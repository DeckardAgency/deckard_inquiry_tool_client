import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-article-item-shimmer',
    imports: [CommonModule],
    templateUrl: './article-item-shimmer.component.html',
    styleUrls: ['./article-item-shimmer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleItemShimmerComponent {
  @Input() viewMode: 'grid' | 'list' = 'list';
}
