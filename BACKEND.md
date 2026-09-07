# LibHub Backend — Complete System Documentation

## 1. Executive Summary

**LibHub Backend** is the RESTful API and server-side engine powering the LibHub Library Management System. It is constructed with **Node.js**, **Express.js**, and **MongoDB with Mongoose ODM**.

It handles authentication, role-based authorization, book catalog management, member borrowing transactions, reservation lifecycle workflows, user management, and static multipart file uploads for book covers and user avatars. In addition, it serves the compiled Angular single-page application in production.

---

## 2. Technology Stack & Architectural Highlights

| Layer / Concern | Technology | Notes |
|---|---|---|
| **Runtime** | Node.js (CommonJS modules) | Standard Node runtime with native asynchronous handlers |
| **Web Framework** | Express.js 4.x | Lightweight HTTP routing, JSON body parsing, and middleware pipeline |
| **Database & ODM** | MongoDB with Mongoose | Typed schemas, validation, pre-save encryption hooks, and population |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` | Stateless Bearer token authentication with 12-round salted password hashing |
| **File Uploads** | Multer (`multer`) | Disk-based image uploads for profile pictures (`/uploads/users`) and book covers (`/uploads/books`) |
| **Static Serving** | `express.static` + SVG Fallbacks | Serves media assets and serves compiled Angular frontend (`Frontend/dist/...`) |
| **CORS** | `cors` | Configured to allow cross-origin requests from frontend development servers |

---

## 3. Directory Structure

```text
Backend/
├── config/
│   └── db-connect.js          # MongoDB connection handler with Mongoose
├── controllers/
│   ├── auth-controllers.js    # Register, login, and logout handlers
│   ├── book-controllers.js    # Book catalog CRUD, search, pagination, and cover management
│   ├── loan-controllers.js    # Checkout, return processing, due date renewal, overdue tracking
│   ├── reservation-controllers.js # Member reservations, cancellations, and fulfillment
│   └── user-controllers.js   # Profile management, password updates, admin user moderation
├── middleware/
│   ├── auth-middleware.js     # JWT token verification (protect) and RBAC guard (restrictTo)
│   └── multer-middleware.js   # Disk storage setup and image mime-type filtering
├── models/
│   ├── book-model.js          # Book schema, availability counters, categories enum
│   ├── loan-model.js          # Loan schema, dates, status enums, member/book references
│   ├── reservation-model.js   # Reservation schema, status transitions, member/book references
│   └── user-model.js          # User schema, password hashing, role enum, active status
├── routes/
│   ├── auth-routes.js         # /api/v1/auth endpoints
│   ├── book-routes.js         # /api/v1/books endpoints
│   ├── loan-routes.js         # /api/v1/loans endpoints
│   ├── reservation-routes.js  # /api/v1/reservations endpoints
│   └── user-routes.js         # /api/v1/users endpoints
├── uploads/                   # Media upload target directories
│   ├── books/                 # Stored book cover images
│   └── users/                 # Stored user avatar images
├── utils/
│   ├── delete-uploaded-file.js # Safe disk cleanup utility for replaced/deleted media
│   ├── generate-token.js      # JWT signing helper
│   └── send-email.js          # Email notification helper (console logging or SMTP)
├── index.js                   # Application entry point, Express server, route mounting
└── package.json               # Backend dependencies and scripts
```

---

## 4. Database Models & Schema Specifications

### 4.1. User Model (`models/user-model.js`)
Stores system accounts across all three platform roles.
- `name`: String (Required, trimmed, 2-100 characters).
- `email`: String (Required, unique, trimmed, lowercase, valid email regex).
- `password`: String (Required, min 6 characters, excluded from default queries via `select: false`).
- `role`: String (Enum: `'member'`, `'librarian'`, `'admin'`; default `'member'`).
- `status`: String (Enum: `'active'`, `'suspended'`; default `'active'`).
- `profilePicture`: String (Optional path/filename to uploaded image).
- `isEmailVerified`: Boolean (Default `true`).
- `createdAt` / `updatedAt`: Timestamps.
- **Hooks & Methods:**
  - Pre-save hook hashes `password` with `bcryptjs.hash(password, 12)` if modified.
  - `comparePassword(candidatePassword)`: Validates plaintext credentials against the hashed password.

### 4.2. Book Model (`models/book-model.js`)
Catalog entity containing metadata and inventory counts.
- `title`: String (Required, trimmed, max 200 chars).
- `author`: String (Required, trimmed, max 100 chars).
- `isbn`: String (Required, unique, trimmed).
- `category`: String (Enum: `'Fiction'`, `'Non-Fiction'`, `'Science'`, `'History'`, `'Technology'`, `'Biography'`, `'Philosophy'`, `'Art'`, `'Other'`).
- `description`: String (Optional, max 2000 chars).
- `coverImage`: String (Optional filename or absolute image URL).
- `totalCopies`: Number (Required, min 1, default 1).
- `availableCopies`: Number (Required, min 0, default equals `totalCopies`).
- `createdAt` / `updatedAt`: Timestamps.

### 4.3. Loan Model (`models/loan-model.js`)
Tracks the borrowing lifecycle of a book checked out by a member.
- `book`: ObjectId ref `'Book'` (Required).
- `member`: ObjectId ref `'User'` (Required).
- `issuedBy`: ObjectId ref `'User'` (Required, librarian or admin).
- `issueDate`: Date (Default `Date.now`).
- `dueDate`: Date (Required; defaults to 14 days from issue date).
- `returnDate`: Date (Optional; populated upon return).
- `status`: String (Enum: `'active'`, `'returned'`, `'overdue'`; default `'active'`).
- `renewalCount`: Number (Default 0, max allowed renewals configurable).
- `createdAt` / `updatedAt`: Timestamps.

### 4.4. Reservation Model (`models/reservation-model.js`)
Tracks member hold requests on books that are currently out of stock.
- `book`: ObjectId ref `'Book'` (Required).
- `member`: ObjectId ref `'User'` (Required).
- `reservationDate`: Date (Default `Date.now`).
- `status`: String (Enum: `'pending'`, `'ready'`, `'fulfilled'`, `'cancelled'`; default `'pending'`).
- `readyUntil`: Date (Optional pickup deadline set when marked ready).
- `createdAt` / `updatedAt`: Timestamps.

---

## 5. Security & Authentication Architecture

### 5.1. Token Issuance & Verification
- When a user logs in (`POST /api/v1/auth/login`) or registers (`POST /api/v1/auth/register`), the backend generates a signed JSON Web Token containing the user's ID:
  ```js
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  ```

### 5.2. `protect` Middleware (`middleware/auth-middleware.js`)
- Inspects the `Authorization` header for a `Bearer <token>` format.
- Decodes the token using `JWT_SECRET`.
- Queries MongoDB for the user document (`User.findById(decoded.id)`).
- Verifies that the account exists and is not suspended (`status !== 'suspended'`).
- Injects the authenticated user document into `req.user`.

### 5.3. `restrictTo(...roles)` Middleware
- Checks whether `req.user.role` matches any of the allowed roles for the targeted route:
  ```js
  restrictTo("librarian", "admin")
  ```
- Rejects unauthorized requests with a `403 Forbidden` response.

---

## 6. Complete API Reference

All successful responses follow the standard JSON response envelope:
```json
{
  "status": "success",
  "message": "Optional descriptive status",
  "data": { ... }
}
```

### 6.1. Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Access | Description | Request Body Payload |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register new member account | `{ "name": "Jane", "email": "jane@lib.com", "password": "pass" }` |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & get JWT | `{ "email": "jane@lib.com", "password": "pass" }` |
| `POST` | `/api/v1/auth/logout` | Public | Terminate session | None |

### 6.2. User Management Routes (`/api/v1/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/me` | Authenticated | Retrieve current user profile |
| `PATCH` | `/api/v1/users/me` | Authenticated | Update current user name or email |
| `PATCH` | `/api/v1/users/me/password` | Authenticated | Change current password (`currentPassword`, `newPassword`) |
| `PATCH` | `/api/v1/users/me/picture` | Authenticated | Upload avatar image (Multipart field: `profilePicture`) |
| `DELETE` | `/api/v1/users/me` | Authenticated | Deactivate own account |
| `GET` | `/api/v1/users` | Admin only | List all registered users (filters: `role`, `status`, `search`) |
| `GET` | `/api/v1/users/:id` | Admin only | Retrieve user details by ID |
| `PATCH` | `/api/v1/users/:id/status` | Admin only | Set status (`active` or `suspended`) |
| `PATCH` | `/api/v1/users/:id/role` | Admin only | Set role (`member`, `librarian`, `admin`) |
| `DELETE` | `/api/v1/users/:id` | Admin only | Permanently delete user and associated records |

### 6.3. Book Catalog Routes (`/api/v1/books`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/books` | Public | List books with query parameters (`search`, `category`, `available`, `sort`, `page`, `limit`) |
| `GET` | `/api/v1/books/:id` | Public | Retrieve single book details by ID |
| `POST` | `/api/v1/books` | Librarian / Admin | Add new book (Multipart field `coverImage`, plus title, author, isbn, category, copies) |
| `PATCH` | `/api/v1/books/:id` | Librarian / Admin | Update book metadata or cover image |
| `DELETE` | `/api/v1/books/:id` | Librarian / Admin | Delete book and unlink cover image |

