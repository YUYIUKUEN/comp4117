<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <div class="forgot-password-header">
          <h1>Reset Password</h1>
          <p class="subtitle">Enter your email to receive reset instructions</p>
        </div>

        <form v-if="!submitted" @submit.prevent="handleRequestReset" class="forgot-password-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="student@university.edu"
              required
              :disabled="loading"
              @blur="validateEmail"
            />
            <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
          </div>

          <div v-if="errors.submit" class="error-box">
            <span class="error-icon">⚠</span>
            <span>{{ errors.submit }}</span>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>

        <div v-else class="success-message">
          <div class="success-icon">✓</div>
          <h2>Check Your Email</h2>
          <p>We've sent a password reset link to <strong>{{ email }}</strong></p>
          <p class="instructions">Click the link in the email to reset your password. The link expires in 1 hour.</p>
          <button @click="resetForm" class="btn-secondary">
            Try Another Email
          </button>
        </div>

        <div class="forgot-password-footer">
          <p>Remember your password?
            <router-link to="/login">Login here</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import passwordResetService from '@/services/passwordResetService';

const email = ref('');
const loading = ref(false);
const submitted = ref(false);
const errors = reactive({
  email: '',
  submit: '',
});

const validateEmail = () => {
  if (!email.value) {
    errors.email = 'Email is required';
  } else if (!email.value.includes('@')) {
    errors.email = 'Please enter a valid email';
  } else {
    errors.email = '';
  }
};

const handleRequestReset = async () => {
  errors.submit = '';
  errors.email = '';

  if (!email.value.trim()) {
    errors.submit = 'Please enter your email address';
    return;
  }

  if (!email.value.includes('@')) {
    errors.submit = 'Please enter a valid email address';
    return;
  }

  loading.value = true;

  try {
    await passwordResetService.requestReset(email.value);
    submitted.value = true;
  } catch (err: any) {
    errors.submit =
      err.response?.data?.error || 'Failed to send reset link. Please try again.';
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  email.value = '';
  submitted.value = false;
};
</script>

<style scoped>
.forgot-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
}

.forgot-password-container {
  width: 100%;
}

.forgot-password-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.forgot-password-header {
  margin-bottom: 2rem;
  text-align: center;
}

.forgot-password-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

.forgot-password-form {
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

.form-group input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
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

.success-message {
  text-align: center;
  padding: 2rem 0;
}

.success-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  background-color: #e8f5e9;
  border-radius: 50%;
  color: #4caf50;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.success-message h2 {
  margin: 1rem 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.success-message p {
  margin: 0.5rem 0;
  color: #666;
  line-height: 1.6;
}

.instructions {
  font-size: 0.9rem;
  color: #999;
  margin-top: 1rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.forgot-password-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}

.forgot-password-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.forgot-password-footer a:hover {
  text-decoration: underline;
}
</style>
