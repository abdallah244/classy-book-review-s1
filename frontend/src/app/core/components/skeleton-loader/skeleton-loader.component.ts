import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonType, SkeletonConfig } from '../../services/skeleton-loader.service';

/**
 * 💀 Skeleton Loader Component
 * مكون عرض هيكل التحميل
 *
 * الاستخدام:
 * <app-skeleton-loader type="card" [count]="3"></app-skeleton-loader>
 * <app-skeleton-loader type="text" width="200px"></app-skeleton-loader>
 * <app-skeleton-loader type="avatar" [rounded]="true"></app-skeleton-loader>
 */
@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-container" [ngClass]="containerClass">
      @for (item of items; track $index) {
        <div
          class="skeleton"
          [ngClass]="skeletonClass"
          [style.width]="width"
          [style.height]="height"
          [class.animated]="animated"
          [class.rounded]="rounded"
        >
          @if (type === 'card') {
            <div class="skeleton-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
              </div>
            </div>
          }
          @if (type === 'avatar') {
            <div class="skeleton-avatar"></div>
          }
          @if (type === 'list') {
            <div class="skeleton-list-item">
              <div class="skeleton-avatar small"></div>
              <div class="skeleton-list-content">
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
              </div>
            </div>
          }
          @if (type === 'table') {
            <div class="skeleton-table-row">
              @for (col of [1, 2, 3, 4]; track col) {
                <div class="skeleton-table-cell"></div>
              }
            </div>
          }
          @if (type === 'paragraph') {
            <div class="skeleton-paragraph">
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text"></div>
              <div class="skeleton-text short"></div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .skeleton-container {
        width: 100%;
      }

      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .skeleton.animated {
        animation: shimmer 1.5s infinite;
      }

      .skeleton.rounded {
        border-radius: 50%;
      }

      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* Text Skeleton */
      .skeleton-text {
        height: 16px;
        margin-bottom: 8px;
        background: inherit;
        background-size: inherit;
        animation: inherit;
        border-radius: 4px;
      }

      .skeleton-text.short {
        width: 60%;
      }

      /* Title Skeleton */
      .skeleton-title {
        height: 24px;
        width: 80%;
        margin-bottom: 12px;
        background: inherit;
        background-size: inherit;
        animation: inherit;
        border-radius: 4px;
      }

      /* Avatar Skeleton */
      .skeleton-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: inherit;
        background-size: inherit;
        animation: inherit;
      }

      .skeleton-avatar.small {
        width: 36px;
        height: 36px;
      }

      /* Card Skeleton */
      .skeleton-card {
        padding: 16px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .skeleton-image {
        width: 100%;
        height: 180px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8px;
        margin-bottom: 16px;
      }

      .skeleton-content {
        padding: 8px 0;
      }

      /* List Skeleton */
      .skeleton-list-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .skeleton-list-content {
        flex: 1;
      }

      /* Table Skeleton */
      .skeleton-table-row {
        display: flex;
        gap: 16px;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
      }

      .skeleton-table-cell {
        flex: 1;
        height: 20px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 4px;
      }

      /* Paragraph Skeleton */
      .skeleton-paragraph {
        padding: 8px 0;
      }

      /* Dark Mode Support */
      @media (prefers-color-scheme: dark) {
        .skeleton {
          background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
        }

        .skeleton-card {
          background: #1a1a1a;
        }

        .skeleton-image,
        .skeleton-table-cell {
          background: linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%);
        }

        .skeleton-list-item,
        .skeleton-table-row {
          border-bottom-color: #333;
        }
      }
    `,
  ],
})
export class SkeletonLoaderComponent {
  @Input() type: SkeletonType = 'text';
  @Input() count: number = 1;
  @Input() width: string = '100%';
  @Input() height: string = 'auto';
  @Input() animated: boolean = true;
  @Input() rounded: boolean = false;

  get items(): number[] {
    return Array(this.count).fill(0);
  }

  get skeletonClass(): string {
    return `skeleton-${this.type}`;
  }

  get containerClass(): string {
    return `skeleton-container-${this.type}`;
  }
}
