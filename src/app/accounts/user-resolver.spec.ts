import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { Observable, of, firstValueFrom, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { userResolver } from './user-resolver';
import { User } from './accounts.types';
import { Accounts } from './accounts';
import { Mock } from 'vitest';

const setup = (userMock: Mock) => {
  const executeResolver: ResolveFn<User> = (...resolverParameters) => {
    return TestBed.runInInjectionContext(() => userResolver(...resolverParameters));
  };
  TestBed.configureTestingModule({
    providers: [{ provide: Accounts, useValue: { getUser: userMock } }],
  });
  return { executeResolver };
};

const resolverArgs = [{} as ActivatedRouteSnapshot, {} as RouterStateSnapshot] as const;

describe('userResolver', () => {
  it('should return the auth user', async () => {
    const expectedUser = { id: 1 };
    const { executeResolver } = setup(vi.fn(() => of(expectedUser)));
    const user$ = executeResolver(...resolverArgs) as Observable<User>;
    expect(user$).toBeInstanceOf(Observable);
    expect(await firstValueFrom(user$)).toStrictEqual(expectedUser);
  });

  it('should throw if an error has occurred', async () => {
    const { executeResolver } = setup(
      vi.fn(() => throwError(() => new Error('Test user resolver failure'))),
    );
    const user$ = executeResolver(...resolverArgs) as Observable<User>;
    expect(user$).toBeInstanceOf(Observable);
    await expect(async () => await firstValueFrom(user$)).rejects.toThrow();
  });
});
