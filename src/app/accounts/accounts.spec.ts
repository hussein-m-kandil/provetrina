import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { AuthData, SigninData, SignupData, User } from './accounts.types';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter, Router, UrlSegment } from '@angular/router';
import { environment } from '../../environments';
import { TestBed } from '@angular/core/testing';
import { AppStorage } from '../app-storage';
import { Component } from '@angular/core';
import { Accounts } from './accounts';
import { Observable } from 'rxjs';

const appStorageMock = { removeItem: vi.fn(), getItem: vi.fn(), setItem: vi.fn() };

const navigationSpy = vi.spyOn(Router.prototype, 'navigateByUrl');

@Component({ template: '<h1>Dummy</h1>' })
class Dummy {}

const setup = async (initialRoute?: string) => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([{ path: '**', component: Dummy }]),
      { provide: AppStorage, useValue: appStorageMock },
    ],
  });
  const storage = TestBed.inject(AppStorage) as unknown as typeof appStorageMock;
  const httpTesting = TestBed.inject(HttpTestingController);
  const service = TestBed.inject(Accounts);
  const routerHarness = await RouterTestingHarness.create();
  if (initialRoute) {
    await routerHarness.navigateByUrl(initialRoute);
    navigationSpy.mockClear();
  }
  return { service, storage, httpTesting, routerHarness };
};

const { apiUrl } = environment;

const user: User = {
  id: 1,
  username: 'test_user',
  first_name: 'Test',
  last_name: 'User',
};

const access = 'test_token';
const authData: AuthData = { access, refresh: access };

const signinData: SigninData = { username: user.username, password: 'test@pass123' };
const signupData: SignupData = {
  ...signinData,
  password_confirmation: signinData.password,
  first_name: user.first_name,
  last_name: user.last_name,
};

