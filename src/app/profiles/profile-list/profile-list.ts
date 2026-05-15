import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profiles } from '../profiles';
import { List } from '../../list';

@Component({
  selector: 'app-profile-list',
  imports: [RouterLink, List],
  templateUrl: './profile-list.html',
})
export class ProfileList implements OnInit {
  protected readonly profiles = inject(Profiles);

  protected search(value: string) {
    this.profiles.reset();
    this.profiles.searchValue.set(value);
    this.profiles.load();
  }

  ngOnInit() {
    this.profiles.reset();
    this.profiles.load();
  }
}
