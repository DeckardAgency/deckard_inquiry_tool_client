import { Component, inject, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InquiryModalComponent } from '../../modals/inquiry-modal/inquiry-modal.component';
import { InquiryModalService } from '@services/inquiry-modal.service';
import { IconComponent } from '@shared/components/icon/icon.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-quick-actions',
    imports: [CommonModule, RouterModule, InquiryModalComponent, IconComponent],
    templateUrl: "quick-actions.component.html",
    styleUrls: ["quick-actions.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsComponent {
  isModalOpen = false;

  public modalService = inject(InquiryModalService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.modalService.isOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(isOpen => {
        this.isModalOpen = isOpen;
      });
  }

  openInquiryModal(event: Event): void {
    event.preventDefault();
    this.modalService.open();
  }
}
