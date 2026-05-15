import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { Slug, type Profile as ProfileT } from '../profiles.types';
import { MessageService } from 'primeng/api';
import { Profile } from './profile';
import { of } from 'rxjs';
import { Profiles } from '../profiles';

const profile: ProfileT = {
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

const profilesMock = {
  Slug,
  loadProfileSections: vi.fn(),
  deleteProfile: vi.fn(() => of()),
  activeProfileSections: vi.fn(() =>
    Object.fromEntries(
      Object.values(Slug).map((slug) => [slug, { loading: false, error: '', entries: [] }]),
    ),
  ),
};

const renderComponent = ({
  inputs,
  providers,
  ...options
}: RenderComponentOptions<Profile> = {}) => {
  return render(Profile, {
    providers: [
      MessageService,
      { provide: Profiles, useValue: profilesMock },
      ...(providers || []),
    ],
    inputs: { profile: profile, ...(inputs || {}) },
    ...options,
  });
};

describe('Profile', () => {
  it('should load profile sections', async () => {
    await renderComponent();
    expect(profilesMock.loadProfileSections).toHaveBeenCalledTimes(1);
  });

  it('should display the profile data', async () => {
    await renderComponent({ inputs: { profile: profile } });
    expect(screen.getByText(new RegExp(profile.name))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.title))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.location))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.email))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.bio))).toBeVisible();
    expect(screen.getByText(new RegExp(profile.tel))).toBeVisible();
  });

  it('should read data of every profile section', async () => {
    await renderComponent();
    expect(profilesMock.activeProfileSections.mock.calls.length).toBeGreaterThanOrEqual(
      Object.keys(Slug).length,
    );
  });
});
