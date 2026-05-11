import { Component, Input, OnInit, ChangeDetectionStrategy, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ManualCartItem, UploadedFile } from '@core/models';
import { ManualQuickCartService } from '@services/cart/manual-quick-cart.service';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoggerService, ScopedLogger } from '@services/logger.service';

@Component({
  selector: 'app-manual-quick-cart',
  imports: [CommonModule, FormsModule],
  templateUrl: './manual-quick-cart.component.html',
  styleUrls: ['./manual-quick-cart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualQuickCartComponent implements OnInit {
  @Input() isOpen = false;
  cartItems$: Observable<ManualCartItem[]> = new Observable<ManualCartItem[]>();
  loading$: Observable<boolean>;
  notificationVisible$: Observable<boolean>;
  notificationMessage$: Observable<string>;
  notificationType$: Observable<'success' | 'remove' | 'error'>;

  private cartItems: ManualCartItem[] = [];
  private destroyRef = inject(DestroyRef);
  private logger!: ScopedLogger;

  // Reference number input
  referenceNumber: string = '';

  // Track which sections are open
  openSections: Set<string> = new Set();

  constructor(
    public manualQuickCartService: ManualQuickCartService,
    private router: Router,
    private authService: AuthService,
    private loggerService: LoggerService
  ) {
    this.logger = this.loggerService.createLogger('ManualQuickCartComponent');
    this.loading$ = this.manualQuickCartService.loading$;
    this.notificationVisible$ = this.manualQuickCartService.notificationVisible$;
    this.notificationMessage$ = this.manualQuickCartService.notificationMessage$;
    this.notificationType$ = this.manualQuickCartService.notificationType$;
  }

  ngOnInit(): void {
    // Initialize the observable in ngOnInit
    this.cartItems$ = this.manualQuickCartService.cartItems$;

    // Subscribe to cart items for local calculations
    this.manualQuickCartService.cartItems$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        this.cartItems = items;

        // Auto-open first part's details section by default
        if (items.length > 0) {
          this.openSections.add('details-0');
        }
      });
  }

  onClose(): void {
    this.manualQuickCartService.close();
  }

  removeItem(index: number): void {
    this.manualQuickCartService.removeFromCart(index);
  }

  // Toggle section open/closed state
  toggleSection(sectionId: string): void {
    if (this.openSections.has(sectionId)) {
      this.openSections.delete(sectionId);
    } else {
      this.openSections.add(sectionId);
    }
  }

  // Check if a section is open
  isSectionOpen(sectionId: string): boolean {
    return this.openSections.has(sectionId);
  }

  // Navigate back and close cart
  goBack(): void {
    this.onClose();
  }

  /**
   * Save inquiry as draft
   * Validates and sends to backend
   */
  saveDraft(): void {
    // if (!this.validateInput()) {
    //   return;
    // }

    // Check if user is authenticated
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/manual-entry' }
      });
      return;
    }

    // Call the service to save draft
    this.manualQuickCartService.saveDraft(
      this.cartItems,
      this.referenceNumber || undefined
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.logger.debug('Inquiry saved as draft:', response);
          // Clear inputs after a successful save
          this.referenceNumber = '';

          // Optionally navigate after a delay
          setTimeout(() => {
            // this.router.navigate(['/inquiries/drafts']);
          }, 2000);
        },
        error: (error) => {
          this.logger.error('Error saving draft:', error);
          // Error is handled by the service and shown via notification
        }
      });
  }

  /**
   * Navigate to cart overview page for review before submission
   */
  placeInquiry(): void {
    if (!this.validateInput()) {
      return;
    }

    // Check if user is authenticated
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/manual-entry' }
      });
      return;
    }

    // Store reference number in sessionStorage for the cart overview page
    if (typeof window !== 'undefined' && window.sessionStorage) {
      if (this.referenceNumber) {
        sessionStorage.setItem('manualInquiryReferenceNumber', this.referenceNumber);
      }
    }

    // Close the side cart
    this.onClose();

    // Navigate to cart overview page for review
    this.router.navigate(['/manual-entry-cart']);
  }

  /**
   * Validate required input fields
   */
  private validateInput(): boolean {
    // Check if cart is empty
    if (this.cartItems.length === 0) {
      this.manualQuickCartService.showNotification(
        'Your inquiry is empty. Please add parts before saving.',
        'error'
      );
      return false;
    }

    return true;
  }

  // Get part count for display
  getPartCount(): number {
    return this.cartItems.length;
  }

  /**
   * Download a file
   */
  downloadFile(file: UploadedFile): void {
    // If file has a mediaItem with filePath, download from server
    if (file.mediaItem && file.mediaItem.filePath) {
      const fileUrl = `${environment.apiBaseUrl}${file.mediaItem.filePath}`;
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    // If file object exists, create download from blob
    else if (file.file) {
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get visible files (excludes Excel files which are auto-generated from spreadsheet)
   */
  getVisibleFiles(files: UploadedFile[]): UploadedFile[] {
    if (!files) return [];
    return files.filter(file => {
      const fileName = file.name.toLowerCase();
      return !fileName.endsWith('.xls') && !fileName.endsWith('.xlsx');
    });
  }
}
