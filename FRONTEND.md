# LibHub Frontend — System Documentation

## 1. Overview

**LibHub Frontend** is the Angular client for the LibHub Library Management System, built with **Angular 22** using standalone components and **zoneless change detection** (`provideZonelessChangeDetection()` — there is no `zone.js` dependency in this project).

Three role-based experiences share one app:
- **Members:** browse/search the catalog, reserve unavailable books, view their own loans and reservations, manage their profile.
- **Librarians:** manage the book catalog (create/edit/delete, cover uploads), process checkouts/renewals/returns, and move reservations through their lifecycle (mark ready → check out).
- **Admins:** everything librarians can do, plus user management (activate/suspend, change role, delete) and a dashboard with system counts.

---

## 2. Tech Stack

| Concern | Technology |
|---|---|
| Framework | Angular 22, standalone components (no NgModules) |
| Change detection | Zoneless (`provideZonelessChangeDetection`) — no `zone.js` |
| Language | TypeScript 6.0 |
| Styling | **Plain CSS** with a shared set of custom properties defined once in `styles.css` (`--color-primary`, `--color-bg`, etc.) plus one `.css` file per component. **No Tailwind** — there's no `tailwind.config`, no PostCSS plugin, and no `@tailwind`/`@apply` anywhere in the project. |
| Forms | `ReactiveFormsModule` + hand-written validators |
| Icons | Custom inline-SVG `IconComponent` (no icon library dependency) |
| Notifications / dialogs | `ToastService` + `ConfirmModalComponent` (native `alert`/`confirm` are not used) |
| Media | `BookCoverPipe` / `UserAvatarPipe` for resolving uploaded file paths |
| Dev-server proxy | `proxy.conf.json` forwards `/api/v1` → `http://localhost:5000` so the app can call relative API paths with no CORS friction in dev |

---

## 3. Directory Structure

```text
Frontend/src/
├── app/
│   ├── app.config.ts               # provideZonelessChangeDetection, router, HttpClient + auth interceptor
│   ├── app.routes.ts
│   ├── app.ts / app.html / app.css # Root shell: navbar, toast container, router-outlet
│   │
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts       # authGuard — redirects to /login if not authenticated
│   │   │   └── role.guard.ts       # roleGuard(allowedRoles[]) — factory, checks auth + role
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts # Attaches Bearer token to outgoing requests
│   │   ├── models/                 # book / loan / reservation / user / api-response interfaces
│   │   ├── pipes/
│   │   │   └── media-url.pipe.ts   # BookCoverPipe, UserAvatarPipe
│   │   ├── services/
│   │   │   ├── auth.service.ts     # signals-based session state, localStorage persistence
│   │   │   ├── book.service.ts
│   │   │   ├── loan.service.ts
│   │   │   ├── reservation.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── navigation.service.ts
│   │   └── utils/
│   │       ├── file-validation.ts  # 5MB + JPG/PNG/WEBP checks
│   │       └── media-url.ts
│   │
│   ├── features/
│   │   ├── admin/                  # admin-dashboard.component.*
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── catalog/
│   │   │   ├── book-list/          # served at the app root '/'
│   │   │   └── book-details/       # 'books/:id'
│   │   ├── librarian/
│   │   │   ├── dashboard/          # librarian-dashboard.component.* — 'librarian/books'
│   │   │   ├── book-form/          # add/edit, 'librarian/books/new' and 'librarian/books/:id/edit'
│   │   │   ├── loans-management/   # 'librarian/loans'
│   │   │   └── reservations-management/  # 'librarian/reservations'
│   │   ├── member/
│   │   │   ├── my-loans/           # 'my-loans'
│   │   │   └── my-reservations/    # 'my-reservations'
│   │   └── profile/                # 'profile'
│   │
│   └── shared/components/
│       ├── confirm-modal/
│       ├── icon/
│       ├── navbar/
│       ├── sidebar/
│       └── toast/
│
├── environments/
│   ├── environment.ts              # production
│   └── environment.development.ts  # apiUrl: '/api/v1' (routed through proxy.conf.json in dev)
├── index.html
├── main.ts
└── styles.css
```

---

## 4. Core Services

