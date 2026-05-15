import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { userEvent } from '@testing-library/user-event';
import { type Profile } from '../profiles.types';
import { finalize, of, throwError } from 'rxjs';
import { ProfileForm } from './profile-form';
import { MessageService } from 'primeng/api';
import { Accounts } from '../../accounts';
import { Profiles } from '../profiles';

const profile = {
  id: 1,
  tel: '01',
  bio: 'Bio',
  name: 'Foo',
  title: 'Blah',
  location: 'Z',
  email: 'x@y.z',
  public: false,
} as Profile;

const accountsMock = { user: vi.fn(() => null as unknown) };
const profilesMock = {
  createProfile: vi.fn(() => of(profile)),
  updateProfile: vi.fn(() => of(profile)),
};

const renderComponent = ({ providers, ...options }: RenderComponentOptions<ProfileForm> = {}) => {
  return render(ProfileForm, {
    providers: [
      MessageService,
      { provide: Accounts, useValue: accountsMock },
      { provide: Profiles, useValue: profilesMock },
      ...(providers || []),
    ],
    ...options,
  });
};

describe('ProfileForm', () => {
  afterEach(vi.resetAllMocks);

  it('should display a profile form with inputs and save button', async () => {
    await renderComponent();
    expect(screen.getByRole('form', { name: /profile/i })).toBeVisible();
    for (const field of Object.keys(profile)) {
      if (field === 'id') continue;
      const name = new RegExp(field, 'i');
      if (field === 'public') {
        expect(screen.getByRole('checkbox', { name })).toBeChecked();
      } else {
        expect(screen.getByRole('textbox', { name })).toBeVisible();
        expect(screen.getByRole('textbox', { name })).toHaveValue('');
      }
    }
    expect(screen.getByRole('button', { name: /save/i })).toBeVisible();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  it('should has the current user name as the name field default value', async () => {
    const user = { first_name: 'Foo', last_name: 'Bar' };
    accountsMock.user.mockImplementation(() => user);
    await renderComponent();
    expect(screen.getByRole('textbox', { name: /name/i })).toHaveValue(
      `${user.first_name} ${user.last_name}`,
    );
  });

  it('should has the give profile data as the fields initial values', async () => {
    await renderComponent({ inputs: { profile: { ...profile, public: false } } });
    for (const field of Object.keys(profile) as (keyof typeof profile)[]) {
      if (field === 'id') continue;
      const name = new RegExp(field, 'i');
      if (field === 'public') {
        expect(screen.getByRole('checkbox', { name })).not.toBeChecked();
      } else {
        expect(screen.getByRole('textbox', { name })).toBeVisible();
        expect(screen.getByRole('textbox', { name })).toHaveValue(profile[field]);
      }
    }
  });

  it('should not create a profile without a name', async () => {
    const actor = userEvent.setup();
    await renderComponent();
    await actor.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInvalid();
    expect(profilesMock.createProfile).toHaveBeenCalledTimes(0);
    expect(profilesMock.updateProfile).toHaveBeenCalledTimes(0);
  });

  it('should create a profile', async () => {
    const actor = userEvent.setup();
    await renderComponent();
    await actor.type(screen.getByRole('textbox', { name: /name/i }), 'Foo');
    await actor.click(screen.getByRole('button', { name: /save/i }));
    expect(profilesMock.createProfile).toHaveBeenCalledTimes(1);
    expect(profilesMock.updateProfile).toHaveBeenCalledTimes(0);
  });

  it('should update the profile', async () => {
    const actor = userEvent.setup();
    await renderComponent({ inputs: { profile } });
    await actor.click(screen.getByRole('button', { name: /save/i }));
    expect(profilesMock.createProfile).toHaveBeenCalledTimes(0);
    expect(profilesMock.updateProfile).toHaveBeenCalledTimes(1);
  });

  it('should emit `canceled` event', async () => {
    const cancelationHandler = vi.fn();
    const actor = userEvent.setup();
    await renderComponent({ on: { canceled: cancelationHandler } });
    await actor.click(screen.getByRole('button', { name: /cancel/i }));
    expect(cancelationHandler).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it('should emit `failed` event', async () => {
    const actor = userEvent.setup();
    const failureHandler = vi.fn();
    let submitted = false;
    const errRes = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
    profilesMock.updateProfile.mockImplementation(() =>
      throwError(() => errRes).pipe(finalize(() => (submitted = true))),
    );
    await renderComponent({ inputs: { profile }, on: { failed: failureHandler } });
    await actor.click(screen.getByRole('button', { name: /save/i }));
    await vi.waitUntil(() => submitted);
    expect(failureHandler).toHaveBeenCalledExactlyOnceWith(errRes);
  });

  it('should emit `succeeded` event', async () => {
    const actor = userEvent.setup();
    const successHandler = vi.fn();
    let submitted = false;
    profilesMock.updateProfile.mockImplementation(() =>
      of(profile).pipe(finalize(() => (submitted = true))),
    );
    await renderComponent({ inputs: { profile }, on: { succeeded: successHandler } });
    await actor.click(screen.getByRole('button', { name: /save/i }));
    await vi.waitUntil(() => submitted);
    expect(successHandler).toHaveBeenCalledExactlyOnceWith(profile);
  });
});
