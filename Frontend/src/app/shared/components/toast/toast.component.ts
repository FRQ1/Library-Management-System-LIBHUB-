import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (toastService.toasts().length > 0) {
      <div class="toast-container" role="status" aria-live="polite">
        @for (toast of toastService.toasts(); track toast.id) {
          <div class="toast-item" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
            <app-icon
              [name]="toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'alert-circle' : 'sparkles'"
              [size]="18"
            ></app-icon>
            <span class="toast-text">{{ toast.message }}</span>
            <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Close notification">
              <app-icon name="x" [size]="14"></app-icon>
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 1100;
        max-width: 380px;
        pointer-events: none;
      }

      .toast-item {
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: var(--radius, 12px);
        background: var(--color-surface, #ffffff);
        color: var(--color-text, #0f172a);
        box-shadow: var(--shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.12));
        border: 1px solid var(--color-border, #e2e8f0);
        font-size: 13px;
        line-height: 1.4;
        animation: slideIn 0.2s var(--ease-out, ease-out);
      }

      .toast-success {
        border-color: var(--color-success, #10b981);
        color: #065f46;
        background: var(--color-success-light, #ecfdf5);
      }

      .toast-error {
        border-color: var(--color-danger, #ef4444);
        color: #991b1b;
        background: var(--color-danger-light, #fef2f2);
      }

      .toast-text {
        flex: 1;
      }

      .toast-close {
        background: transparent;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: currentColor;
        opacity: 0.7;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .toast-close:hover {
        opacity: 1;
      }

      @keyframes slideIn {
        from {
          transform: translateY(12px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    `,
  ],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
