---
work_package_id: "WP10"
title: "Authentication UI (Login, Register, Password Reset)"
lane: "doing"
dependencies: ["WP02", "WP09"]
subtasks: ["T048", "T049", "T050", "T051", "T052"]
created_at: "2026-02-02"
agent: "GitHub Copilot"
shell_pid: "5800"
---

# WP10: Authentication UI (Login, Register, Password Reset)

**Objective**: Implement complete authentication user interface with login, registration, and password reset flows.

**Scope**: Login form, registration form, password reset form, email verification, session management, and auth state display.

**Success Criteria**:
- Login form validates and submits correctly
- Registration form creates new users
- Password reset workflow works end-to-end
- Auth state persists across page reloads
- 80%+ test coverage for auth components

**Estimated Effort**: 3-4 days (frontend developer)

---

## Subtask T048: Implement Enhanced Login Component

**Purpose**: Create login form with validation, loading states, and error handling.

**Files to Create**:
- `src/views/Login.vue` (enhanced)
- `src/components/forms/LoginForm.vue`
- `tests/components/LoginForm.test.js`

**Steps**:

1. Create enhanced `src/views/Login.vue`:
   ```vue
   <template>
     <div class="login-page">
       <div class="login-container">
         <div class="login-card">
           <div class="login-header">
             <h1>FYP Management</h1>
             <p class="subtitle">Final Year Project Management System</p>
           </div>
           
           <form @submit.prevent="handleLogin" class="login-form">
             <div class="form-group">
               <label for="email">University Email</label>
               <input
                 id="email"
                 v-model="form.email"
                 type="email"
                 placeholder="your.email@university.edu"
                 required
                 :disabled="loading"
               />
               <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
             </div>
             
             <div class="form-group">
               <label for="password">Password</label>
               <input
                 id="password"
                 v-model="form.password"
                 type="password"
                 placeholder="••••••••"
                 required
                 :disabled="loading"
               />
               <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
             </div>
             
             <div v-if="errors.submit" class="error-box">
               <span class="error-icon">⚠</span>
               <span>{{ errors.submit }}</span>
             </div>
             
             <button
               type="submit"
               class="btn-submit"
               :disabled="loading || !form.email || !form.password"
             >
               <span v-if="loading" class="spinner"></span>
               {{ loading ? 'Logging in...' : 'Login' }}
             </button>
           </form>
           
           <div class="login-footer">
             <router-link to="/forgot-password" class="link">
               Forgot password?
             </router-link>
           </div>
         </div>
         
         <div class="demo-info">
           <p><strong>Demo Credentials</strong></p>
           <p>Student: student@university.edu / password123</p>
           <p>Supervisor: supervisor@university.edu / password123</p>
           <p>Admin: admin@university.edu / password123</p>
         </div>
       </div>
     </div>
   </template>
   
   <script setup>
   import { ref, reactive } from 'vue';
   import { useRouter } from 'vue-router';
   import { useAuthStore } from '../stores/authStore';
   import authService from '../services/authService';
   
   const router = useRouter();
   const authStore = useAuthStore();
   
   const form = reactive({
     email: '',
     password: '',
   });
   
   const loading = ref(false);
   const errors = reactive({
     email: null,
     password: null,
     submit: null,
   });
   
   const validateForm = () => {
     errors.email = null;
     errors.password = null;
     errors.submit = null;
     
     if (!form.email) {
       errors.email = 'Email is required';
     } else if (!form.email.includes('@university.edu')) {
       errors.email = 'Must use university email';
     }
     
     if (!form.password) {
       errors.password = 'Password is required';
     } else if (form.password.length < 6) {
       errors.password = 'Password must be at least 6 characters';
     }
     
     return !errors.email && !errors.password;
   };
   
   const handleLogin = async () => {
     if (!validateForm()) return;
     
     loading.value = true;
     
     try {
       const response = await authService.login({
         email: form.email,
         password: form.password,
       });
       
       authStore.setAuth(response.data.data.user, response.data.data.token);
       
       // Redirect based on role
       const redirectPath = {
         'Student': '/dashboard/student',
         'Supervisor': '/dashboard/supervisor',
         'Admin': '/admin',
       }[response.data.data.user.role] || '/dashboard';
       
       await router.push(redirectPath);
     } catch (err) {
       const errorMsg = err.response?.data?.error || 'Login failed. Please check your credentials.';
       errors.submit = errorMsg;
     } finally {
       loading.value = false;
     }
   };
   </script>
   
   <style scoped>
   .login-page {
     display: flex;
     justify-content: center;
     align-items: center;
     min-height: 100vh;
     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
   }
   
   .login-container {
     display: flex;
     gap: 3rem;
     align-items: center;
     width: 100%;
     max-width: 1200px;
     padding: 2rem;
   }
   
   .login-card {
     background: white;
     padding: 3rem;
     border-radius: 12px;
     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
     width: 100%;
     max-width: 400px;
   }
   
   .login-header {
     margin-bottom: 2rem;
     text-align: center;
   }
   
   .login-header h1 {
     margin: 0;
     font-size: 1.8rem;
     color: #333;
   }
   
   .subtitle {
     margin: 0.5rem 0 0;
     color: #666;
     font-size: 0.9rem;
   }
   
   .login-form {
     margin-bottom: 1.5rem;
   }
   
   .form-group {
     margin-bottom: 1.5rem;
   }
   
   label {
     display: block;
     margin-bottom: 0.5rem;
     font-weight: 500;
     color: #333;
     font-size: 0.95rem;
   }
   
   input {
     width: 100%;
     padding: 0.75rem;
     border: 2px solid #e0e0e0;
     border-radius: 6px;
     font-size: 1rem;
     transition: border-color 0.2s;
     box-sizing: border-box;
   }
   
   input:focus {
     outline: none;
     border-color: #667eea;
   }
   
   input:disabled {
     background: #f5f5f5;
     cursor: not-allowed;
   }
   
   .error-text {
     display: block;
     color: #dc3545;
     font-size: 0.85rem;
     margin-top: 0.3rem;
   }
   
   .error-box {
     background: #fff3cd;
     border: 1px solid #ffc107;
     color: #856404;
     padding: 0.75rem;
     border-radius: 6px;
     margin-bottom: 1rem;
     display: flex;
     align-items: center;
     gap: 0.5rem;
   }
   
   .error-icon {
     font-size: 1.2rem;
   }
   
   .btn-submit {
     width: 100%;
     padding: 0.875rem;
     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
     color: white;
     border: none;
     border-radius: 6px;
     font-size: 1rem;
     font-weight: 600;
     cursor: pointer;
     transition: transform 0.2s;
     display: flex;
     justify-content: center;
     align-items: center;
     gap: 0.5rem;
   }
   
   .btn-submit:hover:not(:disabled) {
     transform: translateY(-2px);
   }
   
   .btn-submit:disabled {
     opacity: 0.7;
     cursor: not-allowed;
   }
   
   .spinner {
     display: inline-block;
     width: 1rem;
     height: 1rem;
     border: 2px solid rgba(255, 255, 255, 0.3);
     border-top-color: white;
     border-radius: 50%;
     animation: spin 0.6s linear infinite;
   }
   
   @keyframes spin {
     to { transform: rotate(360deg); }
   }
   
   .login-footer {
     text-align: center;
   }
   
   .link {
     color: #667eea;
     text-decoration: none;
     font-size: 0.9rem;
   }
   
   .link:hover {
     text-decoration: underline;
   }
   
   .demo-info {
     background: rgba(255, 255, 255, 0.1);
     backdrop-filter: blur(10px);
     color: white;
     padding: 1.5rem;
     border-radius: 12px;
     max-width: 300px;
   }
   
   .demo-info p {
     margin: 0.5rem 0;
     font-size: 0.85rem;
   }
   
   @media (max-width: 768px) {
     .login-container {
       flex-direction: column;
       gap: 2rem;
     }
     
     .demo-info {
       max-width: 100%;
     }
   }
   </style>
   ```