### 4.1 `AuthService`
Signal-based (`signal`/`computed`, not `BehaviorSubject`). `currentUser`, `isLoggedIn`, `role` are computed signals backed by `localStorage` (`libhub_token`, `libhub_user`) so a page refresh keeps the session. `login()`/`register()` call the backend and populate session state via `tap`; `logout()` clears storage and navigates to `/login`.

### 4.2 `BookService`
`getAll({ search?, category? })`, `getById`, `create(FormData)`, `update(id, FormData)`, `delete(id)`. Only `search` and `category` query params exist — there's no pagination, sorting, or `available` filter on either side.

### 4.3 `LoanService`
`getAll(status?)`, `getOverdue()`, `getMyLoans()`, `checkout({ bookId, memberId, days? })`, `renew(id, days?)`, `returnBook(id)`.

### 4.4 `ReservationService`
`getMy()`, `create(bookId)`, `getAll(status?)`, `markReady(id)`, **`fulfill(id)`** (checks a `ready` reservation out as a loan — `PATCH /:id/fulfill`), `cancel(id)`.

### 4.5 `UserService`
Self: `getMe`, `updateMe({ name?, email? })`, `updateMyPassword`, `updateMyPicture(FormData)`, `deactivateMe`.
Admin: `getAll(role?)`, `getById`, `updateStatus(id, isActive: boolean)`, `updateRole(id, role)`, `deleteUser(id)`.

### 4.6 `ToastService`
In-app toast queue (success/error/info), replaces `window.alert`.

---

## 5. Routing & Access Control

Declared in `app.routes.ts`. Guards are plain `CanActivateFn`s, not classes.

| Path | Component | Guard | Notes |
|---|---|---|---|
| `''` | `BookListComponent` | — | Public catalog, root path |
| `books/:id` | `BookDetailsComponent` | — | Public detail view |
| `login` | `LoginComponent` | — | |
| `register` | `RegisterComponent` | — | |
| `my-loans` | `MyLoansComponent` | `authGuard` | Any authenticated role |
| `my-reservations` | `MyReservationsComponent` | `authGuard` | Any authenticated role |
| `profile` | `ProfileComponent` | `authGuard` | Any authenticated role |
| `librarian/books` | `LibrarianDashboardComponent` | `roleGuard(['librarian','admin'])` | |
| `librarian/books/new` | `BookFormComponent` | `roleGuard(['librarian','admin'])` | |
| `librarian/books/:id/edit` | `BookFormComponent` | `roleGuard(['librarian','admin'])` | |
| `librarian/loans` | `LoansManagementComponent` | `roleGuard(['librarian','admin'])` | |
| `librarian/reservations` | `ReservationsManagementComponent` | `roleGuard(['librarian','admin'])` | |
| `admin` | `AdminDashboardComponent` | `roleGuard(['admin'])` | |
| `**` | redirect to `''` | — | Fallback |

`roleGuard` checks authentication itself (redirects to `/login` if not logged in, to `/` if logged in but wrong role) — it isn't paired with `authGuard` in the route config.

---

## 6. Reservation → Loan Flow (as of the latest fix)

`pending` (member reserves) → librarian **Mark Ready** → librarian **Check Out** (calls `reservationService.fulfill(id)`) → a Loan is created and the reservation becomes `fulfilled`, showing up immediately in the member's My Loans. Cancel is available at `pending` or `ready`, and is blocked once a reservation is `fulfilled` or already `cancelled`.

---

## 7. Design Tokens

Defined once in `styles.css` `:root` and reused everywhere via `var(--token-name)`:

- Primary: `#0F766E` (teal) / hover `#0B5E57`
- Accent: `#D97706` (amber) / hover `#B45309`
- Background: `#F8FAFC`, surfaces `#FFFFFF`, border `#E2E8F0`
- Text: `#0F172A` (headings) / `#475569` (muted) / `#94A3B8` (faint)

This is a light theme, not dark mode.

---

## 8. Build & Run

```bash
cd Frontend
npm install
npm start        # ng serve, proxies /api/v1 to localhost:5000
npm run build    # production bundle
```

Production output lands in `Frontend/dist/libhub-frontend/browser` (the Angular project identifier in `angular.json` is `libhub-frontend`).
