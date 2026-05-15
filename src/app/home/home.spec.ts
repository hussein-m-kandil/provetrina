import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { Home } from './home';

const renderComponent = (options: RenderComponentOptions<Home> = {}) => {
  return render(Home, options);
};

describe('Home', () => {
  it('should have hero', async () => {
    await renderComponent();
    expect(screen.getByRole('heading')).toBeVisible();
  });
});
