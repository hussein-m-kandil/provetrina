import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { Slug } from '../profiles.types';
import { Section } from './section';

const section = {
  error: '',
  loading: false,
  slug: Slug.LINK,
  entries: [
    {
      id: 1,
      order: 1,
      href: 'https://superman.krypton/',
      label: 'Website',
      profile: 1,
    },
    {
      id: 2,
      order: 2,
      href: 'https://superhros.universe/superman',
      label: 'Portfolio',
      profile: 1,
    },
  ],
};

const sectionData = {
  profileId: 1,
  editable: true,
  section,
  header: 'Test Header',
};

const renderComponent = ({
  inputs,
  providers,
  ...options
}: RenderComponentOptions<Section> = {}) => {
  return render(Section, {
    inputs: { ...sectionData, ...(inputs || {}) },
    providers: [MessageService, ...(providers || [])],
    autoDetectChanges: false,
    ...options,
  });
};

describe('Section', () => {
  it('should have the given section data', async () => {
    await renderComponent({ inputs: sectionData });
    expect(screen.getByRole('heading', { name: sectionData.header })).toBeVisible();
    expect(screen.getByRole('button', { name: /add/i })).toBeVisible();
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('should display the add-form after clicking the add-button', async () => {
    const actor = userEvent.setup();
    await renderComponent({ inputs: sectionData });
    await actor.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByRole('form')).toBeVisible();
    await actor.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('should not have an add-button if not editable', async () => {
    await renderComponent({ inputs: { ...sectionData, editable: false } });
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should display empty-section message', async () => {
    await renderComponent({ inputs: { ...sectionData, section: { ...section, entries: [] } } });
    expect(screen.getByText(/empty section.*are not visible/i)).toBeVisible();
  });
});
