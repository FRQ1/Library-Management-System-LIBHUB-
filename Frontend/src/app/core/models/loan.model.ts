import { Book } from './book.model';
import { User } from './user.model';

export type LoanStatus = 'active' | 'returned' | 'overdue';

export interface Loan {
  _id: string;
  book: Book | string;
  member: User | string;
  checkedOutBy: User | string;
  borrowDate: string;
  dueDate: string;
  returnDate: string | null;
  status: LoanStatus;
  createdAt?: string;
}
