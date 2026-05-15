import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { Account } from './account';

const user = { id: 1, username: 'foo_bar', first_name: 'Foo', last_name: 'Bar' };

const renderComponent = ({ inputs, ...options }: RenderComponentOptions<Account> = {}) => {
  return render(Account, { inputs: { user, ...inputs }, ...options });
};

describe('Account', () => {
  it('should has user data', async () => {
    await renderComponent();
    expect(screen.getByText(new RegExp(user.username))).toBeVisible();
    expect(screen.getByText(new RegExp(user.first_name))).toBeVisible();
    expect(screen.getByText(new RegExp(user.last_name))).toBeVisible();
  });

  it('should has mutation links', async () => {
    await renderComponent();
    const editLink = screen.getByRole('link', { name: /edit/i }) as HTMLAnchorElement;
    const deleteLink = screen.getByRole('link', { name: /delete/i }) as HTMLAnchorElement;
    expect(editLink).toBeVisible();
    expect(deleteLink).toBeVisible();
    expect(editLink.href).toMatch(/edit$/);
    expect(deleteLink.href).toMatch(/delete$/);
  });
});