describe('Accounts', () => {
  afterEach(vi.resetAllMocks);

  const testData = [
    {
      url: `${apiUrl}token/`,
      methodName: 'signIn' as const,
      method: 'POST' as const,
      resData: undefined,
      reqData: signupData,
      reqBody: signupData,
      action: 'sign in',
    },
    {
      url: `${apiUrl}accounts/`,
      methodName: 'createUser' as const,
      method: 'POST' as const,
      resData: undefined,
      reqData: signupData,
      reqBody: signupData,
      action: 'sign up',
    },
    {
      url: `${apiUrl}accounts/${user.id}/`,
      methodName: 'editUser' as const,
      method: 'PATCH' as const,
      resData: user,
      reqData: { ...signupData, password: '', last_name: '' },
      reqBody: { username: signupData.username, first_name: signupData.first_name, last_name: '' },
      action: 'edit',
    },
  ];

  for (const { url, method, action, methodName, reqData, reqBody, resData } of testData) {
    it(`should ${action}`, async () => {
      const { service, httpTesting, storage } = await setup('/signin');
      const user$: Observable<unknown> =
        methodName === 'editUser'
          ? service.editUser(user.id, reqData)
          : service[methodName](reqData);
      let result: unknown, error: unknown;
      user$.subscribe({ next: (r) => (result = r), error: (e) => (error = e) });
      const req = httpTesting.expectOne({ method, url }, `Request to ${action}`);
      if (methodName === 'signIn') req.flush(authData);
      else req.flush(user);
      expect(navigationSpy).toHaveBeenCalledOnce();
      if (methodName === 'signIn') {
        expect(navigationSpy.mock.calls[0][0].toString()).toBe('/');
        expect(storage.setItem).toHaveBeenCalledOnce();
        expect(service.authData()).toStrictEqual(authData);
        expect(service.authenticated()).toBe(true);
      } else {
        expect(service.user()).toStrictEqual(user);
        expect(service.authenticated()).toBe(false);
        expect(service.authData()).toBeNull();
        if (methodName === 'createUser') {
          expect(navigationSpy.mock.calls[0][0].toString()).toBe('/signin');
          httpTesting
            .expectOne({ method: 'POST', url: `${apiUrl}token/` }, 'Request to sign in')
            .flush(authData);
        } else {
          expect(navigationSpy.mock.calls[0][0].toString()).toBe('/account');
        }
      }
      expect(req.request.body).toStrictEqual(reqBody);
      expect(result).toStrictEqual(resData);
      expect(error).toBeUndefined();
      httpTesting.verify();
    });

    it('should throw backend errors', async () => {
      const { service, httpTesting, storage } = await setup();
      const backendErrors = [
        { status: 500, statusText: 'Server error' },
        { status: 400, statusText: 'Client error' },
      ];
      for (const resError of backendErrors) {
        const user$: Observable<unknown> =
          methodName === 'editUser'
            ? service.editUser(user.id, reqData)
            : service[methodName](reqData);
        let result, error;
        user$.subscribe({ next: (r) => (result = r), error: (e) => (error = e) });
        const req = httpTesting.expectOne({ method, url }, `Request to ${action}`);
        req.flush(null, resError);
        expect(req.request.body).toStrictEqual(reqBody);
        expect(service.authData()).toBeNull();
        expect(result).toBeUndefined();
        expect(error).toBeInstanceOf(HttpErrorResponse);
        expect(error).toHaveProperty('status', resError.status);
        expect(error).toHaveProperty('statusText', resError.statusText);
        expect(storage.setItem).toHaveBeenCalledTimes(0);
        httpTesting.verify();
      }
    });

    it('should throw network error', async () => {
      const { service, httpTesting, storage } = await setup();
      const user$: Observable<unknown> =
        methodName === 'editUser'
          ? service.editUser(user.id, reqData)
          : service[methodName](reqData);
      let result, error;
      user$.subscribe({ next: (r) => (result = r), error: (e) => (error = e) });
      const req = httpTesting.expectOne({ method, url }, `Request to ${action}`);
      const networkError = new ProgressEvent('Network error!');
      req.error(networkError);
      expect(req.request.body).toStrictEqual(reqBody);
      expect(service.authData()).toBeNull();
      expect(result).toBeUndefined();
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect(error).toHaveProperty('status', 0);
      expect(error).toHaveProperty('error', networkError);
      expect(storage.setItem).toHaveBeenCalledTimes(0);
      httpTesting.verify();
    });
  }

  it('should sign out', async () => {
    let testToken: string | null = 'test_token';
    const { service, httpTesting, storage } = await setup();
    storage.getItem.mockImplementation(() => testToken);
    storage.removeItem.mockImplementation(() => (testToken = null));
    service.signOut();
    expect(testToken).toBeNull();
    expect(navigationSpy).toHaveBeenCalledOnce();
    expect(navigationSpy.mock.calls[0][0].toString()).toBe('/signin');
    expect(storage.removeItem).toHaveBeenCalledOnce();
    storage.removeItem.mockReset();
    storage.getItem.mockReset();
    httpTesting.verify();
  });

  it('should delete and sign out', async () => {
    let testToken: string | null = 'test_token';
    const { service, httpTesting, storage } = await setup();
    storage.getItem.mockImplementation(() => testToken);
    storage.removeItem.mockImplementation(() => (testToken = null));
    let result: unknown, error: unknown;
    service.deleteUser(user.id).subscribe({ next: (r) => (result = r), error: (e) => (error = e) });
    httpTesting
      .expectOne({ method: 'DELETE', url: `${apiUrl}accounts/${user.id}/` }, `Request to delete`)
      .flush('', { status: 204, statusText: 'No content' });
    expect(result).toBe('');
    expect(testToken).toBeNull();
    expect(error).toBeUndefined();
    expect(navigationSpy).toHaveBeenCalledOnce();
    expect(navigationSpy.mock.calls[0][0].toString()).toBe('/signin');
    expect(storage.removeItem).toHaveBeenCalledOnce();
    storage.removeItem.mockReset();
    storage.getItem.mockReset();
    httpTesting.verify();
  });

  it('should fail to delete and not sign out', async () => {
    let testToken: string | null = 'test_token';
    const { service, httpTesting, storage } = await setup();
    storage.getItem.mockImplementation(() => testToken);
    storage.removeItem.mockImplementation(() => (testToken = null));
    let result: unknown, error: unknown;
    service.deleteUser(user.id).subscribe({ next: (r) => (result = r), error: (e) => (error = e) });
    httpTesting
      .expectOne({ method: 'DELETE', url: `${apiUrl}accounts/${user.id}/` }, `Request to delete`)
      .flush('Failed', { status: 500, statusText: 'Internal server error' });
    expect(result).toBeUndefined();
    expect(testToken).toBeTruthy();
    expect(navigationSpy).toHaveBeenCalledTimes(0);
    expect(storage.removeItem).toHaveBeenCalledTimes(0);
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error).toHaveProperty('error', 'Failed');
    expect(error).toHaveProperty('status', 500);
    storage.removeItem.mockReset();
    storage.getItem.mockReset();
    httpTesting.verify();
  });

  it('should be an auth URL', async () => {
    const { service } = await setup();
    for (const suffix of ['in', 'up']) {
      [
        `/foo/sign${suffix}/?bar=tar&wzx=baz`,
        `/foo/sign${suffix}/?bar=tar`,
        `/foo/sign${suffix}?bar=tar`,
        `/foo/sign${suffix}/?`,
        `/foo/sign${suffix}?`,
        `/foo/sign${suffix}/`,
        `/sign${suffix}/`,
        `sign${suffix}/`,
        [{ path: `sign${suffix}` } as UrlSegment],
      ].forEach((url) => expect(service.isAuthUrl(url)).toBe(true));
    }
  });

  it('should not be an auth URL', async () => {
    const { service } = await setup();
    for (const suffix of ['in', 'up']) {
      [
        `/foo/sign${suffix}/bar=tar&wzx=baz`,
        `/foo/sign${suffix}x`,
        `assign${suffix}`,
        `sign${suffix}s`,
        [{ path: `/sign${suffix}` } as UrlSegment],
        [{ path: `sign${suffix}/` } as UrlSegment],
      ].forEach((url) => expect(service.isAuthUrl(url)).toBe(false));
    }
  });
});
