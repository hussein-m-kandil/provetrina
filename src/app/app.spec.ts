import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { environment } from '../environments';
import { Component } from '@angular/core';
import { Navigation } from './navigation';
import { App } from './app';
import { of } from 'rxjs';

@Component({ selector: 'app-any', template: `<div>{{ title }}</div>` })
class AnyComponentMock {
  static TITLE = 'Test Any Component';
  protected title = AnyComponentMock.TITLE;
}

const resolve = { testData: vi.fn(() => of(null)) };

const testRoutes = [
  { path: '', resolve, children: [{ path: 'any', component: AnyComponentMock }] },
];

const navigationMock = { isInitial: vi.fn(), navigating: vi.fn(), error: vi.fn() };

const renderComponent = ({
  routes,
  providers,
  initialRoute,
  ...options
}: RenderComponentOptions<App> = {}) => {
  return render(App, {
    providers: [{ provide: Navigation, useValue: navigationMock }, ...(providers || [])],
    initialRoute: initialRoute || '/',
    routes: routes || testRoutes,
    autoDetectChanges: false,
    ...options,
  });
};

describe('App', () => {
  afterEach(vi.resetAllMocks);

  it('should display the app title', async () => {
    await renderComponent();
    const name = environment.title;
    expect(screen.getByRole('heading', { name })).toBeVisible();
  });

  const urls = ['/', '/any'];

  for (const initialRoute of urls) {
    it('should show loader on initial navigation', async () => {
      navigationMock.navigating.mockImplementation(() => true);
      navigationMock.isInitial.mockImplementation(() => true);
      await renderComponent({ initialRoute });
      expect(screen.getByLabelText(/loading/i)).toBeVisible();
    });

    it('should show loader on non-initial navigation', async () => {
      navigationMock.navigating.mockImplementation(() => true);
      navigationMock.isInitial.mockImplementation(() => false);
      await renderComponent({ initialRoute });
      expect(screen.getByLabelText(/loading/i)).toBeVisible();
    });

    it('should display an initial navigation error message and a retry button', async () => {
      const error = { message: 'Test navigation error', url: '/' };
      navigationMock.isInitial.mockImplementation(() => true);
      navigationMock.error.mockImplementation(() => error);
      await renderComponent({ initialRoute });
      expect(screen.getByText(error.message));
      expect(screen.getByRole('button', { name: /retry/i }));
      expect(screen.queryByLabelText(/loading/i)).toBeNull();
    });

    it('should display a non-initial navigation error message and a retry button', async () => {
      const error = { message: 'Test navigation error', url: '/' };
      navigationMock.error.mockImplementation(() => error);
      await renderComponent({ initialRoute });
      expect(screen.getByText(error.message));
      expect(screen.getByRole('button', { name: /retry/i }));
      expect(screen.queryByLabelText(/loading/i)).toBeNull();
    });
  }
});
