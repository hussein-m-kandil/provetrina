import { NavigationEnd, NavigationError, Router } from '@angular/router';
import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Accounts } from '../accounts';

const DEFAULT_MSG = 'Failed to load the requested page.';

@Injectable({
  providedIn: 'root',
})
export class Navigation {
  private readonly _router = inject(Router);
  private readonly _accounts = inject(Accounts);

  readonly error = signal<{ url: string; message: string } | null>(null);

  readonly current = computed(() => this._router.currentNavigation());

  readonly navigating = computed(() => !!this.current());

  readonly isInitial = signal(!this._router.navigated);

  constructor() {
    this._router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationError) {
        const errorData = { url: event.url, message: DEFAULT_MSG };
        if (event.error instanceof HttpErrorResponse) {
          if (event.error.status === 401) {
            this._accounts.purgeAuthData();
            this._router.navigate(['/signin'], {
              ...this._accounts.navigationOptions,
              queryParams: { url: event.url },
            });
          }
          const resErr = event.error.error['detail'];
          if (typeof resErr === 'string') {
            errorData.message = resErr;
          }
        }
        this.error.set(errorData);
      } else {
        this.error.set(null);
        if (event instanceof NavigationEnd) this.isInitial.set(false);
      }
    });
  }

  retry() {
    const error = this.error();
    this.error.set(null);
    if (!error) return Promise.resolve(false);
    return this._router.navigateByUrl(error.url);
  }
}
