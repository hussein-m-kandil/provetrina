import type { Profile, SectionData, SectionEntry, Sections } from './profiles.types';
import { asyncScheduler, map, observeOn, of, tap } from 'rxjs';
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments';
import { ListResponse } from '../app.types';
import { getResErrMsg } from '../utils';
import { Slug } from './profiles.types';
import { Accounts } from '../accounts';
import { ListStore } from '../list';

const sectionBase: Omit<SectionData, 'slug' | 'entries'> = { loading: false, error: '' };

const initialSections: Sections = {
  [Slug.LINK]: { ...sectionBase, entries: [], slug: Slug.LINK },
  [Slug.SKILL]: { ...sectionBase, entries: [], slug: Slug.SKILL },
  [Slug.EDUCATION]: { ...sectionBase, entries: [], slug: Slug.EDUCATION },
  [Slug.WORK_EXPERIENCE]: { ...sectionBase, entries: [], slug: Slug.WORK_EXPERIENCE },
  [Slug.PROJECT]: { ...sectionBase, entries: [], slug: Slug.PROJECT },
  [Slug.COURSE]: { ...sectionBase, entries: [], slug: Slug.COURSE },
};

@Injectable({
  providedIn: 'root',
})
export class Profiles extends ListStore<Profile> {
  private readonly _http = inject(HttpClient);
  private readonly _accounts = inject(Accounts);

  readonly Slug = Slug;

  readonly baseUrl = environment.apiUrl + 'provetrina/';

  readonly activeProfileSections = signal(initialSections);

  readonly searchValue = signal('');

  protected override readonly loadErrorMessage = 'Failed to load posts.';

  private _updateActiveProfileSections(slug: Slug, updates: Partial<SectionData>) {
    this.activeProfileSections.update((sections) => ({
      ...sections,
      [slug]: { ...sections[slug], ...updates },
    }));
  }

  private readonly _nextPageNum = signal<number | null>(0);

  protected override getMore() {
    const nextPageNum = this._nextPageNum();
    if (nextPageNum !== null) {
      const searchValue = this.searchValue();
      const params: Record<string, number | string> = {};
      if (nextPageNum) params['page'] = nextPageNum;
      if (searchValue) params['q'] = searchValue;
      return this._http.get<ListResponse<Profile>>(`${this.baseUrl}profiles/`, { params }).pipe(
        map((res) => {
          let next = null;
          if (res.next) {
            // res.next will be an absolute URL, e.g. https://host/path/?page=123
            const match = res.next.match(/\d+$/);
            if (match) next = parseInt(match[0], 10) || null;
          }
          this._nextPageNum.set(next);
          return res.results;
        }),
      );
    } else {
      return of([]).pipe(observeOn(asyncScheduler));
    }
  }

  override reset() {
    super.reset();
    this._nextPageNum.set(0);
    this.searchValue.set('');
  }

  loadProfileSection(slug: Slug, profileId: Profile['id']) {
    const section = this.activeProfileSections()[slug];
    this._updateActiveProfileSections(slug, { loading: true, error: '' });
    this.getSectionEntries(section.slug, profileId).subscribe({
      next: (data) => {
        this._updateActiveProfileSections(slug, { loading: false, entries: data.results });
      },
      error: (res) => {
        this._updateActiveProfileSections(slug, {
          loading: false,
          error: getResErrMsg(res) || `Failed to load ${slug}.`,
        });
      },
    });
  }

  loadProfileSections(profileId: Profile['id']) {
    this.activeProfileSections.set(initialSections);
    for (const slug of Object.values(Slug) as Slug[]) {
      this.loadProfileSection(slug, profileId);
    }
  }

  getProfileList() {
    return this._http.get<ListResponse<Profile>>(`${this.baseUrl}profiles/`);
  }

  getProfile(idOrUsername: Profile['id' | 'username']) {
    return this._http.get<Profile>(`${this.baseUrl}profiles/${idOrUsername}/`);
  }

  createProfile(data: Pick<Profile, 'name'> & Partial<Omit<Profile, 'name'>>) {
    return this._http.post<Profile>(`${this.baseUrl}profiles/`, data);
  }

