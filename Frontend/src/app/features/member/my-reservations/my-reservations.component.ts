import { Component, OnInit, inject } from '@angular/core';
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

  reservations: Reservation[] = [];
  loading = true;

  // Confirm cancel modal state
  showCancelModal = false;
  reservationToCancel: Reservation | null = null;

  ngOnInit(): void {
    this.fetchReservations();
  }

  fetchReservations(): void {
    this.loading = true;
    this.reservationService.getMyReservations().subscribe({
      next: (res) => {
        this.reservations = res.data.reservations;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Could not load your reservations.');
      },
    });
  }

  asBook(book: Book | string | undefined | null): Book | null {
    return (book && typeof book === 'object') ? (book as Book) : null;
  }

  promptCancel(reservation: Reservation): void {
    this.reservationToCancel = reservation;
    this.showCancelModal = true;
  }

  dismissCancelModal(): void {
    this.showCancelModal = false;
    this.reservationToCancel = null;
  }

  confirmCancel(): void {
    if (!this.reservationToCancel) return;
    const res = this.reservationToCancel;
    this.showCancelModal = false;

    this.reservationService.cancel(res._id).subscribe({
      next: () => {
        this.toast.success('Reservation cancelled.');
        this.reservationToCancel = null;
        this.fetchReservations();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not cancel this reservation.');
        this.reservationToCancel = null;
      },
    });
  }
}

