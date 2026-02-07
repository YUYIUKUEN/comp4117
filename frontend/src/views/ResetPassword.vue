<template>
  <div class="reset-password-page">
    <div class="reset-password-container">
      <div class="reset-password-card">
        <div class="reset-password-header">
          <h1>Set New Password</h1>
          <p class="subtitle">Enter your new password below</p>
        </div>

        <form v-if="!submitted" @submit.prevent="handleResetPassword" class="reset-password-form">
          <div class="form-group">
            <label for="password">New Password</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
              :disabled="loading || validating"
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
              :disabled="loading || validating"
            />
            <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
          </div>

          <div v-if="errors.submit" class="error-box">
            <span class="error-icon">⚠</span>
            <span>{{ errors.submit }}</span>
          </div>

          <button type="submit" class="btn-submit" :disabled="loading || validating">
            <span v-if="loading || validating" class="spinner"></span>
            {{ loading ? 'Resetting...' : validating ? 'Validating...' : 'Reset Password' }}
          </button>
        </form>

        <div v-else class="success-message">
          <div class="success-icon">✓</div>
          <h2>Password Reset Successful</h2>
          <p>Your password has been reset successfully. You can now login with your new password.</p>
          <router-link to="/login" class="btn-success">
            Go to Login
          </router-link>
        </div>

        <div class="reset-password-footer">
          <p>Remember your password?
            <router-link to="/login">Login here</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import passwordResetService from '@/services/passwordResetService';

const route = useRoute();
const router = useRouter();

const form = reactive({
  password: '',
  confirmPassword: '',
});

const loading = ref(false);
const validating = ref(true);
const submitted = ref(false);
const errors = reactive({
  password: '',
  confirmPassword: '',
  submit: '',
});

const token = route.params.token as string;

onMounted(async () => {
  // Validate the reset token
  if (!token) {
    errors.submit = 'Invalid reset link. Please request a new one.';
    validating.value = false;
    return;
  }

  try {
    await passwordResetService.validateResetToken(token);
    validating.value = false;
  } catch (err: any) {
    errors.submit =
      err.response?.data?.error || 'Reset link is invalid or expired. Please request a new one.';
    validating.value = false;
  }
};

const handleResetPassword = async () => {
  errors.submit = '';
  errors.password = '';
  errors.confirmPassword = '';

  // Validate
  if (!form.password) {
    errors.submit = 'Please enter a new password';
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

  loading.value = true;

  try {
    await passwordResetService.resetPassword(token, form.password);
    submitted.value = true;

    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (err: any) {
    errors.submit = err.response?.data?.error || 'Failed to reset password. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
}

.reset-password-container {
  width: 100%;
}

.reset-password-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.reset-password-header {
  margin-bottom: 2rem;
  text-align: center;
}

.reset-password-header h1 {
  margin: 0;
  font-size: 2rem;
  color: #333;
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

.reset-password-form {
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

.btn-success {
  display: inline-block;
  padding: 0.75rem 2rem;
  background-color: #4caf50;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin-top: 1.5rem;
  transition: background-color 0.3s;
}

.btn-success:hover {
  background-color: #45a049;
}

.reset-password-footer {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}

.reset-password-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.reset-password-footer a:hover {
  text-decoration: underline;
}
</style>
