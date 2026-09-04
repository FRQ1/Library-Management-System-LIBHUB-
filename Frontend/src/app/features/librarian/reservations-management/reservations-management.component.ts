import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent, SidebarLink } from '../../../shared/components/sidebar/sidebar.component';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import { Book } from '../../../core/models/book.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-reservations-management',
  standalone: true,
  imports: [CommonModule, SidebarComponent, IconComponent],
  templateUrl: './reservations-management.component.html',
  styleUrl: './reservations-management.component.css',
})
export class ReservationsManagementComponent implements OnInit {
  sidebarLinks: SidebarLink[] = [
    { label: 'Books', path: '/librarian/books', icon: 'book-open' },
    { label: 'Loans', path: '/librarian/loans', icon: 'refresh-cw' },
    { label: 'Reservations', path: '/librarian/reservations', icon: 'bookmark' },
    { label: 'Profile', path: '/profile', icon: 'user' },
  ];

  reservations: Reservation[] = [];
  loading = true;

  constructor(private reservationService: ReservationService, public auth: AuthService) {
    if (this.auth.role() === 'admin') {
      this.sidebarLinks = [{ label: 'Admin', path: '/admin', icon: 'settings' }, ...this.sidebarLinks];
    }
  }

  ngOnInit(): void {
    this.fetchReservations();
  }

  asBook(book: Reservation['book']): Book | null {
    return typeof book === 'object' ? book : null;
  }

  asUser(user: Reservation['member']): User | null {
    return typeof user === 'object' ? user : null;
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
      },
    });
  }

  markReady(reservation: Reservation): void {
    this.reservationService.markReady(reservation._id).subscribe({
      next: () => this.fetchReservations(),
      error: (err) => alert(err.error?.message || 'Could not update this reservation.'),
    });
  }

  cancel(reservation: Reservation): void {
    if (!confirm('Cancel this reservation?')) return;

    this.reservationService.cancel(reservation._id).subscribe({
      next: () => this.fetchReservations(),
      error: (err) => alert(err.error?.message || 'Could not cancel this reservation.'),
    });
  }
}
