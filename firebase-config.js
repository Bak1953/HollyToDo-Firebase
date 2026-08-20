// Replace the values below with your Firebase web app config from:
// Firebase Console → Project settings → Your apps → Web app
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authenticate the user anonymously
signInAnonymously(auth)
  .then((userCredential) => {
    const user = userCredential.user;
    console.log("Successfully signed in anonymously! UID:", user.uid);
    // You can now read and write to Firestore using 'db'
  })
  .catch((error) => {
    console.error("Error signing in anonymously:", error.code, error.message);
  });