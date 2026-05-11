// inquiry-card-shimmer.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-inquiry-card-shimmer',
    templateUrl: './inquiry-card-shimmer.component.html',
    styleUrls: ['./inquiry-card-shimmer.component.scss'],
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InquiryCardShimmerComponent {}