2. Create `tests/components/LoginForm.test.js`:
   ```javascript
   import { describe, it, expect, beforeEach, vi } from 'vitest';
   import { mount } from '@vue/test-utils';
   import { createPinia, setActivePinia } from 'pinia';
   import Login from '../../src/views/Login.vue';
   import * as authService from '../../src/services/authService';
   
   vi.mock('../../src/services/authService');
   
   describe('Login Component', () => {
     beforeEach(() => {
       setActivePinia(createPinia());
     });
     
     it('renders login form', () => {
       const wrapper = mount(Login);
       expect(wrapper.find('input[type="email"]').exists()).toBe(true);
       expect(wrapper.find('input[type="password"]').exists()).toBe(true);
     });
     
     it('validates email format', async () => {
       const wrapper = mount(Login);
       const emailInput = wrapper.find('input[type="email"]');
       
       await emailInput.setValue('invalid-email');
       await wrapper.find('form').trigger('submit');
       
       expect(wrapper.vm.errors.email).toBeTruthy();
     });
     
     it('validates password length', async () => {
       const wrapper = mount(Login);
       const passwordInput = wrapper.find('input[type="password"]');
       
       await passwordInput.setValue('123');
       await wrapper.find('form').trigger('submit');
       
       expect(wrapper.vm.errors.password).toBeTruthy();
     });
   });
   ```

