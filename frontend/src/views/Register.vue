<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>Create Account</h1>
          <p class="subtitle">Join the FYP Management System</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="fullname">Full Name</label>
            <input
              id="fullname"
              v-model="form.fullName"
              type="text"
              placeholder="John Doe"
              required
              :disabled="loading"
            />
            <span v-if="errors.fullName" class="error-text">{{ errors.fullName }}</span>
          </div>

          <div class="form-group">
            <label for="email">University Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="student@university.edu"
              required
              :disabled="loading"
              @blur="validateEmail"
            />
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select id="role" v-model="form.role" :disabled="loading">
              <option value="">Select your role</option>
              <option value="Student">Student</option>
              <option value="Supervisor">Supervisor</option>
            </select>
            <span v-if="errors.role" class="error-text">{{ errors.role }}</span>
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

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
            <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
          </div>

          <div v-if="errors.submit" class="error-box">
            <span class="error-icon">⚠</span>
            <span>{{ errors.submit }}</span>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Creating...' : 'Create Account' }}
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

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import registrationService from '@/services/registrationService';

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
  fullName: '',
  email: '',
  role: '',
  password: '',
  confirmPassword: '',
  submit: '',
});

const validateEmail = () => {
  if (!form.email) {
    errors.email = 'Email is required';
  } else if (!form.email.includes('@')) {
    errors.email = 'Please enter a valid email';
  } else {
    errors.email = '';
  }
};

const handleRegister = async () => {
  errors.submit = '';

  // Validate form
  if (!form.fullName.trim()) {
    errors.submit = 'Full name is required';
    return;
  }
  if (!form.email.includes('@')) {
    errors.submit = 'Valid email is required';
    return;
  }
  if (form.password.length < 8) {
    errors.submit = 'Password must be at least 8 characters';
    return;
  }
  if (form.password !== form.confirmPassword) {
    errors.submit = 'Passwords do not match';
    return;
  }
  if (!form.role) {
    errors.submit = 'Please select a role';
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

    await router.push('/verify-email');
  } catch (err: any) {
    errors.submit =
      err.response?.data?.error || 'Registration failed. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
}

.register-container {
  width: 100%;
}

.register-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.register-header {
  margin-bottom: 2rem;
  text-align: center;
}

.register-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-text {
  color: #d32f2f;
  font-size: 0.85rem;
}

.error-box {
  background-color: #ffebee;
  border-left: 4px solid #d32f2f;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #d32f2f;
}

.error-icon {
  font-weight: bold;
  font-size: 1.2rem;
}

.btn-submit {
  padding: 0.85rem;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-submit:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.register-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}

.register-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.register-footer a:hover {
  text-decoration: underline;
}
</style>
