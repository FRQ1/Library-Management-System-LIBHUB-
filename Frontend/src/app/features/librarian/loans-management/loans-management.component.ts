import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent, SidebarLink } from '../../../shared/components/sidebar/sidebar.component';
import { LoanService } from '../../../core/services/loan.service';
import { Loan } from '../../../core/models/loan.model';
import { Book } from '../../../core/models/book.model';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-loans-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, IconComponent],
  templateUrl: './loans-management.component.html',
  styleUrl: './loans-management.component.css',
})
export class LoansManagementComponent implements OnInit {
  sidebarLinks: SidebarLink[] = [
    { label: 'Books', path: '/librarian/books', icon: 'book-open' },
    { label: 'Loans', path: '/librarian/loans', icon: 'refresh-cw' },
    { label: 'Reservations', path: '/librarian/reservations', icon: 'bookmark' },
    { label: 'Profile', path: '/profile', icon: 'user' },
  ];

  loans: Loan[] = [];
  loading = true;
  overdueOnly = false;
  showCheckoutForm = false;

  checkoutBookId = '';
  checkoutMemberId = '';
  checkoutDays = 14;
  checkoutError = '';
  checkoutLoading = false;

  constructor(private loanService: LoanService, public auth: AuthService) {
    if (this.auth.role() === 'admin') {
      this.sidebarLinks = [{ label: 'Admin', path: '/admin', icon: 'settings' }, ...this.sidebarLinks];
    }
  }

  ngOnInit(): void {
    this.fetchLoans();
  }

  asBook(book: Loan['book']): Book | null {
    return typeof book === 'object' ? book : null;
  }

  asUser(user: Loan['member']): User | null {
    return typeof user === 'object' ? user : null;
  }

  fetchLoans(): void {
    this.loading = true;
    const request$ = this.overdueOnly ? this.loanService.getOverdue() : this.loanService.getAll();

    request$.subscribe({
      next: (res) => {
        this.loans = res.data.loans;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  toggleOverdue(): void {
    this.overdueOnly = !this.overdueOnly;
    this.fetchLoans();
  }

  submitCheckout(): void {
    if (!this.checkoutBookId || !this.checkoutMemberId) return;

    this.checkoutLoading = true;
    this.checkoutError = '';

    this.loanService
      .checkout({ bookId: this.checkoutBookId, memberId: this.checkoutMemberId, days: this.checkoutDays })
      .subscribe({
        next: () => {
          this.checkoutLoading = false;
          this.showCheckoutForm = false;
          this.checkoutBookId = '';
          this.checkoutMemberId = '';
          this.fetchLoans();
        },
        error: (err) => {
          this.checkoutLoading = false;
          this.checkoutError = err.error?.message || 'Could not check out this book.';
        },
      });
  }

  renew(loan: Loan): void {
    this.loanService.renew(loan._id).subscribe({
      next: () => this.fetchLoans(),
      error: (err) => alert(err.error?.message || 'Could not renew this loan.'),
    });
  }

  returnBook(loan: Loan): void {
    if (!confirm('Mark this book as returned?')) return;

    this.loanService.returnBook(loan._id).subscribe({
      next: () => this.fetchLoans(),
      error: (err) => alert(err.error?.message || 'Could not process this return.'),
    });
  }

  isOverdue(loan: Loan): boolean {
    return loan.status === 'active' && new Date(loan.dueDate) < new Date();
  }
}
