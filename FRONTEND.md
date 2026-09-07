# LibHub Frontend — Complete System Documentation

## 1. Executive Summary

**LibHub Frontend** is the user-facing web application for the LibHub Library Management System. It is built with **Angular 21** using standalone components, modern reactive forms, TypeScript, and a tailored library-themed design system.

The application serves three distinct user roles with dedicated interfaces and permissions:
- **Members (Patrons):** Search and filter catalog books, reserve unavailable titles, monitor active loans and return due dates, view borrowing history, update personal profiles, and deactivate accounts.
- **Librarians:** Manage the library catalog (create, edit, delete books with cover images), issue book loans (checkout), renew loans, process book returns, and fulfill member reservations.
- **Administrators:** Oversee platform users (activate/suspend accounts, update user roles, delete accounts), monitor high-level system analytics (total volumes, active borrowings, overdue counts), and access all librarian catalog tooling.

---

## 2. Technology Stack & Architectural Highlights

| Layer / Concern | Technology | Notes |
|---|---|---|
| **Framework** | Angular 21 (`@angular/core`, `@angular/common`, `@angular/router`) | Modern Standalone Component architecture (no NgModules required) |
| **Change Detection** | Zone.js | Consistent asynchronous reactivity and change propagation |
| **Language** | TypeScript 5.9 | Strict type checking, interfaces for all data contracts |
| **Styling & Theme** | Tailwind CSS + CSS Custom Properties | Deep Emerald (`#0F766E`), Slate Navy (`#1E293B`), Warm Brass accents, Fraunces serif headings, and Inter sans body text |
| **Forms & Validation** | ReactiveFormsModule + Custom Validators | Strongly-typed form groups, real-time input error states, client-side 5MB file format validation |
| **Icons** | Custom Inline SVG (`IconComponent`) | Lightweight, self-contained Lucide/Feather stroke icons without heavy third-party dependencies |
| **Notifications & Dialogs** | `ToastService` + `ConfirmModalComponent` | Accessible in-app toast toasts and non-blocking confirmation modals (replaces native `window.alert` / `window.confirm`) |
| **Media Resolution** | `BookCoverPipe`, `UserAvatarPipe` | Automatic prefixing and SVG fallbacks for uploaded media |

---

## 3. Directory Structure

