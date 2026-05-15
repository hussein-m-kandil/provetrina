import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { userEvent } from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { AccountForm } from './account-form';
import { Accounts } from '../accounts';
import { Toast } from 'primeng/toast';
import { of, throwError } from 'rxjs';

const user = {
  id: 1,
  username: 'test_user',
  first_name: 'Test',
  last_name: 'User',
};

const SIGNIN_ROUTE = 'signin';
const SIGNIN_REGEX = /sign ?in/i;
const SIGNUP_ROUTE = 'signup';
const SIGNUP_REGEX = /sign ?up/i;
const EDIT_ROUTE = 'edit';
const EDIT_REGEX = /edit account/i;

const createUser = vi.fn(() => of());
const editUser = vi.fn(() => of());
const signIn = vi.fn(() => of());
const navigate = vi.fn(() => of());
const accountsMock = vi.fn(() => ({ signIn, createUser, editUser, navigate }));

const renderComponent = async ({
  providers,
  ...options
}: RenderComponentOptions<AccountForm> = {}) => {
  const renderResult = await render(`<router-outlet /><p-toast/>`, {
    imports: [Toast],
    providers: [
      MessageService,
      provideRouter(
        [
          { path: 'signin', component: AccountForm },
          { path: 'signup', component: AccountForm },
          { path: 'edit', component: AccountForm, resolve: { user: () => user } },
          { path: 'profiles/:idOrUsername', component: class {} },
        ],
        withComponentInputBinding(),
      ),
      { provide: Accounts, useValue: accountsMock() },
      ...(providers || []),
    ],
    autoDetectChanges: false,
    ...options,
  });
  if (options.initialRoute !== undefined) navigate.mockReset();
  return renderResult;
};

