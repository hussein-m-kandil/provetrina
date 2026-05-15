export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

export interface AuthData {
  access: string;
  refresh: string;
}

export interface SignupData extends Omit<User, 'id'> {
  password: string;
  password_confirmation: string;
}

export type SigninData = Pick<SignupData, 'username' | 'password'>;
