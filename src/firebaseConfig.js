// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCqFDJ660tVMb9dpsNtjoi5xzoSLz-zMRI",
  authDomain: "cocoflow-662fe.firebaseapp.com",
  projectId: "cocoflow-662fe",
  storageBucket: "cocoflow-662fe.appspot.com",
  messagingSenderId: "527003685668",
  appId: "1:527003685668:web:f8c54a244707c710fbd9b1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Set persistence to none by default
setPersistence(auth, browserLocalPersistence);

export { auth, db, googleProvider };