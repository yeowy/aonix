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

        const orders = {};

        for (const docSnapshot of shoppingHistorySnapshot.docs) {
            const data = docSnapshot.data();
            if (!data.productId) {
                console.error("No productId ", data);
                continue;
            }

            const orderTime = new Date(data.purchaseDate).toISOString().slice(0, 19); // 秒単位で切り捨て
            if (!orders[orderTime]) {
                orders[orderTime] = [];
            }

            const productDoc = await getDoc(doc(db, 'products', data.productId));
            const productName = productDoc.exists() ? productDoc.data().name : 'Unknown Product';
            const productId = productDoc.id;
            const productImages = productDoc.exists() ? productDoc.data().images : [];

            orders[orderTime].push({ productName, productId, purchaseDate: data.purchaseDate, productImages });
        }

        const sortedOrderTimes = Object.keys(orders).sort((a, b) => new Date(b) - new Date(a));

        for (const orderTime of sortedOrderTimes) {
            const items = orders[orderTime];
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('order');

            const orderHeader = document.createElement('div');
            orderHeader.classList.add('order-header');
            orderHeader.textContent = `Order Date: ${new Date(orderTime).toLocaleString()}`;
            orderDiv.appendChild(orderHeader);

            const orderItemsDiv = document.createElement('div');
            orderItemsDiv.classList.add('order-items');

            items.forEach(item => {
                const historyItem = document.createElement('div');
                const productImage = item.productImages.length > 0 ? item.productImages[0] : '';
                historyItem.innerHTML = `<a href="/aonix/pages/product_review.html?id=${item.productId}">${item.productName}</a>
                    <a href="/aonix/pages/product_review.html?id=${item.productId}">
                        <img src="${productImage}" alt="${item.productName}" style="width: 70px; float: right;">
                    </a>`;
                orderItemsDiv.appendChild(historyItem);
            });

            orderDiv.appendChild(orderItemsDiv);
            shoppingHistoryContainer.appendChild(orderDiv);
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