### 6.4. Loan & Borrowing Routes (`/api/v1/loans`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/loans/my` | Authenticated | Get current member's loans (active and returned history) |
| `GET` | `/api/v1/loans` | Librarian / Admin | List all loans across the library (with status filtering) |
| `GET` | `/api/v1/loans/overdue` | Librarian / Admin | List currently overdue loans |
| `POST` | `/api/v1/loans` | Librarian / Admin | Check out a book to a member (`bookId`, `memberId`, `dueDate`) |
| `PATCH` | `/api/v1/loans/:id/renew` | Librarian / Admin | Extend loan due date |
| `PATCH` | `/api/v1/loans/:id/return` | Librarian / Admin | Mark loan as returned and increment `availableCopies` |

### 6.5. Reservation Routes (`/api/v1/reservations`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/v1/reservations/my` | Authenticated | Get current member's pending and ready reservations |
| `POST` | `/api/v1/reservations` | Authenticated | Place a hold on a book (`bookId`) |
| `GET` | `/api/v1/reservations` | Librarian / Admin | List all active and pending reservations |
| `PATCH` | `/api/v1/reservations/:id/ready`| Librarian / Admin | Mark reservation as ready for pickup |
| `DELETE` | `/api/v1/reservations/:id` | Authenticated | Cancel a reservation (own reservation or librarian) |

