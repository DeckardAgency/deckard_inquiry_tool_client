import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '@env/environment';
import { Product } from '@core/models';
import { getImageVariationUrl, mediaUrl } from '@utils/format-utils';
import { animate, style, transition, trigger } from '@angular/animations';


@Component({
    selector: 'app-article-item',
    imports: [CommonModule],
    templateUrl: './article-item.component.html',
    styleUrls: ['./article-item.component.scss'],
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
export class ArticleItemComponent {
  @Input() product!: Product;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() isSelected = false;
  @Output() productSelected = new EventEmitter<Product>();

  environment = environment;

  onProductClick(): void {
    this.productSelected.emit(this.product);
  }

  protected readonly getImageVariationUrl = getImageVariationUrl;
  protected readonly mediaUrl = mediaUrl;
}
