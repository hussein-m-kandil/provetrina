import { NavigationBehaviorOptions, Router, UrlSegment } from '@angular/router';
import { SigninData, SignupData, AuthData, User } from './accounts.types';
import { computed, signal, inject, Injectable } from '@angular/core';
import { catchError, defer, map, Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments';
import { AppStorage } from '../app-storage';

const AUTH_KEY = 'seco_seco';

const { apiUrl } = environment;

@Injectable({
  providedIn: 'root',
})
export class Accounts {
  private readonly _router = inject(Router);
  private readonly _http = inject(HttpClient);
  private readonly _storage = inject(AppStorage);

  readonly _authData = signal<AuthData | null>(null);
  readonly authData = this._authData.asReadonly();

  readonly authenticated = computed<boolean>(() => !!this._authData());

  readonly user = signal<User | null>(null);

  readonly navigationOptions: NavigationBehaviorOptions = {
    onSameUrlNavigation: 'reload',
    replaceUrl: true,
  };

  private _initAuthData() {
    const restoredAuthData = this._storage.getItem(AUTH_KEY);
    if (restoredAuthData) {
      const [access, refresh] = restoredAuthData.split(' ');
      return this._authData.set({ access, refresh });
    }
  }

  constructor() {
    this._initAuthData();
  }

  updateAuthData(authData: AuthData) {
    const { access, refresh } = authData;
    this._storage.setItem(AUTH_KEY, '' + access + ' ' + refresh);
    this._authData.set(JSON.parse(JSON.stringify(authData)));
  }

  purgeAuthData() {
    this.user.set(null);
    this._authData.set(null);
    this._storage.removeItem(AUTH_KEY);
  }

  navigate(commands: Parameters<typeof this._router.navigate>['0']) {
    const queryParams = { ...this._router.routerState.snapshot.root.queryParams };
    if (commands[0] === queryParams['url']) delete queryParams['url'];
    this._router.navigate(commands, {
      ...this.navigationOptions,
      queryParams,
    });
  }

  signIn(data: SigninData) {
    return this._http.post<AuthData>(`${apiUrl}token/`, data).pipe(
      map((authData) => {
        this.updateAuthData(authData);
        const url = this._router.routerState.snapshot.root.queryParams['url'];
        this.navigate([url || '/']);
      }),
    );
  }

  signOut() {
    this.purgeAuthData();
    this.navigate(['/signin']);
  }

  getUser(): Observable<User> {
    return defer(() => {
      const user = this.user();
      if (user) return of(user);
      return this._http.get<User>(`${apiUrl}accounts/me/`).pipe(tap((user) => this.user.set(user)));
    });
  }

  createUser(data: SignupData) {
    return this._http.post<User>(`${apiUrl}accounts/`, data).pipe(
      map((user) => {
        this.user.set(user);
        this.navigate(['/signin']);
        this.signIn(data)
          .pipe(catchError(() => of()))
          .subscribe();
      }),
    );
  }

  editUser(id: User['id'], data: Partial<SignupData>) {
    const { password, password_confirmation, ...restData } = data;
    const reqBody: typeof data = { ...restData };
    // Only the password may not be empty
    if (password) {
      reqBody.password = password;
      reqBody.password_confirmation = password_confirmation;
    }
    return this._http.patch<User>(`${apiUrl}accounts/${id}/`, reqBody).pipe(
      tap((user) => {
        this.user.set(user);
        this.navigate(['/account']);
      }),
    );
  }

  deleteUser(id: User['id']) {
    return this._http.delete<void>(`${apiUrl}accounts/${id}/`).pipe(tap(() => this.signOut()));
  }

  isAuthUrl = (url: UrlSegment[] | string): boolean => {
    if (typeof url === 'string') return /^(.*\/)?sign(in|up)\/?(\?.*)?$/.test(url);
    return url.some(({ path }) => /^sign(in|up)$/.test(path));
  };
}
