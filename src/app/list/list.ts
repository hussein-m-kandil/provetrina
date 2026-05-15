import {
  input,
  output,
  viewChild,
  Component,
  ElementRef,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ButtonDirective } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ListLoader } from './list-loader';
import { ListStore } from './list-store';
import { Ripple } from 'primeng/ripple';

@Component({
  selector: 'app-list',
  imports: [NgTemplateOutlet, ListLoader, InputText, ButtonDirective, Ripple],
  templateUrl: './list.html',
})
export class List {
  readonly store = input.required<ListStore<{ id: unknown }>>();
  readonly listFragment = input.required<TemplateRef<unknown>>();
  readonly pluralLabel = input.required<string>();

  readonly autoLoadMore = input(false, { transform: booleanAttribute });
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly searchLabel = input('');
  readonly searchValue = input('');

  readonly searched = output<string>();

  private readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  private readonly _focusFilledSearchBox = () => {
    const searchBoxRef = this.searchBox();
    if (searchBoxRef) {
      const searchBox = searchBoxRef.nativeElement;
      if (searchBox.value) searchBox.focus();
    }
  };

  constructor() {
    afterNextRender(this._focusFilledSearchBox);
  }
}