```text
Frontend/src/
├── app/
│   ├── app.config.ts                  # Application configuration (router, HttpClient, zone detection)
│   ├── app.routes.ts                  # Central routing table with auth & role guards
│   ├── app.ts                         # Root application shell component
│   ├── app.html                       # Global layout with Navbar, ToastContainer, and router-outlet
│   ├── app.css                        # App-level styling & sticky layout rules
│   │
│   ├── core/                          # Singleton services, guards, interceptors, models
│   │   ├── guards/
│   │   │   ├── auth.guard.ts          # Redirects unauthenticated users to /auth/login
│   │   │   └── role.guard.ts          # Protects routes based on required user roles
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts    # Attaches JWT Bearer token; handles 401 unauthenticated logouts
│   │   ├── models/
│   │   │   ├── api-response.model.ts  # Standard backend envelope { status, message, data }
│   │   │   ├── book.model.ts          # Book entity, categories, and query parameter interfaces
│   │   │   ├── loan.model.ts          # Loan entity, status enums, checkout/renew interfaces
│   │   │   ├── reservation.model.ts   # Reservation entity and status enums
│   │   │   └── user.model.ts          # User entity, roles, and ID normalization helpers
│   │   ├── pipes/
│   │   │   └── media-url.pipe.ts      # BookCoverPipe & UserAvatarPipe for resolving uploads
│   │   ├── services/
│   │   │   ├── auth.service.ts        # Login, registration, token persistence, user state
│   │   │   ├── book.service.ts        # Book catalog queries, CRUD, cover image uploads
│   │   │   ├── loan.service.ts        # Checkouts, returns, extensions, overdue loans
│   │   │   ├── navigation.service.ts  # Centralized, role-based sidebar navigation items
│   │   │   ├── reservation.service.ts # Book reservations creation, cancellation, fulfillment
│   │   │   └── user.service.ts        # Profile management, admin user management
│   │   └── utils/
│   │       ├── file-validation.ts     # 5MB size and JPG/PNG/WEBP image type validation
│   │       └── media-url.ts           # Media URL resolution with SVG placeholder fallbacks
│   │
│   ├── features/                      # Route-level views & pages
│   │   ├── admin/
│   │   │   ├── admin-dashboard.component.ts   # User management table & library reports
│   │   │   ├── admin-dashboard.component.html
│   │   │   └── admin-dashboard.component.css
│   │   ├── auth/
│   │   │   ├── login/                 # User login form with responsive sanctuary backdrop
│   │   │   └── register/              # User account registration
│   │   ├── catalog/
│   │   │   ├── book-list/             # Public book browsing, category chips, search bar
│   │   │   └── book-details/          # Book details view, reservation button, librarian actions
│   │   ├── librarian/
│   │   │   ├── dashboard/             # Librarian catalog overview with search & filters
│   │   │   ├── book-form/             # Add and Edit book form with image drag-and-drop
│   │   │   ├── loans-management/      # Active loans, return processing, checkouts
│   │   │   └── reservations-management/ # Pending & ready reservation queues
│   │   ├── member/
│   │   │   ├── my-loans/              # Member's active and returned loans with due dates
│   │   │   └── my-reservations/       # Member's pending and ready reservations
│   │   └── profile/
│   │       ├── profile.component.ts   # Info update, avatar upload, password change, deactivation
│   │       ├── profile.component.html
│   │       └── profile.component.css
│   │
│   └── shared/                        # Reusable standalone components
│       └── components/
│           ├── confirm-modal/         # Accessible confirmation dialog modal
│           ├── icon/                  # Stroke SVG icon renderer
│           ├── navbar/                # Top navigation with role links and user dropdown
│           ├── sidebar/               # Reusable sidebar for librarian and admin views
│           └── toast/                 # In-app toast notification container and service
│
├── assets/images/                     # Static imagery (hero banners, sanctuary images)
├── environments/
│   ├── environment.ts                 # Production environment settings
│   └── environment.development.ts     # Local development settings (API baseUrl: /api/v1)
├── index.html                         # HTML5 entry with Google Fonts (Fraunces & Inter)
├── main.ts                            # Angular bootstrap entry
└── styles.css                         # Global CSS resets, utility variables, card/button styles
```

---

## 4. State Management & Core Services

### 4.1. `AuthService` (`core/services/auth.service.ts`)
- **State Properties:**
  - `currentUser: User | null` — The currently authenticated user object.
  - `token: string | null` — The active JWT Bearer token stored in `localStorage`.
- **Key Methods:**
  - `login(credentials)`: Authenticates against `POST /api/v1/auth/login`, saves JWT to `localStorage`, and updates active user state.
  - `register(payload)`: Creates a new user via `POST /api/v1/auth/register` and establishes session.
  - `logout()`: Clears `localStorage` and routes the user back to `/auth/login`.
  - `hasRole(...roles)`: Boolean check verifying if the authenticated user possesses any of the required roles.

### 4.2. `NavigationService` (`core/services/navigation.service.ts`)
Centralizes the sidebar navigation items for administrative and librarian workflows, preventing link mismatches:
- Provides `getLibrarianNavItems()`: Books Catalog, Loans & Returns, Reservations Queue, My Profile.
- Provides `getAdminNavItems()`: Books Catalog, Loans & Returns, Reservations Queue, User Administration, My Profile.

### 4.3. `BookService` (`core/services/book.service.ts`)
- Communicates with `/api/v1/books`.
- Uses Angular's `HttpParams` for query filtering: `search`, `category`, `available`, `sort`, `page`, and `limit`.
- Supports multipart `FormData` for creating and updating books with binary cover image uploads.

### 4.4. `LoanService` (`core/services/loan.service.ts`)
- Communicates with `/api/v1/loans`.
- Handles member queries (`/api/v1/loans/my`) and librarian transactions (`/api/v1/loans`, `/api/v1/loans/overdue`).
- Provides methods for checkout, renewal (`/:id/renew`), and return processing (`/:id/return`).

