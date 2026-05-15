import { Navigation, Navigator } from './navigation';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../environments';
import { MessageService } from 'primeng/api';
import { Accounts } from './accounts';
import { Toast } from 'primeng/toast';
import { Mainbar } from './mainbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigator, Toast, Mainbar],
  templateUrl: './app.html',
  providers: [MessageService],
})
export class App {
  protected readonly title = environment.title;
  protected readonly navigation = inject(Navigation);
  protected readonly accounts = inject(Accounts);
}
