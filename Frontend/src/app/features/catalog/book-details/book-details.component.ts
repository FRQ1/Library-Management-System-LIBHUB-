import { Component, OnInit, inject, signal } from '@angular/core';
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

  book = signal<Book | null>(null);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  reserving = signal<boolean>(false);
  reserveMessage = signal<string>('');
  reserveError = signal<boolean>(false);

  // Confirm delete modal state
  showDeleteModal = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.bookService.getById(id).subscribe({
      next: (res) => {
        this.book.set(res.data.book);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Book not found.');
        this.loading.set(false);
      },
    });
  }

  reserve(): void {
    const currentBook = this.book();
    if (!currentBook) return;
    this.reserving.set(true);
    this.reserveMessage.set('');

    this.reservationService.create(currentBook._id).subscribe({
      next: () => {
        this.reserving.set(false);
        this.reserveError.set(false);
        this.reserveMessage.set('Book reserved! Check "My Reservations" for updates.');
        this.toast.success('Book reserved successfully!');
      },
      error: (err) => {
        this.reserving.set(false);
        this.reserveError.set(true);
        this.reserveMessage.set(err.error?.message || 'Could not reserve this book.');
        this.toast.error(this.reserveMessage());
      },
    });
  }

  promptDeleteBook(): void {
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
  }

  confirmDeleteBook(): void {
    const currentBook = this.book();
    if (!currentBook) return;
    this.showDeleteModal.set(false);

    this.bookService.delete(currentBook._id).subscribe({
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



