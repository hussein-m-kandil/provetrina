import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { MessageService } from 'primeng/api';
import { SectionForm } from './section-form';
import { Slug } from '../profiles.types';
import { Profiles } from '../profiles';
import { of } from 'rxjs';

const profilesMock = {
  slugs: Slug,
  createSectionEntry: vi.fn(() => of()),
  getSectionEntryName: vi.fn(() => 'Section entry'),
};

const renderComponent = ({
  providers,
  inputs,
  ...options
}: RenderComponentOptions<SectionForm> = {}) => {
  return render(SectionForm, {
    providers: [
      MessageService,
      { provide: Profiles, useValue: profilesMock },
      ...(providers || []),
    ],
    inputs: { profileId: 1, order: 1, slug: Slug.LINK, ...(inputs || {}) },
    ...options,
  });
};

describe('SectionForm', () => {
  afterEach(vi.resetAllMocks);

  for (const slug of Object.values(Slug) as Slug[]) {
    it('should have form, fields, and save button', async () => {
      await renderComponent({ inputs: { slug } });
      expect(screen.getByRole('form')).toBeVisible();
      expect(screen.getAllByRole('textbox').length).greaterThan(0);
      expect(screen.getByRole('button', { name: /save/i })).toBeVisible();
      expect(screen.getByRole('form', { name: /section entry/i })).toBeVisible();
    });

    it('should not submit an empty form', async () => {
      const actor = userEvent.setup();
      await renderComponent({ inputs: { slug } });
      await actor.click(screen.getByRole('button', { name: /save/i }));
      screen
        .getAllByRole('textbox')
        .some((inp) => inp.ariaInvalid === 'true' && inp.classList.contains('ng-invalid'));
      expect(profilesMock.createSectionEntry).toHaveBeenCalledTimes(0);
    });

    it('should submit a filled-out form', async () => {
      const actor = userEvent.setup();
      await renderComponent({ inputs: { slug } });
      for (const inp of screen.queryAllByRole('textbox')) {
        if (/-url-/i.test(inp.id)) await actor.type(inp, 'http://test.case/');
        else await actor.type(inp, 'Foo');
      }
      for (const inp of screen.queryAllByRole('combobox')) {
        if (/-date-/i.test(inp.id)) await actor.type(inp, '10/10/2020');
      }
      await actor.click(screen.getByRole('button', { name: /save/i }));
      screen
        .getAllByRole('textbox')
        .every((inp) => inp.ariaInvalid !== 'true' && inp.classList.contains('ng-valid'));
      expect(profilesMock.createSectionEntry).toHaveBeenCalledTimes(1);
    });
  }
});
