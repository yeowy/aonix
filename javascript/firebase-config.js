// Import Firebase functions
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyBFV13kCeawtN5z1Sm2FvSfsipkKpxajUY",
    authDomain: "aonix-a3806.firebaseapp.com",
    databaseURL: "https://aonix-a3806-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "aonix-a3806",
    storageBucket: "aonix-a3806.firebasestorage.app",
    messagingSenderId: "982397435402",
    appId: "1:982397435402:web:3489555089a48fa8db69f3",
    measurementId: "G-NRPQSDLD4R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configure Google Sign-In Provider
const googleProvider = new GoogleAuthProvider();
// Optional: Specify additional scopes
googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');
// Optional: Customize the default Google Sign-In options
googleProvider.setCustomParameters({
  'login_hint': 'user@example.com'
});

// Export Firebase services
export { auth, db, googleProvider };
