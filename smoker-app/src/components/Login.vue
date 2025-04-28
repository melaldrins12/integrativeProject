<template>
    <div class="login-container" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height:100vh; background: linear-gradient(to right, #0f4c81, #203a43); color: white;">
      <div class="login-box" style="background: rgba(255, 255, 255, 0.85); padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); width: 300px;">
        <h1 style="text-align: center; font-size: 1.8em; margin-bottom: 15px; color: #333;">Welcome to Our Service</h1>
        <p style="text-align: center; font-size: 0.9em; margin-bottom: 20px; color: #555;">Please sign in to continue</p>
        
        <!-- Google Sign-In Button -->
        <button @click="signInWithGoogle" style="background: #4285F4; color: white; border: none; padding: 10px 20px; border-radius: 5px; font-size: 0.9em; cursor: pointer; width: 100%; margin-bottom: 10px;">
          Sign In with Google
        </button>
        
        <!-- Separator -->
        <div class="or-separator" style="text-align: center; margin: 10px 0;">OR</div>
        
        <!-- Email & Password Sign-In/Sign-Up Form -->
        <form @submit.prevent="submitForm" style="width: 100%;">
          <input type="email" v-model="email" placeholder="Email" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ced4da; border-radius: 5px;">
          <input type="password" v-model="password" placeholder="Password" style="width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ced4da; border-radius: 5px;">
          <button type="submit" style="background-color: #20c997; color: white; border: none; padding: 10px; border-radius: 5px; width: 100%;">Sign Up/Sign In</button>
        </form>
        
        <p style="text-align: center; font-size: 0.8em; color: #555;">By signing in, you agree to our <a href="#" style="color: #4285F4; text-decoration: none;">Terms of Service</a></p>
      </div>
    </div>
  </template>
  
  <script>
  import { signInWithGoogle } from '../services/auth';
  import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
  
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
          .catch((error => {
            console.error('Error signing in with Google', error);
          }));
      },
      submitForm() {
        const auth = getAuth();
        createUserWithEmailAndPassword(auth, this.email, this.password)
          .then((userCredential) => {
            // Signed in 
            var user = userCredential.user;
            this.$router.push('/dashboard');
          })
          .catch((error) => {
            console.error('Error creating user', error);
            alert(error.message || 'An error occurred while signing up.');
          });
      }
    }
  };
  </script>
  
  <style scoped>
  .login-container {
    text-align: center;
  }
  
  .login-box {
    max-width: 300px;
    width: 100%;
    margin: auto;
  }
  
  .or-separator {
    border-top: 1px solid #ccc;
    padding-top: 10px;
    margin-top: 20px;
  }
  
  button {
    margin-top: 10px;
  }
  
  a {
    color: #4285F4;
    text-decoration: none;
  }
  </style>