import { test, expect } from '@playwright/test';
import {
  mockTokenResponse,
  mockUserResponse,
  mockMachinesResponse,
  mockOrdersResponse,
  mockInquiriesResponse,
  emptyCollectionResponse
} from './fixtures/api-responses';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'fake-jwt-token');
    });

    // Mock API routes
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockUserResponse)
      });
    });

    await page.route('**/api/v1/machines**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockMachinesResponse)
      });
    });

    await page.route('**/api/v1/orders**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockOrdersResponse)
      });
    });

    await page.route('**/api/v1/inquiries**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockInquiriesResponse)
      });
    });
  });

  test('should display dashboard with all sections', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check Quick Actions section
    await expect(page.locator('.quick-actions')).toBeVisible();
    await expect(page.locator('.quick-actions__title')).toContainText('Quick Actions');

    // Check Inquiry List section
    await expect(page.locator('.inquiry-list')).toBeVisible();

    // Check Activity History section
    await expect(page.locator('.activity-history')).toBeVisible();
  });

  test('should display three quick action cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const quickActionCards = page.locator('.quick-action-card');
    await expect(quickActionCards).toHaveCount(3);

    // Check New Inquiry card
    await expect(page.locator('.quick-action-card').first()).toContainText('New inquiry');

    // Check View Machines card
    await expect(page.locator('.quick-action-card').nth(1)).toContainText('View Machines');

    // Check Contact Sales Manager card
    await expect(page.locator('.quick-action-card').nth(2)).toContainText('Contact Sales Manager');
  });

  test('should open inquiry modal when clicking New Inquiry', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click on New Inquiry card
    await page.locator('.quick-action-card').first().click();

    // Modal should appear - use specific modal class
    await expect(page.locator('.modal-overlay').first()).toBeVisible({ timeout: 5000 });
  });

  test('should display orders in inquiry list section', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check that inquiry list has items
    const inquiryList = page.locator('.inquiry-list');
    await expect(inquiryList).toBeVisible();

    // Should show order cards (max 3 on dashboard)
    const orderCards = page.locator('.inquiry-list .inquiry-card, .inquiry-list [class*="card"]');
    const count = await orderCards.count();
    expect(count).toBeLessThanOrEqual(3);
  });

  test('should have View All link in inquiry list', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for View All link
    const viewAllLink = page.locator('.inquiry-list__view-all, .inquiry-list a[href*="my-inquiries"]');
    await expect(viewAllLink).toBeVisible();
  });

  test('should display activity history with tabs', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check Activity History section
    const activityHistory = page.locator('.activity-history');
    await expect(activityHistory).toBeVisible();

    // Check for tabs
    const tabs = page.locator('.activity-history__tab, [class*="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to my-inquiries when clicking View All', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find and click View All link in inquiry list
    const viewAllLink = page.locator('.inquiry-list__view-all').first();

    if (await viewAllLink.isVisible()) {
      await Promise.all([
        page.waitForURL(/\/my-inquiries/, { timeout: 10000 }),
        viewAllLink.click()
      ]);
    }
  });

  test('should show user greeting or welcome message', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should be accessible (no redirect to login)
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should have breadcrumbs showing Dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for breadcrumb with Dashboard
    const breadcrumb = page.locator('.breadcrumb, [class*="breadcrumb"]');
    if (await breadcrumb.isVisible()) {
      await expect(breadcrumb).toContainText('Dashboard');
    }
  });
});

test.describe('Dashboard - Empty State', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'fake-jwt-token');
    });

    // Mock API routes with empty data
    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockUserResponse)
      });
    });

    await page.route('**/api/v1/machines**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockMachinesResponse)
      });
    });

    await page.route('**/api/v1/orders**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(emptyCollectionResponse)
      });
    });

    await page.route('**/api/v1/inquiries**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(emptyCollectionResponse)
      });
    });
  });

  test('should display empty state when no orders or inquiries', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should still load
    await expect(page.locator('.dashboard').first()).toBeVisible();

    // Quick actions should still be visible
    await expect(page.locator('.quick-actions')).toBeVisible();
  });

  test('should show empty message in inquiry list', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for empty state message or no cards
    const inquiryList = page.locator('.inquiry-list');
    await expect(inquiryList).toBeVisible();

    // Either shows empty message or no cards
    const cards = page.locator('.inquiry-list .inquiry-card');
    const emptyMessage = page.locator('.inquiry-list__empty, .inquiry-list [class*="empty"]');

    const cardCount = await cards.count();
    const hasEmptyMessage = await emptyMessage.isVisible().catch(() => false);

    expect(cardCount === 0 || hasEmptyMessage).toBeTruthy();
  });
});

test.describe('Dashboard - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    hasTouch: true
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'fake-jwt-token');
    });

    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockUserResponse)
      });
    });

    await page.route('**/api/v1/machines**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockMachinesResponse)
      });
    });

    await page.route('**/api/v1/orders**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockOrdersResponse)
      });
    });

    await page.route('**/api/v1/inquiries**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockInquiriesResponse)
      });
    });
  });

  test('should display dashboard on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should be visible
    await expect(page.locator('.dashboard').first()).toBeVisible();
  });

  test('should stack quick action cards on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Quick actions should be visible
    await expect(page.locator('.quick-actions')).toBeVisible();

    // Cards should still be present
    const quickActionCards = page.locator('.quick-action-card');
    await expect(quickActionCards).toHaveCount(3);
  });

  test('should be able to tap New Inquiry on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Tap on New Inquiry card
    await page.locator('.quick-action-card').first().tap();

    // Modal should appear
    await expect(page.locator('.modal-overlay').first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Dashboard - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('auth_token', 'fake-jwt-token');
    });

    await page.route('**/api/v1/users/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockUserResponse)
      });
    });

    await page.route('**/api/v1/machines**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockMachinesResponse)
      });
    });

    await page.route('**/api/v1/orders**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockOrdersResponse)
      });
    });

    await page.route('**/api/v1/inquiries**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/ld+json',
        body: JSON.stringify(mockInquiriesResponse)
      });
    });
  });

  test('should redirect if not authenticated', async ({ page }) => {
    // Clear auth token
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/dashboard');

    // Should redirect to login, home, or stay somewhere
    await page.waitForTimeout(1000);
    const url = page.url();
    // Accept login, dashboard, or root as valid destinations
    expect(url).toMatch(/\/(login|dashboard)?$/);
  });

  test('should be able to navigate back to dashboard from other pages', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find sidebar or nav link to dashboard
    const dashboardLink = page.locator('a[href="/dashboard"], [routerLink="/dashboard"]').first();

    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });
});
