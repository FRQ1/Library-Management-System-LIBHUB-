import { Service, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Service()
export class ToastService {
  private nextId = 0;
  private toastsSignal = signal<ToastMessage[]>([]);

  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: 'success' | 'error' | 'info' = 'info', durationMs = 4000): void {
    const id = ++this.nextId;
    const toast: ToastMessage = { id, message, type };

    this.toastsSignal.update((current) => [...current, toast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(message: string, durationMs = 4000): void {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs = 5000): void {
    this.show(message, 'error', durationMs);
  }

  info(message: string, durationMs = 4000): void {
    this.show(message, 'info', durationMs);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((current) => current.filter((t) => t.id !== id));
  }
}
