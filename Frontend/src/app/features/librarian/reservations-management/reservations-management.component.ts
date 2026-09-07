import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent, SidebarLink } from '../../../shared/components/sidebar/sidebar.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import { Book } from '../../../core/models/book.model';
import { User } from '../../../core/models/user.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-reservations-management',
  standalone: true,
  imports: [CommonModule, SidebarComponent, IconComponent, ConfirmModalComponent],
  templateUrl: './reservations-management.component.html',
  styleUrl: './reservations-management.component.css',
})
export class ReservationsManagementComponent implements OnInit {
  private reservationService = inject(ReservationService);
  private navigationService = inject(NavigationService);
  private toast = inject(ToastService);

  sidebarLinks: SidebarLink[] = this.navigationService.getStaffSidebarLinks();

  reservations: Reservation[] = [];
  loading = true;

  // Confirm cancel modal state
  showCancelModal = false;
  reservationToCancel: Reservation | null = null;

  ngOnInit(): void {
    this.fetchReservations();
  }

  asBook(book: Book | string | undefined | null): Book | null {
    return (book && typeof book === 'object') ? (book as Book) : null;
  }

  asUser(user: User | string | undefined | null): User | null {
    return (user && typeof user === 'object') ? (user as User) : null;
  }

  fetchReservations(): void {
    this.loading = true;
    this.reservationService.getAll().subscribe({
      next: (res) => {
        this.reservations = res.data.reservations;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Could not load reservations.');
      },
    });
  }

  markReady(reservation: Reservation): void {
    this.reservationService.markReady(reservation._id).subscribe({
      next: () => {
        this.toast.success('Reservation marked ready for pickup.');
        this.fetchReservations();
      },
      error: (err) => this.toast.error(err.error?.message || 'Could not update this reservation.'),
    });
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

