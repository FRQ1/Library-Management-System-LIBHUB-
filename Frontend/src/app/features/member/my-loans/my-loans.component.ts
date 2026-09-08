import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { Loan } from '../../../core/models/loan.model';
import { Book } from '../../../core/models/book.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BookCoverPipe } from '../../../core/pipes/media-url.pipe';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, BookCoverPipe],
  templateUrl: './my-loans.component.html',
  styleUrl: './my-loans.component.css',
})
export class MyLoansComponent implements OnInit {
  private loanService = inject(LoanService);
  private toast = inject(ToastService);

  currentLoans = signal<Loan[]>([]);
  pastLoans = signal<Loan[]>([]);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    this.loanService.getMyLoans().subscribe({
      next: (res) => {
        const loans = res.data.loans;
        this.currentLoans.set(loans.filter((l) => l.status !== 'returned'));
        this.pastLoans.set(loans.filter((l) => l.status === 'returned'));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Could not load your loans.');
      },
    });
  }

  asBook(book: Loan['book']): Book | null {
    return typeof book === 'object' ? book : null;
  }

  isOverdue(loan: Loan): boolean {
    return loan.status === 'active' && new Date(loan.dueDate) < new Date();
  }
}