**Validation Checklist**:
- [ ] Login form renders correctly
- [ ] Email validation works
- [ ] Password validation enforced
- [ ] Loading state shows spinner
- [ ] Error messages display
- [ ] Form submission sends request
- [ ] Component tests pass with 80%+ coverage

---

## Subtask T049: Implement Registration Component

**Purpose**: Create user registration form with validation and account creation.

**Files to Create**:
- `src/views/Register.vue`
- `src/services/registrationService.js`
- `tests/views/Register.test.js`

**Steps**:

1. Create `src/views/Register.vue`:
   ```vue
   <template>
     <div class="register-page">
       <div class="register-container">
         <div class="register-card">
           <div class="register-header">
             <h1>Create Account</h1>
             <p class="subtitle">Join FYP Management System</p>
           </div>
           
           <form @submit.prevent="handleRegister" class="register-form">
             <div class="form-group">
               <label for="fullName">Full Name</label>
               <input
                 id="fullName"
                 v-model="form.fullName"
                 type="text"
                 placeholder="Your Full Name"
                 required
               />
             </div>
             
             <div class="form-group">
               <label for="email">University Email</label>
               <input
                 id="email"
                 v-model="form.email"
                 type="email"
                 placeholder="your.email@university.edu"
                 required
               />
             </div>
             
             <div class="form-group">
               <label for="role">Role</label>
               <select v-model="form.role" required>
                 <option value="">Select Role</option>
                 <option value="Student">Student</option>
                 <option value="Supervisor">Supervisor</option>
               </select>
             </div>
             
             <div class="form-group">
               <label for="password">Password</label>
               <input
                 id="password"
                 v-model="form.password"
                 type="password"
                 placeholder="••••••••"
                 required
               />
             </div>
             
             <div class="form-group">
               <label for="confirmPassword">Confirm Password</label>
               <input
                 id="confirmPassword"
                 v-model="form.confirmPassword"
                 type="password"
                 placeholder="••••••••"
                 required
               />
             </div>
             
             <div v-if="errors.submit" class="error-box">
               {{ errors.submit }}
             </div>
             
             <button type="submit" class="btn-submit" :disabled="loading">
               {{ loading ? 'Creating Account...' : 'Create Account' }}
             </button>
           </form>
           
           <div class="register-footer">
             <p>Already have account?
               <router-link to="/login">Login here</router-link>
             </p>
           </div>
         </div>
       </div>
     </div>
   </template>
   
   <script setup>
   import { reactive, ref } from 'vue';
   import { useRouter } from 'vue-router';
   import registrationService from '../services/registrationService';
   
   const router = useRouter();
   
   const form = reactive({
     fullName: '',
     email: '',
     role: '',
     password: '',
     confirmPassword: '',
   });
   
   const loading = ref(false);
   const errors = reactive({
     submit: null,
   });
   
   const validateForm = () => {
     if (!form.fullName.trim()) return 'Full name is required';
     if (!form.email.includes('@university.edu')) return 'Must use university email';
     if (form.password.length < 8) return 'Password must be at least 8 characters';
     if (form.password !== form.confirmPassword) return 'Passwords do not match';
     return null;
   };
   
   const handleRegister = async () => {
     const error = validateForm();
     if (error) {
       errors.submit = error;
       return;
     }
     
     loading.value = true;
     
     try {
       await registrationService.register({
         fullName: form.fullName,
         email: form.email,
         role: form.role,
         password: form.password,
       });
       
       await router.push({
         name: 'VerifyEmail',
         params: { email: form.email },
       });
     } catch (err) {
       errors.submit = err.response?.data?.error || 'Registration failed';
     } finally {
       loading.value = false;
     }
   };
   </script>
   
   <style scoped>
   /* Similar to Login.vue styling */
   .register-page {
     display: flex;
     justify-content: center;
     align-items: center;
     min-height: 100vh;
     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   }
   
   .register-card {
     background: white;
     padding: 2rem;
     border-radius: 12px;
     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
     width: 100%;
     max-width: 450px;
   }
   
   .register-header {
     margin-bottom: 2rem;
     text-align: center;
   }
   
   .register-header h1 {
     margin: 0;
     color: #333;
   }
   
   /* Use similar form styles as Login */
   select {
     width: 100%;
     padding: 0.75rem;
     border: 2px solid #e0e0e0;
     border-radius: 6px;
     font-size: 1rem;
   }
   </style>
   ```

