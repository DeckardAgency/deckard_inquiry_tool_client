import { Component, ChangeDetectionStrategy, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuickCartService } from '@services/cart/quick-cart.service';
import { Product } from '@core/models';
import { environment } from '@env/environment';
import { mediaUrl } from '@utils/format-utils';
import { CarouselComponent, CarouselImage } from '@shared/components/carousel/carousel.component';
import { LoggerService, ScopedLogger } from '@services/logger.service';
import { AgentClientSelectionService } from '@core/services/agent-client-selection.service';

@Component({
  selector: 'app-product-card',
  imports: [CommonModule, FormsModule, CarouselComponent],
  styleUrls: ['./product-card.component.scss'],
  templateUrl: './product-card.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent implements OnInit, OnChanges, AfterViewInit {
  environment = environment;
  protected readonly mediaUrl = mediaUrl;
  @Input() product!: Product;
  quantity: number = 1;
  carouselImages: CarouselImage[] = [];

  private productChanged = false;
  private logger!: ScopedLogger;

  constructor(
    private quickCartService: QuickCartService,
    private loggerService: LoggerService,
    private agentClientSelectionService: AgentClientSelectionService
  ) {
    this.logger = this.loggerService.createLogger('ProductCardComponent');
  }

  ngOnInit() {
    // Validate product data
    if (!this.product) {
      this.logger.error('Product data is required for ProductCardComponent');
    }

    // Initialize imageGallery if it's undefined
    if (!this.product.imageGallery) {
      this.product.imageGallery = [];
    }

    // Prepare carousel images
    this.prepareCarouselImages();
  }

  ngAfterViewInit() {

  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['product'] && !changes['product'].firstChange) {
      this.productChanged = true;
      // Update carousel images when product changes
      this.prepareCarouselImages();
    }
  }

  /**
   * Prepare images for the carousel component
   */
  prepareCarouselImages(): void {
    this.carouselImages = [];

    // Add a featured image first if it exists
    if (this.product.featuredImage) {
      this.carouselImages.push({
        url: mediaUrl(this.product.featuredImage.filePath),
        alt: this.product.name
      });
    }

    // Add gallery images
    if (this.product.imageGallery && this.product.imageGallery.length > 0) {
      this.product.imageGallery.forEach((image, index) => {
        this.carouselImages.push({
          url: mediaUrl(image.filePath),
          alt: `${this.product.name} - Image ${index + 1}`
        });
      });
    }
  }

  /**
   * Check if product has any images (featured or gallery)
   * @returns boolean indicating if there are any images to display
   */
  hasImages(): boolean {
    return (
      (this.product.featuredImage !== null && this.product.featuredImage !== undefined) ||
      (this.product.imageGallery && this.product.imageGallery.length > 0)
    );
  }

  /**
   * Check if carousel should be displayed (when there are multiple images)
   * @returns boolean indicating if carousel should be shown
   */
  shouldShowCarousel(): boolean {
    return this.carouselImages.length > 1;
  }

  // Quantity Methods
  incrementQuantity(): void {
    this.quantity++;
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  updateQuantity(value: number): void {
    this.quantity = Math.max(1, value);
  }

  formatPrice(price: number | undefined): string {
    if (price === undefined || price === null) {
      return '0.00';
    }
    return price.toLocaleString('de-DE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Get machine names from the machines relation or fall back to machineText
   * @returns comma-separated machine articleDescriptions or machineText
   */
  getMachineNames(): string {
    // If product has machines relation with data, use articleDescription
    if (this.product.machines && this.product.machines.length > 0) {
      const machineNames = this.product.machines
        .map(machine => machine.articleDescription)
        .filter(desc => desc) // Remove any empty values
        .join(', ');

      // If we got machine names, return them; otherwise fall back to machineText
      if (machineNames) {
        return machineNames;
      }
    }
    // Fall back to machineText if no machines are linked or no valid articleDescriptions
    return this.product.machineText || '-';
  }

  // Method to add the product to the cart
  addToCart(): void {
    if (this.product) {
      const selectedClient = this.agentClientSelectionService.getSelectedClient();
      const client = selectedClient ? {
        id: selectedClient.id,
        name: selectedClient.name,
        code: selectedClient.code
      } : undefined;
      this.quickCartService.addToCart(this.product, this.quantity, client);
      // Reset quantity after adding to the cart
      this.quantity = 1;
    }
  }
}