### 4.5. `ReservationService` (`core/services/reservation.service.ts`)
- Communicates with `/api/v1/reservations`.
- Handles reservation creation (`POST /`), member retrieval (`/my`), cancellation (`DELETE /:id`), and fulfillment transitions (`PATCH /:id/ready`).

### 4.6. `UserService` (`core/services/user.service.ts`)
- Handles self-profile operations: `getMe()`, `updateMe()`, `updateMyPassword()`, `updateMyPicture()` (multipart `FormData`), and `deactivateMe()`.
- Handles administrative controls: `getAllUsers()`, `updateUserStatus(id, status)`, `updateUserRole(id, role)`, and `deleteUser(id)`.

### 4.7. `ToastService` (`shared/components/toast/toast.service.ts`)
- Reactive subject emitting notification objects (`success`, `error`, `info`) with auto-dismiss timers (3500ms) and manual close triggers.

---

## 5. Routing & Access Control

Route definitions are declared in `src/app/app.routes.ts`:

| Route Path | Component | Guard(s) | Allowed Roles | Description |
|---|---|---|---|---|
| `/books` | `BookListComponent` | *None* | Public | Book catalog browsing with search and category filters |
| `/books/:id` | `BookDetailsComponent` | *None* | Public / Member | Book detail view with reservation trigger |
| `/auth/login` | `LoginComponent` | *None* | Guest | Email and password login |
| `/auth/register` | `RegisterComponent` | *None* | Guest | New member registration |
| `/member/loans` | `MyLoansComponent` | `authGuard` | Authenticated | Member's personal active loans and history |
| `/member/reservations` | `MyReservationsComponent` | `authGuard` | Authenticated | Member's reservations queue and cancellation |
| `/profile` | `ProfileComponent` | `authGuard` | Authenticated | Profile info, password update, avatar upload, account deactivation |
| `/librarian/books` | `LibrarianDashboardComponent` | `authGuard`, `roleGuard` | `librarian`, `admin` | Catalog management dashboard |
| `/librarian/books/new` | `BookFormComponent` | `authGuard`, `roleGuard` | `librarian`, `admin` | Add new book to catalog |
| `/librarian/books/:id/edit` | `BookFormComponent` | `authGuard`, `roleGuard` | `librarian`, `admin` | Edit existing catalog book details and cover |
| `/librarian/loans` | `LoansManagementComponent` | `authGuard`, `roleGuard` | `librarian`, `admin` | Process checkouts, extensions, and returns |
| `/librarian/reservations` | `ReservationsManagementComponent` | `authGuard`, `roleGuard` | `librarian`, `admin` | Manage and fulfill member reservations |
| `/admin` | `AdminDashboardComponent` | `authGuard`, `roleGuard` | `admin` | User management and system report metrics |
| `**` | *Redirect to `/books`* | *None* | All | Fallback route |

---

## 6. Design System & UI Principles

- **Color Palette**:
  - Primary Green: `#0F766E` (Deep Teal / Emerald)
  - Primary Hover: `#115E59`
  - Accent / Gold: `#D97706` / `#B45309`
  - Neutral Background: `#F8FAFC`
  - Cards & Containers: Pure White `#FFFFFF` with refined 1px borders (`#E2E8F0`)
  - Text: Slate `#0F172A` (headings), `#334155` (body), `#64748B` (muted labels)
- **Typography**:
  - Headings: `Fraunces`, serif
  - Body & UI: `Inter`, sans-serif
- **Form Controls & Modals**:
  - Inputs feature distinct focus rings, clear error labels, and responsive layout scaling.
  - Native browser popups (`alert`, `confirm`) are completely avoided in favor of accessible, keyboard-trapped modal dialogs.
- **Image Fallbacks**:
  - Failed book covers load an embedded SVG placeholder (`book-placeholder.svg`).
  - Missing user avatars fall back to initials or a neutral SVG silhouette.

---

## 7. Build & Execution Instructions

From the project root:

```bash
# Build the Angular application for production
npm run build:frontend

# Or directly from the Frontend workspace
cd Frontend
npm install
npm run build
```

The production output is generated into `Frontend/dist/libhub-frontend-v21/browser` and is automatically served statically by the backend server when running in production mode.
