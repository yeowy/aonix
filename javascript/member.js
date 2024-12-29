// member.js

import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const userEmailDisplay = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const shoppingHistoryContainer = document.getElementById('shopping-history');
const reviewsContainer = document.getElementById('reviews');

// Load user account information
function loadUserAccountInfo(user) {
    userEmailDisplay.textContent = user.email;
}

// Logout functionality
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '/aonix/pages/login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Load shopping history
async function loadShoppingHistory(userId) {
    const shoppingHistoryRef = collection(db, 'users', userId, 'shoppingHistory');
    const shoppingHistorySnapshot = await getDocs(shoppingHistoryRef);
    shoppingHistorySnapshot.forEach(doc => {
        const historyItem = document.createElement('div');
        historyItem.textContent = `${doc.data().itemName} - ${doc.data().purchaseDate}`;
        shoppingHistoryContainer.appendChild(historyItem);
    });
}

// Load review history
async function loadReviewHistory(userId) {
    const reviewsRef = collection(db, 'users', userId, 'reviews');
    const reviewsSnapshot = await getDocs(reviewsRef);
    reviewsSnapshot.forEach(doc => {
        const reviewItem = document.createElement('div');
        reviewItem.textContent = `${doc.data().reviewText} - ${doc.data().reviewDate}`;
        reviewsContainer.appendChild(reviewItem);
    });
}

// Check user authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserAccountInfo(user);
        loadShoppingHistory(user.uid);
        loadReviewHistory(user.uid);
    } else {
        window.location.href = '/aonix/pages/login.html';
    }
});