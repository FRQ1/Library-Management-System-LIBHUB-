import { Component, OnInit, inject } from '@angular/core';
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

  books: Book[] = [];
  loading = true;
  searchTerm = '';

  // Confirm delete modal state
  showDeleteModal = false;
  bookToDelete: Book | null = null;

  ngOnInit(): void {
    this.fetchBooks();
  }

  fetchBooks(): void {
    this.loading = true;
    this.bookService.getAll({ search: this.searchTerm || undefined }).subscribe({
      next: (res) => {
        this.books = res.data.books;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('Could not load books catalog.');
      },
    });
  }

  promptDeleteBook(book: Book): void {
    this.bookToDelete = book;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.bookToDelete = null;
  }

  confirmDeleteBook(): void {
    if (!this.bookToDelete) return;
    const book = this.bookToDelete;
    this.showDeleteModal = false;

    this.bookService.delete(book._id).subscribe({
      next: () => {
        this.books = this.books.filter((b) => b._id !== book._id);
        this.toast.success(`Book "${book.title}" deleted.`);
        this.bookToDelete = null;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not delete this book.');
        this.bookToDelete = null;
      },
    });
  }
}

