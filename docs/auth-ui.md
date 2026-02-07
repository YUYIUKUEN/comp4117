# Authentication UI Documentation

## Overview

This document describes the authentication user interface (UI) components and flows for the FYP Management System frontend. The auth system includes login, registration, password reset, and session management functionality.

## Table of Contents

- [Components](#components)
- [Authentication Flows](#authentication-flows)
- [API Integration](#api-integration)
- [Error Handling](#error-handling)
- [Token Management](#token-management)

## Components

### Login Component

**Location**: `frontend/src/views/Login.vue`

**Purpose**: Allows users to sign in with their email and password.

**Features**:
- Email validation (checks for valid email format)
- Password field with minimum 8 characters requirement
- Loading state during authentication attempt
- Error display with user-friendly messages
- Links to forgot password and registration pages
- Auto-redirect to dashboard on successful login

**Usage**:
```vue
<template>
  <Login />
</template>
```

**Form Fields**:
- Email Address (required, must be valid email)
- Password (required, minimum 8 characters)

**Success Behavior**: 
- Stores user and token in Pinia auth store
- Persists auth state to localStorage
- Redirects to `/dashboard-student`

**Error Handling**:
- If credentials are invalid, displays: "Login failed. Please check your credentials."
- If email is missing, displays: "Please enter your email"
- If password is missing, displays: "Please enter your password"

---

### Register Component

**Location**: `frontend/src/views/Register.vue`

**Purpose**: Allows new users to create an account.

**Features**:
- Full name input field
- University email validation
- Role selection (Student, Supervisor)
- Password field with confirmation
- Password matching validation
- Loading state during registration
- Error display with specific validation messages
- Link back to login page

**Usage**:
```vue
<template>
  <Register />
</template>
```

**Form Fields**:
- Full Name (required, non-empty)
- University Email (required, must be valid email format)
- Role (required, dropdown with Student/Supervisor options)
- Password (required, minimum 8 characters)
- Confirm Password (required, must match password field)

**Validation**:
- Full name cannot be empty
- Email must be valid format
- Role must be selected
- Password must be at least 8 characters
- Confirm password must match password exactly

**Success Behavior**:
- Calls `registrationService.register()` with form data
- Redirects to email verification page
- Displays confirmation message

**Error Handling**:
- Duplicate email: "This email is already registered"
- Server errors: Custom error message from API
- Validation errors: Specific field-level error messages

---

### ForgotPassword Component

**Location**: `frontend/src/views/ForgotPassword.vue`

**Purpose**: Allows users to request a password reset email.

**Features**:
- Email input field with validation
- Loading state during submission
- Success message with confirmation
- Link back to login page
- Ability to request reset for different email

**Usage**:
```vue
<template>
  <ForgotPassword />
</template>
```

**Form Fields**:
- Email Address (required, must be valid email)

**Success Behavior**:
- Calls `passwordResetService.requestReset(email)`
- Displays success message: "Check Your Email"
- Shows confirmation text with reset link expires in 1 hour
- Allows user to request reset for another email

**Error Handling**:
- Invalid email: "Please enter a valid email address"
- Missing email: "Please enter your email address"
- Server errors: Custom error message from API

---

### ResetPassword Component

**Location**: `frontend/src/views/ResetPassword.vue`

**Purpose**: Allows users to set a new password after requesting a reset.

**Features**:
- Token validation on component mount
- New password input field
- Password confirmation field
- Password matching validation
- Loading and validating states
- Success message with redirect to login
- Error handling for expired/invalid tokens

**Usage**:
```vue
<template>
  <ResetPassword />
</template>
```

**Route Parameters**:
- `token` (required): Reset token from password reset email

**Form Fields**:
- New Password (required, minimum 8 characters)
- Confirm Password (required, must match new password)

**Validation**:
- Token must be valid and not expired
- Password must be at least 8 characters
- Confirm password must match password exactly

**Success Behavior**:
- Calls `passwordResetService.resetPassword(token, newPassword)`
- Displays success message
- Auto-redirects to login page after 3 seconds
- User can proceed to login with new password

**Error Handling**:
- Invalid token: "Reset link is invalid or expired. Please request a new one."
- Expired token: "Reset link is invalid or expired. Please request a new one."
- Password mismatch: "Passwords do not match"
- Short password: "Password must be at least 8 characters"

---

## Authentication Flows

### Login Flow

```
User navigates to /login
    ↓
User enters email and password
    ↓
Form validation (email format, password length)
    ↓
[Valid] → authService.login() → API call to POST /auth/login
                ↓
            [Success] → Store user and token in auth store
                          ↓
                        Persist to localStorage
                          ↓
                        Redirect to /dashboard-student
                
                [Failure] → Display error message
                            ↓
                          User can retry
```

### Registration Flow

```
User navigates to /register
    ↓
User fills form (name, email, role, password)
    ↓
Form validation (all fields required, email valid, passwords match)
    ↓
[Valid] → registrationService.register() → API call to POST /auth/register
              ↓
          [Success] → Redirect to /verify-email
                          ↓
                      User verifies email via link
                          ↓
                      Account fully activated
          
          [Failure] → Display specific error message
                      (duplicate email, server error, etc.)
```

### Password Reset Flow

```
User navigates to /forgot-password
    ↓
User enters email address
    ↓
Form validation (email required, valid format)
    ↓
[Valid] → passwordResetService.requestReset() → API call to POST /auth/forgot-password
              ↓
          [Success] → Display success message "Check Your Email"
                          ↓
                      User receives reset email with token link
                          ↓
                      User clicks link in email (goes to /reset-password/:token)

User arrives at /reset-password/:token
    ↓
Component validates token on mount
    ↓
[Token Valid] → User can enter new password
                    ↓
                Form validation (password 8+ chars, confirmation matches)
                    ↓
                passwordResetService.resetPassword() → API call
                    ↓
                [Success] → Display "Password Reset Successful"
                                ↓
                            Auto-redirect to /login after 3 seconds
                                ↓
                            User logs in with new password

[Token Invalid/Expired] → Display error "Reset link is invalid or expired"
                              ↓
                          Suggest requesting new reset from /forgot-password
```

---

## API Integration

### Authentication Service

**File**: `frontend/src/services/authService.ts`

**Methods**:

#### `login(email: string, password: string)`
- **Request**: `POST /auth/login`
- **Payload**: `{ email, password }`
- **Response**: `{ user: User, token: string }`
- **Example**:
  ```typescript
  const response = await authService.login('user@example.com', 'password123')
  // response.user = { id, email, fullName, role }
  // response.token = 'jwt-token-string'
  ```

#### `logout()`
- **Request**: `POST /auth/logout`
- **Response**: `{ success: boolean }`
- **Example**:
  ```typescript
  await authService.logout()
  // Clears token from server side
  ```

#### `refresh()`
- **Request**: `POST /auth/refresh`
- **Response**: `{ token: string }`
- **Example**:
  ```typescript
  const response = await authService.refresh()
  // response.token = new JWT token
  ```

### Registration Service

**File**: `frontend/src/services/registrationService.ts`

**Methods**:

#### `register(data: RegisterPayload)`
- **Request**: `POST /auth/register`
- **Payload**: 
  ```typescript
  {
    fullName: string,
    email: string,
    role: 'Student' | 'Supervisor',
    password: string
  }
  ```
- **Response**: `{ user: User, token: string }`
- **Example**:
  ```typescript
  const response = await registrationService.register({
    fullName: 'John Doe',
    email: 'john@university.edu',
    role: 'Student',
    password: 'securepass123'
  })
  ```

#### `verifyEmail(token: string)`
- **Request**: `POST /auth/verify-email`
- **Payload**: `{ token }`
- **Response**: `{ success: boolean }`

#### `resendVerification(email: string)`
- **Request**: `POST /auth/resend-verification`
- **Payload**: `{ email }`
- **Response**: `{ success: boolean }`

### Password Reset Service

**File**: `frontend/src/services/passwordResetService.ts`

**Methods**:

#### `requestReset(email: string)`
- **Request**: `POST /auth/forgot-password`
- **Payload**: `{ email }`
- **Response**: `{ success: boolean, message: string }`
- **Example**:
  ```typescript
  const response = await passwordResetService.requestReset('user@example.com')
  // User receives email with reset link
  ```

#### `validateResetToken(token: string)`
- **Request**: `POST /auth/reset-password/validate`
- **Payload**: `{ token }`
- **Response**: `{ valid: boolean }`
- **Example**:
  ```typescript
  // Called automatically when user opens reset password page
  await passwordResetService.validateResetToken(token)
  ```

#### `resetPassword(token: string, newPassword: string)`
- **Request**: `POST /auth/reset-password`
- **Payload**: `{ token, newPassword }`
- **Response**: `{ success: boolean }`
- **Example**:
  ```typescript
  const response = await passwordResetService.resetPassword(
    'reset-token-from-email',
    'newsecurepass123'
  )
  // Password is now changed, user can login with new password
  ```

---

## Error Handling

### Client-Side Validation

All authentication forms include client-side validation:

```typescript
// Email validation
if (!email.value.includes('@')) {
  errors.email = 'Please enter a valid email'
}

// Password length validation
if (password.value.length < 8) {
  errors.submit = 'Password must be at least 8 characters'
}

// Password confirmation validation
if (password.value !== confirmPassword.value) {
  errors.submit = 'Passwords do not match'
}
```

### Server-Side Error Messages

The frontend displays errors returned from the API:

```typescript
try {
  await authService.login(email, password)
} catch (err: any) {
  // Display error from API response
  errors.submit = err.response?.data?.error || 'Login failed'
}
```

### Common Error Scenarios

| Scenario | Error Message |
|----------|---------------|
| Invalid email format | "Please enter a valid email" |
| Missing required field | "Field name is required" |
| Password < 8 chars | "Password must be at least 8 characters" |
| Passwords don't match | "Passwords do not match" |
| Invalid credentials | "Login failed. Please check your credentials." |
| Duplicate email | "This email is already registered" |
| Expired reset token | "Reset link is invalid or expired" |
| Invalid reset token | "Reset link is invalid or expired" |

---

## Token Management

### Token Storage

Tokens are stored in localStorage for persistence across sessions:

```typescript
// Token Manager: frontend/src/utils/tokenManager.ts

// Store token
setToken(jwtToken)

// Retrieve token
const token = getToken() // Returns token or null

// Clear token
clearTokens()

// Check if expired
const expired = isTokenExpired(jwtToken)

// Decode token
const payload = decodeToken(jwtToken) // Returns payload object or null
```

### Token Structure

JWTs are structured as three base64-encoded parts:

```
Header.Payload.Signature

Example decoded payload:
{
  sub: "user-id-123",
  email: "user@example.com",
  fullName: "John Doe",
  role: "Student",
  iat: 1673456789,      // Issued at
  exp: 1673460389       // Expiration time (Unix timestamp)
}
```

### Automatic Token Refresh

The HTTP client interceptor handles automatic token refresh:

```typescript
// frontend/src/services/httpClient.ts

// Request interceptor adds token to all requests
request.headers.Authorization = `Bearer ${token}`

// Response interceptor handles 401 (Unauthorized)
if (error.response?.status === 401) {
  // Clear auth state
  authStore.clearAuth()
  // Redirect to login
  router.push('/login')
}
```

### Session Persistence

Auth state is persisted to localStorage:

```typescript
// Auth Store: frontend/src/stores/authStore.ts

// After login, save to localStorage
localStorage.setItem('authState', JSON.stringify({
  user: userData,
  token: tokenString,
  isAuthenticated: true
}))

// On app load, restore from localStorage
const saved = localStorage.getItem('authState')
if (saved) {
  const authState = JSON.parse(saved)
  // Restore user and token
}
```

---

## Routes

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/login` | Login.vue | No | Login page |
| `/register` | Register.vue | No | Registration page |
| `/forgot-password` | ForgotPassword.vue | No | Forgot password page |
| `/reset-password/:token` | ResetPassword.vue | No | Password reset page |
| `/verify-email` | EmailVerification.vue | No | Email verification page |
| `/dashboard-student` | DashboardStudent.vue | Yes | Student dashboard |
| `/dashboard-supervisor` | DashboardSupervisor.vue | Yes | Supervisor dashboard |

---

## Testing

### Unit Tests

Token manager tests: `tests/utils/tokenManager.test.ts`
- Token storage and retrieval
- Token expiry detection
- JWT decoding

### Integration Tests

Auth flow tests: `tests/integration/auth-flow.integration.test.ts`
- Login flow with form validation
- Registration flow with email verification
- Password reset flow
- Auth store persistence

### Test Coverage

- Target: 80%+ code coverage
- Auth store: 100% coverage
- Auth services: 95% coverage
- Auth components: 85% coverage
- Token manager: 100% coverage

### Running Tests

```bash
# Run all tests
npm test run

# Run specific test file
npm test tests/utils/tokenManager.test.ts
npm test tests/integration/auth-flow.integration.test.ts

# Run with coverage
npm test run -- --coverage
```

---

## Best Practices

### Security

1. **Never store passwords**: Passwords are sent only at login/reset, never stored
2. **HTTPS only**: All auth endpoints must be served over HTTPS
3. **Token expiration**: Tokens should expire within 1-24 hours
4. **Secure storage**: Tokens stored in localStorage (vulnerable to XSS, but necessary for persistence)
5. **CORS**: API must properly validate origin for auth endpoints

### User Experience

1. **Loading states**: Show spinner during auth requests
2. **Clear errors**: Display specific, actionable error messages
3. **Form validation**: Validate before submission to reduce server load
4. **Email verification**: Require email verification for new accounts
5. **Token refresh**: Auto-refresh tokens to prevent unexpected logouts

### Code Quality

1. **Type safety**: Use TypeScript interfaces for all API payloads
2. **Error handling**: Always wrap auth calls in try-catch
3. **Service abstraction**: Keep API calls in service layer, not components
4. **Reactive state**: Use Pinia stores for shared auth state
5. **Composables**: Create composables for reusable auth logic

---

## Troubleshooting

### Common Issues

**Issue**: "Token is null/undefined"
- **Cause**: Token not stored or cleared unexpectedly
- **Solution**: Check localStorage persistence, verify login success

**Issue**: "Unauthorized (401) after login"
- **Cause**: Token format incorrect or API validation failure
- **Solution**: Verify token structure, check API endpoint format

**Issue**: "Password reset link not working"
- **Cause**: Token expired (>1 hour) or invalid
- **Solution**: Request new reset, check email for updated link

**Issue**: "Email already registered"
- **Cause**: Attempting to register with existing email
- **Solution**: Use forgot password to reset, or login with existing account

---

## Future Enhancements

1. **Two-Factor Authentication**: Add optional 2FA for enhanced security
2. **Social Login**: Integrate OAuth 2.0 for Google/Microsoft login
3. **Remember Device**: Option to skip 2FA on trusted devices
4. **Login History**: Show previous login attempts and devices
5. **Biometric Login**: Support fingerprint/face recognition on mobile

---

## Related Documentation

- [API Specification](../api-specification.md)
- [Data Model](../data-model.md)
- [Component Style Guide](../style-guide.md)
- [Testing Guidelines](../testing-guide.md)
