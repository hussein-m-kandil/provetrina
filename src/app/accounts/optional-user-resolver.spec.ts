import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot } from '@angular/router';
import { optionalUserResolver } from './optional-user-resolver';
import { Observable, of, firstValueFrom, throwError } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { User } from './accounts.types';
import { Accounts } from './accounts';
import { Mock } from 'vitest';

const setup = (getUserMock: Mock) => {
  const executeResolver: ResolveFn<User | null> = (...resolverParameters) => {
    return TestBed.runInInjectionContext(() => optionalUserResolver(...resolverParameters));
  };
  TestBed.configureTestingModule({
    providers: [{ provide: Accounts, useValue: { getUser: getUserMock } }],
  });
  return { executeResolver };
};

const resolverArgs = [{} as ActivatedRouteSnapshot, {} as RouterStateSnapshot] as const;

describe('optionalUserResolver', () => {
  it('should return the auth user', async () => {
    const expectedUser = { id: 1 };
    const { executeResolver } = setup(vi.fn(() => of(expectedUser)));
    const user$ = executeResolver(...resolverArgs) as Observable<User>;
    expect(user$).toBeInstanceOf(Observable);
    expect(await firstValueFrom(user$)).toStrictEqual(expectedUser);
  });

  it('should return null if an error has occurred', async () => {
    const { executeResolver } = setup(
      vi.fn(() => throwError(() => new Error('Test optional user resolver failure'))),
    );
    const user$ = executeResolver(...resolverArgs) as Observable<User>;
    expect(user$).toBeInstanceOf(Observable);
    expect(await firstValueFrom(user$)).toBeNull();
  });
});
