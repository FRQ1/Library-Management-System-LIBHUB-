import { Service, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { SidebarLink } from '../../shared/components/sidebar/sidebar.component';

@Service()
export class NavigationService {
  private auth = inject(AuthService);

  /**
   * Returns the sidebar navigation links appropriate for the user's role.
   * Admin users see Admin + Librarian links, Librarians see Librarian links.
   */
  getStaffSidebarLinks(): SidebarLink[] {
    const role = this.auth.role();

    const baseLinks: SidebarLink[] = [
      { label: 'Books', path: '/librarian/books', icon: 'book-open' },
      { label: 'Loans', path: '/librarian/loans', icon: 'refresh-cw' },
      { label: 'Reservations', path: '/librarian/reservations', icon: 'bookmark' },
    ];

    if (role === 'admin') {
      return [
        { label: 'Admin', path: '/admin', icon: 'settings' },
        ...baseLinks,
        { label: 'Profile', path: '/profile', icon: 'user' },
      ];
    }

    return [
      ...baseLinks,
      { label: 'Profile', path: '/profile', icon: 'user' },
    ];
  }
}
