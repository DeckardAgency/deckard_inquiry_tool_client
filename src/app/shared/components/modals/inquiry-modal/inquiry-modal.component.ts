import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-inquiry-modal',
    imports: [CommonModule, RouterModule],
    template: `
    <div *ngIf="isOpen" class="modal-overlay" (click)="closeOnBackdrop($event)" [@fadeAnimation]>
      <div class="modal-container" [@slideAnimation]>
        <div class="modal-header">
          <h2 class="modal-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V8M14 2V6C14 6.53043 14.2107 7.03914 14.5858 7.41421C14.9609 7.78929 15.4696 8 16 8H20M3 15H9M6 12V18" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            New inquiry
          </h2>
          <!--          <button class="modal-close" (click)="close()">-->
          <!--            <svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">-->
          <!--              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"-->
          <!--                stroke-linecap="round" stroke-linejoin="round"/>-->
          <!--            </svg>-->
          <!--          </button>-->
        </div>
        <div class="modal-content">
          <div class="inquiry-options">
            <a routerLink="/shop" class="inquiry-option" (click)="close()">
              <div class="inquiry-option__icon inquiry-option__icon--red">
                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" fill="none">
                  <path d="M3.16699 11.0834L10.1495 4.10092C10.4441 3.80457 10.7944 3.56945 11.1803 3.40912C11.5662 3.24879 11.98 3.16642 12.3978 3.16675H25.6028C26.0207 3.16642 26.4345 3.24879 26.8204 3.40912C27.2062 3.56945 27.5566 3.80457 27.8512 4.10092L34.8337 11.0834M3.16699 11.0834H34.8337M3.16699 11.0834V15.8334C3.16699 16.6733 3.50062 17.4787 4.09449 18.0726C4.68835 18.6665 5.49381 19.0001 6.33366 19.0001M34.8337 11.0834V15.8334C34.8337 16.6733 34.5 17.4787 33.9062 18.0726C33.3123 18.6665 32.5068 19.0001 31.667 19.0001M6.33366 19.0001V31.6667C6.33366 32.5066 6.66729 33.3121 7.26115 33.9059C7.85502 34.4998 8.66047 34.8334 9.50033 34.8334H28.5003C29.3402 34.8334 30.1456 34.4998 30.7395 33.9059C31.3334 33.3121 31.667 32.5066 31.667 31.6667V19.0001M6.33366 19.0001C7.25875 18.9492 8.14225 18.5991 8.85116 18.0026C9.04008 17.8661 9.26724 17.7926 9.50033 17.7926C9.73341 17.7926 9.96057 17.8661 10.1495 18.0026C10.8584 18.5991 11.7419 18.9492 12.667 19.0001C13.5921 18.9492 14.4756 18.5991 15.1845 18.0026C15.3734 17.8661 15.6006 17.7926 15.8337 17.7926C16.0667 17.7926 16.2939 17.8661 16.4828 18.0026C17.1917 18.5991 18.0752 18.9492 19.0003 19.0001C19.9254 18.9492 20.8089 18.5991 21.5178 18.0026C21.7067 17.8661 21.9339 17.7926 22.167 17.7926C22.4001 17.7926 22.6272 17.8661 22.8162 18.0026C23.5251 18.5991 24.4086 18.9492 25.3337 19.0001C26.2587 18.9492 27.1423 18.5991 27.8512 18.0026C28.0401 17.8661 28.2672 17.7926 28.5003 17.7926C28.7334 17.7926 28.9606 17.8661 29.1495 18.0026C29.8584 18.5991 30.7419 18.9492 31.667 19.0001M23.7503 34.8334V28.5001C23.7503 27.6602 23.4167 26.8548 22.8228 26.2609C22.229 25.667 21.4235 25.3334 20.5837 25.3334H17.417C16.5771 25.3334 15.7717 25.667 15.1778 26.2609C14.584 26.8548 14.2503 27.6602 14.2503 28.5001V34.8334" stroke="#DC2626" stroke-width="3.16667" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="inquiry-option__content">
                <h3 class="inquiry-option__title">Shop</h3>
                <p class="inquiry-option__description">
                  Get genuine Deckard spare parts quickly. Select your machine, find your compatible parts, and quickly order with confidence for reliable delivery.
                </p>
              </div>
              <span class="inquiry-option__button">
                Select
                <span class="inquiry-option__arrow">
                  <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m8 16 6-6-6-6" stroke="#232323" stroke-width="1.5"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </span>
            </a>

            <a routerLink="/manual-entry/input-form" class="inquiry-option" (click)="close()">
              <div class="inquiry-option__icon inquiry-option__icon--red">
                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" fill="none">
                  <path d="M33.25 23.75V30.0833C33.25 30.9232 32.9164 31.7286 32.3225 32.3225C31.7286 32.9164 30.9232 33.25 30.0833 33.25H7.91667C7.07681 33.25 6.27136 32.9164 5.6775 32.3225C5.08363 31.7286 4.75 30.9232 4.75 30.0833V23.75M26.9167 12.6667L19 4.75M19 4.75L11.0833 12.6667M19 4.75V23.75" stroke="#DC2626" stroke-width="3.16667" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="inquiry-option__content">
                <h3 class="inquiry-option__title">Manual Inquiry</h3>
                <p class="inquiry-option__description">
                  Request custom or less common parts. Select your machine, manually enter part details (name, number, description), attach files or images, and add notes.
                </p>
              </div>
              <span class="inquiry-option__button">
                Select
                <span class="inquiry-option__arrow">
                  <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m8 16 6-6-6-6" stroke="#232323" stroke-width="1.5"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </span>
            </a>

            <a routerLink="/inquiry-tool" class="inquiry-option inquiry-option--disabled" (click)="close()">
              <div class="inquiry-option__icon inquiry-option__icon--red">
                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38" fill="none">
                  <path d="M20.5835 11.0835L13.7752 4.27518C13.0601 3.56356 12.0923 3.16406 11.0835 3.16406C10.0747 3.16406 9.10691 3.56356 8.39184 4.27518L4.27518 8.39184C3.56356 9.10691 3.16406 10.0747 3.16406 11.0835C3.16406 12.0923 3.56356 13.0601 4.27518 13.7752L11.0835 20.5835M12.6672 9.5001L15.8338 6.33344M28.5005 25.3334L31.6672 22.1668M26.9172 17.4168L33.7255 24.2251C35.2138 25.7134 35.2138 28.1201 33.7255 29.6084L29.6088 33.7251C28.1205 35.2134 25.7138 35.2134 24.2255 33.7251L17.4172 26.9168M23.7505 7.91677L30.0838 14.2501M33.5259 10.7856C34.363 9.94869 34.8334 8.81351 34.8335 7.62978C34.8337 6.44606 34.3636 5.31076 33.5267 4.47364C32.6898 3.63652 31.5546 3.16614 30.3709 3.166C29.1871 3.16585 28.0518 3.63594 27.2147 4.47285L6.08355 25.6088C5.71593 25.9753 5.44406 26.4266 5.29188 26.9229L3.2003 33.8136C3.15938 33.9505 3.15629 34.096 3.19136 34.2345C3.22642 34.3731 3.29834 34.4995 3.39948 34.6005C3.50062 34.7015 3.6272 34.7732 3.7658 34.8081C3.9044 34.8429 4.04985 34.8396 4.18672 34.7984L11.079 32.7084C11.5748 32.5576 12.0261 32.2874 12.3931 31.9215L33.5259 10.7856Z" stroke="#DC2626" stroke-width="3.16667" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="inquiry-option__content">
                <h3 class="inquiry-option__title">Inquiry Tool</h3>
                <p class="inquiry-option__description">
                  Simplify part inquiries with our tool. Select your Deckard machine type, drill down to the specific module, and choose from a compatible list of parts.
                </p>
              </div>
              <span class="inquiry-option__button">
                Select
                <span class="inquiry-option__arrow">
                  <svg width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="m8 16 6-6-6-6" stroke="#232323" stroke-width="1.5"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </span>
            </a>
          </div>

          <!-- Mobile pagination indicators -->
          <div class="inquiry-pagination">
            <div class="inquiry-pagination__dot inquiry-pagination__dot--active"></div>
            <div class="inquiry-pagination__dot"></div>
            <div class="inquiry-pagination__dot"></div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-container {
      background: #F4F4F5;
      border-radius: 0.375rem;
      width: 90%;
      max-width: 1100px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 26px 26px 0 26px;
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.25rem;
      font-weight: 500;
      margin: 0;
      color: #18181B;
    }

    .modal-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #71717A;
      display: flex;
      padding: 0.5rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s;
    }

    .modal-close:hover {
      background-color: #F4F4F5;
    }

    .modal-content {
      padding: 16px 26px 26px 26px;
    }

    .inquiry-options {
      display: flex;
      flex-direction: row;
      gap: 1rem;
    }

    .inquiry-option {
      background-color: #ffffff;
      padding: 24px;
      border-radius: 0.375rem;
      text-decoration: none;
      transition: all 0.2s;
      //flex: 1 0 calc(33.333% - 1rem);
      min-width: 0;  /* Important for flex items to be able to shrink below content size */
      display: flex;
      flex-direction: column;
    }

    .inquiry-option:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .inquiry-option--disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    .inquiry-option__icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: #F4F4F5;
      margin-bottom: 32px;
    }

    .inquiry-option__icon--red {
      color: #DC2626;
    }

    .inquiry-option__content {
      flex: 1;
    }

    .inquiry-option__title {
      font-size: 1.125rem;
      font-weight: 500;
      color: #18181B;
      margin: 0 0 0.5rem 0;
    }

    .inquiry-option__description {
      color: #52525B;
      font-size: 0.875rem;
      line-height: 1.5;
      margin: 0;
    }

    .inquiry-option__button {
      margin-top: 24px;
      display: flex;
      align-items: center;
      width: fit-content;
      border-radius: 6px;
      padding: 8px 16px;
      border: 1px solid #E4E4E7;
      font-size: 14px;
      color: #232323;
      text-decoration: none;
    }

    .inquiry-option__arrow {
      margin-left: 1rem;
    }

    /* Hide pagination by default */
    .inquiry-pagination {
      display: none;
      justify-content: center;
      margin-top: 16px;
    }

    .inquiry-pagination__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #E4E4E7;
      margin: 0 4px;
    }

    .inquiry-pagination__dot--active {
      background-color: #DC2626;
    }

    /* Mobile styles - carousel view */
    @media screen and (max-width: 768px) {
      .modal-container {
        width: 95%;
        max-width: 95%;
      }

      .modal-content {
        padding: 16px 16px 24px 16px;
        position: relative;
      }

      .inquiry-options {
        display: flex;
        overflow-x: auto;
        scroll-snap-type: x mandatory;
        gap: 12px;
        padding: 4px 4px 8px 4px;
        -webkit-overflow-scrolling: touch; /* For smooth scrolling on iOS */
        scrollbar-width: none; /* Hide scrollbar in Firefox */
        -ms-overflow-style: none; /* Hide scrollbar in IE/Edge */
      }

      .inquiry-options::-webkit-scrollbar {
        display: none; /* Hide scrollbar in Chrome/Safari */
      }

      .inquiry-option {
        flex: 0 0 90%;
        scroll-snap-align: center;
        min-width: 250px;
      }

      /* Show pagination on mobile */
      .inquiry-pagination {
        display: flex;
      }
    }

    /* Small mobile styles */
    @media screen and (max-width: 480px) {
      .inquiry-option {
        flex: 0 0 95%;
      }

      .modal-header {
        padding: 20px 20px 0 20px;
      }

      .modal-content {
        padding: 12px 12px 20px 12px;
      }

      .inquiry-option__icon {
        width: 48px;
        height: 48px;
        margin-bottom: 24px;
      }

      .inquiry-option__description {
        font-size: 0.8125rem;
      }
    }
  `],
    animations: [
        trigger('fadeAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ opacity: 0 }))
            ])
        ]),
        trigger('slideAnimation', [
            transition(':enter', [
                style({ transform: 'translateY(-50px)', opacity: 0 }),
                animate('300ms 100ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateY(-50px)', opacity: 0 }))
            ])
        ])
    ]
})
export class InquiryModalComponent {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

  close(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }
}
