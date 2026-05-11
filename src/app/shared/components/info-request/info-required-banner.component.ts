import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartInfoRequestResponse } from '@models/api/part-info-request-api.model';

@Component({
  selector: 'app-info-required-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-required-banner.component.html',
  styleUrls: ['./info-required-banner.component.scss']
})
export class InfoRequiredBannerComponent {
  @Input() pendingRequests: PartInfoRequestResponse[] = [];
  @Input() inquiryNumber: string = '';

  @Output() viewRequest = new EventEmitter<PartInfoRequestResponse>();
  @Output() viewAllRequests = new EventEmitter<void>();

  get requestCount(): number {
    return this.pendingRequests.length;
  }

  get firstRequestPart(): string {
    if (this.pendingRequests.length === 0) return '';
    const part = this.pendingRequests[0].inquiryMachinePart;
    return part?.partNumber || part?.partName || 'Part';
  }

  onViewRequest(request: PartInfoRequestResponse): void {
    this.viewRequest.emit(request);
  }

  onViewAll(): void {
    this.viewAllRequests.emit();
  }
}
