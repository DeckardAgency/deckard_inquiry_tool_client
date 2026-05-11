import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartInfoRequestResponse } from '@models/api/part-info-request-api.model';

@Component({
  selector: 'app-info-requests-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './info-requests-list.component.html',
  styleUrls: ['./info-requests-list.component.scss']
})
export class InfoRequestsListComponent {
  @Input() infoRequests: PartInfoRequestResponse[] = [];
  @Input() loading: boolean = false;

  @Output() respondToRequest = new EventEmitter<PartInfoRequestResponse>();
  @Output() viewHistory = new EventEmitter<PartInfoRequestResponse>();
  @Output() closeList = new EventEmitter<void>();

  onClose(): void {
    this.closeList.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  getPartInfo(request: PartInfoRequestResponse): string {
    const part = request.inquiryMachinePart;
    if (part.partNumber && part.partName) {
      return `${part.partNumber} - ${part.partName}`;
    }
    return part.partNumber || part.partName || 'Part';
  }

  getStatusLabel(request: PartInfoRequestResponse): string {
    switch (request.status) {
      case 'pending': return 'Awaiting Your Response';
      case 'needs_revision': return 'More Information Needed';
      case 'responded': return 'Response Sent';
      case 'accepted': return 'Accepted';
      default: return 'Unknown';
    }
  }

  getStatusClass(request: PartInfoRequestResponse): string {
    switch (request.status) {
      case 'pending': return 'status--pending';
      case 'needs_revision': return 'status--revision';
      case 'responded': return 'status--responded';
      case 'accepted': return 'status--accepted';
      default: return '';
    }
  }

  canRespond(request: PartInfoRequestResponse): boolean {
    return request.status === 'pending' || request.status === 'needs_revision';
  }

  getLastAdminMessage(request: PartInfoRequestResponse): string {
    if (!request.messages || request.messages.length === 0) return '';
    const adminMessages = request.messages.filter(m => m.senderType === 'admin');
    if (adminMessages.length > 0) {
      const lastMessage = adminMessages[adminMessages.length - 1];
      // Truncate if too long
      const maxLength = 120;
      if (lastMessage.messageText.length > maxLength) {
        return lastMessage.messageText.substring(0, maxLength) + '...';
      }
      return lastMessage.messageText;
    }
    return '';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  onRespond(request: PartInfoRequestResponse): void {
    this.respondToRequest.emit(request);
  }

  onViewHistory(request: PartInfoRequestResponse): void {
    this.viewHistory.emit(request);
  }

  trackByRequestId(index: number, request: PartInfoRequestResponse): string {
    return request.id;
  }
}
