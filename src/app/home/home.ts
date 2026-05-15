import { Component } from '@angular/core';
import { ProfileList } from '../profiles';

@Component({
  selector: 'app-home',
  imports: [ProfileList],
  templateUrl: './home.html',
})
export class Home {}
