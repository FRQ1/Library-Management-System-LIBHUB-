import { Book } from './book.model';
import { User } from './user.model';

export type ReservationStatus = 'pending' | 'ready' | 'cancelled' | 'fulfilled';

export interface Reservation {
  _id: string;
  book: Book | string;
  member: User | string;
  requestDate: string;
  status: ReservationStatus;
  createdAt?: string;
}
