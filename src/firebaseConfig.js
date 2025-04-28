// services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCqFDJ660tVMb9dpsNtjoi5xzoSLz-zMRI",
    authDomain: "cocoflow-662fe.firebaseapp.com",
    projectId: "cocoflow-662fe",
    storageBucket: "cocoflow-662fe.firebasestorage.app",
    messagingSenderId: "527003685668",
    appId: "1:527003685668:web:f8c54a244707c710fbd9b1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);