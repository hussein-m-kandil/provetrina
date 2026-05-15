import {
  ResolveFn,
  RedirectCommand,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { profileResolver } from './profile-resolver';
import { Accounts, User } from '../accounts';
import { Profile } from './profiles.types';
import { Profiles } from './profiles';

const profile: Profile = {
  id: 1,
  tel: '01',
  bio: 'Bio',
  name: 'Foo',
  title: 'Blah',
  location: 'Z',
  email: 'x@y.z',
  username: 'foo',
  public: true,
};

const profilesMock = { getProfile: vi.fn(() => of(profile)) };
const accountsMock = { user: vi.fn<() => User | null>(() => null) };

const setup = () => {
  TestBed.configureTestingModule({
    providers: [
      { provide: Profiles, useValue: profilesMock },
      { provide: Accounts, useValue: accountsMock },
    ],
  });
};

const executeResolver: ResolveFn<Profile> = (...resolverParameters) => {
  return TestBed.runInInjectionContext(() => profileResolver(...resolverParameters));
};

const resolverArgs = [{ params: {} } as ActivatedRouteSnapshot, {} as RouterStateSnapshot] as const;

describe('profileResolver', () => {
  it('should return an observable of a profile', async () => {
    setup();
    resolverArgs[0].params['profileId'] = profile.id;
    const result = await firstValueFrom(
      executeResolver(...resolverArgs) as Observable<Profile | RedirectCommand>,
    );
    expect(result).toStrictEqual(profile);
    delete resolverArgs[0].params['profileId'];
  });

  it('should return an observable of a private profile if it is requested by its owner', async () => {
    const privateProfile = { ...profile, public: false };
    profilesMock.getProfile.mockImplementationOnce(() => of(privateProfile));
    accountsMock.user.mockImplementationOnce(() => ({ id: profile.id }) as User);
    setup();
    resolverArgs[0].params['profileId'] = profile.id;
    const result = await firstValueFrom(
      executeResolver(...resolverArgs) as Observable<Profile | RedirectCommand>,
    );
    expect(result).toStrictEqual(privateProfile);
    delete resolverArgs[0].params['profileId'];
  });

  it('should redirect to not-found page if the profile is private and requested by non-owner', async () => {
    const privateProfile = { ...profile, public: false };
    profilesMock.getProfile.mockImplementationOnce(() => of(privateProfile));
    accountsMock.user.mockImplementationOnce(() => ({ id: profile.id + 1 }) as User);
    setup();
    resolverArgs[0].params['profileId'] = profile.id;
    const result = await firstValueFrom(
      executeResolver(...resolverArgs) as Observable<Profile | RedirectCommand>,
    );
    expect(result).toBeInstanceOf(RedirectCommand);
    expect((result as RedirectCommand).redirectTo.toString()).toBe('/not-found');
    delete resolverArgs[0].params['profileId'];
  });

  it('should redirect to not-found page if the profile is private and requested by unauthenticated user', async () => {
    const privateProfile = { ...profile, public: false };
    profilesMock.getProfile.mockImplementationOnce(() => of(privateProfile));
    accountsMock.user.mockImplementationOnce(() => null);
    setup();
    resolverArgs[0].params['profileId'] = profile.id;
    const result = await firstValueFrom(
      executeResolver(...resolverArgs) as Observable<Profile | RedirectCommand>,
    );
    expect(result).toBeInstanceOf(RedirectCommand);
    expect((result as RedirectCommand).redirectTo.toString()).toBe('/not-found');
    delete resolverArgs[0].params['profileId'];
  });

  it('should redirect to not-found page if non-exists profile requested by a user with different id', async () => {
    profilesMock.getProfile.mockImplementationOnce(() =>
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );
    accountsMock.user.mockImplementationOnce(() => ({ id: profile.id + 1 }) as User);
    setup();
    resolverArgs[0].params['profileId'] = profile.id;
    const result = await firstValueFrom(
      executeResolver(...resolverArgs) as Observable<Profile | RedirectCommand>,
    );
    expect(result).toBeInstanceOf(RedirectCommand);
    expect((result as RedirectCommand).redirectTo.toString()).toBe('/not-found');
    delete resolverArgs[0].params['profileId'];
  });

  it('should redirect to create-profile page if non-exists profile requested by a user with same id', async () => {
    profilesMock.getProfile.mockImplementationOnce(() =>
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );
    accountsMock.user.mockImplementationOnce(() => ({ id: profile.id }) as User);
    setup();
    resolverArgs[0].params['profileId'] = profile.id;
    const result = await firstValueFrom(
      executeResolver(...resolverArgs) as Observable<Profile | RedirectCommand>,
    );
    expect(result).toBeInstanceOf(RedirectCommand);
    expect((result as RedirectCommand).redirectTo.toString()).toBe('/create');
    delete resolverArgs[0].params['profileId'];
  });

  it('should throw error', async () => {
    profilesMock.getProfile.mockImplementationOnce(() =>
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' })),
    );
    setup();
    resolverArgs[0].params['profileId'] = profile.id;
    const result = firstValueFrom(
      executeResolver(...resolverArgs) as Observable<Profile | RedirectCommand>,
    );
    await expect(result).rejects.toThrow();
    delete resolverArgs[0].params['profileId'];
  });

  it('should throw error if not given a profile id', () => {
    setup();
    expect(() => executeResolver(...resolverArgs)).toThrow();
  });
});
