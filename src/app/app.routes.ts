import {
  authGuard,
  AccountForm,
  userResolver,
  AccountDeleteForm,
  optionalUserResolver,
} from './accounts';
import { RouterStateSnapshot, Routes, TitleStrategy } from '@angular/router';
import { Profile, profileResolver, CreateProfile } from './profiles';
import { Account } from './accounts/account/account';
import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { environment } from '../environments';
import { NotFound } from './not-found';
import { Home } from './home';

const appTitle = environment.title;

export const routes: Routes = [
  {
    path: '',
    runGuardsAndResolvers: 'always',
    resolve: { user: optionalUserResolver },
    children: [
      { path: '', title: appTitle, component: Home },
      { path: 'not-found', title: '404 Not Found', component: NotFound },
      {
        path: '',
        canActivateChild: [authGuard],
        runGuardsAndResolvers: 'always',
        children: [
          { path: 'signin', title: 'Sing In', component: AccountForm },
          { path: 'signup', title: 'Sing Up', component: AccountForm },
          {
            path: 'account',
            resolve: { user: userResolver },
            runGuardsAndResolvers: 'always',
            children: [
              { path: '', title: 'Account', component: Account },
              { path: 'edit', title: 'Edit Account', component: AccountForm },
              { path: 'delete', title: 'Delete Account', component: AccountDeleteForm },
            ],
          },
        ],
      },
      {
        path: 'create',
        title: 'Create Profile',
        component: CreateProfile,
      },
      {
        path: ':profileId',
        title: 'Profile',
        component: Profile,
        runGuardsAndResolvers: 'always',
        resolve: { profile: profileResolver },
      },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class RouteTitleStrategy extends TitleStrategy {
  private readonly _title = inject(Title);
  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    const prefix = routeTitle && routeTitle !== appTitle ? routeTitle + ' | ' : '';
    this._title.setTitle(prefix + appTitle);
  }
}
