import {
  FormGroup,
  Validators,
  ValidatorFn,
  FormControl,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
} from '@angular/forms';
import { Component, DestroyRef, inject, input, OnChanges, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { SignupData, User } from '../accounts.types';
import { NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Textarea } from 'primeng/textarea';
import { getResErrMsg } from '../../utils';
import { Divider } from 'primeng/divider';
import { Message } from 'primeng/message';
import { Button } from 'primeng/button';
import { Accounts } from '../accounts';
import { Observable } from 'rxjs';

export const passwordsMatchValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const password = control.get('password');
  const confirmation = control.get('password_confirmation');
  if (password && confirmation && password.value !== confirmation.value) {
    confirmation.setErrors({ validation: 'Passwords does not match' });
  } else if (confirmation && confirmation.hasError('validation')) {
    confirmation.setErrors(confirmation.dirty && !confirmation.value ? { required: true } : null);
  }
  return null;
};

@Component({
  selector: 'app-account-form',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    FloatLabel,
    InputText,
    Textarea,
    Divider,
    Message,
    Button,
  ],
  templateUrl: './account-form.html',
})
export class AccountForm implements OnInit, OnChanges {
  // NOTE: Any required fields makes the `OnInit` handler redundant.
  readonly user = input<User>();
  protected readonly passwordHidden = signal(true);
  protected readonly confirmationHidden = signal(true);

  private readonly _activeRoute = inject(ActivatedRoute);
  private readonly _toast = inject(MessageService);
  private readonly _accounts = inject(Accounts);

  private readonly _activatedPath = this._activeRoute.snapshot.url.at(-1)?.path || '';

  protected readonly SIGN_IN_LABEL = 'Sign In';
  protected readonly SIGN_UP_LABEL = 'Sign Up';
  protected readonly EDIT_LABEL = 'Edit Account';

  protected readonly info = this._activatedPath.endsWith('signup')
    ? ({
        type: 'signup',
        label: this.SIGN_UP_LABEL,
        success: { summary: 'Welcome!', detail: 'You have signed-up successfully.' },
        error: { summary: 'Submission failed!', detail: 'Failed to sign you up.' },
      } as const)
    : this._activatedPath.endsWith('edit')
      ? ({
          type: 'edit',
          label: this.EDIT_LABEL,
          success: {
            summary: 'Account edited!',
            detail: 'You have successfully edited your account data.',
          },
          error: { summary: 'Submission failed!', detail: 'Failed to edit your account data.' },
        } as const)
      : ({
          type: 'signin',
          label: this.SIGN_IN_LABEL,
          success: { summary: 'Welcome back!', detail: 'You have signed-in successfully.' },
          error: { summary: 'Submission failed!', detail: 'Failed to sign you in.' },
        } as const);

  protected readonly signingIn = this.info.type === 'signin';
  protected readonly signingUp = this.info.type === 'signup';
  protected readonly editing = this.info.type === 'edit';

  private _fieldValidators = this.editing ? [] : [Validators.required];
  protected readonly form = new FormGroup<{
    username: FormControl<string>;
    password: FormControl<string>;
    password_confirmation?: FormControl<string>;
    first_name?: FormControl<string>;
    last_name?: FormControl<string>;
  }>(
    {
      username: new FormControl('', { validators: this._fieldValidators, nonNullable: true }),
      password: new FormControl('', { validators: this._fieldValidators, nonNullable: true }),
      ...(this.signingUp || this.editing
        ? {
            password_confirmation: new FormControl('', {
              validators: this._fieldValidators,
              nonNullable: true,
            }),
            first_name: new FormControl('', { nonNullable: true }),
            last_name: new FormControl('', { nonNullable: true }),
          }
        : {}),
    },
    { validators: passwordsMatchValidator },
  );

  protected navigate(...args: Parameters<typeof this._accounts.navigate>) {
    if (this.form.enabled) this._accounts.navigate(...args);
  }

  private readonly _destroyRef = inject(DestroyRef);

  private _initForm() {
    if (this.editing) {
      const user = this.user();
      if (user) {
        this.form.controls.username.setValue(user.username);
        this.form.controls.first_name?.setValue(user.first_name);
        this.form.controls.last_name?.setValue(user.last_name);
      }
    }
  }

  protected submit() {
    this.form.markAllAsTouched();
    this.form.markAllAsDirty();
    this.form.markAsTouched();
    this.form.markAsDirty();
    this.form.setErrors(null);
    if (this.form.enabled && this.form.valid) {
      this.form.disable();
      const user = this.user();
      const formValues = this.form.getRawValue();
      let req$: Observable<unknown>;
      if (this.signingUp) {
        req$ = this._accounts.createUser(formValues as SignupData);
      } else if (this.editing && user) {
        req$ = this._accounts.editUser(user.id, formValues);
      } else if (this.signingIn) {
        req$ = this._accounts.signIn(formValues);
      } else {
        return;
      }
      req$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe({
        next: () => {
          this.form.enable();
          this._toast.add({ ...this.info.success, severity: 'success' });
        },
        error: (res) => {
          this.form.enable();
          let message: null | string = getResErrMsg(res);
          if (res instanceof HttpErrorResponse) {
            if (this.signingIn && res.status === 401) {
              message = 'Invalid credentials.';
            } else if (res.status === 400 && res.error) {
              const nonFieldErrors = res.error['non_field_errors'] as string[] | undefined;
              if (nonFieldErrors && typeof nonFieldErrors[0] === 'string') {
                message = nonFieldErrors[0];
              }
              const controlNames = Object.keys(this.form.controls);
              for (const controlName of controlNames) {
                const fieldError = res.error[controlName] as string | undefined;
                if (fieldError) {
                  const fieldControl = this.form.get(controlName);
                  if (fieldControl) fieldControl.setErrors({ validation: fieldError });
                }
              }
            }
          }
          if (this.form.valid && !message) {
            message = 'Something went wrong, please try again later.';
          }
          if (message) this.form.setErrors({ global: message });
          this._toast.add({ ...this.info.error, severity: 'error' });
        },
      });
    }
  }

  protected isInvalid(controlName: string) {
    const control = this.form.get(controlName);
    return control && control.invalid && control.dirty;
  }

  protected getError(name: string) {
    const control = this.form.get(name);
    if (control) {
      const required = control.getError('required') as string;
      if (required) return `${name[0].toUpperCase()}${name.slice(1)} is required.`;
      const validationError = control.getError('validation') as string;
      if (validationError) return validationError;
    }
    return '';
  }

  protected togglePasswordVisibility() {
    this.passwordHidden.update((hidden) => !hidden);
  }

  protected toggleConfirmVisibility() {
    this.confirmationHidden.update((hidden) => !hidden);
  }

  ngOnInit() {
    this._initForm();
  }

  ngOnChanges() {
    this._initForm();
  }
}