  updateProfile(id: Profile['id'], data: Partial<Profile>) {
    return this._http.patch<Profile>(`${this.baseUrl}profiles/${id}/`, data);
  }

  deleteProfile(id: Profile['id']) {
    return this._http.delete<void>(`${this.baseUrl}profiles/${id}/`);
  }

  getSectionEntryName(slug: Slug) {
    let sectionName = 'Section entry';
    for (const [k, v] of Object.entries(Slug)) {
      if (v === slug) {
        sectionName = k[0].toUpperCase() + k.slice(1).toLowerCase().replace(/_/g, ' ');
      }
    }
    return sectionName;
  }

  getSectionEntries<E extends SectionEntry>(slug: Slug, profileId: Profile['id']) {
    return this._http.get<ListResponse<E>>(`${this.baseUrl}${slug}`, {
      params: { profile_id: profileId },
    });
  }

  getSectionEntry<E extends SectionEntry>(
    slug: Slug,
    id: SectionEntry['id'],
    profileId: Profile['id'],
  ) {
    return this._http.get<E>(`${this.baseUrl}${slug}${id}/`, {
      params: { profile_id: profileId },
    });
  }

  createSectionEntry<E extends SectionEntry>(slug: Slug, profileId: Profile['id'], data: unknown) {
    return this._http
      .post<E>(`${this.baseUrl}${slug}`, data, {
        params: { profile_id: profileId },
      })
      .pipe(
        tap((entry) => {
          const user = this._accounts.user();
          if (user && user.id === profileId) {
            this._updateActiveProfileSections(slug, {
              entries: this.activeProfileSections()[slug].entries.concat(entry),
            });
          }
        }),
      );
  }

  updateSectionEntry<E extends SectionEntry>(
    slug: Slug,
    id: SectionEntry['id'],
    profileId: Profile['id'],
    data: unknown,
  ) {
    return this._http
      .patch<E>(`${this.baseUrl}${slug}${id}/`, data, {
        params: { profile_id: profileId },
      })
      .pipe(
        tap((entry) => {
          const user = this._accounts.user();
          if (user && user.id === profileId) {
            this._updateActiveProfileSections(slug, {
              entries: this.activeProfileSections()[slug].entries.map((e) =>
                e.id === entry.id ? entry : e,
              ),
            });
          }
        }),
      );
  }

  deleteSectionEntry(slug: Slug, id: SectionEntry['id'], profileId: Profile['id']) {
    return this._http
      .delete<void>(`${this.baseUrl}${slug}${id}/`, {
        params: { profile_id: profileId },
      })
      .pipe(
        tap(() => {
          const user = this._accounts.user();
          if (user && user.id === profileId) {
            this._updateActiveProfileSections(slug, {
              entries: this.activeProfileSections()[slug].entries.filter((e) => e.id !== id),
            });
          }
        }),
      );
  }

  reorderSectionEntries(slug: Slug, orderedEntries: SectionEntry[], profileId: Profile['id']) {
    const body = { ordered_ids: orderedEntries.map((e) => e.id) };
    return this._http
      .post<void>(`${this.baseUrl}${slug}reorder/`, body, {
        params: { profile_id: profileId },
      })
      .pipe(
        tap({
          next: () => {
            const user = this._accounts.user();
            if (user && user.id === profileId) {
              const currentEntries = this.activeProfileSections()[slug].entries.slice();
              const updatedEntries: SectionEntry[] = [];
              for (const entry of orderedEntries) {
                const entryIndex = currentEntries.findIndex((e) => e.id === entry.id);
                if (entryIndex >= 0) {
                  updatedEntries.push(currentEntries[entryIndex]);
                  currentEntries.splice(entryIndex, 1);
                }
              }
              updatedEntries.push(...currentEntries);
              this._updateActiveProfileSections(slug, { entries: updatedEntries });
            }
          },
          error: () => {
            const user = this._accounts.user();
            if (user && user.id === profileId) {
              const entriesCopy = this.activeProfileSections()[slug].entries.slice();
              const entriesInOriginalOrder = entriesCopy.sort((a, b) => a.order - b.order);
              this._updateActiveProfileSections(slug, { entries: entriesInOriginalOrder });
            }
          },
        }),
      );
  }
}
