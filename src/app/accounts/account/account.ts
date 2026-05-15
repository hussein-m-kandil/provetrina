import { Component, inject, input, OnChanges } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { updateRouteTitle } from '../../utils';
import { RouterLink } from '@angular/router';
import { User } from '../accounts.types';

@Component({
  selector: 'app-account',
  imports: [RouterLink],
  templateUrl: './account.html',
})
export class Account implements OnChanges {
  readonly user = input.required<User>();

  private readonly _title = inject(Title);

  ngOnChanges() {
    updateRouteTitle(this._title, this.user().username);
  }
}
