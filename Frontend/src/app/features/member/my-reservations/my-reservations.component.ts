import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import { Book } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, BookCoverPipe],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.css',
})
export class MyReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  loading = true;

  constructor(private reservationService: ReservationService) {}

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
      },
    });
  }

  asBook(book: Reservation['book']): Book | null {
    return typeof book === 'object' ? book : null;
  }

  cancel(reservation: Reservation): void {
    if (!confirm('Cancel this reservation?')) return;

    this.reservationService.cancel(reservation._id).subscribe({
      next: () => this.fetchReservations(),
      error: (err) => alert(err.error?.message || 'Could not cancel this reservation.'),
    });
  }
}
