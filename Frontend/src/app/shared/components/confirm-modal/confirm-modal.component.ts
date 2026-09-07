import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-dialog" role="dialog" aria-modal="true" [attr.aria-labelledby]="'confirm-modal-title'">
          <div class="modal-icon-wrapper" [class.danger]="isDanger">
            <app-icon [name]="isDanger ? 'alert-circle' : 'help-circle'" [size]="24"></app-icon>
          </div>

          <div class="modal-content">
            <h3 id="confirm-modal-title" class="modal-title">{{ title }}</h3>
            <p class="modal-message">{{ message }}</p>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" (click)="onCancel()">
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="btn"
              [class.btn-danger]="isDanger"
              [class.btn-primary]="!isDanger"
              (click)="onConfirm()"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: rgba(15, 23, 42, 0.45);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        z-index: 1000;
        animation: fadeIn 0.15s ease-out;
      }

      .modal-dialog {
        background-color: var(--color-surface, #ffffff);
        border: 1px solid var(--color-border, #e2e8f0);
        border-radius: var(--radius-lg, 16px);
        box-shadow: var(--shadow-lg, 0 12px 32px rgba(15, 23, 42, 0.12));
        width: 100%;
        max-width: 440px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        animation: scaleUp 0.15s var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
      }

      .modal-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: var(--color-primary-light, #f0fdfa);
        color: var(--color-primary, #0f766e);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
      }

      .modal-icon-wrapper.danger {
        background-color: var(--color-danger-light, #fef2f2);
        color: var(--color-danger, #ef4444);
      }

      .modal-content {
        margin-bottom: 24px;
      }

      .modal-title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text, #0f172A);
      }

      .modal-message {
        margin: 0;
        font-size: 14px;
        color: var(--color-text-muted, #475569);
        line-height: 1.5;
      }

      .modal-actions {
        display: flex;
        gap: 12px;
        width: 100%;
        justify-content: flex-end;
      }

      .modal-actions button {
        flex: 1;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleUp {
        from { transform: scale(0.96); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `,
  ],
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() isDanger = true;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }
}
