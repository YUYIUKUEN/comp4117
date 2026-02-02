# Research Findings: FYP Management System MVP

**Feature**: 001-fyp-management-system-mvp  
**Date**: 2026-02-02  
**Phase**: 0 (Research & Clarifications)

---

## Research Tasks & Findings

### 1. MongoDB Connection Pooling & Best Practices

**Decision**: Use Mongoose with connection pooling enabled  
**Rationale**: Mongoose automatically manages connection pools with sensible defaults. For MVP, pool size of 10-20 connections is sufficient for <100 concurrent users.

**Configuration**:
```javascript
// mongoose.connect(uri, {
//   maxPoolSize: 20,
//   minPoolSize: 5,
//   socketTimeoutMS: 45000,
// })
```

**Alternatives Considered**:
- Direct MongoDB driver: More control but more complexity; Mongoose is sufficient for MVP
- Connection pooling middleware: Unnecessary; Mongoose handles this transparently

---

### 2. Mongoose Schema Validation & File Metadata

**Decision**: Use Mongoose schema validators with custom validators for file uploads

**Rationale**:
- Mongoose schema-level validation prevents invalid data at the source
- Custom validators can check file types, size, and metadata
- Pre-hooks can normalize file paths and metadata before saving

**Patterns**:
```javascript
// File metadata schema
const fileSchema = new Schema({
  filename: { type: String, required: true },
  mimetype: { type: String, enum: ['application/pdf', 'application/msword', ...], required: true },
  size: { type: Number, max: 52428800, required: true }, // 50MB max
  uploadedAt: { type: Date, default: Date.now },
});

// Custom validator
const validateFileType = (file) => {
  const allowedTypes = ['application/pdf', 'application/msword'];
  return allowedTypes.includes(file.mimetype);
};
```

**Alternatives Considered**:
- Application-level validation only: Duplicates logic; schema validation is cleaner
- Database constraints without schema validation: Works but loses Mongoose benefits

---

### 3. JWT Token Management & Expiry Strategy

**Decision**: 24-hour token expiry with optional refresh token support (for Phase 2)

**Rationale**:
- 24-hour expiry balances security (short-lived tokens) with UX (not logging out constantly)
- For MVP, refresh tokens deferred; re-login on expiry is acceptable
- Tokens stored in httpOnly cookies (secure, prevents XSS access)

**MVP Implementation**:
```javascript
// Token issued with 24h expiry
const token = jwt.sign(
  { userId, role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

**Future Enhancement** (Phase 2): Implement refresh token mechanism for seamless re-authentication

**Alternatives Considered**:
- Session-based auth: Requires server-side session storage; JWT is more scalable
- Longer token expiry (30 days): Security risk; users need explicit logout or timeout
- Refresh tokens in MVP: Adds complexity; 24h expiry with re-login is acceptable

---

### 4. Express.js Middleware Ordering & Error Handling

**Decision**: Middleware chain: (1) CORS → (2) logging → (3) body parser → (4) auth → (5) routes → (6) error handler

**Rationale**:
- Correct ordering prevents auth checks on CORS preflight requests
- Centralized error handler catches all thrown errors and formats them consistently
- Logging middleware captures all requests for audit purposes

**Architecture**:
```javascript
// 1. CORS
app.use(cors());

// 2. Logging
app.use(logger('combined'));

// 3. Body parsing
app.use(express.json({ limit: '50mb' }));

// 4. Auth middleware (applied per route)
// app.use(authenticateToken); // Selective, not global

// 5. Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/topics', topicRoutes);
// ...

