<template>
  <div class="verify-page">
    <div class="verify-container">
      <div class="verify-card">
        <div class="verify-header">
          <div class="success-icon">✓</div>
          <h1>Account Created Successfully!</h1>
          <p class="subtitle">Your account has been created. You can now log in.</p>
        </div>

        <div class="verify-content">
          <p>Welcome to the FYP Management System!</p>
          <p>Your account is ready to use. Please proceed to the login page to access your account.</p>
        </div>

        <button @click="goToLogin" class="btn-login">
          Go to Login
        </button>

        <div class="verify-footer">
          <p>Already verified?
            <router-link to="/login">Login here</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goToLogin = () => {
  router.push('/login');
};
</script>

<style scoped>
.verify-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
}

.verify-container {
  width: 100%;
}

.verify-card {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.verify-header {
  margin-bottom: 2rem;
  text-align: center;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: #4caf50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1rem;
}

.verify-header h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 0.95rem;
}

.verify-content {
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
}

.verify-content p {
  margin: 0.5rem 0;
  color: #555;
  line-height: 1.6;
}

.btn-login {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.btn-login:hover {
  opacity: 0.9;
}

.verify-footer {
  margin-top: 1.5rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.verify-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.verify-footer a:hover {
  text-decoration: underline;
}
</style>
