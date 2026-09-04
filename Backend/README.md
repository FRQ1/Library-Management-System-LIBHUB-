# LibHub Backend

Node/Express/MongoDB (Mongoose) API for the LibHub Library Management System.
Structured as: config / controllers / middleware / models / routes / utils,
with multer for image uploads and a consistent { status, message, data }
JSON response shape.

## What this module does

This is the authentication and authorization module of the LibHub backend.
It handles:

- User registration (POST /register) - creates an account, hashes the
  password, sends an email-verification token, and returns a JWT so the
  account can be used immediately.
- Login (POST /login) - verifies email + password and returns a JWT.
- Email verification and password reset, each via a single-use,
  time-limited token.
- Role-based access control (RBAC) - every protected route checks the JWT
  (via a `protect` middleware) and, where relevant, the user's role (via a
  `restrictTo(...roles)` middleware) before running the controller.

This auth module is the foundation the rest of the app (Books, Loans,
Reservations, User management) builds on - every protected endpoint in
those modules reuses the same `protect` / `restrictTo` middleware.

## User roles

Three roles, stored on the `User` model's `role` field:

| Role | Description |
|---|---|
| `admin` | Manages all users (activate/suspend, change role, delete), full system access |
| `librarian` | Manages the book catalog, processes checkouts/returns, manages reservations |
| `member` | Browses the catalog, borrows/reserves books, manages their own profile |

`POST /register` always creates a `member` account. Librarian and admin
accounts are created by promoting an existing user via
`PATCH /users/:id/role` (admin-only) - there's no public signup path
directly into a privileged role, on purpose.

## Setup / running locally

```bash
cd Backend
npm install
npm start             
```

The server starts on `PORT` (default `5000`). Uploaded images are served
from `/api/v1/uploads/books/...` and `/api/v1/uploads/users/...`.

Email sending (verification / password reset) is optional in dev: if
`EMAIL_HOST` is left blank in `.env`, the email content (including the raw
verification/reset token) is just logged to the server console instead of
actually being sent, so you can copy the token from the terminal and test
the flow without an SMTP account.

## Auth routes + examples

All requests/responses below are JSON unless noted. Base URL:
`http://localhost:5000/api/v1/auth`

### POST /register

Creates a member account and returns a JWT immediately (the account still
needs to be verified via the emailed token before certain flows, but the
token returned here already works against protected routes).

Request:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass123"
}
```

Response (201):
```json
{
    "status": "success",
    "message": "Account created. Please check your email to verify your account",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhODQ3MzNmNmJiN2Y3MTZjZjI2OTU2ZSIsImlhdCI6MTc4NzA2NTE1MiwiZXhwIjoxNzg3NjY5OTUyfQ._tAjaW_22SVRMFSKnzNhk3YE8Y9zPvwYxZW8fYFhBNI",
    "data": {
        "user": {
            "id": "6a84733f6bb7f716cf26956e",
            "name": "Jane Doe",
            "email": "jane@example.com",
            "role": "member"
        }
    }
}
```

### POST /login

Request:
```json
{
  "email": "jane@example.com",
  "password": "SecurePass123"
}
```

Response (200, success):
```json
{
    "status": "success",
    "message": "Logged in successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhODQ3MzNmNmJiN2Y3MTZjZjI2OTU2ZSIsImlhdCI6MTc4NzA2NTkwMiwiZXhwIjoxNzg3NjcwNzAyfQ.UOjS2HFH3MA8ogHKO4UPKE1cR-cq56HUny_ogQN1h-w",
    "data": {
        "user": {
            "id": "6a84733f6bb7f716cf26956e",
            "name": "Jane Doe",
            "email": "jane@example.com",
            "role": "member"
        }
    }
}
```

Response (401, wrong credentials):
```json
{
  "status": "fail",
  "message": "Incorrect email or password"
}
```

### GET /verify-email/:token

Verifies the account using the raw token emailed (or console-logged) on
registration.

Response (200):
```json
{
  "status": "success",
  "message": "Email verified successfully. You can now log in"
}
```

### POST /logout

No body required. Since JWTs are stateless, this is just a clean
client-facing endpoint - the actual "logout" is the client discarding its
token.

### POST /forgot-password

Request:
```json
{ "email": "jane@example.com" }
```

Response (200) - always the same message, whether or not the email exists,
so the endpoint can't be used to enumerate registered emails:
```json
{
  "status": "success",
  "message": "If that email is registered, a reset link has been sent"
}
```

### PATCH /reset-password/:token

Request:
```json
{ "password": "NewSecurePass456" }
```

Response (200):
```json
{
  "status": "success",
  "message": "Password reset successfully. You can now log in"
}
```

### Accessing a protected route with the token

Any route behind `protect` (e.g. `GET /api/v1/users/me`) requires the
header:
```
Authorization: Bearer <token>
```

Response without a token (401):
```json
{
  "status": "fail",
  "message": "You are not logged in. Please log in to get access"
}
```

## Testing Screenshots

Screenshots below are from testing the auth module in Postman. Files live
in `screenshots/` at the project root.

**Registering a new user (returns a token immediately):**
![Register success](Postman-screenshots/register-success.png)

**Login with correct credentials:**
![Login success](Postman-screenshots/login-success.png)

**Login with incorrect credentials:**
![Login failure](Postman-screenshots/login-wrong-password.png)

**Using the returned token to access a protected route (`GET /users/me`):**
![Protected route access](Postman-screenshots/protected-route.png)

**Attempting the protected route without a token:**
![Protected route rejected](Postman-screenshots/protected-route-no-token.png)

## Other endpoints (Books / Loans / Reservations / Users)

These build on the auth module above using the same `protect` /
`restrictTo` middleware.

### Users - /api/v1/users (JWT required)
- GET /me, PATCH /me, PATCH /me/password, PATCH /me/picture (field profilePicture), DELETE /me
- Admin only: GET /, GET /:id, PATCH /:id/status, PATCH /:id/role, DELETE /:id

### Books - /api/v1/books
- GET /?search=&category= (public), GET /:id (public)
- Librarian/Admin: POST / (field coverImage), PATCH /:id, DELETE /:id

### Loans - /api/v1/loans (JWT required)
- Member: GET /my
- Librarian/Admin: GET /, GET /overdue, POST / ({bookId, memberId, days?}),
  PATCH /:id/renew ({days?}), PATCH /:id/return

### Reservations - /api/v1/reservations (JWT required)
- Member: GET /my, POST / ({bookId})
- Librarian/Admin: GET /, PATCH /:id/ready
- Member (own) or Librarian/Admin: DELETE /:id (cancel)

