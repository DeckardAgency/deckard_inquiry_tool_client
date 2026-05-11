import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-machine-article-item-shimmer',
    imports: [CommonModule],
    templateUrl: './machine-article-item-shimmer.component.html',
    styleUrls: ['./machine-article-item-shimmer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MachineArticleItemShimmerComponent {
  @Input() viewMode: 'grid' | 'list' = 'list';
}
