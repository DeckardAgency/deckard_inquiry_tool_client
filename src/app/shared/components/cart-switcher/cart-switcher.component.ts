import { Component, OnInit, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-cart-switcher',
    imports: [CommonModule, RouterLink, RouterModule],
    templateUrl: './cart-switcher.component.html',
    styleUrls: ['./cart-switcher.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartSwitcherComponent implements OnInit {
  currentUrl: string = '';
  private destroyRef = inject(DestroyRef);

  constructor(private router: Router) { }

  ngOnInit() {
    // Initialize current URL
    this.currentUrl = this.router.url;

    // Subscribe to router events to update currentUrl with proper cleanup
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((event: NavigationEnd) => {
      this.currentUrl = event.url;
    });
  }
}
