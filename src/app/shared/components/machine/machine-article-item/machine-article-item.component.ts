// src/app/shared/components/machine/machine-article-item/machine-article-item.component.ts
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '@env/environment';
import { Machine } from '@core/models';
import { getImageVariationUrl } from '@utils/format-utils';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-machine-article-item',
    imports: [CommonModule],
    templateUrl: './machine-article-item.component.html',
    styleUrls: ['./machine-article-item.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('400ms ease-in', style({ opacity: 1 }))
            ])
        ])
    ]
})
export class MachineArticleItemComponent {
  @Input() machine!: Machine;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() isSelected = false;
  @Output() machineSelected = new EventEmitter<Machine>();

  environment = environment;

  onMachineClick(): void {
    this.machineSelected.emit(this.machine);
  }

  protected readonly getImageVariationUrl = getImageVariationUrl;
}
