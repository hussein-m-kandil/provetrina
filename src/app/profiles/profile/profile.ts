import {
  input,
  signal,
  inject,
  computed,
  Component,
  OnChanges,
  DestroyRef,
  linkedSignal,
} from '@angular/core';
import type {
  Slug,
  Profile as ProfileT,
  Sections as SectionT,
  SectionEntry as SectionEntryT,
} from '../profiles.types';
import { Button, ButtonDirective, ButtonLabel, ButtonIcon } from 'primeng/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getResErrMsg, updateRouteTitle } from '../../utils';
import { Title } from '@angular/platform-browser';
import { SectionEntry } from '../section-entry';
import { ProfileForm } from '../profile-form';
import { MessageService } from 'primeng/api';
import { Accounts } from '../../accounts';
import { Router } from '@angular/router';
import { Profiles } from '../profiles';
import { Section } from '../section';

@Component({
  selector: 'app-profile',
  imports: [ProfileForm, SectionEntry, Section, ButtonDirective, ButtonLabel, ButtonIcon, Button],
  templateUrl: './profile.html',
})
export class Profile implements OnChanges {
  readonly profile = input.required<ProfileT>();

  protected readonly activeProfile = linkedSignal(() => this.profile());

  protected readonly accounts = inject(Accounts);
  protected readonly profiles = inject(Profiles);

  protected readonly editingProfile = signal(false);

  protected readonly editable = computed(() => {
    return this.accounts.user()?.id === this.activeProfile().id;
  });

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _toast = inject(MessageService);
  private readonly _router = inject(Router);
  private readonly _title = inject(Title);

  protected toggleEditingProfile() {
    this.editingProfile.update((editingProfile) => !editingProfile);
  }

  protected handleProfileUpdate(updatedProfile: ProfileT) {
    this.activeProfile.set(updatedProfile);
    this.editingProfile.update((editingProfile) => !editingProfile);
  }

  protected deleteProfile() {
    if (window.confirm('Do you really want to permanently delete your profile?')) {
      this.profiles
        .deleteProfile(this.activeProfile().id)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: () => {
            this._toast.add({
              severity: 'success',
              summary: 'Profile deleted',
              detail: 'Your profile has been deleted successfully.',
            });
            this._router.navigate(['/']);
          },
          error: (res) => {
            this._toast.add({
              severity: 'error',
              summary: 'Profile deletion failed',
              detail: getResErrMsg(res) || 'Failed to delete your profile.',
            });
          },
        });
    }
  }

  protected getSection<S extends Slug>(slug: S): SectionT[S] | null {
    const section = this.profiles.activeProfileSections()[slug];
    return this.editable() || section.loading || section.error || section.entries.length > 0
      ? section
      : null;
  }

  protected reorderSectionEntries(slug: Slug, entries: SectionEntryT[]) {
    this.profiles.reorderSectionEntries(slug, entries, this.activeProfile().id).subscribe({
      error: (res) => {
        const reason = getResErrMsg(res);
        this._toast.add({
          severity: 'error',
          summary: 'Reorder failed',
          detail: reason
            ? 'The following error occurred while reordering the profile section entries: `' +
              reason.replace(/\.$/, '') +
              '`.'
            : 'Failed to reorder the profile section entries.',
        });
      },
    });
  }

  ngOnChanges(): void {
    const profile = this.activeProfile();
    updateRouteTitle(this._title, profile.name);
    this.profiles.loadProfileSections(profile.id);
  }
}
