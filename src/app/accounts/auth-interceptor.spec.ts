import { HttpClient, withInterceptors, provideHttpClient, HttpRequest } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth-interceptor';
import { environment } from '../../environments';
import { TestBed } from '@angular/core/testing';
import { Accounts } from './accounts';

const authData = { access: 'test_access_token', refresh: 'test_refresh_token' };

const accountsMock = {
  authData: vi.fn<() => typeof authData | null>(() => authData),
  updateAuthData: vi.fn(),
  purgeAuthData: vi.fn(),
};

const setup = (authDataMock: (typeof accountsMock)['authData'] = accountsMock.authData) => {
  TestBed.configureTestingModule({
    providers: [
      { provide: Accounts, useValue: { ...accountsMock, authData: authDataMock } },
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
    ],
  });
  const httpTesting = TestBed.inject(HttpTestingController);
  const http = TestBed.inject(HttpClient);
  return { http, httpTesting };
};

const httpMethods = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] as const;
const url = environment.apiUrl;

describe('authInterceptor', () => {
  it('should set the Authorization header', () => {
    const { http, httpTesting } = setup();
    for (const method of httpMethods) {
      http.request(new HttpRequest(method, url, null)).subscribe();
      const req = httpTesting.expectOne({ method, url });
      req.flush(null);
      httpTesting.verify();
      expect(req.request.headers.get('Authorization')).toEqual('Bearer ' + authData.access);
    }
  });

  it('should not set the Authorization header,', () => {
    const { http, httpTesting } = setup(vi.fn(() => null));
    for (const method of httpMethods) {
      http.request(new HttpRequest(method, url, null)).subscribe();
      const req = httpTesting.expectOne({ method, url });
      req.flush(null);
      httpTesting.verify();
      expect(req.request.headers.get('Authorization')).toBeNull();
    }
  });

  it('should try to refresh on a 401 response status, and purge auth data if failed', async () => {
    const { http, httpTesting } = setup();
    let reqCompleted = false;
    const completeReq = () => setTimeout(() => (reqCompleted = true), 0);
    for (const method of httpMethods) {
      http
        .request(new HttpRequest(method, url, null))
        .subscribe({ next: completeReq, error: completeReq });
      const req = httpTesting.expectOne({ method, url });
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
      await vi.waitUntil(() => reqCompleted);
      const refreshReq = httpTesting.expectOne(
        { method: 'POST', url: `${url}token/refresh/` },
        'Request to refresh',
      );
      refreshReq.flush(null, { status: 401, statusText: 'Unauthorized' });
      expect(refreshReq.request.body).toStrictEqual({ refresh: authData.refresh });
      expect(accountsMock.purgeAuthData).toHaveBeenCalledTimes(1);
      accountsMock.purgeAuthData.mockClear();
      httpTesting.verify();
    }
  });

  it('should try to refresh on a 401 response status, and not purge auth data if server/network error', async () => {
    const { http, httpTesting } = setup();
    let reqCompleted = false;
    const completeReq = () => setTimeout(() => (reqCompleted = true), 0);
    for (let i = 0; i < 2; i++) {
      for (const method of httpMethods) {
        http
          .request(new HttpRequest(method, url, null))
          .subscribe({ next: completeReq, error: completeReq });
        const req = httpTesting.expectOne({ method, url });
        req.flush(null, { status: 401, statusText: 'Unauthorized' });
        await vi.waitUntil(() => reqCompleted);
        const refreshReq = httpTesting.expectOne(
          { method: 'POST', url: `${url}token/refresh/` },
          'Request to refresh',
        );
        if (i) refreshReq.flush(null, { status: 500, statusText: 'Internal Server Error' });
        else refreshReq.error(new ProgressEvent('Network Error'));
        expect(refreshReq.request.body).toStrictEqual({ refresh: authData.refresh });
        expect(accountsMock.purgeAuthData).toHaveBeenCalledTimes(0);
        httpTesting.verify();
      }
    }
  });

  it('should try to refresh on a 401 response status, and not purge auth data if succeeded', async () => {
    const { http, httpTesting } = setup();
    let reqCompleted = false;
    const completeReq = () => setTimeout(() => (reqCompleted = true), 0);
    for (const method of httpMethods) {
      http
        .request(new HttpRequest(method, url, null))
        .subscribe({ next: completeReq, error: completeReq });
      const req = httpTesting.expectOne({ method, url }, 'Request to do anything');
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
      await vi.waitUntil(() => reqCompleted);
      const refreshReq = httpTesting.expectOne(
        { method: 'POST', url: `${url}token/refresh/` },
        'Request to refresh',
      );
      refreshReq.flush({ access: authData.access });
      httpTesting.expectOne({ method, url }, 'Request to do anything').flush(null);
      await vi.waitUntil(() => reqCompleted);
      expect(refreshReq.request.body).toStrictEqual({ refresh: authData.refresh });
      expect(accountsMock.purgeAuthData).toHaveBeenCalledTimes(0);
      httpTesting.verify();
    }
  });

  it('should not try to refresh on a 401 response status, and purge auth data if there is no auth data', async () => {
    const { http, httpTesting } = setup(vi.fn(() => null));
    let reqCompleted = false;
    const completeReq = () => setTimeout(() => (reqCompleted = true), 0);
    for (const method of httpMethods) {
      http
        .request(new HttpRequest(method, url, null))
        .subscribe({ next: completeReq, error: completeReq });
      const req = httpTesting.expectOne({ method, url });
      req.flush(null, { status: 401, statusText: 'Unauthorized' });
      await vi.waitUntil(() => reqCompleted);
      expect(accountsMock.purgeAuthData).toHaveBeenCalledTimes(1);
      accountsMock.purgeAuthData.mockClear();
      httpTesting.verify();
    }
  });

  it('should not purge auth data any response status other that the 401', async () => {
    const { http, httpTesting } = setup();
    let reqCompleted = false;
    const completeReq = () => setTimeout(() => (reqCompleted = true), 0);
    for (const method of httpMethods) {
      http
        .request(new HttpRequest(method, url, null))
        .subscribe({ next: completeReq, error: completeReq });
      const req = httpTesting.expectOne({ method, url });
      req.flush(null, { status: 403, statusText: 'Forbidden' });
      await vi.waitUntil(() => reqCompleted);
      expect(accountsMock.purgeAuthData).toHaveBeenCalledTimes(0);
      httpTesting.verify();
    }
  });
});
