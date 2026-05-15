import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { Observable, of, Subscriber } from 'rxjs';
import { SectionEntry } from './section-entry';
import { MessageService } from 'primeng/api';
import { Slug } from '../profiles.types';
import { Profiles } from '../profiles';

const entryData = {
  header: 'Test Header',
  subheader: 'test subheader',
  headerHref: 'http://test.case/',
  slug: Slug.LINK,
  profileId: 1,
  entryId: 1,
  editable: true,
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  summary: 'Test summary...',
  location: 'Test place.',
  keywords: 'Foo, bar, baz',
};

const profilesMock = {
  getSectionEntryName: vi.fn(() => 'Section entry'),
  deleteSectionEntry: vi.fn(() => of()),
};

const renderComponent = ({
  providers,
  inputs,
  ...options
}: RenderComponentOptions<SectionEntry> = {}) => {
  return render(SectionEntry, {
    providers: [
      MessageService,
      { provide: Profiles, useValue: profilesMock },
      ...(providers || []),
    ],
    inputs: { ...entryData, ...(inputs || {}) },
    autoDetectChanges: false,
    ...options,
  });
};

describe('SectionEntry', () => {
  it('should create', async () => {
    await renderComponent({ inputs: { ...entryData } });
    expect(
      screen.getByRole('heading', { name: `${entryData.header}${entryData.subheader}` }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: entryData.header })).toHaveAttribute(
      'href',
      entryData.headerHref,
    );
    expect(screen.getAllByRole('time').map((node) => node.getAttribute('datetime'))).toStrictEqual([
      entryData.startDate,
      entryData.endDate,
    ]);
    expect(screen.getByText(entryData.location)).toBeVisible();
    expect(screen.getByText(entryData.summary)).toBeVisible();
    for (const kw of entryData.keywords.split(',')) {
      expect(screen.getByText(kw.trim())).toBeVisible();
    }
    expect(screen.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  it('should not have a header link', async () => {
    await renderComponent({ inputs: { ...entryData, headerHref: undefined } });
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('should not have a delete button', async () => {
    await renderComponent({ inputs: { ...entryData, editable: undefined } });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should not have any dates if not give a start-date', async () => {
    await renderComponent({ inputs: { ...entryData, startDate: undefined } });
    expect(screen.queryByRole('time')).toBeNull();
  });

  it('should have the given start-date and the word `Preset` if not given an end-date', async () => {
    await renderComponent({ inputs: { ...entryData, endDate: undefined } });
    expect(screen.queryByRole('time')).toHaveAttribute('datetime', entryData.startDate);
    expect(screen.getByText(/present/i)).toBeVisible();
  });

  it('should delete the entry if confirmed', async () => {
    let sub!: Subscriber<void>;
    profilesMock.deleteSectionEntry.mockImplementation(() => new Observable((s) => (sub = s)));
    const originalWindowConfirmFn = window.confirm.bind(window);
    const confirmMock = vi.fn(() => true);
    const actor = userEvent.setup();
    const deletionHandler = vi.fn();
    window.confirm = confirmMock;
    const { detectChanges } = await renderComponent({
      inputs: entryData,
      on: { deleted: deletionHandler },
    });
    await actor.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    sub.next();
    sub.complete();
    detectChanges();
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
    expect(confirmMock).toHaveBeenCalledOnce();
    expect(profilesMock.deleteSectionEntry).toHaveBeenCalledExactlyOnceWith(
      entryData.slug,
      entryData.entryId,
      entryData.profileId,
    );
    expect(deletionHandler).toHaveBeenCalledExactlyOnceWith(entryData.entryId);
    window.confirm = originalWindowConfirmFn;
    profilesMock.deleteSectionEntry.mockReset();
  });

  it('should not delete the entry if not confirmed', async () => {
    const originalWindowConfirmFn = window.confirm.bind(window);
    const confirmMock = vi.fn(() => false);
    const actor = userEvent.setup();
    const deletionHandler = vi.fn();
    window.confirm = confirmMock;
    await renderComponent({ inputs: entryData, on: { deleted: deletionHandler } });
    await actor.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
    expect(confirmMock).toHaveBeenCalledOnce();
    expect(profilesMock.deleteSectionEntry).toHaveBeenCalledTimes(0);
    expect(deletionHandler).toHaveBeenCalledTimes(0);
    window.confirm = originalWindowConfirmFn;
  });

  it('should handle entry deletion error', async () => {
    let sub!: Subscriber<void>;
    profilesMock.deleteSectionEntry.mockImplementation(() => new Observable((s) => (sub = s)));
    const originalWindowConfirmFn = window.confirm.bind(window);
    const confirmMock = vi.fn(() => true);
    const actor = userEvent.setup();
    const deletionHandler = vi.fn();
    window.confirm = confirmMock;
    const { detectChanges } = await renderComponent({
      inputs: entryData,
      on: { deleted: deletionHandler },
    });
    await actor.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    sub.error();
    detectChanges();
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
    expect(confirmMock).toHaveBeenCalledOnce();
    expect(profilesMock.deleteSectionEntry).toHaveBeenCalledExactlyOnceWith(
      entryData.slug,
      entryData.entryId,
      entryData.profileId,
    );
    expect(deletionHandler).toHaveBeenCalledTimes(0);
    window.confirm = originalWindowConfirmFn;
    profilesMock.deleteSectionEntry.mockReset();
  });
});