describe('AccountForm', () => {
  afterEach(vi.resetAllMocks);

  it('should render sign-in form', async () => {
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    expect(screen.getByRole('form', { name: SIGNIN_REGEX })).toBeVisible();
    expect(screen.queryByRole('form', { name: SIGNUP_REGEX })).toBeNull();
    expect(screen.queryByRole('form', { name: EDIT_REGEX })).toBeNull();
  });

  it('should render sign-up form', async () => {
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    expect(screen.getByRole('form', { name: SIGNUP_REGEX })).toBeVisible();
    expect(screen.queryByRole('form', { name: SIGNIN_REGEX })).toBeNull();
    expect(screen.queryByRole('form', { name: EDIT_REGEX })).toBeNull();
  });

  it('should render edit form', async () => {
    await renderComponent({ initialRoute: EDIT_ROUTE });
    expect(screen.getByRole('form', { name: EDIT_REGEX })).toBeVisible();
    expect(screen.queryByRole('form', { name: SIGNUP_REGEX })).toBeNull();
    expect(screen.queryByRole('form', { name: SIGNIN_REGEX })).toBeNull();
  });

  it('should render sign-in fields', async () => {
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    const usernameInp = screen.getByLabelText(/username/i);
    const passwordInp = screen.getByLabelText(/password$/i);
    const confirmInp = screen.queryByLabelText(/confirmation$/i);
    const firstNameInp = screen.queryByLabelText(/first name/i);
    const lastNameInp = screen.queryByLabelText(/last name/i);
    expect(usernameInp).toBeVisible();
    expect(usernameInp).toBeValid();
    expect(usernameInp).toHaveValue('');
    expect(usernameInp).toBeInstanceOf(HTMLInputElement);
    expect(usernameInp).toHaveAttribute('type', 'text');
    expect(passwordInp).toBeVisible();
    expect(passwordInp).toBeValid();
    expect(passwordInp).toHaveValue('');
    expect(passwordInp).toBeInstanceOf(HTMLInputElement);
    expect(passwordInp).toHaveAttribute('type', 'password');
    expect(firstNameInp).toBeNull();
    expect(confirmInp).toBeNull();
    expect(lastNameInp).toBeNull();
  });

  it('should render sign-up fields', async () => {
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    const usernameInp = screen.getByLabelText(/username/i);
    const passwordInp = screen.getByLabelText(/password$/i);
    const confirmInp = screen.getByLabelText(/confirmation$/i);
    const firstNameInp = screen.getByLabelText(/first name/i);
    const lastNameInp = screen.getByLabelText(/last name/i);
    expect(usernameInp).toBeVisible();
    expect(usernameInp).toBeValid();
    expect(usernameInp).toHaveValue('');
    expect(usernameInp).toBeInstanceOf(HTMLInputElement);
    expect(usernameInp).toHaveAttribute('type', 'text');
    expect(passwordInp).toBeVisible();
    expect(passwordInp).toBeValid();
    expect(passwordInp).toHaveValue('');
    expect(passwordInp).toBeInstanceOf(HTMLInputElement);
    expect(passwordInp).toHaveAttribute('type', 'password');
    expect(confirmInp).toBeVisible();
    expect(confirmInp).toBeValid();
    expect(confirmInp).toHaveValue('');
    expect(confirmInp).toBeInstanceOf(HTMLInputElement);
    expect(confirmInp).toHaveAttribute('type', 'password');
    expect(firstNameInp).toBeVisible();
    expect(firstNameInp).toBeValid();
    expect(firstNameInp).toHaveValue('');
    expect(firstNameInp).toBeInstanceOf(HTMLInputElement);
    expect(firstNameInp).toHaveAttribute('type', 'text');
    expect(lastNameInp).toBeVisible();
    expect(lastNameInp).toBeValid();
    expect(lastNameInp).toHaveValue('');
    expect(lastNameInp).toBeInstanceOf(HTMLInputElement);
  });

  it('should render edit fields', async () => {
    await renderComponent({ initialRoute: EDIT_ROUTE });
    const usernameInp = screen.getByLabelText(/username/i);
    const passwordInp = screen.getByLabelText(/password$/i);
    const confirmInp = screen.getByLabelText(/confirmation$/i);
    const firstNameInp = screen.getByLabelText(/first name/i);
    const lastNameInp = screen.getByLabelText(/last name/i);
    expect(usernameInp).toBeVisible();
    expect(usernameInp).toBeValid();
    expect(usernameInp).toHaveValue(user.username);
    expect(usernameInp).toBeInstanceOf(HTMLInputElement);
    expect(usernameInp).toHaveAttribute('type', 'text');
    expect(passwordInp).toBeVisible();
    expect(passwordInp).toBeValid();
    expect(passwordInp).toHaveValue('');
    expect(passwordInp).toBeInstanceOf(HTMLInputElement);
    expect(passwordInp).toHaveAttribute('type', 'password');
    expect(confirmInp).toBeVisible();
    expect(confirmInp).toBeValid();
    expect(confirmInp).toHaveValue('');
    expect(confirmInp).toBeInstanceOf(HTMLInputElement);
    expect(confirmInp).toHaveAttribute('type', 'password');
    expect(firstNameInp).toBeVisible();
    expect(firstNameInp).toBeValid();
    expect(firstNameInp).toHaveValue(user.first_name);
    expect(firstNameInp).toBeInstanceOf(HTMLInputElement);
    expect(firstNameInp).toHaveAttribute('type', 'text');
    expect(lastNameInp).toBeVisible();
    expect(lastNameInp).toBeValid();
    expect(lastNameInp).toHaveValue(user.last_name);
    expect(lastNameInp).toBeInstanceOf(HTMLInputElement);
  });

  it('should render a submit button and a sign-up switcher', async () => {
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    const signinForm = screen.getByRole('form', { name: SIGNIN_REGEX });
    const signupBtn = screen.getByRole('button', { name: SIGNUP_REGEX });
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    const cancelBtn = screen.queryByRole('button', { name: /cancel/i });
    const signinBtn = screen.queryByRole('button', { name: SIGNIN_REGEX });
    expect(submitBtn).toBeVisible();
    expect(signinForm.contains(submitBtn)).toBe(true);
    expect(submitBtn).toHaveAttribute('type', 'submit');
    expect(cancelBtn).toBeNull();
    expect(signinBtn).toBeNull();
    expect(signupBtn).toBeVisible();
    expect(signinForm.contains(signupBtn)).toBe(false);
    expect(signupBtn).toHaveAttribute('type', 'button');
  });

  it('should render a submit button and a sign-in switcher', async () => {
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    const signinForm = screen.getByRole('form', { name: SIGNUP_REGEX });
    const signinBtn = screen.getByRole('button', { name: SIGNIN_REGEX });
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    const cancelBtn = screen.queryByRole('button', { name: /cancel/i });
    const signupBtn = screen.queryByRole('button', { name: SIGNUP_REGEX });
    expect(submitBtn).toBeVisible();
    expect(signinForm.contains(submitBtn)).toBe(true);
    expect(submitBtn).toHaveAttribute('type', 'submit');
    expect(cancelBtn).toBeNull();
    expect(signupBtn).toBeNull();
    expect(signinBtn).toBeVisible();
    expect(signinForm.contains(signinBtn)).toBe(false);
    expect(signinBtn).toHaveAttribute('type', 'button');
  });

  it('should render a submit button and a cancel button', async () => {
    await renderComponent({ initialRoute: EDIT_ROUTE });
    const editForm = screen.getByRole('form', { name: EDIT_REGEX });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    const signinBtn = screen.queryByRole('button', { name: SIGNIN_REGEX });
    const signupBtn = screen.queryByRole('button', { name: SIGNUP_REGEX });
    expect(submitBtn).toBeVisible();
    expect(editForm.contains(submitBtn)).toBe(true);
    expect(submitBtn).toHaveAttribute('type', 'submit');
    expect(signinBtn).toBeNull();
    expect(signupBtn).toBeNull();
    expect(cancelBtn).toBeVisible();
    expect(editForm.contains(cancelBtn)).toBe(false);
    expect(cancelBtn).toHaveAttribute('type', 'button');
  });

  it('should navigate to the sign-up form after clicking the sign-up switcher', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.click(screen.getByRole('button', { name: SIGNUP_REGEX }));
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'signup']);
  });

  it('should navigate to the sign-in form after clicking the sign-up switcher', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.click(screen.getByRole('button', { name: SIGNIN_REGEX }));
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/', 'signin']);
  });

  it('should navigate back after clicking the cancel button', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(navigate).toHaveBeenCalledExactlyOnceWith(['/account']);
  });

  it('should show-password button toggle the password value visibility in the sign-in form', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /show/i }));
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: /hide/i }));
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'password');
  });

  it('should show-password button toggle the password value visibility in the sign-up form', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirmation$/i)).toHaveAttribute('type', 'password');
    const showButtons = screen.getAllByRole('button', { name: /show/i });
    for (const showBtn of showButtons) await user.click(showBtn);
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/confirmation$/i)).toHaveAttribute('type', 'text');
    const hideButtons = screen.getAllByRole('button', { name: /hide/i });
    for (const hideBtn of hideButtons) await user.click(hideBtn);
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirmation$/i)).toHaveAttribute('type', 'password');
  });

  it('should show-password button toggle the password value visibility in the edit form', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirmation$/i)).toHaveAttribute('type', 'password');
    const showButtons = screen.getAllByRole('button', { name: /show/i });
    for (const showBtn of showButtons) await user.click(showBtn);
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/confirmation$/i)).toHaveAttribute('type', 'text');
    const hideButtons = screen.getAllByRole('button', { name: /hide/i });
    for (const hideBtn of hideButtons) await user.click(hideBtn);
    expect(screen.getByLabelText(/password$/i)).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText(/confirmation$/i)).toHaveAttribute('type', 'password');
  });

  it('should not submit the sing-in form while all fields are empty', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: SIGNIN_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/username/i)).toBeInvalid();
    expect(screen.getByLabelText(/password$/i)).toBeInvalid();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should not submit the sing-in form while it has an empty username field', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: SIGNIN_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/username/i)).toBeInvalid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should not submit the sing-in form while it has an empty password field', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: SIGNIN_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/password$/i)).toBeInvalid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should submit the sing-in form', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(signIn).toHaveBeenCalledOnce();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should not submit the sing-up form while all the required fields are empty', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: SIGNUP_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/username/i)).toBeInvalid();
    expect(screen.getByLabelText(/password$/i)).toBeInvalid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeInvalid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should not submit the sing-up form while it has an empty username field', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: SIGNUP_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/username/i)).toBeInvalid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should not submit the sing-up form while it has an empty password field and its confirmation', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: SIGNUP_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/password$/i)).toBeInvalid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeInvalid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should submit the sing-up form while it has an empty first_name field', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: SIGNUP_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(createUser).toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should not submit the sing-up form while the password and its confirmation are not matching', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pasS@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: SIGNUP_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/confirmation$/i)).toBeInvalid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should not submit the edit form while the password and its confirmation are not matching', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pasS@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('form', { name: EDIT_REGEX })).toBeVisible();
    expect(screen.getByLabelText(/confirmation$/i)).toBeInvalid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
  });

  it('should display the error returned from the server after submitting the sign-in form', async () => {
    const message = 'Test error';
    const error = { detail: message };
    const res = new HttpErrorResponse({ status: 400, statusText: 'Client error', error });
    signIn.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(editUser).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(signIn).toHaveBeenCalledOnce();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByText(new RegExp(message))).toBeVisible();
  });

  it('should display the error returned from the server after submitting the sign-up form', async () => {
    const message = 'Test error';
    const error = { detail: message };
    const res = new HttpErrorResponse({ status: 400, statusText: 'Client error', error });
    createUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(new RegExp(message))).toBeVisible();
  });

  it('should display the error returned from the server after submitting the edit form', async () => {
    const message = 'Test error';
    const error = { detail: message };
    const res = new HttpErrorResponse({ status: 400, statusText: 'Client error', error });
    editUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(editUser).toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(new RegExp(message))).toBeVisible();
  });

  it('should display the error message returned from the server after submitting the sign-in form', async () => {
    const message = 'Test error';
    const error = { non_field_errors: [message] };
    const res = new HttpErrorResponse({ status: 400, statusText: 'Client error', error });
    signIn.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(signIn).toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByText(new RegExp(message))).toBeVisible();
  });

  it('should display the error message returned from the server after submitting the sign-up form', async () => {
    const message = 'Test error';
    const error = { non_field_errors: [message] };
    const res = new HttpErrorResponse({ status: 400, statusText: 'Client error', error });
    createUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(new RegExp(message))).toBeVisible();
  });

  it('should display the error message returned from the server after submitting the edit form', async () => {
    const message = 'Test error';
    const error = { non_field_errors: [message] };
    const res = new HttpErrorResponse({ status: 400, statusText: 'Client error', error });
    editUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(editUser).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(new RegExp(message))).toBeVisible();
  });

  it('should display a server error message after submitting the sign-in form', async () => {
    const error = new ProgressEvent('Test network error');
    const res = new HttpErrorResponse({ status: 500, statusText: 'Test server error', error });
    signIn.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(signIn).toHaveBeenCalled();
    expect(editUser).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByText(/something .*wrong/i)).toBeVisible();
  });

  it('should display a server error message after submitting the sign-up form', async () => {
    const error = new ProgressEvent('Test network error');
    const res = new HttpErrorResponse({ status: 500, statusText: 'Test server error', error });
    createUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(/something .*wrong/i)).toBeVisible();
  });

  it('should display a server error message after submitting the edit form', async () => {
    const error = new ProgressEvent('Test network error');
    const res = new HttpErrorResponse({ status: 500, statusText: 'Test server error', error });
    editUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(editUser).toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(/something .*wrong/i)).toBeVisible();
  });

  it('should display a network error message after submitting the sign-in form', async () => {
    const error = new ProgressEvent('Test network error');
    const res = new HttpErrorResponse({ status: 0, statusText: 'Test no status', error });
    signIn.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNIN_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(editUser).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(signIn).toHaveBeenCalledOnce();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByText(/check your internet/i)).toBeVisible();
  });

  it('should display a network error message after submitting the sign-up form', async () => {
    const error = new ProgressEvent('Test network error');
    const res = new HttpErrorResponse({ status: 0, statusText: 'Test no status', error });
    createUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(/check your internet/i)).toBeVisible();
  });

  it('should display a network error message after submitting the edit form', async () => {
    const error = new ProgressEvent('Test network error');
    const res = new HttpErrorResponse({ status: 0, statusText: 'Test no status', error });
    editUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(editUser).toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(/check your internet/i)).toBeVisible();
  });

  it('should display the validation errors returned form the server after submitting the sign-up form', async () => {
    const error = { username: 'Test username Error', password: 'Test password Error' };
    const res = new HttpErrorResponse({ status: 400, statusText: 'Client error', error });
    createUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(editUser).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).toHaveBeenCalledOnce();
    expect(screen.getByLabelText(/username/i)).toBeInvalid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeInvalid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(new RegExp(error.username))).toBeVisible();
    expect(screen.getByText(new RegExp(error.password))).toBeVisible();
  });

  it('should display the validation errors returned form the server after submitting the edit form', async () => {
    const error = { username: 'Test username Error', password: 'Test password Error' };
    const res = new HttpErrorResponse({ status: 400, statusText: 'Client error', error });
    editUser.mockImplementationOnce(() => throwError(() => res));
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(editUser).toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/username/i)).toBeInvalid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeInvalid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByText(new RegExp(error.username))).toBeVisible();
    expect(screen.getByText(new RegExp(error.password))).toBeVisible();
  });

  it('should submit and reset the sing-up form without an empty last_name field', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
  });

  it('should submit and reset the sing-up form with a filled last_name field', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: SIGNUP_ROUTE });
    await user.type(screen.getByLabelText(/username/i), 'test_user');
    await user.type(screen.getByLabelText(/first name/i), 'Test User');
    await user.type(screen.getByLabelText(/password$/i), 'pass@123');
    await user.type(screen.getByLabelText(/confirmation$/i), 'pass@123');
    await user.type(screen.getByLabelText(/last name/i), 'Testing...');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).toHaveBeenCalledOnce();
    expect(signIn).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/last name/i)).toBeValid();
    expect(screen.getByLabelText(/confirmation$/i)).toBeValid();
    expect(screen.getByLabelText(/username/i)).toBeValid();
    expect(screen.getByLabelText(/first name/i)).toBeValid();
    expect(screen.getByLabelText(/password$/i)).toBeValid();
  });

  it('should submit the edit form', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.type(screen.getByLabelText(/username/i), ' x');
    await user.type(screen.getByLabelText(/password$/i), ' x');
    await user.type(screen.getByLabelText(/first name/i), ' x');
    await user.type(screen.getByLabelText(/confirmation$/i), ' x');
    await user.type(screen.getByLabelText(/last name/i), ' x');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(editUser).toHaveBeenCalled();
  });

  it('should submit the edit form even if all the fields are empty', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.clear(screen.getByLabelText(/username/i));
    await user.clear(screen.getByLabelText(/password$/i));
    await user.clear(screen.getByLabelText(/first name/i));
    await user.clear(screen.getByLabelText(/confirmation$/i));
    await user.clear(screen.getByLabelText(/last name/i));
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(editUser).toHaveBeenCalled();
  });

  it('should submit the edit form even if the form is never touched', async () => {
    const user = userEvent.setup();
    await renderComponent({ initialRoute: EDIT_ROUTE });
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(createUser).not.toHaveBeenCalled();
    expect(signIn).not.toHaveBeenCalled();
    expect(editUser).toHaveBeenCalled();
  });

  it('should not have a guest sign-in route in the edit form', async () => {
    await renderComponent({ initialRoute: EDIT_ROUTE });
    expect(screen.queryByRole('button', { name: /guest/i })).toBeNull();
  });
});
