<template>
  <div class="login-container">
    <div class="login-box">
      <h1>Welcome to Our Service</h1>
      <p>Please sign in to continue</p>
    
      <!-- Google Sign-In Button -->
      <button @click="signInWithGoogle" class="google-button">
        Sign In with Google
      </button>
    
      <!-- Separator -->
      <div class="or-separator">OR</div>
    
      <!-- Email & Password Sign-In/Sign-Up Form -->
      <form @submit.prevent="submitForm" class="login-form">
        <input type="email" v-model="email" placeholder="Email" class="input-field" required>
        <input type="password" v-model="password" placeholder="Password" class="input-field" required>
        <button type="submit" class="submit-button">Sign In</button>
        <button type="button" @click="signUp" class="submit-button">Sign Up</button>
      </form>
    
      <p class="terms-text">
        By signing in, you agree to our
        <a href="#">Terms of Service</a>
      </p>
    </div>
  </div>
</template>

<script>
import { signInWithGoogle } from '../services/auth';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default {
  data() {
    return {
      email: '',
      password: ''
    };
  },
  methods: {
    signInWithGoogle() {
      signInWithGoogle()
        .then((result) => {
          this.$router.push('/dashboard');
        })
        .catch((error) => {
          console.error('Error signing in with Google', error);
          this.handleError(error);
        });
    },
    submitForm() {
      this.signInWithEmailAndPassword(this.email, this.password);
    },
    signUp() {
      this.createUserWithEmailAndPassword(this.email, this.password);
    },
    signInWithEmailAndPassword(email, password) {
      const auth = getAuth();
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          var user = userCredential.user;
          this.$router.push('/dashboard');
        })
        .catch((error) => {
          console.error('Error signing in with email and password', error);
          this.handleError(error);
        });
    },
    createUserWithEmailAndPassword(email, password) {
      const auth = getAuth();
      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          var user = userCredential.user;
          this.$router.push('/dashboard');
        })
        .catch((error) => {
          console.error('Error creating user', error);
          this.handleError(error);
        });
    },
    handleError(error) {
      const errorCode = error.code;
      const errorMessage = error.message || 'An unknown error occurred.';

      if (errorCode === 'auth/invalid-email') {
        alert('Please enter a valid email address.');
      } else if (errorCode === 'auth/user-disabled') {
        alert('User account is disabled.');
      } else if (errorCode === 'auth/user-not-found') {
        alert('User not found.');
      } else if (errorCode === 'auth/wrong-password') {
        alert('Incorrect password.');
      } else {
        alert(errorMessage || 'Could not sign in.');
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to right, #0f4c81, #203a43);
  color: white;
  text-align: center;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  width: 360px; /* Increased width */
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-box h1 {
  font-size: 1.5em;
  margin-bottom: 10px;
  color: #333;
  text-align: center;
  width: 100%;
}

.login-box p {
  font-size: 0.8em;
  margin-bottom: 15px;
  color: #666;
  text-align: center;
  width: 100%;
}

.google-button {
  background: #4285F4;
  color: white;
  border: none;
  padding: 10px 0;
  border-radius: 6px;
  font-size: 0.9em;
  cursor: pointer;
  width: 100%;
  margin-bottom: 15px;
  transition: background-color 0.3s;
}

.google-button:hover {
  background: #357ae8;
}

.or-separator {
  border-top: 1px solid #ccc;
  margin: 15px 0;
  position: relative;
  width: 100%;
}

.or-separator::after {
  content: "OR";
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 0 10px;
  color: #666;
  font-size: 0.8em;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-field {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ced4da;
  border-radius: 5px;
  font-size: 0.9em;
}

.submit-button {
  background-color: #20c997;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  width: 100%;
  font-size: 0.9em;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 10px;
}

.submit-button:hover {
  background-color: #17a589;
}

.terms-text {
  font-size: 0.7em;
  color: #555;
  margin-top: 15px;
  text-align: center;
  width: 100%;
}

.terms-text a {
  color: #4285F4;
  text-decoration: none;
}

.terms-text a:hover {
  text-decoration: underline;
}
</style>