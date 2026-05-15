import { render, RenderComponentOptions, screen } from '@testing-library/angular';
import { Component, output, OutputEmitterRef } from '@angular/core';
import { CreateProfile } from './create-profile';
import { MessageService } from 'primeng/api';
import { Profile } from '../profiles.types';
import { Router } from '@angular/router';

const navigateSpy = vi.spyOn(Router.prototype, 'navigate');

let profileFormSucceeded!: OutputEmitterRef<Profile>;
let profileFormCanceled!: OutputEmitterRef<void>;

@Component({
  selector: 'app-profile-form',
  template: '<h1>{{ label }}</h1>',
})
class ProfileFormMock {
  static readonly TEXT_CONTENT = 'Profile Form Mock';
  protected label = ProfileFormMock.TEXT_CONTENT;
  readonly succeeded = output<Profile>();
  readonly canceled = output();
  constructor() {
    profileFormSucceeded = this.succeeded;
    profileFormCanceled = this.canceled;
  }
}

const renderComponent = ({ providers, ...options }: RenderComponentOptions<CreateProfile> = {}) => {
  return render(CreateProfile, {
    componentImports: [ProfileFormMock],
    providers: [MessageService, ...(providers || [])],
    ...options,
  });
};

describe('CreateProfile', () => {
  afterEach(vi.resetAllMocks);

  it('should display the profile form', async () => {
    await renderComponent();
    expect(screen.getByText(ProfileFormMock.TEXT_CONTENT)).toBeVisible();
  });

  it('should navigate the user to the created profile page on success', async () => {
    await renderComponent();
    profileFormSucceeded.emit({ id: 1 } as Profile);
    expect(navigateSpy).toHaveBeenCalledExactlyOnceWith(['/', 1]);
  });

  it('should navigate the user to home page on cancel', async () => {
    await renderComponent();
    profileFormCanceled.emit();
    expect(navigateSpy).toHaveBeenCalledExactlyOnceWith(['/']);
  });
});
