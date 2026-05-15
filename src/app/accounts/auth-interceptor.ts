import {
  HttpRequest,
  HttpBackend,
  HttpResponse,
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { catchError, filter, mergeMap } from 'rxjs';
import { environment } from '../../environments';
import { AuthData } from './accounts.types';
import { inject } from '@angular/core';
import { Accounts } from './accounts';

const apiUrl = environment.apiUrl;

const HTTP_401_ERR_RES = new HttpErrorResponse({
  statusText: 'Unauthorized',
  status: 401,
});

const isUnauthorized = (res: unknown) => {
  return res instanceof HttpErrorResponse && res.status === 401;
};

const refreshAuthToken = (
  httpBackend: HttpBackend,
  accounts: Accounts,
  staleAuthData: AuthData,
) => {
  const url = apiUrl + 'token/refresh/';
  const data = { refresh: staleAuthData.refresh };
  return httpBackend.handle(new HttpRequest('POST', url, data)).pipe(
    catchError((error) => {
      if (isUnauthorized(error)) {
        accounts.purgeAuthData();
      }
      throw error;
    }),
    filter((e): e is HttpResponse<{ access: string }> => e instanceof HttpResponse),
  );
};

const authorize = <T>(req: HttpRequest<T>, token: string): HttpRequest<T> => {
  return req.clone({ headers: req.headers.set('Authorization', 'Bearer ' + token) });
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const httpBackend = inject(HttpBackend);
  const accounts = inject(Accounts);
  const authData = accounts.authData();
  return next(authData ? authorize(req, authData.access) : req).pipe(
    catchError((error) => {
      if (isUnauthorized(error)) {
        const staleAuthData = accounts.authData();
        if (staleAuthData) {
          return refreshAuthToken(httpBackend, accounts, staleAuthData).pipe(
            mergeMap((res) => {
              const access = res.body && res.body['access'];
              if (access) {
                accounts.updateAuthData({ ...staleAuthData, access });
                return next(authorize(req, access));
              }
              accounts.purgeAuthData();
              throw HTTP_401_ERR_RES;
            }),
          );
        }
        accounts.purgeAuthData();
      }
      throw error;
    }),
  );
};
