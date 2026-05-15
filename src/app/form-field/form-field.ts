import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component, input } from '@angular/core';
import { DatePicker } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';
import { FieldType } from './form-field.types';
import { InputText } from 'primeng/inputtext';
import { Checkbox } from 'primeng/checkbox';
import { Textarea } from 'primeng/textarea';
import { Message } from 'primeng/message';

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule, FloatLabel, Checkbox, Message, InputText, Textarea, DatePicker],
  templateUrl: './form-field.html',
})
export class FormField {
  readonly control = input.required<FormControl>();
  readonly type = input.required<FieldType>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();

  protected getErrors(): string[] | null {
    const control = this.control();
    if (control.errors) {
      return Object.values(control.errors).filter((e) => typeof e === 'string');
    }
    return null;
  }
}
