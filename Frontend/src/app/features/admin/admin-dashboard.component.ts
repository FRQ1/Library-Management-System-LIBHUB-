import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { SidebarComponent, SidebarLink } from '../../shared/components/sidebar/sidebar.component';
import { UserService } from '../../core/services/user.service';
import { BookService } from '../../core/services/book.service';
import { LoanService } from '../../core/services/loan.service';
import { User, UserRole } from '../../core/models/user.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

type AdminTab = 'users' | 'librarians' | 'reports';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, IconComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  sidebarLinks: SidebarLink[] = [
    { label: 'Books', path: '/librarian/books', icon: 'book-open' },
    { label: 'Loans', path: '/librarian/loans', icon: 'refresh-cw' },
    { label: 'Reservations', path: '/librarian/reservations', icon: 'bookmark' },
    { label: 'Admin', path: '/admin', icon: 'settings' },
    { label: 'Profile', path: '/profile', icon: 'user' },
  ];

  activeTab: AdminTab = 'users';

  users: User[] = [];
  librarians: User[] = [];
  loadingUsers = true;

  reports = {
    totalBooks: 0,
    activeLoans: 0,
    overdueLoans: 0,
    activeUsers: 0,
  };
  loadingReports = true;

  constructor(private userService: UserService, private bookService: BookService, private loanService: LoanService) {}

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchReports();
  }

  setTab(tab: AdminTab): void {
    this.activeTab = tab;
  }

  fetchUsers(): void {
    this.loadingUsers = true;
    this.userService.getAll().subscribe({
      next: (res) => {
        this.users = res.data.users;
        this.librarians = res.data.users.filter((u) => u.role === 'librarian');
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
      },
    });
  }

  fetchReports(): void {
    this.loadingReports = true;
    forkJoin({
      books: this.bookService.getAll(),
      loans: this.loanService.getAll('active'),
      overdue: this.loanService.getOverdue(),
      users: this.userService.getAll(),
    }).subscribe({
      next: ({ books, loans, overdue, users }) => {
        this.reports = {
          totalBooks: books.count ?? books.data.books.length,
          activeLoans: loans.count ?? loans.data.loans.length,
          overdueLoans: overdue.count ?? overdue.data.loans.length,
          activeUsers: users.data.users.filter((u) => u.isActive).length,
        };
        this.loadingReports = false;
      },
      error: () => {
        this.loadingReports = false;
      },
    });
  }

  toggleStatus(user: User): void {
    this.userService.updateStatus(user.id, !user.isActive).subscribe({
      next: () => this.fetchUsers(),
      error: (err) => alert(err.error?.message || 'Could not update this user.'),
    });
  }

  changeRole(user: User, role: UserRole): void {
    if (role === user.role) return;
    this.userService.updateRole(user.id, role).subscribe({
      next: () => this.fetchUsers(),
      error: (err) => alert(err.error?.message || 'Could not update this user.'),
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => this.fetchUsers(),
      error: (err) => alert(err.error?.message || 'Could not delete this user.'),
    });
  }
}
