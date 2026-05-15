import { Component, DestroyRef, inject, input, OnChanges, output, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { handleFormGroupSubmissionError } from '../../utils';
import { NgTemplateOutlet } from '@angular/common';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Textarea } from 'primeng/textarea';
import { Checkbox } from 'primeng/checkbox';
import { Profile } from '../profiles.types';
import { Message } from 'primeng/message';
import { Accounts } from '../../accounts';
import { Button } from 'primeng/button';
import { Profiles } from '../profiles';

@Component({
  selector: 'app-profile-form',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    FloatLabel,
    InputText,
    Textarea,
    Checkbox,
    Message,
    Button,
  ],
  templateUrl: './profile-form.html',
})
export class ProfileForm implements OnInit, OnChanges {
  // NOTE: Any required fields makes the `OnInit` handler redundant.
  readonly profile = input<Profile>();

  readonly succeeded = output<Profile>();
  readonly failed = output<unknown>();
  readonly canceled = output();

  protected accounts = inject(Accounts);
  protected profiles = inject(Profiles);

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    location: new FormControl('', { nonNullable: true }),
    public: new FormControl(true, { nonNullable: true }),
    title: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    tel: new FormControl('', { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
  });

  private _initForm() {
    const profile = this.profile();
    if (profile) {
      this.form.controls.location.setValue(profile.location);
      this.form.controls.public.setValue(profile.public);
      this.form.controls.title.setValue(profile.title);
      this.form.controls.email.setValue(profile.email);
      this.form.controls.name.setValue(profile.name);
      this.form.controls.tel.setValue(profile.tel);
      this.form.controls.bio.setValue(profile.bio);
      this.form.controls.name.setValidators([]);
    } else {
      const user = this.accounts.user();
      if (user) {
        this.form.controls.name.setValue(`${user.first_name} ${user.last_name}`);
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
      const formValues = this.form.getRawValue();
      const profile = this.profile();
      const editing = !!profile;
      (editing
        ? this.profiles.updateProfile(profile.id, formValues)
        : this.profiles.createProfile(formValues)
      )
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (profile) => {
            this.form.reset();
            this.form.enable();
            this.succeeded.emit(profile);
            this._toast.add({
              severity: 'success',
              summary: 'Submission succeeded!',
              detail: `The profile is ${editing ? 'updated' : 'created'} successfully.`,
            });
          },
          error: (res) => {
            this.form.enable();
            this.failed.emit(res);
            this.form.setErrors(handleFormGroupSubmissionError(this.form, res));
            this._toast.add({
              severity: 'error',
              summary: 'Submission failed!',
              detail: `Failed to ${editing ? 'update' : 'create'} the profile.`,
            });
          },
        });
    }
  }

  ngOnInit() {
    this._initForm();
  }

  ngOnChanges() {
    this._initForm();
  }
}
