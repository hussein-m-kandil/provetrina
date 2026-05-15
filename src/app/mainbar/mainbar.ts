import {
  inject,
  viewChild,
  Component,
  OnDestroy,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { environment } from '../../environments';
import { ColorScheme } from '../color-scheme';
import { MessageService } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { Ripple } from 'primeng/ripple';
import { Accounts } from '../accounts';

@Component({
  selector: 'app-mainbar',
  imports: [ButtonDirective, RouterLink, Ripple],
  templateUrl: './mainbar.html',
})
export class Mainbar implements OnDestroy {
  private readonly _container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly _toast = inject(MessageService);

  protected readonly colorScheme = inject(ColorScheme);
  protected readonly accounts = inject(Accounts);

  protected readonly title = environment.title;

  private readonly _configureContainerHeight = () => {
    const container = this._container().nativeElement;
    const firstChild = container.firstElementChild;
    if (firstChild) {
      container.style.height = getComputedStyle(firstChild).height;
    }
  };

  protected signOut() {
    const user = this.accounts.user();
    this.accounts.signOut();
    this._toast.add({
      severity: 'info',
      summary: `Bye${user ? ', ' + user.username : ''}`,
      detail: 'You have signed-out successfully.',
    });
  }

  constructor() {
    afterNextRender(() => {
      this._configureContainerHeight();
      window.addEventListener('resize', this._configureContainerHeight);
    });
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this._configureContainerHeight);
  }
}
