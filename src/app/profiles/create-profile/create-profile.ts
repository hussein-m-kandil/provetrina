import { Component, inject } from '@angular/core';
import { type Profile } from '../profiles.types';
import { ProfileForm } from '../profile-form';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-profile',
  imports: [ProfileForm],
  templateUrl: './create-profile.html',
  styles: ``,
})
export class CreateProfile {
  private readonly _router = inject(Router);

  protected handleCreation(createdProfile: Profile) {
    this._router.navigate(['/', createdProfile.id]);
  }

  protected handleCancelation() {
    this._router.navigate(['/']);
  }
}
