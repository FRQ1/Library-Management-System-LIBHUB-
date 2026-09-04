import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { BookCategory } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';

const CATEGORY_OPTIONS: BookCategory[] = [
  'fiction',
  'science',
  'history',
  'biography',
  'technology',
  'fantasy',
  'mystery',
  'children',
  'comics',
  'other',
];

@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent, BookCoverPipe],
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.css',
})
export class BookFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  categoryOptions = CATEGORY_OPTIONS;

  form = this.fb.group({
    title: ['', Validators.required],
    author: ['', Validators.required],
    isbn: ['', Validators.required],
    category: ['fiction' as BookCategory, Validators.required],
    description: [''],
    totalCopies: [1, [Validators.required, Validators.min(0)]],
  });

  isEditMode = false;
  bookId: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  existingCoverImage = '';

  loading = false;
  errorMessage = '';

  constructor(
    private bookService: BookService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bookId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.bookId;

    if (this.isEditMode && this.bookId) {
      this.bookService.getById(this.bookId).subscribe({
        next: (res) => {
          const book = res.data.book;
          this.form.patchValue({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            category: book.category,
            description: book.description || '',
            totalCopies: book.totalCopies,
          });
          this.existingCoverImage = book.coverImage || '';
        },
        error: () => {
          this.errorMessage = 'Could not load this book.';
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;

    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = () => (this.previewUrl = reader.result as string);
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.previewUrl = null;
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const raw = this.form.getRawValue();
    const formData = new FormData();
    formData.append('title', raw.title!);
    formData.append('author', raw.author!);
    formData.append('isbn', raw.isbn!);
    formData.append('category', raw.category!);
    formData.append('description', raw.description || '');
    formData.append('totalCopies', String(raw.totalCopies));
    if (this.selectedFile) {
      formData.append('coverImage', this.selectedFile);
    }

    const request$ = this.isEditMode && this.bookId
      ? this.bookService.update(this.bookId, formData)
      : this.bookService.create(formData);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/librarian/books']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Could not save this book.';
      },
    });
  }
}
