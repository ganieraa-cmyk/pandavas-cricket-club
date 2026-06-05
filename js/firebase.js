// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpbLOPJIcev-dkfi1V-beOt0L0BJ8NuKA",
  authDomain: "pandavas-cricket-club.firebaseapp.com",
  projectId: "pandavas-cricket-club",
  storageBucket: "pandavas-cricket-club.firebasestorage.app",
  messagingSenderId: "395347601154",
  appId: "1:395347601154:web:74866933b281febfbe441b",
  measurementId: "G-9DLV665VF0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
