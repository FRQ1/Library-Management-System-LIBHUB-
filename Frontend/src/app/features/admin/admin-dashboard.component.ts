import { Component, OnInit, inject, signal } from '@angular/core';
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

  activeTab = signal<AdminTab>('users');

  users = signal<User[]>([]);
  librarians = signal<User[]>([]);
  loadingUsers = signal<boolean>(true);

  reports = signal<{
    totalBooks: number;
    activeLoans: number;
    overdueLoans: number;
    activeUsers: number;
  }>({
    totalBooks: 0,
    activeLoans: 0,
    overdueLoans: 0,
    activeUsers: 0,
  });
  loadingReports = signal<boolean>(true);

  // Confirmation modal state
  showDeleteModal = signal<boolean>(false);
  userToDelete = signal<User | null>(null);

  getUserId = getUserId;

  ngOnInit(): void {
    this.fetchUsers();
    this.fetchReports();
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
  }

  fetchUsers(): void {
    this.loadingUsers.set(true);
    this.userService.getAll().subscribe({
      next: (res) => {
        this.users.set(res.data.users);
        this.librarians.set(res.data.users.filter((u) => u.role === 'librarian'));
        this.loadingUsers.set(false);
      },
      error: () => {
        this.loadingUsers.set(false);
        this.toast.error('Could not load users list.');
      },
    });
  }

  fetchReports(): void {
    this.loadingReports.set(true);
    forkJoin({
      books: this.bookService.getAll(),
      loans: this.loanService.getAll('active'),
      overdue: this.loanService.getOverdue(),
      users: this.userService.getAll(),
    }).subscribe({
      next: ({ books, loans, overdue, users }) => {
        this.reports.set({
          totalBooks: books.count ?? books.data.books.length,
          activeLoans: loans.count ?? loans.data.loans.length,
          overdueLoans: overdue.count ?? overdue.data.loans.length,
          activeUsers: users.data.users.filter((u) => u.isActive).length,
        });
        this.loadingReports.set(false);
      },
      error: () => {
        this.loadingReports.set(false);
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
    this.userToDelete.set(user);
    this.showDeleteModal.set(true);
  }

  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.userToDelete.set(null);
  }

  confirmDeleteUser(): void {
    const user = this.userToDelete();
    if (!user) return;
    const id = getUserId(user);
    if (!id) return;

    const targetName = user.name;
    this.showDeleteModal.set(false);

    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.toast.success(`User "${targetName}" deleted.`);
        this.fetchUsers();
        this.userToDelete.set(null);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Could not delete this user.');
        this.userToDelete.set(null);
      },
    });
  }
}



