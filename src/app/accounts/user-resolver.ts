import { ResolveFn } from '@angular/router';
import { User } from './accounts.types';
import { inject } from '@angular/core';
import { Accounts } from './accounts';

export const userResolver: ResolveFn<User> = () => {
  const accounts = inject(Accounts);
  return accounts.getUser();
};
