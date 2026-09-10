import { BookCategory } from '../models/book.model';

export const BOOK_CATEGORIES: BookCategory[] = [
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

export const BOOK_CATEGORY_LABELS: Record<BookCategory, string> = {
  fiction: 'Fiction',
  science: 'Science',
  history: 'History',
  biography: 'Biography',
  technology: 'Technology',
  fantasy: 'Fantasy',
  mystery: 'Mystery',
  children: 'Children',
  comics: 'Comics',
  other: 'Other',
};
