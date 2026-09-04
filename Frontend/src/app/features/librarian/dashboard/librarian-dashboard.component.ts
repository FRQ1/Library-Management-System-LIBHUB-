import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SidebarComponent, SidebarLink } from '../../../shared/components/sidebar/sidebar.component';
import { BookService } from '../../../core/services/book.service';
import { Book } from '../../../core/models/book.model';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';

@Component({
  selector: 'app-librarian-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SidebarComponent, IconComponent, BookCoverPipe],
  templateUrl: './librarian-dashboard.component.html',
  styleUrl: './librarian-dashboard.component.css',
})
export class LibrarianDashboardComponent implements OnInit {
  sidebarLinks: SidebarLink[] = [
    { label: 'Books', path: '/librarian/books', icon: 'book-open' },
    { label: 'Loans', path: '/librarian/loans', icon: 'refresh-cw' },
    { label: 'Reservations', path: '/librarian/reservations', icon: 'bookmark' },
    { label: 'Profile', path: '/profile', icon: 'user' },
  ];

  books: Book[] = [];
  loading = true;
  searchTerm = '';

  constructor(private bookService: BookService, public auth: AuthService) {
    if (this.auth.role() === 'admin') {
      this.sidebarLinks = [{ label: 'Admin', path: '/admin', icon: 'settings' }, ...this.sidebarLinks];
    }
  }

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
      },
    });
  }

  deleteBook(book: Book): void {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    this.bookService.delete(book._id).subscribe({
      next: () => {
        this.books = this.books.filter((b) => b._id !== book._id);
      },
      error: (err) => alert(err.error?.message || 'Could not delete this book.'),
    });
  }
}
