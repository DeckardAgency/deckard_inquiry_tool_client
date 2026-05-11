import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-detail-shimmer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="order-detail-shimmer">
      <!-- Header shimmer -->
      <div class="order-detail-shimmer__header">
        <div class="order-detail-shimmer__header-top">
          <div class="shimmer shimmer--button"></div>
          <div class="order-detail-shimmer__title-container">
            <div class="shimmer shimmer--title"></div>
            <div class="order-detail-shimmer__badges">
              <div class="shimmer shimmer--badge"></div>
              <div class="shimmer shimmer--badge"></div>
            </div>
          </div>
          <div class="order-detail-shimmer__actions">
            <div class="shimmer shimmer--action-btn"></div>
            <div class="shimmer shimmer--action-btn"></div>
            <div class="shimmer shimmer--action-btn"></div>
          </div>
        </div>

        <div class="order-detail-shimmer__header-bottom">
          <div class="order-detail-shimmer__info-group order-detail-shimmer__info-group--left">
            <div class="shimmer shimmer--info-item"></div>
          </div>
          <div class="order-detail-shimmer__info-group order-detail-shimmer__info-group--right">
            <div class="shimmer shimmer--info-item"></div>
            <div class="shimmer shimmer--info-item"></div>
          </div>
        </div>
      </div>

      <!-- Products section shimmer -->
      <div class="order-detail-shimmer__products-section">
        <div class="shimmer shimmer--section-title"></div>

        <div class="order-detail-shimmer__products-table">
          <table class="order-detail-shimmer__table">
            <thead>
            <tr>
              <th class="order-detail-shimmer__table-header"><div class="shimmer shimmer--table-header"></div></th>
              <th class="order-detail-shimmer__table-header"><div class="shimmer shimmer--table-header"></div></th>
              <th class="order-detail-shimmer__table-header"><div class="shimmer shimmer--table-header"></div></th>
              <th class="order-detail-shimmer__table-header"><div class="shimmer shimmer--table-header"></div></th>
              <th class="order-detail-shimmer__table-header"><div class="shimmer shimmer--table-header"></div></th>
              <th class="order-detail-shimmer__table-header"><div class="shimmer shimmer--table-header"></div></th>
              <th class="order-detail-shimmer__table-header"><div class="shimmer shimmer--table-header"></div></th>
            </tr>
            </thead>
            <tbody>
            <tr class="order-detail-shimmer__table-row" *ngFor="let item of shimmerRows">
              <td class="order-detail-shimmer__table-cell"><div class="shimmer shimmer--table-cell"></div></td>
              <td class="order-detail-shimmer__table-cell"><div class="shimmer shimmer--table-cell shimmer--table-cell-long"></div></td>
              <td class="order-detail-shimmer__table-cell"><div class="shimmer shimmer--table-cell"></div></td>
              <td class="order-detail-shimmer__table-cell"><div class="shimmer shimmer--table-cell"></div></td>
              <td class="order-detail-shimmer__table-cell"><div class="shimmer shimmer--table-cell"></div></td>
              <td class="order-detail-shimmer__table-cell"><div class="shimmer shimmer--table-cell"></div></td>
              <td class="order-detail-shimmer__table-cell"><div class="shimmer shimmer--table-cell"></div></td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="order-detail-shimmer__total-section">
          <div class="order-detail-shimmer__total-row">
            <div class="shimmer shimmer--total-label"></div>
            <div class="shimmer shimmer--total-value"></div>
          </div>
        </div>
      </div>

      <!-- Log messages shimmer -->
      <div class="order-detail-shimmer__logs">
        <div class="shimmer shimmer--section-title"></div>
        <div class="order-detail-shimmer__logs-container">
          <div class="order-detail-shimmer__logs-item" *ngFor="let log of shimmerLogs">
            <div class="shimmer shimmer--log-status"></div>
            <div class="shimmer shimmer--log-date"></div>
            <div class="shimmer shimmer--log-user"></div>
            <div class="shimmer shimmer--log-comment"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    // Variables
    $color-gray-50: #f9fafb;
    $color-gray-200: #e5e7eb;
    $color-gray-300: #d1d5db;
    $color-green: #237804;

    // Shimmer effect base styles
    .shimmer {
      background: linear-gradient(
          90deg,
          #f0f0f0 0%,
          #f8f8f8 20%,
          #f0f0f0 40%,
          #f0f0f0 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite linear;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    // Component structure matching order-detail layout
    .order-detail-shimmer {
      &__header {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        border-top: 1px solid #E4E4E7;
      }

      &__header-top {
        margin-bottom: 1rem;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &__header-bottom {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: $color-gray-50;
        padding: 12px 16px;
      }

      &__title-container {
        flex: 1;
        display: flex;
        align-items: center;
      }

      &__badges {
        display: flex;
        gap: 0.625rem;
      }

      &__actions {
        display: flex;
        gap: 8px;
      }

      &__info-group {
        display: flex;
        align-items: center;
        gap: 40px;

        &--left {
          flex: 1;
        }

        &--right {
          flex-shrink: 0;
        }
      }

      &__products-section {
        padding: 1rem;
        border-top: 1px solid #E4E4E7;
      }

      &__products-table {
        border-radius: 0.375rem;
        overflow: hidden;
        border: 1px solid #E4E4E7;
      }

      &__table {
        width: 100%;
        border-collapse: collapse;

        thead {
          background-color: #ffffff;
        }
      }

      &__table-header {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #E4E4E7;

        &:last-child {
          text-align: right;
        }
      }

      &__table-row {
        &:not(:last-child) {
          border-bottom: 1px solid #E4E4E7;
        }
      }

      &__table-cell {
        padding: 1rem;

        &:last-child {
          text-align: right;
        }
      }

      &__total-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 1rem;
        background-color: $color-green;
        border-radius: 6px;
      }

      &__total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
      }

      &__logs {
        padding: 1rem;
        border-top: 1px solid #E4E4E7;
      }

      &__logs-container {
        padding: 0 1rem;
        display: flex;
        flex-direction: column;
        border-radius: 0.375rem;
        border: 1px solid #E4E4E7;
        background-color: #fff;
      }

      &__logs-item {
        display: grid;
        grid-template-columns: 120px 160px 100px 1fr;
        align-items: center;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid #E4E4E7;

        &:last-child {
          border-bottom: none;
        }
      }
    }

    // Shimmer element sizes
    .shimmer--button {
      width: 36px;
      height: 36px;
      border-radius: 6px;
    }

    .shimmer--title {
      width: 280px;
      height: 24px;
      margin-right: 1rem;
    }

    .shimmer--badge {
      width: 80px;
      height: 28px;
      border-radius: 12px;
    }

    .shimmer--action-btn {
      width: 80px;
      height: 36px;
    }

    .shimmer--info-item {
      width: 200px;
      height: 20px;
    }

    .shimmer--section-title {
      width: 180px;
      height: 24px;
      margin-bottom: 1rem;
    }

    .shimmer--table-header {
      width: 80%;
      height: 14px;
    }

    .shimmer--table-cell {
      width: 60%;
      height: 16px;

      &-long {
        width: 90%;
      }
    }

    .shimmer--total-label {
      width: 100px;
      height: 16px;
    }

    .shimmer--total-value {
      width: 80px;
      height: 16px;
    }

    .shimmer--log-status {
      width: 90px;
      height: 24px;
      border-radius: 6px;
    }

    .shimmer--log-date {
      width: 140px;
      height: 16px;
    }

    .shimmer--log-user {
      width: 60px;
      height: 16px;
    }

    .shimmer--log-comment {
      width: 100%;
      max-width: 400px;
      height: 16px;
    }

    // Special shimmer for colored sections
    .order-detail-shimmer__total-section {
      .shimmer {
        background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.2) 0%,
            rgba(255, 255, 255, 0.3) 20%,
            rgba(255, 255, 255, 0.2) 40%,
            rgba(255, 255, 255, 0.2) 100%
        );
      }
    }

    // Responsive adjustments
    @media (max-width: 992px) {
      .order-detail-shimmer {
        &__header {
          gap: 16px;
        }

        &__header-top {
          flex-wrap: wrap;
        }

        &__actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    }

    @media (max-width: 768px) {
      .order-detail-shimmer {
        &__header-bottom {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 1rem;
        }

        &__info-group {
          width: 100%;
          gap: 16px;

          &--right {
            padding-top: 8px;
            border-top: 1px solid $color-gray-200;
          }
        }

        &__products-table {
          overflow-x: auto;
        }

        &__table {
          min-width: 600px;
        }

        &__actions {
          justify-content: flex-start;
          flex-wrap: wrap;
        }

        &__logs-item {
          grid-template-columns: 1fr;
          gap: 8px;
        }
      }

      .shimmer--title {
        width: 200px;
      }

      .shimmer--info-item {
        width: 150px;
      }

      .shimmer--log-comment {
        max-width: 100%;
      }
    }
  `]
})
export class OrderDetailShimmerComponent {
  // Arrays for ngFor loops
  shimmerRows = [1, 2, 3];
  shimmerLogs = [1, 2, 3];
}
