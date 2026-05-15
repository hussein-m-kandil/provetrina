import { Profile, SectionBase, SectionEntry, SectionFormData, Slug } from '../profiles.types';
import { input, output, inject, Component, OnChanges, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { handleFormGroupSubmissionError } from '../../utils';
import { sectionFormDataFactory } from './section-form.data';
import { ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { FormField } from '../../form-field';
import { Message } from 'primeng/message';
import { Button } from 'primeng/button';
import { Profiles } from '../profiles';

@Component({
  selector: 'app-section-form',
  imports: [ReactiveFormsModule, FormField, Message, Button],
  templateUrl: './section-form.html',
})
export class SectionForm implements OnChanges {
  readonly order = input.required<SectionBase['order']>();
  readonly profileId = input.required<Profile['id']>();
  readonly slug = input.required<Slug>();

  readonly succeeded = output<SectionEntry>();
  readonly failed = output<unknown>();
  readonly canceled = output();

  protected readonly profiles = inject(Profiles);

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);

  protected form!: SectionFormData['form'];
  protected fields!: SectionFormData['fields'];

  protected submit() {
    const form = this.form;
    form.markAllAsTouched();
    form.markAllAsDirty();
    form.markAsTouched();
    form.markAsDirty();
    form.setErrors(null);
    if (form.enabled && form.valid) {
      const slug = this.slug();
      const order = this.order();
      const profileId = this.profileId();
      const formValues = { ...form.getRawValue(), order };
      form.disable();
      this.profiles
        .createSectionEntry(slug, profileId, formValues)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (createdEntry) => {
            form.reset();
            form.enable();
            this.succeeded.emit(createdEntry);
            this._toast.add({
              severity: 'success',
              summary: 'Submission succeeded!',
              detail: `A new entry is created successfully.`,
            });
          },
          error: (res) => {
            form.enable();
            this.failed.emit(res);
            const formErrors = handleFormGroupSubmissionError(form, res);
            form.setErrors(formErrors);
            this._toast.add({
              severity: 'error',
              summary: 'Submission failed!',
              detail: formErrors.nonFieldError || 'Something went wrong.',
            });
          },
        });
    }
  }

  protected createFormLabel() {
    return this.profiles.getSectionEntryName(this.slug()) + ' Form';
  }

  ngOnChanges() {
    const formData = sectionFormDataFactory[this.slug()]();
    this.form = formData.form;
    this.fields = formData.fields;
  }
}
