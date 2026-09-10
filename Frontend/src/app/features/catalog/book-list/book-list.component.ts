import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { Book, BookCategory } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';
import { BOOK_CATEGORIES, BOOK_CATEGORY_LABELS } from '../../../core/constants/book-constants';

const CATEGORIES: { value: BookCategory | ''; label: string }[] = [
  { value: '', label: 'All' },
  ...BOOK_CATEGORIES.map((value) => ({ value, label: BOOK_CATEGORY_LABELS[value] })),
];

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, BookCoverPipe],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit {
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);

  categories = CATEGORIES;
  books = signal<Book[]>([]);
  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  searchTerm = '';
  activeCategory = signal<BookCategory | ''>('');

  featuredBooks = computed(() => this.books().slice(0, 3));

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = '/assets/images/book-placeholder.svg';
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['category'] !== undefined) {
        this.activeCategory.set((params['category'] || '') as BookCategory | '');
      }
      this.fetchBooks();
    });
  }

  fetchBooks(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.bookService
      .getAll({ search: this.searchTerm || undefined, category: this.activeCategory() || undefined })
      .subscribe({
        next: (res) => {
          this.books.set(res.data.books);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Could not load the catalog. Please try again.');
          this.loading.set(false);
        },
      });
  }

  selectCategory(category: BookCategory | ''): void {
    this.activeCategory.set(category);
    this.fetchBooks();
  }

  onSearchSubmit(): void {
    this.fetchBooks();
  }
}


