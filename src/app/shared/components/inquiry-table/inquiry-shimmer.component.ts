import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-inquiry-shimmer',
    imports: [CommonModule],
    templateUrl: './inquiry-shimmer.component.html',
    styleUrls: ['./inquiry-shimmer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InquiryShimmerComponent {
  @Input() rows: number = 5;

  // Generate array of length 'rows' for ngFor
  get rowsArray(): number[] {
    return Array(this.rows).fill(0).map((_, i) => i);
  }
}
