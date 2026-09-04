import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Book } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, BookCoverPipe],
  templateUrl: './book-details.component.html',
  styleUrl: './book-details.component.css',
})
export class BookDetailsComponent implements OnInit {
  book: Book | null = null;
  loading = true;
  errorMessage = '';

  reserving = false;
  reserveMessage = '';
  reserveError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookService: BookService,
    private reservationService: ReservationService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.bookService.getById(id).subscribe({
      next: (res) => {
        this.book = res.data.book;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Book not found.';
        this.loading = false;
      },
    });
  }

  reserve(): void {
    if (!this.book) return;
    this.reserving = true;
    this.reserveMessage = '';

    this.reservationService.create(this.book._id).subscribe({
      next: () => {
        this.reserving = false;
        this.reserveError = false;
        this.reserveMessage = 'Book reserved! Check "My Reservations" for updates.';
      },
      error: (err) => {
        this.reserving = false;
        this.reserveError = true;
        this.reserveMessage = err.error?.message || 'Could not reserve this book.';
      },
    });
  }

  deleteBook(): void {
    if (!this.book) return;
    if (!confirm(`Delete "${this.book.title}"? This cannot be undone.`)) return;

    this.bookService.delete(this.book._id).subscribe({
      next: () => this.router.navigate(['/librarian/books']),
      error: (err) => alert(err.error?.message || 'Could not delete this book.'),
    });
  }
}
