import { TestBed } from '@angular/core/testing';
import { Profile, SectionData, SectionEntry, Sections, Slug } from './profiles.types';
import { Profiles } from './profiles';
import { environment } from '../../environments';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Accounts } from '../accounts';

const profile: Profile = {
  id: 1,
  tel: '01',
  bio: 'Bio',
  name: 'Foo',
  title: 'Blah',
  location: 'Z',
  email: 'x@y.z',
  username: 'foo',
  public: true,
};

const baseUrl = environment.apiUrl + 'provetrina/';

const accountsMock = { user: vi.fn(() => ({ id: profile.id }) as unknown) };

const setup = () => {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: Accounts, useValue: accountsMock },
    ],
  });
  const httpTesting = TestBed.inject(HttpTestingController);
  const service = TestBed.inject(Profiles);
  return { service, httpTesting };
};

const updateSection = (
  service: Profiles,
  slug: Slug,
  createSectionUpdates: (sections: Sections) => Partial<SectionData>,
) => {
  service.activeProfileSections.update((sections) => {
    return { ...sections, [slug]: { ...sections[slug], ...createSectionUpdates(sections) } };
  });
};

describe('Profiles', () => {
  it('should has the backend URL', () => {
    const { service } = setup();
    expect(service.baseUrl).toBe(baseUrl);
  });

  it('should get a profile list', async () => {
    const { service, httpTesting } = setup();
    const requestPromise = firstValueFrom(service.getProfileList());
    httpTesting
      .expectOne({ method: 'GET', url: `${baseUrl}profiles/` }, 'Request to get a profile')
      .flush([profile]);
    expect(await requestPromise).toStrictEqual([profile]);
    httpTesting.verify();
  });

  it('should get a profile by id', async () => {
    const { service, httpTesting } = setup();
    const requestPromise = firstValueFrom(service.getProfile(profile.id));
    httpTesting
      .expectOne(
        { method: 'GET', url: `${baseUrl}profiles/${profile.id}/` },
        'Request to get a profile',
      )
      .flush(profile);
    expect(await requestPromise).toStrictEqual(profile);
    httpTesting.verify();
  });

  it('should create a profile', async () => {
    const { service, httpTesting } = setup();
    const requestPromise = firstValueFrom(service.createProfile(profile));
    httpTesting
      .expectOne({ method: 'POST', url: `${baseUrl}profiles/` }, 'Request to create a profile')
      .flush(profile);
    expect(await requestPromise).toStrictEqual(profile);
    httpTesting.verify();
  });

  it('should update a profile by id', async () => {
    const { service, httpTesting } = setup();
    const requestPromise = firstValueFrom(service.updateProfile(profile.id, profile));
    httpTesting
      .expectOne(
        { method: 'PATCH', url: `${baseUrl}profiles/${profile.id}/` },
        'Request to update a profile',
      )
      .flush(profile);
    expect(await requestPromise).toStrictEqual(profile);
    httpTesting.verify();
  });

  it('should delete a profile by id', async () => {
    const { service, httpTesting } = setup();
    const requestPromise = firstValueFrom(service.deleteProfile(profile.id));
    httpTesting
      .expectOne(
        { method: 'DELETE', url: `${baseUrl}profiles/${profile.id}/` },
        'Request to delete a profile',
      )
      .flush(profile);
    expect(await requestPromise).toStrictEqual(profile);
    httpTesting.verify();
  });

  it('should return the section name', async () => {
    const { service } = setup();
    expect(service.getSectionEntryName(Slug.COURSE)).toBe('Course');
    expect(service.getSectionEntryName(Slug.SKILL)).toBe('Skill');
    expect(service.getSectionEntryName(Slug.LINK)).toBe('Link');
  });

  it('should load all profile sections', () => {
    const resBody = { results: [{ id: 7 }] };
    const { service, httpTesting } = setup();
    service.loadProfileSections(profile.id);
    for (const slug of Object.values(Slug) as Slug[]) {
      httpTesting
        .expectOne(
          { method: 'GET', url: `${baseUrl}${slug}?profile_id=${profile.id}` },
          `GET '${slug}'`,
        )
        .flush(resBody);
      expect(service.activeProfileSections()[slug].entries).toStrictEqual(resBody.results);
    }
    httpTesting.verify();
  });

  for (const [key, slug] of Object.entries(Slug) as [string, Slug][]) {
    const entryId = 1;
    const profileId = profile.id;
    const entryName = `${key[0].toUpperCase()}${key.slice(1).toLowerCase().replace(/_/g, '-')}`;

    it('should get a section entries', async () => {
      const resBody = [{}];
      const { service, httpTesting } = setup();
      const requestPromise = firstValueFrom(service.getSectionEntries(slug, profileId));
      httpTesting
        .expectOne(
          { method: 'GET', url: `${baseUrl}${slug}?profile_id=${profileId}` },
          `Request to get ${entryName} list`,
        )
        .flush(resBody);
      expect(await requestPromise).toBe(resBody);
      httpTesting.verify();
    });

    it('should get a section entry by id', async () => {
      const resBody = {};
      const { service, httpTesting } = setup();
      const requestPromise = firstValueFrom(service.getSectionEntry(slug, entryId, profileId));
      httpTesting
        .expectOne(
          { method: 'GET', url: `${baseUrl}${slug}${entryId}/?profile_id=${profileId}` },
          `Request to get ${entryName}`,
        )
        .flush(resBody);
      expect(await requestPromise).toStrictEqual(resBody);
      httpTesting.verify();
    });

    for (const user of [
      null,
      { id: profileId, type: 'owner' },
      { id: profileId + 1, type: 'non-owner' },
    ]) {
      const userType = user ? user.type : 'null';

      it(`should create a section entry (user = ${userType})`, async () => {
        accountsMock.user.mockImplementation(() => user);
        const resBody = { id: entryId };
        const { service, httpTesting } = setup();
        const requestPromise = firstValueFrom(service.createSectionEntry(slug, profileId, {}));
        httpTesting
          .expectOne(
            { method: 'POST', url: `${baseUrl}${slug}?profile_id=${profileId}` },
            `Request to crate ${entryName}`,
          )
          .flush(resBody);
        expect(await requestPromise).toStrictEqual(resBody);
        if (user && user.id === profileId) {
          expect(service.activeProfileSections()[slug].entries).toStrictEqual([resBody]);
        } else {
          expect(service.activeProfileSections()[slug].entries).toStrictEqual([]);
        }
        httpTesting.verify();
        accountsMock.user.mockReset();
      });

      it(`should update a section entry by id (user = ${userType})`, async () => {
        accountsMock.user.mockImplementation(() => user);
        const initialEntry = { id: entryId, order: 1 };
        const resBody = { id: entryId, order: 2 };
        const { service, httpTesting } = setup();
        const data = { entries: [initialEntry] } as SectionData;
        updateSection(service, slug, (sections) => ({
          entries: sections[slug].entries.concat(data.entries),
        }));
        const requestPromise = firstValueFrom(
          service.updateSectionEntry(slug, entryId, profileId, {}),
        );
        httpTesting
          .expectOne(
            { method: 'PATCH', url: `${baseUrl}${slug}${entryId}/?profile_id=${profileId}` },
            `Request to update ${entryName}`,
          )
          .flush(resBody);
        expect(await requestPromise).toStrictEqual(resBody);
        if (user && user.id == profileId) {
          expect(service.activeProfileSections()[slug].entries).toStrictEqual([resBody]);
        } else {
          expect(service.activeProfileSections()[slug].entries).toStrictEqual([initialEntry]);
        }
        httpTesting.verify();
        accountsMock.user.mockReset();
      });

      it(`should delete a section entry by id (user = ${userType})`, async () => {
        accountsMock.user.mockImplementation(() => user);
        const initialEntry = { id: entryId };
        const resBody = '';
        const { service, httpTesting } = setup();
        const data = { entries: [initialEntry] } as SectionData;
        updateSection(service, slug, (sections) => ({
          entries: sections[slug].entries.concat(data.entries),
        }));
        const requestPromise = firstValueFrom(service.deleteSectionEntry(slug, entryId, profileId));
        httpTesting
          .expectOne(
            { method: 'DELETE', url: `${baseUrl}${slug}${entryId}/?profile_id=${profileId}` },
            `Request to delete ${entryName}`,
          )
          .flush(resBody);
        expect(await requestPromise).toStrictEqual(resBody);
        if (user && user.id === profileId) {
          expect(service.activeProfileSections()[slug].entries).toStrictEqual([]);
        } else {
          expect(service.activeProfileSections()[slug].entries).toStrictEqual([initialEntry]);
        }
        httpTesting.verify();
        accountsMock.user.mockReset();
      });
    }

    it('should reorder section entries if the request succeeded', async () => {
      const entries = [
        { id: 0, order: 0 },
        { id: 1, order: 1 },
        { id: 2, order: 2 },
      ] as SectionEntry[];
      const orderedEntries = [entries[2], entries[1]];
      const expectedEntries = [...orderedEntries, entries[0]]; // Any extras comes last
      const { service, httpTesting } = setup();
      service.activeProfileSections.update((sections) => ({
        ...sections,
        [slug]: { ...sections[slug], entries },
      }));
      const requestPromise = firstValueFrom(
        service.reorderSectionEntries(slug, orderedEntries, profile.id),
      );
      const req = httpTesting.expectOne(
        { method: 'POST', url: `${baseUrl}${slug}reorder/?profile_id=${profile.id}` },
        `Request to reorder '${slug}'`,
      );
      req.flush('', { status: 204, statusText: 'No Content' });
      await requestPromise;
      expect(req.request.body).toStrictEqual({ ordered_ids: orderedEntries.map((e) => e.id) });
      expect(service.activeProfileSections()[slug].entries).toStrictEqual(expectedEntries);
      httpTesting.verify();
    });

    it('should not reorder section entries if the request failed', async () => {
      const entries = [
        { id: 1, order: 1 },
        { id: 2, order: 2 },
      ] as SectionEntry[];
      const orderedEntries = [entries[1], entries[0]];
      const { service, httpTesting } = setup();
      service.activeProfileSections.update((sections) => ({
        ...sections,
        [slug]: { ...sections[slug], entries },
      }));
      const requestPromise = firstValueFrom(
        service.reorderSectionEntries(slug, orderedEntries, profile.id),
      );
      const req = httpTesting.expectOne(
        { method: 'POST', url: `${baseUrl}${slug}reorder/?profile_id=${profile.id}` },
        `Request to reorder '${slug}'`,
      );
      req.flush('', { status: 500, statusText: 'Internal Server Error' });
      await expect(() => requestPromise).rejects.toThrow();
      expect(req.request.body).toStrictEqual({ ordered_ids: orderedEntries.map((e) => e.id) });
      expect(service.activeProfileSections()[slug].entries).toStrictEqual(entries);
      httpTesting.verify();
    });
  }
});
