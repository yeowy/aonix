// app.js
import { auth, db, googleProvider } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    getDoc,
    updateDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userDashboard = document.getElementById('user-dashboard');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const loginError = document.getElementById('login-error');

const registerEmail = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const confirmPassword = document.getElementById('confirm-password');
const registerButton = document.getElementById('register-button');
const registerError = document.getElementById('register-error');

const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const userEmailDisplay = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const addEntryButton = document.getElementById('add-entry-button');
const userEntriesContainer = document.getElementById('user-entries');
const googleSignInButton = document.getElementById('google-signin');
const divider = document.getElementById('divider');
// Form Toggle Functions

showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    googleSignInButton.style.display = 'none';  
    divider.style.display = 'none';
});


showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
    googleSignInButton.style.display = 'block';  
    divider.style.display = 'block';
});


// Authentication Functions
async function registerUser(email, password) {
    try {
        if (password !== confirmPassword.value) {
            throw new Error("Passwords do not match");
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        registerError.textContent = error.message;
        throw error;
    }
}

async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        loginError.textContent = error.message;
        throw error;
    }
}

// Google Sign-In Functions
async function handleGoogleSignIn() {
    try {
        // Choose between popup or redirect based on device/preference
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // On mobile, use redirect for better UX
            await signInWithRedirect(auth, googleProvider);
        } else {
            // On desktop, use popup
            const result = await signInWithPopup(auth, googleProvider);

            // Handle the result directly
            await processGoogleSignInResult(result);
        }
    } catch (error) {
        handleSignInError(error);
    }
}

// Process Google Sign-In Result
async function processGoogleSignInResult(result) {
    // This gives you a Google Access Token
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    // The signed-in user info
    const user = result.user;

    // Create or update user profile in Firestore
    await createUserProfile(user);

    // Switch to user dashboard
    switchToUserDashboard(user);
}

// Handle Redirect Sign-In (for mobile or if popup fails)
async function handleGoogleRedirectSignIn() {
    try {
        const result = await getRedirectResult(auth);
        if (result) {
            await processGoogleSignInResult(result);
        }
    } catch (error) {
        handleSignInError(error);
    }
}

// Create or Update User Profile in Firestore
async function createUserProfile(user) {
    try {
        const userRef = doc(db, 'users', user.uid);

        // Check if user profile already exists
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
            // Create new user profile
            await setDoc(userRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                providerId: user.providerId,
                createdAt: new Date(),
                lastLogin: new Date()
            });
        } else {
            // Update last login time
            await updateDoc(userRef, {
                lastLogin: new Date()
            });
        }
    } catch (error) {
        console.error("Error creating/updating user profile:", error);
    }
}

// Error Handling for Sign-In
function handleSignInError(error) {
    // Specific error handling
    const errorCode = error.code;
    const errorMessage = error.message;

    // Different handling based on error type
    switch (errorCode) {
        case 'auth/account-exists-with-different-credential':
            console.error('User already exists with a different credential');
            break;
        case 'auth/popup-blocked':
            console.error('Popup blocked. Try using redirect method.');
            break;
        case 'auth/popup-closed-by-user':
            console.error('Sign-in popup closed by user');
            break;
        default:
            console.error('Sign-in error:', errorMessage);
    }

    // Update UI to show error
    const loginError = document.getElementById('login-error');
    if (loginError) {
        loginError.textContent = `Sign-in failed: ${errorMessage}`;
    }
}

// Register Button Handler
registerButton.addEventListener('click', async () => {
    try {
        const user = await registerUser(registerEmail.value, registerPassword.value);
        switchToUserDashboard(user);
    } catch (error) {
        console.error("Registration error:", error);
    }
});

// Login Button Handler
loginButton.addEventListener('click', async () => {
    try {
        const user = await loginUser(loginEmail.value, loginPassword.value);
        switchToUserDashboard(user);
    } catch (error) {
        console.error("Login error:", error);
    }
});

// Logout Button Handler
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        switchToLoginForm();
    } catch (error) {
        console.error("Logout error:", error);
    }
});

// Add Entry Button Handler
addEntryButton.addEventListener('click', async () => {
    try {
        const entryText = prompt("Enter your new entry:");
        if (entryText) {
            await addUserEntry(entryText);
            await loadUserEntries();
        }
    } catch (error) {
        console.error("Add entry error:", error);
    }
});

// Switch to User Dashboard
function switchToUserDashboard(user) {
    loginForm.classList.add('hidden');
    registerForm.classList.add('hidden');
    userDashboard.classList.remove('hidden');
    userEmailDisplay.textContent = user.email;
    loadUserEntries();
}

// Switch to Login Form
function switchToLoginForm() {
    userDashboard.classList.add('hidden');
    loginForm.classList.remove('hidden');
    userEmailDisplay.textContent = '';
    userEntriesContainer.innerHTML = '';
}

// Add User Entry to Firestore
async function addUserEntry(entryText) {
    try {
        const user = auth.currentUser;
        await addDoc(collection(db, 'user_entries'), {
            userId: user.uid,
            text: entryText,
            createdAt: new Date()
        });
    } catch (error) {
        console.error("Error adding entry:", error);
    }
}

// Load User Entries
async function loadUserEntries() {
    try {
        const user = auth.currentUser;
        userEntriesContainer.innerHTML = ''; // Clear previous entries

        const q = query(collection(db, 'user_entries'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('entry');
            entryDiv.textContent = doc.data().text;
            userEntriesContainer.appendChild(entryDiv);
        });
    } catch (error) {
        console.error("Error loading entries:", error);
    }
}

// Authentication State Listener
auth.onAuthStateChanged((user) => {
    if (user) {
        switchToUserDashboard(user);
    } else {
        switchToLoginForm();
    }
});

// Add event listener for Google Sign-In
googleSignInButton.addEventListener('click', handleGoogleSignIn);

// Check for redirect result on page load
document.addEventListener('DOMContentLoaded', () => {
    handleGoogleRedirectSignIn();
});

