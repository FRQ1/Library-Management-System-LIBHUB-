import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Book } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, BookCoverPipe, ConfirmModalComponent],
  templateUrl: './book-details.component.html',
  styleUrl: './book-details.component.css',
})
export class BookDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookService = inject(BookService);
  private reservationService = inject(ReservationService);
  private toast = inject(ToastService);
  public auth = inject(AuthService);

  book: Book | null = null;
  loading = true;
  errorMessage = '';

  reserving = false;
  reserveMessage = '';
  reserveError = false;

  // Confirm delete modal state
  showDeleteModal = false;

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
        this.toast.success('Book reserved successfully!');
      },
      error: (err) => {
        this.reserving = false;
        this.reserveError = true;
        this.reserveMessage = err.error?.message || 'Could not reserve this book.';
        this.toast.error(this.reserveMessage);
      },
    });
  }

  promptDeleteBook(): void {
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  confirmDeleteBook(): void {
    if (!this.book) return;
    this.showDeleteModal = false;

    this.bookService.delete(this.book._id).subscribe({
      next: () => {
        this.toast.success('Book deleted from catalog.');
        this.router.navigate(['/librarian/books']);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not delete this book.');
      },
    });
  }
}

