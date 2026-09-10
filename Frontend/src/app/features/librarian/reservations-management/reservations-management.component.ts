import { Component, OnInit, inject, signal } from '@angular/core';
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

  reservations = signal<Reservation[]>([]);
  loading = signal<boolean>(true);

  // Confirm cancel modal state
  showCancelModal = signal<boolean>(false);
  reservationToCancel = signal<Reservation | null>(null);

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
    this.loading.set(true);
    this.reservationService.getAll().subscribe({
      next: (res) => {
        this.reservations.set(res.data.reservations);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
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
      error: (err) => this.toast.error(err.message || 'Could not update this reservation.'),
    });
  }

  checkOut(reservation: Reservation): void {
    this.reservationService.fulfill(reservation._id).subscribe({
      next: () => {
        this.toast.success('Checked out — the book now shows in the member\'s loans.');
        this.fetchReservations();
      },
      error: (err) => this.toast.error(err.message || 'Could not check out this reservation.'),
    });
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
        this.toast.error(err.message || 'Could not cancel this reservation.');
        this.reservationToCancel.set(null);
      },
    });
  }
}


