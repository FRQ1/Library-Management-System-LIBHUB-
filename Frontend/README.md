# LibHub Frontend

Angular 21 frontend for the LibHub Library Management System. Talks to the
LibHub backend API at `http://localhost:5000/api/v1` by default (see
`src/environments/`).

Built with **Angular CLI 21.2.22 / @angular/core 21.2.22**. Uses classic
zone.js-based change detection (not the newer zoneless mode) so familiar
patterns - mutating a plain property inside `.subscribe()`, `[(ngModel)]`,
event bindings - all work exactly as expected. `zone.js` is declared as a
proper polyfill in `angular.json` (`architect.build.options.polyfills`),
which both `ng build` and `ng serve` need to resolve it correctly.

## Setup

```bash
cd Frontend
npm install
npm start
```

The dev server runs at `http://localhost:4200`. Make sure the backend
(`Backend/`) is already running on port 5000 - see its own README for setup
(`npm install`, `.env`, `npm run seed`, `npm run dev`).

If your backend runs on a different port/host, update `apiUrl` in
`src/environments/environment.development.ts` (used by `npm start`) and
`src/environments/environment.ts` (used by production builds).

## Design system

- **Fonts**: Fraunces (serif, headings) + Inter (sans, body) via Google Fonts,
  loaded in `index.html`.
- **Icons**: `shared/components/icon/icon.component.ts` - a self-contained
  set of ~25 inline-SVG stroke icons (Feather/Lucide style), no external
  icon-font or CDN dependency. Use `<app-icon name="book-open" [size]="18">`.
  No emoji anywhere in the UI.
- **Colors/spacing/shadows**: CSS custom properties in `src/styles.css`
  (deep library-green primary, warm brass accent).

## Fixed: book cover / profile picture images

The backend's uploaded images are served as bare filenames (e.g.
`book-123.jpeg`) that need to be prefixed with the backend's static file
URL to actually load - binding them straight to `[src]` doesn't work. This
is handled centrally:

- `core/utils/media-url.ts` - `bookCoverUrl()` / `userAvatarUrl()` resolve
  either a bare filename (prefixes it with `${apiUrl}/uploads/books|users/`)
  or an already-absolute URL (returned as-is).
- `core/pipes/media-url.pipe.ts` - exposes these as the `bookCover` and
  `userAvatar` template pipes, e.g. `[src]="book.coverImage | bookCover"`.

Every image binding in the app goes through one of these two pipes.

## Project structure

```
src/app/
├── app.ts / app.html / app.css   - root component (navbar + router-outlet)
├── app.config.ts                  - providers: router, HttpClient, zone CD
├── app.routes.ts                   - all routes + guards
├── core/
│   ├── models/        - TypeScript interfaces matching the API's shapes
│   ├── services/       - HTTP calls to the backend (auth, books, loans, ...)
│   ├── guards/          - authGuard, roleGuard(...) for route protection
│   ├── interceptors/    - attaches the JWT to every request
│   ├── pipes/            - bookCover / userAvatar template pipes
│   └── utils/             - media-url.ts (URL resolution logic)
├── shared/components/
│   ├── navbar/           - top nav, role-aware links, user menu
│   ├── sidebar/          - left nav for librarian/admin dashboards
│   └── icon/              - inline-SVG icon component (no external deps)
└── features/
    ├── auth/              - login, register, forgot/reset password, verify-email
    ├── catalog/            - public book list + book details
    ├── librarian/           - books dashboard, add/edit book, loans, reservations
    ├── member/               - my loans, my reservations
    ├── profile/                - shared profile page (all roles)
    └── admin/                   - user management + reports dashboard
```

## Roles and access

- **Public** (no login): catalog, book details
- **Any logged-in user**: my loans, my reservations, profile
- **Librarian / Admin**: `/librarian/books`, `/librarian/loans`, `/librarian/reservations`
- **Admin only**: `/admin` (user management, activate/suspend, change role, reports)

Route access is enforced client-side via `authGuard` / `roleGuard(...roles)`
in `app.routes.ts` - the real enforcement still happens server-side on the
backend (`protect` / `restrictTo`), this is just to keep the UI from showing
pages a user shouldn't see.

## Notes

- Auth token + current user are stored in `localStorage` (`AuthService`) and
  restored on page refresh.
- A 401 response from any API call automatically logs the user out
  (see `core/interceptors/auth.interceptor.ts`).
- The "Check Out" form on `/librarian/loans` currently takes a raw Book ID
  and Member ID (no picker/autocomplete yet) - grab a book's ID from its
  catalog URL, and a member's ID from the Admin > Users tab.
- Email verification and password reset both use tokens; since the backend
  logs these to its console instead of actually emailing them (unless
  `EMAIL_HOST` is configured), copy the token from the backend's terminal
  output into the `/verify-email/:token` or `/reset-password/:token` page.
