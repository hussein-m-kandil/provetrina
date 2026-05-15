import {
  input,
  signal,
  output,
  inject,
  Component,
  DestroyRef,
  booleanAttribute,
} from '@angular/core';
import { SectionEntry as SectionEntryT } from '../profiles.types';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Profile, Slug } from '../profiles.types';
import { MessageService } from 'primeng/api';
import { getResErrMsg } from '../../utils';
import { DatePipe } from '@angular/common';
import { Button } from 'primeng/button';
import { Profiles } from '../profiles';
import { Badge } from 'primeng/badge';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-section-entry',
  imports: [DatePipe, Button, Badge],
  templateUrl: './section-entry.html',
})
export class SectionEntry {
  readonly editable = input(false, { transform: booleanAttribute });
  readonly entryId = input.required<SectionEntryT['id']>();
  readonly profileId = input.required<Profile['id']>();
  readonly header = input.required<string>();
  readonly slug = input.required<Slug>();
  readonly headerHref = input('');
  readonly subheader = input('');
  readonly startDate = input('');
  readonly endDate = input('');
  readonly summary = input('');
  readonly location = input('');
  readonly keywords = input('');

  readonly deleted = output<SectionEntryT['id']>();

  protected readonly profiles = inject(Profiles);

  protected readonly deleting = signal(false);

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);

  protected deleteEntry() {
    const id = this.entryId();
    const slug = this.slug();
    const subject = this.profiles.getSectionEntryName(slug);
    const lowerSubject = subject.toLowerCase();
    if (window.confirm('Do you really want to permanently delete this ' + lowerSubject + '?')) {
      this.deleting.set(true);
      this.profiles
        .deleteSectionEntry(slug, id, this.profileId())
        .pipe(
          takeUntilDestroyed(this._destroyRef),
          finalize(() => {
            this.deleting.set(false);
          }),
        )
        .subscribe({
          next: () => {
            this.deleted.emit(id);
            this._toast.add({
              severity: 'success',
              summary: subject + ' deleted',
              detail: `A ${lowerSubject} has been deleted successfully.`,
            });
          },
          error: (res) => {
            this._toast.add({
              severity: 'error',
              summary: subject + ' deletion failed',
              detail: getResErrMsg(res) || `Failed to delete a ${lowerSubject}.`,
            });
          },
        });
    }
  }
}