**Validation Checklist**:
- [ ] Registration form renders all fields
- [ ] Email uniqueness validated (backend)
- [ ] Password confirmation enforced
- [ ] Form validation works
- [ ] Account creation successful
- [ ] Redirects to email verification
- [ ] Tests pass

---

## Subtask T050: Implement Password Reset Flow

**Purpose**: Create password reset and recovery components.

**Files to Create**:
- `src/views/ForgotPassword.vue`
- `src/views/ResetPassword.vue`
- `src/services/passwordResetService.js`

**Steps**:

Create ForgotPassword view requesting email, and ResetPassword view with token validation.

**Validation Checklist**:
- [ ] Forgot password form sends reset request
- [ ] Reset email received
- [ ] Reset link valid
- [ ] New password set successfully
- [ ] User can login with new password

---

## Subtask T051: Implement Session Management & Token Refresh

**Purpose**: Manage JWT token lifecycle and auto-refresh.

**Files to Create**:
- `src/utils/tokenManager.js`
- `src/middleware/tokenRefresh.js`
- `tests/utils/tokenManager.test.js`

**Steps**:

1. Create `src/utils/tokenManager.js`:
   ```javascript
   export const TOKEN_KEY = 'authToken';
   export const REFRESH_TOKEN_KEY = 'refreshToken';
   
   export const getToken = () => {
     return localStorage.getItem(TOKEN_KEY);
   };
   
   export const setToken = (token) => {
     localStorage.setItem(TOKEN_KEY, token);
   };
   
   export const getRefreshToken = () => {
     return localStorage.getItem(REFRESH_TOKEN_KEY);
   };
   
   export const setRefreshToken = (token) => {
     localStorage.setItem(REFRESH_TOKEN_KEY, token);
   };
   
   export const clearTokens = () => {
     localStorage.removeItem(TOKEN_KEY);
     localStorage.removeItem(REFRESH_TOKEN_KEY);
   };
   
   export const isTokenExpired = (token) => {
     if (!token) return true;
     
     const parts = token.split('.');
     if (parts.length !== 3) return true;
     
     try {
       const payload = JSON.parse(atob(parts[1]));
       return payload.exp * 1000 < Date.now();
     } catch {
       return true;
     }
   };
   ```

**Validation Checklist**:
- [ ] Token stored securely in localStorage
- [ ] Auto-refresh before expiry
- [ ] Refresh token rotation working
- [ ] Logout clears tokens
- [ ] Token manager tests pass

---

## Subtask T052: Comprehensive Auth UI Testing & Documentation

**Purpose**: Complete test coverage and auth UI documentation.

**Files to Create**:
- `tests/integration/auth-flow.integration.test.js`
- `docs/auth-ui.md`

**Steps**:

Create end-to-end auth flow tests covering login, registration, password reset, and session management. Document all auth components and flows.

**Validation Checklist**:
- [ ] 80%+ code coverage for auth components
- [ ] E2E tests for complete login flow
- [ ] Registration flow tested
- [ ] Password reset flow tested
- [ ] Session persistence tested
- [ ] Auth UI documentation complete

---

## Definition of Done

- [x] All subtasks T048-T052 completed
- [x] Login component with validation
- [x] Registration component
- [x] Password reset flow
- [x] Session management
- [x] Token refresh working
- [x] 80%+ code coverage
- [x] Auth UI documentation created

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Token expiry during form submission | Medium | Medium | Refresh before expiry, catch 401, retry |
| Password reset link expires | Low | Medium | Long expiry time, email retry option |
| XSS via token theft | Low | Critical | Secure token storage, CSP headers, HTTPS only |

## Reviewer Guidance

- Verify login redirects to correct dashboard
- Check registration prevents duplicate emails
- Confirm password reset email flow
- Validate token refresh works transparently
- Check no sensitive data in localStorage
- Verify HTTPS only for production
- Test error handling and messages
- Ensure 80%+ code coverage

---

**Next Work Package**: WP11 (Topic Discovery UI)  
**Estimated Start**: Can run in parallel with WP10  
**Command**: `spec-kitty implement WP11`

## Activity Log

- 2026-02-07T13:26:59Z – GitHub Copilot – shell_pid=5800 – lane=doing – Started review via workflow command
