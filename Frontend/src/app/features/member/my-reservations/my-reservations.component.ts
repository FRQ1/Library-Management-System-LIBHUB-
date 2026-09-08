import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import { Book } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, BookCoverPipe, ConfirmModalComponent],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.css',
})
export class MyReservationsComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private toast = inject(ToastService);

  reservations = signal<Reservation[]>([]);
  loading = signal<boolean>(true);

  // Confirm cancel modal state
  showCancelModal = signal<boolean>(false);
  reservationToCancel = signal<Reservation | null>(null);

  ngOnInit(): void {
    this.fetchReservations();
  }

  fetchReservations(): void {
    this.loading.set(true);
    this.reservationService.getMyReservations().subscribe({
      next: (res) => {
        this.reservations.set(res.data.reservations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Could not load your reservations.');
      },
    });
  }

  asBook(book: Book | string | undefined | null): Book | null {
    return (book && typeof book === 'object') ? (book as Book) : null;
  }

  promptCancel(reservation: Reservation): void {
    this.reservationToCancel.set(reservation);
    this.showCancelModal.set(true);
  }

  dismissCancelModal(): void {
    this.showCancelModal.set(false);
    this.reservationToCancel.set(null);
  }

  confirmCancel(): void {
    const res = this.reservationToCancel();
    if (!res) return;
    this.showCancelModal.set(false);

    this.reservationService.cancel(res._id).subscribe({
      next: () => {
        this.toast.success('Reservation cancelled.');
        this.reservationToCancel.set(null);
        this.fetchReservations();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not cancel this reservation.');
        this.reservationToCancel.set(null);
      },
    });
  }
}



