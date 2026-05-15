import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, inject, input } from '@angular/core';
import { FloatLabel } from 'primeng/floatlabel';
import { InputText } from 'primeng/inputtext';
import { getResErrMsg } from '../../utils';
import { Message } from 'primeng/message';
import { User } from '../accounts.types';
import { Button } from 'primeng/button';
import { Accounts } from '../accounts';

@Component({
  selector: 'app-account-delete-form',
  imports: [ReactiveFormsModule, FloatLabel, InputText, Message, Button],
  templateUrl: './account-delete-form.html',
})
export class AccountDeleteForm {
  protected readonly accounts = inject(Accounts);

  protected readonly form = new FormGroup({
    username: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly user = input.required<User>();

  protected submit() {
    if (this.form.enabled && this.form.valid) {
      const user = this.user();
      if (this.form.controls.username.value !== user.username) {
        this.form.controls.username.setErrors({ mismatch: true });
        return;
      }
      this.form.markAllAsDirty();
      this.form.disable();
      this.accounts.deleteUser(user.id).subscribe({
        next: () => {
          this.form.enable();
          this.form.reset();
        },
        error: (res) => {
          this.form.enable();
          this.form.setErrors({ global: getResErrMsg(res) || 'Deletion Failed!' });
        },
      });
    }
  }
}
