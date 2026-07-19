// EasyTipMe — shared Firebase initialization (client-side, public config)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBsY_pCxvbbJUtvRb7ClwgWQ25hGzNTgBM",
  authDomain: "easy-tip-me.firebaseapp.com",
  projectId: "easy-tip-me",
  storageBucket: "easy-tip-me.firebasestorage.app",
  messagingSenderId: "189382420404",
  appId: "1:189382420404:web:2f6075c986c81484eab4e1",
  measurementId: "G-GDY85BQ4FX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
