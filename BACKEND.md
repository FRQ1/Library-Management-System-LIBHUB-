# LibHub Backend — System Documentation

## 1. Overview

**LibHub Backend** is the REST API for the LibHub Library Management System, built with **Node.js**, **Express 4**, and **MongoDB via Mongoose**. It handles authentication, role-based authorization, book catalog CRUD, the loan (checkout/return/renew) lifecycle, the reservation lifecycle (including checking a ready reservation out as a loan), user/profile management, and disk-based image uploads for book covers and avatars.

> **Note:** Email verification and forgot/reset-password were part of an earlier plan but were fully removed. Registration and login require no email step.

---

## 2. Tech Stack

| Concern | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Web framework | Express 4.x |
| Database / ODM | MongoDB + Mongoose |
| Auth | `jsonwebtoken` (Bearer tokens) + `bcryptjs` (12-round password hashing) |
| File uploads | `multer` (disk storage) |
| CORS | `cors`, restricted to `http://localhost:4200` |

---

## 3. Directory Structure

```text
Backend/
├── config/
│   └── db-connect.js           # Mongoose connection (MONGODB_URI + DB_NAME)
├── controllers/
│   ├── auth-controllers.js     # register, login, logout
│   ├── book-controllers.js     # book catalog CRUD + search/filter
│   ├── loan-controllers.js     # checkout, renew, return, overdue listing
│   ├── reservation-controllers.js  # create, mark ready, fulfill (check out), cancel
│   └── user-controllers.js     # own-profile actions + admin user management
├── middleware/
│   ├── auth-middleware.js      # protect (JWT check) + restrictTo(...roles)
│   └── multer-middleware.js    # disk storage, mime-type filter, 5MB limit
├── models/
│   ├── book-model.js
│   ├── loan-model.js
│   ├── reservation-model.js
│   └── user-model.js
├── routes/
│   ├── auth-routes.js
│   ├── book-routes.js
│   ├── loan-routes.js
│   ├── reservation-routes.js
│   └── user-routes.js
├── scripts/
│   └── seed.js                 # npm run seed — test accounts, sample books, one loan, one reservation
├── uploads/                     # created on demand by multer (fs.mkdirSync recursive) — not committed
│   ├── books/
│   └── users/
├── utils/
│   ├── delete-uploaded-file.js # fs.unlink cleanup when a cover/avatar is replaced or a book is deleted
│   └── generate-token.js       # jwt.sign({ id }, JWT_SECRET, { expiresIn })
├── index.js                    # Express app, route mounting, static /uploads serving
└── package.json
```

---

## 4. Data Models

### 4.1 User (`models/user-model.js`)
- `name`: String, required, 2–100 chars
- `email`: String, required, unique, lowercase
- `password`: String, required, min 8 chars, `select: false`; hashed via a pre-save hook (`bcrypt`, 12 rounds)
- `role`: enum `admin` | `librarian` | `member`, default `member`
- `profilePicture`: String (filename on disk)
- `isActive`: Boolean, default `true` — suspending a user sets this to `false`
- `comparePassword(candidate)` instance method for login/password checks

### 4.2 Book (`models/book-model.js`)
- `title`, `author`: String, required
- `isbn`: String, required, unique
- `category`: enum — `fiction`, `science`, `history`, `biography`, `technology`, `fantasy`, `mystery`, `children`, `comics`, `other` (no `romance`, by design)
- `description`: String, optional, max 2000 chars
- `coverImage`: String (filename on disk)
- `totalCopies`: Number, required, min 0, default 1
- `availableCopies`: Number, min 0, **defaults to `totalCopies` only at creation** — see the known issue in §7
- `isAvailable` virtual: `availableCopies > 0`

### 4.3 Loan (`models/loan-model.js`)
- `book`, `member`: ObjectId refs, required
- `checkedOutBy`: ObjectId ref to the librarian/admin who processed the checkout, required
- `borrowDate`: Date, default now
- `dueDate`: Date, required (14 days from checkout by default)
- `returnDate`: Date, default `null`
- `status`: enum `active` | `returned` | `overdue`, default `active` — note: `overdue` is a valid enum value but nothing ever writes it; "overdue" is computed at read time (`GET /loans/overdue` filters `status: 'active'` + `dueDate < now`), and the frontend does the same client-side for a member's own loans

### 4.4 Reservation (`models/reservation-model.js`)
- `book`, `member`: ObjectId refs, required
- `requestDate`: Date, default now
- `status`: enum `pending` | `ready` | `fulfilled` | `cancelled`, default `pending`

**Lifecycle:** `pending` → (librarian) `ready` → (librarian) `fulfilled` (this creates a Loan and decrements `availableCopies`), or → `cancelled` at any point before `fulfilled`. A member can only reserve one active (`pending`/`ready`) hold per book at a time.

---

## 5. Auth & Authorization

