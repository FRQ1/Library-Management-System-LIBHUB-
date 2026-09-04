import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { Book, BookCategory } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';

const CATEGORIES: { value: BookCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'science', label: 'Science' },
  { value: 'history', label: 'History' },
  { value: 'biography', label: 'Biography' },
  { value: 'technology', label: 'Technology' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'children', label: 'Children' },
  { value: 'comics', label: 'Comics' },
  { value: 'other', label: 'Other' },
];

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, BookCoverPipe],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit {
  categories = CATEGORIES;
  books: Book[] = [];
  loading = true;
  errorMessage = '';

  searchTerm = '';
  activeCategory: BookCategory | '' = '';

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.fetchBooks();
  }

  fetchBooks(): void {
    this.loading = true;
    this.errorMessage = '';

    this.bookService
      .getAll({ search: this.searchTerm || undefined, category: this.activeCategory || undefined })
      .subscribe({
        next: (res) => {
          this.books = res.data.books;
          this.loading = false;
        },
        error: () => {
          this.errorMessage = 'Could not load the catalog. Please try again.';
          this.loading = false;
        },
      });
  }

  selectCategory(category: BookCategory | ''): void {
    this.activeCategory = category;
    this.fetchBooks();
  }

  onSearchSubmit(): void {
    this.fetchBooks();
  }
}
