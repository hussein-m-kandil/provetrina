import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { type Profile } from './profiles.types';
import { catchError, map, of } from 'rxjs';
import { Accounts } from '../accounts';
import { inject } from '@angular/core';
import { Profiles } from './profiles';

export const profileResolver: ResolveFn<Profile> = (route) => {
  const profileId = route.params['profileId'];
  if (!profileId && profileId !== 0) throw Error('Missing a profile id!');

  const accounts = inject(Accounts);
  const user = accounts.user();

  const router = inject(Router);
  const notFountRedirectCommand = new RedirectCommand(router.parseUrl('/not-found'));
  const createProfileRedirectCommand = new RedirectCommand(router.parseUrl('/create'));

  const profiles = inject(Profiles);
  return profiles.getProfile(profileId).pipe(
    map((profile) => {
      if (profile.public || (user && user.id === profile.id)) return profile;
      return notFountRedirectCommand;
    }),
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        // Check whether the current user does not have a profile yet
        if (user && (user.id === profileId || user.username === profileId)) {
          return of(createProfileRedirectCommand);
        }
        return of(notFountRedirectCommand);
      }
      throw error;
    }),
  );
};
