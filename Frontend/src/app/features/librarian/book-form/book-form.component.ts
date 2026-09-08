import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { BookCategory } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';
import { validateBookCoverFile } from '../../../core/utils/file-validation';
import { ToastService } from '../../../shared/components/toast/toast.service';

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
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  categoryOptions = CATEGORY_OPTIONS;

  form = new FormGroup({
    title: new FormControl('', [Validators.required]),
    author: new FormControl('', [Validators.required]),
    isbn: new FormControl('', [Validators.required]),
    category: new FormControl<BookCategory>('fiction', [Validators.required]),
    description: new FormControl(''),
    totalCopies: new FormControl<number>(1, [Validators.required, Validators.min(0)]),
  });

  isEditMode = signal<boolean>(false);
  bookId: string | null = null;
  selectedFile: File | null = null;
  previewUrl = signal<string | null>(null);
  existingCoverImage = signal<string>('');

  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.bookId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.bookId);

    if (this.isEditMode() && this.bookId) {
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
          this.existingCoverImage.set(book.coverImage || '');
        },
        error: () => {
          this.errorMessage.set('Could not load this book.');
          this.toast.error('Could not load this book.');
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      this.selectedFile = null;
      this.previewUrl.set(null);
      return;
    }

    const validation = validateBookCoverFile(file);
    if (!validation.isValid) {
      this.errorMessage.set(validation.error || 'Invalid file.');
      this.toast.error(this.errorMessage());
      input.value = '';
      return;
    }

    this.errorMessage.set('');
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(this.selectedFile);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    const formData = new FormData();
    formData.append('title', raw.title || '');
    formData.append('author', raw.author || '');
    formData.append('isbn', raw.isbn || '');
    formData.append('category', raw.category || 'fiction');
    formData.append('description', raw.description || '');
    formData.append('totalCopies', String(raw.totalCopies ?? 1));
    if (this.selectedFile) {
      formData.append('coverImage', this.selectedFile);
    }

    const request$ = this.isEditMode() && this.bookId
      ? this.bookService.update(this.bookId, formData)
      : this.bookService.create(formData);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success(this.isEditMode() ? 'Book updated successfully.' : 'Book added to catalog.');
        this.router.navigate(['/librarian/books']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Could not save this book.');
        this.toast.error(this.errorMessage());
      },
    });
  }
}


