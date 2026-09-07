import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent, SidebarLink } from '../../../shared/components/sidebar/sidebar.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { LoanService } from '../../../core/services/loan.service';
import { Loan } from '../../../core/models/loan.model';
import { Book } from '../../../core/models/book.model';
import { User } from '../../../core/models/user.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-loans-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, IconComponent, ConfirmModalComponent],
  templateUrl: './loans-management.component.html',
  styleUrl: './loans-management.component.css',
})
export class LoansManagementComponent implements OnInit {
  private loanService = inject(LoanService);
  private navigationService = inject(NavigationService);
  private toast = inject(ToastService);

  sidebarLinks: SidebarLink[] = this.navigationService.getStaffSidebarLinks();

  loans: Loan[] = [];
  loading = true;
  overdueOnly = false;
  showCheckoutForm = false;

  checkoutBookId = '';
  checkoutMemberId = '';
  checkoutDays = 14;
  checkoutError = '';
  checkoutLoading = false;

  // Confirm return modal state
  showReturnModal = false;
  loanToReturn: Loan | null = null;

  ngOnInit(): void {
    this.fetchLoans();
  }

  asBook(book: Book | string | undefined | null): Book | null {
    return (book && typeof book === 'object') ? (book as Book) : null;
  }

  asUser(user: User | string | undefined | null): User | null {
    return (user && typeof user === 'object') ? (user as User) : null;
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
        this.toast.error('Could not load loans list.');
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
          this.toast.success('Book checked out successfully.');
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
      next: () => {
        this.toast.success('Loan renewed successfully.');
        this.fetchLoans();
      },
      error: (err) => this.toast.error(err.error?.message || 'Could not renew this loan.'),
    });
  }

  promptReturn(loan: Loan): void {
    this.loanToReturn = loan;
    this.showReturnModal = true;
  }

  cancelReturn(): void {
    this.showReturnModal = false;
    this.loanToReturn = null;
  }

  confirmReturn(): void {
    if (!this.loanToReturn) return;
    const loan = this.loanToReturn;
    this.showReturnModal = false;

    this.loanService.returnBook(loan._id).subscribe({
      next: () => {
        this.toast.success('Book marked as returned.');
        this.loanToReturn = null;
        this.fetchLoans();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not process this return.');
        this.loanToReturn = null;
      },
    });
  }

  isOverdue(loan: Loan): boolean {
    return loan.status === 'active' && new Date(loan.dueDate) < new Date();
  }
}