// 6. Error handler (last)
app.use(errorHandler);
```

**Alternatives Considered**:
- Global auth middleware: Blocks all routes; better to apply selectively per route
- Multiple error handlers: Confusing; single centralized handler is cleaner

---

### 5. Vue 3 Composition API Patterns

**Decision**: Use Composition API with custom composables for API calls and form validation

**Rationale**:
- Composables encapsulate logic (API calls, form state) for reusability
- `<script setup>` syntax is cleaner and more performant
- Reactive forms with validation state managed in composables

**Patterns**:
```javascript
// composable: useAuthForm.js
export const useAuthForm = () => {
  const email = ref('');
  const password = ref('');
  const errors = ref({});
  
  const validate = () => {
    // validation logic
  };
  
  const submit = async () => {
    if (validate()) {
      const response = await authApi.login(email.value, password.value);
      // handle response
    }
  };
  
  return { email, password, errors, validate, submit };
};
```

**Alternatives Considered**:
- Options API: Older syntax; Composition API is more modern and flexible
- Class components: Not native to Vue 3; Composition API is standard

---

### 6. Pinia Store Architecture for Role-Based Features

**Decision**: One store per feature (authStore, topicStore, submissionStore, etc.) with role-based getters

**Rationale**:
- Modular stores are easier to test and maintain
- Role-based getters filter data visibility based on user role
- Centralized auth state prevents race conditions

**Pattern**:
```javascript
// authStore.js
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isStudent = computed(() => user.value?.role === 'Student');
  const isSupervisor = computed(() => user.value?.role === 'Supervisor');
  const isAdmin = computed(() => user.value?.role === 'Admin');
  
  return { user, isStudent, isSupervisor, isAdmin };
});

// topicStore.js
export const useTopicStore = defineStore('topic', () => {
  const topics = ref([]);
  const visibleTopics = computed(() => {
    const user = useAuthStore().user;
    if (user.role === 'Student') {
      return topics.value.filter(t => t.status === 'Active');
    }
    return topics.value; // Supervisors/Admins see all
  });
  
  return { topics, visibleTopics };
});
```

**Alternatives Considered**:
- Single monolithic store: Harder to test and scale
- Component-level state: Duplicates logic across components

---

### 7. Playwright E2E Test Automation

**Decision**: Playwright for cross-browser E2E testing (Chrome, Firefox, Safari)

**Rationale**:
- Excellent for web apps with modern JS frameworks
- Can test authentication flows, form submissions, and multi-step workflows
- Supports all major browsers
- Good debugging and reporting tools

**Test Strategy**:
1. **Happy Path**: Student logs in → browse topics → apply → view status
2. **Supervisor Flow**: Login → view applications → approve → see student submission status
3. **Admin Overview**: Dashboard data loads and displays correctly
4. **Error Handling**: Invalid login, network errors, validation errors show user-friendly messages

**Alternatives Considered**:
- Cypress: Good but slower; Playwright is faster and more reliable
- Selenium: Older; Playwright is more modern

---

### 8. File Upload Security Validation

**Decision**: Server-side MIME type validation + file size check + optional virus scanning (deferred)

**Rationale**:
- Client-side validation can be bypassed; server-side is mandatory
- MIME type checking prevents executable uploads
- File size limits (50MB) prevent storage exhaustion
- Virus scanning deferred to Phase 2 (can integrate ClamAV or similar)

**Implementation**:
```javascript
// Backend validation
const validateFile = (file) => {
  const allowedTypes = ['application/pdf', 'application/msword', ...];
  const maxSize = 52428800; // 50MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  return true;
};
```

**Alternatives Considered**:
- No validation: Security risk; attackers could upload malicious files
- Client-side only: Can be bypassed
- In-memory virus scanning: Adds latency; deferred to Phase 2

---

## Research Conclusions

All research findings support the technical decisions made in the plan:

✅ **MongoDB + Mongoose**: Suitable for MVP; connection pooling and schema validation handle document management well  
✅ **JWT with 24h expiry**: Balances security and UX  
✅ **Express.js middleware pattern**: Proven architecture for RESTful APIs  
✅ **Vue 3 Composition API**: Modern, reusable, testable  
✅ **Pinia for role-based access**: Clean separation of feature visibility  
✅ **Playwright for E2E**: Reliable and comprehensive cross-browser testing  
✅ **Server-side file validation**: Essential for security  

**No blockers identified**. Ready to proceed to Phase 1 (Design & Contracts).
