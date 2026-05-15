import { render, screen, RenderComponentOptions } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { ColorScheme, SCHEMES } from '../color-scheme';
import { environment } from '../../environments';
import { MessageService } from 'primeng/api';
import { Accounts } from '../accounts';
import { Mainbar } from './mainbar';

const user = { id: 1, username: 'foo_bar', first_name: 'Foo', last_name: 'Bar' };

const accountsMock = {
  authenticated: vi.fn(() => true),
  signOut: vi.fn(),
  user: vi.fn(() => user as typeof user | null),
};

const colorSchemeMock = {
  selectedScheme: vi.fn<() => (typeof SCHEMES)[number]>(() => SCHEMES[1]),
  switch: vi.fn(),
  select: vi.fn(),
};

const renderComponent = ({ providers, ...options }: RenderComponentOptions<Mainbar> = {}) => {
  return render(Mainbar, {
    providers: [
      MessageService,
      { provide: Accounts, useValue: accountsMock },
      { provide: ColorScheme, useValue: colorSchemeMock },
      ...(providers || []),
    ],
    routes: [{ path: '**', component: class {} }],
    autoDetectChanges: false,
    ...options,
  });
};

describe('Mainbar', () => {
  afterEach(vi.resetAllMocks);

  it('should has the app title', async () => {
    await renderComponent();
    const name = new RegExp(environment.title, 'i');
    const heading = screen.getByRole('heading', { name });
    const link = screen.getByRole('link', { name });
    expect(link).toHaveAttribute('href', '/');
    expect(heading).toContainElement(link);
    expect(heading).toBeVisible();
    expect(link).toBeVisible();
  });

  it('should has a color-scheme toggler that indicates to the selected value', async () => {
    colorSchemeMock.selectedScheme.mockImplementation(() => SCHEMES[2]);
    await renderComponent();
    expect(
      screen.getByRole('button', {
        name: new RegExp(`change .*${SCHEMES[2].value}.* color scheme`, 'i'),
      }),
    ).toBeVisible();
  });

  it('should change the color-scheme', async () => {
    const actor = userEvent.setup();
    await renderComponent();
    for (let i = 0; i < SCHEMES.length; i++) {
      const selectedScheme = colorSchemeMock.selectedScheme();
      await actor.click(
        screen.getByRole('button', { name: new RegExp(selectedScheme.value, 'i') }),
      );
      expect(colorSchemeMock.switch).toHaveBeenCalledTimes(i + 1);
    }
  });

  it('should has the nav links for an unauthenticated user', async () => {
    accountsMock.authenticated.mockImplementation(() => false);
    accountsMock.user.mockImplementation(() => null);
    await renderComponent();
    const signinLink = screen.getByRole('link', { name: /sign ?in/i }) as HTMLAnchorElement;
    const signupLink = screen.getByRole('link', { name: /sign ?up/i }) as HTMLAnchorElement;
    expect(signinLink).toBeVisible();
    expect(signupLink).toBeVisible();
    expect(signinLink.href).toMatch(/signin$/);
    expect(signupLink.href).toMatch(/signup$/);
    expect(screen.queryByRole('link', { name: /profile/i })).toBeNull();
  });

  it('should has the nav links for an authenticated user', async () => {
    accountsMock.authenticated.mockImplementation(() => true);
    accountsMock.user.mockImplementation(() => user);
    await renderComponent();
    const profileLink = screen.getByRole('link', { name: /profile/i }) as HTMLAnchorElement;
    const accountLink = screen.getByRole('link', { name: /account/i }) as HTMLAnchorElement;
    const signoutButton = screen.getByRole('button', { name: /sign ?out/i }) as HTMLButtonElement;
    expect(profileLink).toBeVisible();
    expect(accountLink).toBeVisible();
    expect(signoutButton).toBeVisible();
    expect(accountLink.href).toMatch(/account$/);
    expect(profileLink.href).toMatch(new RegExp(`${user.username}$`));
  });

  it('should sign-out', async () => {
    accountsMock.authenticated.mockImplementation(() => true);
    accountsMock.user.mockImplementation(() => user);
    const actor = userEvent.setup();
    await renderComponent();
    await actor.click(screen.getByRole('button', { name: /sign out/i }));
    expect(accountsMock.signOut).toHaveBeenCalledTimes(1);
  });
});