### 6.6. Uploads & Static Media Routes (`/api/v1/uploads`)
- `GET /api/v1/uploads/books/:filename` — Serves book cover image from disk. If the image is not found, the server returns an inline SVG book placeholder with a 200 status code to prevent broken frontend `<img>` displays.
- `GET /api/v1/uploads/users/:filename` — Serves user avatar image from disk. If missing, returns an inline user silhouette SVG.

---

## 7. File Upload Pipeline & Storage

- **Upload Engine:** Multer disk storage engine configured in `middleware/multer-middleware.js`.
- **Destination Routing:**
  - Files uploaded for `profilePicture` are routed to `Backend/uploads/users/`.
  - Files uploaded for `coverImage` are routed to `Backend/uploads/books/`.
- **File Constraints:**
  - Maximum size: 5 MB (`5 * 1024 * 1024` bytes).
  - Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`.
- **File Deletion Utility (`utils/delete-uploaded-file.js`):**
  - When a book is deleted or its cover is replaced, the old file on disk is removed via `fs.unlink`.
  - When a user uploads a new avatar, the previous avatar file is safely cleaned up.

---

## 8. Configuration & Environment Variables

The backend relies on the following environment variables (configured via `.env` or system environment):

| Variable Name | Required | Default Value | Purpose |
|---|---|---|---|
| `PORT` | Optional | `3000` | Port on which the Express server listens |
| `MONGO_URI` | Optional | `mongodb://localhost:27017/libhub` | MongoDB connection URI |
| `JWT_SECRET` | Optional | `libhub-dev-secret-key-change-in-production` | Encryption key for signing JWT tokens |
| `JWT_EXPIRES_IN`| Optional | `7d` | Lifetime of signed JWT tokens |
| `EMAIL_HOST` | Optional | `""` | SMTP server host (logs token to console if omitted) |
| `EMAIL_PORT` | Optional | `587` | SMTP port |
| `EMAIL_USER` | Optional | `""` | SMTP username |
| `EMAIL_PASS` | Optional | `""` | SMTP password |

---

## 9. Production Execution & Static Frontend Integration

The backend is configured to serve both the REST API and the compiled Angular application in production:

```javascript
// Serves the compiled Angular browser bundle
app.use(express.static(path.join(__dirname, "../Frontend/dist/libhub-frontend-v21/browser")));

// SPA Catch-All fallback: Routes all non-API requests to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/dist/libhub-frontend-v21/browser/index.html"));
});
```

To run the entire stack in production:
```bash
# Build the frontend bundle
npm run build:frontend

# Start the full-stack server
npm start
```
The server will be reachable on port 3000 at `http://localhost:3000`.
