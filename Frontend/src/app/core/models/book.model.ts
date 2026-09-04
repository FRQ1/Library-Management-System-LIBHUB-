export type BookCategory =
  | 'fiction'
  | 'science'
  | 'history'
  | 'biography'
  | 'technology'
  | 'fantasy'
  | 'mystery'
  | 'children'
  | 'comics'
  | 'other';

export interface Book {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  description?: string;
  coverImage?: string;
  totalCopies: number;
  availableCopies: number;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookFormValue {
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  description?: string;
  totalCopies: number;
}
