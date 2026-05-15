import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Accounts } from './accounts';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const accounts = inject(Accounts);
  const authenticated = accounts.authenticated();
  const authenticating = accounts.isAuthUrl(route.url);
  let redirectCommand: RedirectCommand | undefined;
  if (authenticating && authenticated) {
    redirectCommand = new RedirectCommand(router.createUrlTree(['/']), accounts.navigationOptions);
  } else if (!authenticating && !authenticated) {
    redirectCommand = new RedirectCommand(
      router.createUrlTree(['/signin'], { queryParams: { url: state.url } }),
      accounts.navigationOptions,
    );
  }
  return redirectCommand || true;
};
