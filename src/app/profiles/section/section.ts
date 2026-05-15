import {
  input,
  output,
  signal,
  Component,
  TemplateRef,
  contentChild,
  booleanAttribute,
} from '@angular/core';
import { Profile, SectionData, SectionEntry } from '../profiles.types';
import { NgTemplateOutlet } from '@angular/common';
import { SectionForm } from '../section-form';
import { OrderList } from 'primeng/orderlist';
import { ListLoader } from '../../list';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-section',
  imports: [NgTemplateOutlet, ListLoader, SectionForm, Button, OrderList],
  templateUrl: './section.html',
})
export class Section {
  readonly editable = input(false, { transform: booleanAttribute });
  readonly profileId = input.required<Profile['id']>();
  readonly section = input.required<SectionData>();
  readonly header = input.required<string>();

  readonly added = output<SectionEntry>();
  readonly reordered = output();

  protected readonly entryFragment = contentChild<TemplateRef<unknown>>('entry');

  protected readonly adding = signal(false);

  protected toggleAdding() {
    this.adding.update((adding) => !adding);
  }

  protected getNextOrder(items: { order: number }[]) {
    let order = 1;
    for (const item of items) {
      if (item.order >= order) {
        order = item.order + 1;
      }
    }
    return order;
  }
}
