// Replace the values below with your Firebase web app config from:
// Firebase Console → Project settings → Your apps → Web app
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services used by the app
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for Firestore
db.enablePersistence({ synchronizeTabs: true })
    .catch((error) => {
        if (error.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence enabled in one tab only.');
        } else if (error.code === 'unimplemented') {
            console.warn('Browser does not support offline persistence.');
        } else {
            console.error('Firestore persistence error:', error);
        }
    });