- **Token issuance:** `jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' })`, on both register and login.
- **`protect` middleware:** reads `Authorization: Bearer <token>`, verifies it, loads the user, rejects if the user no longer exists or `isActive` is `false`.
- **`restrictTo(...roles)` middleware:** 403s if `req.user.role` isn't in the allowed list.
- All routes except `POST /auth/*` and the public `GET` book-catalog endpoints require `protect`.

---

## 6. API Reference

Every response follows `{ status, message?, data? }`.

### 6.1 Auth — `/api/v1/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Creates a `member` account, returns a token immediately |
| POST | `/login` | Public | Returns a token; 403 if the account is suspended |
| POST | `/logout` | Public | No-op confirmation (JWTs are stateless — the client discards the token) |

### 6.2 Users — `/api/v1/users` (JWT required)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/me` | Self | Current profile |
| PATCH | `/me` | Self | Update `name`/`email` |
| PATCH | `/me/password` | Self | Requires `currentPassword` + `newPassword` |
| PATCH | `/me/picture` | Self | Multipart field `profilePicture` |
| DELETE | `/me` | Self | Sets `isActive: false` on own account |
| GET | `/` | Admin | List users (`?role=` filter) |
| GET | `/:id` | Admin | Single user |
| PATCH | `/:id/status` | Admin | Body `{ isActive }` |
| PATCH | `/:id/role` | Admin | Body `{ role }` |
| DELETE | `/:id` | Admin | Hard delete |

### 6.3 Books — `/api/v1/books`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | `?search=` (matches title/author) and `?category=` filters |
| GET | `/:id` | Public | Single book |
| POST | `/` | Librarian/Admin | Multipart field `coverImage` + book fields |
| PATCH | `/:id` | Librarian/Admin | Update fields and/or replace cover |
| DELETE | `/:id` | Librarian/Admin | Deletes the book and its cover file on disk |

### 6.4 Loans — `/api/v1/loans` (JWT required)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/my` | Member | Own loan history |
| GET | `/` | Librarian/Admin | All loans (`?status=` filter) |
| GET | `/overdue` | Librarian/Admin | Active loans past `dueDate` |
| POST | `/` | Librarian/Admin | Manual checkout: `{ bookId, memberId, days? }` |
| PATCH | `/:id/renew` | Librarian/Admin | Body `{ days? }` (default 14), only on `active`/`overdue` loans |
| PATCH | `/:id/return` | Librarian/Admin | Marks returned, increments `availableCopies` |

### 6.5 Reservations — `/api/v1/reservations` (JWT required)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/my` | Member | Own reservations |
| POST | `/` | Member | Body `{ bookId }`; blocked if an active hold already exists |
| GET | `/` | Librarian/Admin | All reservations (`?status=` filter) |
| PATCH | `/:id/ready` | Librarian/Admin | `pending` → `ready` |
| PATCH | `/:id/fulfill` | Librarian/Admin | `ready` → `fulfilled`; **creates a Loan and decrements `availableCopies` in the same call** |
| DELETE | `/:id` | Owner or Librarian/Admin | Cancels; blocked once `fulfilled` or already `cancelled` |

### 6.6 Uploads — `/api/v1/uploads`
Plain `express.static` mount over the `uploads/` folder — `GET /api/v1/uploads/books/<filename>` and `/uploads/users/<filename>` serve the raw files with no fallback placeholder if a file is missing (a broken `<img>` will just 404).

---

## 7. Known Issues / Follow-ups

- **`availableCopies` isn't resynced on edit.** `updateBook` does `Object.assign(book, req.body)`, so changing `totalCopies` after creation never adjusts `availableCopies` — increasing `totalCopies` doesn't add available stock, and nothing stops `availableCopies` from exceeding the new `totalCopies` on a decrease. Not yet fixed.
- **`checkoutBook` doesn't validate `memberId`** actually belongs to a `member`-role account, or cross-check it against an existing reservation for that book. A malformed ID just surfaces as a generic Mongoose CastError (400).
- `overdue` is a declared loan status that's never persisted — it's always computed live from `dueDate`. Fine as-is, just worth knowing if you add anything that reads `loan.status` directly and expects to see `'overdue'`.

---

## 8. Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `PORT` | Yes | No fallback in code — server won't bind without it |
| `MONGODB_URI` | Yes | Passed straight to `mongoose.connect` |
| `DB_NAME` | Yes | Passed as the `dbName` option |
| `JWT_SECRET` | Yes | Used for both signing and verifying tokens |
| `JWT_EXPIRES_IN` | No | Defaults to `7d` |

---

## 9. Running Locally

```bash
cd Backend
npm install
npm run seed    # optional — wipes and repopulates: admin/librarian/member (password123), 9 books, 1 loan, 1 reservation
npm run dev      # nodemon
# or: npm start
```

Server listens on `PORT` from `.env`, mounted under `/api/v1`.
