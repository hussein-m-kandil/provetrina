import {
  UrlSegment,
  CanActivateFn,
  RedirectCommand,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { authGuard } from './auth-guard';
import { Accounts } from './accounts';

const accountsMock = {
  authenticated: vi.fn(() => true),
  isAuthUrl: vi.fn(() => false),
};

const mockAccounts = vi.fn(() => accountsMock);

const setup = () => {
  TestBed.configureTestingModule({
    providers: [{ provide: Accounts, useValue: mockAccounts() }],
  });
  const executeGuard: CanActivateFn = (...guardParameters) => {
    return TestBed.runInInjectionContext(() => authGuard(...guardParameters));
  };
  return { executeGuard };
};

const getGuardParameters = (routeUrl: Partial<UrlSegment>[] = [], stateUrl = '/') => {
  const route = { url: routeUrl } as ActivatedRouteSnapshot;
  const state = { url: stateUrl } as RouterStateSnapshot;
  return [route, state] as const;
};

describe('authGuard', () => {
  it('should return true', () => {
    const { executeGuard } = setup();
    const result = executeGuard(...getGuardParameters());
    expect(result).toBe(true);
  });

  it('should allow an authenticated user to visit a non-auth URL', async () => {
    mockAccounts.mockImplementation(() => ({
      isAuthUrl: vi.fn(() => false),
      authenticated: vi.fn(() => true),
    }));
    const { executeGuard } = setup();
    const result = executeGuard(...getGuardParameters());
    expect(result).toBe(true);
    mockAccounts.mockReset();
  });

  it('should disallow an authenticated user to visit an auth URL', async () => {
    mockAccounts.mockImplementation(() => ({
      isAuthUrl: vi.fn(() => true),
      authenticated: vi.fn(() => true),
    }));
    const { executeGuard } = setup();
    const result = executeGuard(...getGuardParameters()) as RedirectCommand;
    expect(result).toBeInstanceOf(RedirectCommand);
    expect(result.redirectTo.toString()).toBe('/');
    expect(result.redirectTo.queryParams).toStrictEqual({});
    mockAccounts.mockReset();
  });

  it('should allow an unauthenticated user to visit an auth URL', async () => {
    mockAccounts.mockImplementation(() => ({
      isAuthUrl: vi.fn(() => true),
      authenticated: vi.fn(() => false),
    }));
    const { executeGuard } = setup();
    const result = executeGuard(...getGuardParameters());
    expect(result).toBe(true);
    mockAccounts.mockReset();
  });

  it('should disallow an unauthenticated user to visit a non-auth URL', async () => {
    mockAccounts.mockImplementation(() => ({
      isAuthUrl: vi.fn(() => false),
      authenticated: vi.fn(() => false),
    }));
    const { executeGuard } = setup();
    for (const stateUrl of ['/blah', undefined]) {
      const result = executeGuard(...getGuardParameters(undefined, stateUrl)) as RedirectCommand;
      expect(result).toBeInstanceOf(RedirectCommand);
      expect(result.redirectTo.toString()).toMatch(/\/signin\?.*$/);
      expect(result.redirectTo.queryParams).toStrictEqual({ url: stateUrl || '/' });
    }
    mockAccounts.mockReset();
  });
});
