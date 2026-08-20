// Firebase web app config
const firebaseConfig = {
    apiKey: "AIzaSyDCevzjzI0XbxjUVY05_Bv3AxKba-5PvqA",
    authDomain: "family-todos-f8a24.firebaseapp.com",
    projectId: "family-todos-f8a24",
    storageBucket: "family-todos-f8a24.firebasestorage.app",
    messagingSenderId: "1060482889850",
    appId: "1:1060482889850:web:297938be60ea486f6263c3"
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
