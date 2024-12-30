// member.js

import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
    try {
        const shoppingHistoryRef = collection(db, 'users', userId, 'shoppingHistory');
        const shoppingHistorySnapshot = await getDocs(shoppingHistoryRef);

        if (shoppingHistorySnapshot.empty) {
            shoppingHistoryContainer.textContent = "No contents";
            return;
        }

        for (const docSnapshot of shoppingHistorySnapshot.docs) {
            const data = docSnapshot.data();
            if (!data.productId) {
                console.error("No productId ", data);
                continue;
            }

            const productDoc = await getDoc(doc(db, 'products', data.productId));
            const productName = productDoc.exists() ? productDoc.data().name : 'Unknown Product';
            const productId = productDoc.id;
            const historyItem = document.createElement('div');
            const purchaseDate = new Date(data.purchaseDate).toLocaleDateString();

            historyItem.innerHTML = `<a href="/aonix/pages/product_review.html?id=${productId}">${productName}</a> - ${purchaseDate}`;
            shoppingHistoryContainer.appendChild(historyItem);
        }
    } catch (error) {
        console.error("Loading Error", error);
    }
}

// Load review history
async function loadReviewHistory(userId) {
    const reviewsRef = collection(db, 'users', userId, 'reviews');
    const reviewsSnapshot = await getDocs(reviewsRef);
    reviewsSnapshot.forEach(async reviewDoc => {
        const reviewItem = document.createElement('div');
        const reviewDate = new Date(reviewDoc.data().reviewDate).toLocaleDateString();
        const productDoc = await getDoc(doc(db, 'products', reviewDoc.data().productId));
        const productName = productDoc.exists() ? productDoc.data().name : 'Unknown Product';
        reviewItem.innerHTML = `
            <div>${reviewDoc.data().reviewText}</div>
            <div>${productName} - ${reviewDate}</div>
        `;
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