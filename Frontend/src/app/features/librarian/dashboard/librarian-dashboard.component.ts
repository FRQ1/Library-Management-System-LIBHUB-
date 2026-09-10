import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent, SidebarLink } from '../../../shared/components/sidebar/sidebar.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';

@Component({
  selector: 'app-librarian-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    SidebarComponent,
    IconComponent,
    BookCoverPipe,
    ConfirmModalComponent,
  ],
  templateUrl: './librarian-dashboard.component.html',
  styleUrl: './librarian-dashboard.component.css',
})
export class LibrarianDashboardComponent implements OnInit {
  private bookService = inject(BookService);
  private navigationService = inject(NavigationService);
  private toast = inject(ToastService);

  sidebarLinks: SidebarLink[] = this.navigationService.getStaffSidebarLinks();

  books = signal<Book[]>([]);
  loading = signal<boolean>(true);
  searchTerm = '';

  // Confirm delete modal state
  showDeleteModal = signal<boolean>(false);
  bookToDelete = signal<Book | null>(null);

  ngOnInit(): void {
    this.fetchBooks();
  }

  fetchBooks(): void {
    this.loading.set(true);
    this.bookService.getAll({ search: this.searchTerm || undefined }).subscribe({
      next: (res) => {
        this.books.set(res.data.books);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Could not load books catalog.');
      },
    });
  }

  promptDeleteBook(book: Book): void {
    this.bookToDelete.set(book);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.bookToDelete.set(null);
  }

  confirmDeleteBook(): void {
    const book = this.bookToDelete();
    if (!book) return;
    this.showDeleteModal.set(false);

    this.bookService.delete(book._id).subscribe({
      next: () => {
        this.books.set(this.books().filter((b) => b._id !== book._id));
        this.toast.success(`Book "${book.title}" deleted.`);
        this.bookToDelete.set(null);
      },
      error: (err) => {
        this.toast.error(err.message || 'Could not delete this book.');
        this.bookToDelete.set(null);
      },
    });
  }
}


