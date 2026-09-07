import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { SidebarComponent, SidebarLink } from '../../shared/components/sidebar/sidebar.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../shared/components/toast/toast.service';
import { NavigationService } from '../../core/services/navigation.service';
import { UserService } from '../../core/services/user.service';
import { BookService } from '../../core/services/book.service';
import { LoanService } from '../../core/services/loan.service';
import { User, UserRole, getUserId } from '../../core/models/user.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

type AdminTab = 'users' | 'librarians' | 'reports';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent, IconComponent, ConfirmModalComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private bookService = inject(BookService);
  private loanService = inject(LoanService);
  private navigationService = inject(NavigationService);
  private toast = inject(ToastService);

  sidebarLinks: SidebarLink[] = this.navigationService.getStaffSidebarLinks();

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

  // Confirmation modal state
  showDeleteModal = false;
  userToDelete: User | null = null;

  getUserId = getUserId;

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
        this.toast.error('Could not load users list.');
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
        this.toast.error('Could not load system reports.');
      },
    });
  }

  toggleStatus(user: User): void {
    const id = getUserId(user);
    if (!id) return;

    this.userService.updateStatus(id, !user.isActive).subscribe({
      next: () => {
        this.toast.success(`User status updated.`);
        this.fetchUsers();
      },
      error: (err) => this.toast.error(err.error?.message || 'Could not update this user.'),
    });
  }

  changeRole(user: User, role: UserRole): void {
    if (role === user.role) return;
    const id = getUserId(user);
    if (!id) return;

    this.userService.updateRole(id, role).subscribe({
      next: () => {
        this.toast.success(`User role changed to ${role}.`);
        this.fetchUsers();
      },
      error: (err) => this.toast.error(err.error?.message || 'Could not update this user role.'),
    });
  }

  promptDeleteUser(user: User): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete) return;
    const id = getUserId(this.userToDelete);
    if (!id) return;

    const targetName = this.userToDelete.name;
    this.showDeleteModal = false;

    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.toast.success(`User "${targetName}" deleted.`);
        this.fetchUsers();
        this.userToDelete = null;
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not delete this user.');
        this.userToDelete = null;
      },
    });
  }
}

