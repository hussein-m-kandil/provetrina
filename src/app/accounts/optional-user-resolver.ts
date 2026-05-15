import { ResolveFn } from '@angular/router';
import { User } from './accounts.types';
import { inject } from '@angular/core';
import { Accounts } from './accounts';
import { catchError, of } from 'rxjs';

export const optionalUserResolver: ResolveFn<User | null> = () => {
  const accounts = inject(Accounts);
  return accounts.getUser().pipe(catchError(() => of(null)));
};
