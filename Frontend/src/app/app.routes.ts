import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { VerifyEmailComponent } from './features/auth/verify-email/verify-email.component';

import { BookListComponent } from './features/catalog/book-list/book-list.component';
import { BookDetailsComponent } from './features/catalog/book-details/book-details.component';

import { LibrarianDashboardComponent } from './features/librarian/dashboard/librarian-dashboard.component';
import { BookFormComponent } from './features/librarian/book-form/book-form.component';
import { LoansManagementComponent } from './features/librarian/loans-management/loans-management.component';
import { ReservationsManagementComponent } from './features/librarian/reservations-management/reservations-management.component';

import { MyLoansComponent } from './features/member/my-loans/my-loans.component';
import { MyReservationsComponent } from './features/member/my-reservations/my-reservations.component';

import { ProfileComponent } from './features/profile/profile.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard.component';

export const routes: Routes = [
  // Public
  { path: '', component: BookListComponent },
  { path: 'books/:id', component: BookDetailsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: 'verify-email/:token', component: VerifyEmailComponent },

  // Authenticated (any role)
  { path: 'my-loans', component: MyLoansComponent, canActivate: [authGuard] },
  { path: 'my-reservations', component: MyReservationsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  // Librarian / Admin
  {
    path: 'librarian/books',
    component: LibrarianDashboardComponent,
    canActivate: [roleGuard(['librarian', 'admin'])],
  },
  {
    path: 'librarian/books/new',
    component: BookFormComponent,
    canActivate: [roleGuard(['librarian', 'admin'])],
  },
  {
    path: 'librarian/books/:id/edit',
    component: BookFormComponent,
    canActivate: [roleGuard(['librarian', 'admin'])],
  },
  {
    path: 'librarian/loans',
    component: LoansManagementComponent,
    canActivate: [roleGuard(['librarian', 'admin'])],
  },
  {
    path: 'librarian/reservations',
    component: ReservationsManagementComponent,
    canActivate: [roleGuard(['librarian', 'admin'])],
  },

  // Admin only
  { path: 'admin', component: AdminDashboardComponent, canActivate: [roleGuard(['admin'])] },

  // Fallback
  { path: '**', redirectTo: '' },
];
