// member.js

import { auth, db } from './firebase-config.js';
import { signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentArea = document.querySelector('.preferences-content');

    // 加載訂單歷史
    async function loadShoppingHistory(userId) {
        try {
            const shoppingHistoryRef = collection(db, 'users', userId, 'shoppingHistory');
            const shoppingHistorySnapshot = await getDocs(shoppingHistoryRef);
            const shoppingHistoryContainer = document.getElementById('shopping-history');

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

                const orderTime = new Date(data.purchaseDate).toISOString().slice(0, 19);
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
            shoppingHistoryContainer.innerHTML = '';

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
                    historyItem.innerHTML = `
                        <a href="/aonix/pages/product_review.html?id=${item.productId}">${item.productName}</a>
                        <a href="/aonix/pages/product_review.html?id=${item.productId}">
                            <img src="${productImage}" alt="${item.productName}">
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

    // 加載評論歷史
    async function loadReviewHistory(userId) {
        try {
            const reviewsRef = collection(db, 'users', userId, 'reviews');
            const reviewsSnapshot = await getDocs(reviewsRef);
            const reviewsContainer = document.getElementById('reviews');

            if (reviewsSnapshot.empty) {
                reviewsContainer.textContent = "No reviews yet";
                return;
            }

            reviewsContainer.innerHTML = '';
            const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort reviews by date in descending order
            reviews.sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));

            for (const review of reviews) {
                const reviewItem = document.createElement('div');
                reviewItem.classList.add('review-item');
                
                const reviewDate = new Date(review.reviewDate).toLocaleString();
                const productDoc = await getDoc(doc(db, 'products', review.productId));
                const productName = productDoc.exists() ? productDoc.data().name : 'Unknown Product';
                
                // Create star rating elements
                const stars = Array(5).fill('').map((_, i) => `
                    <iconify-icon 
                        icon="${i < review.rating ? 'mdi:star' : 'mdi:star-outline'}"
                        width="20" 
                        height="20"
                        style="color: gold;"
                    ></iconify-icon>
                `).join('');

                reviewItem.innerHTML = `
                    <div class="review-rating">${stars}</div>
                    <div>${productName} - ${reviewDate}</div>
                    <div>${review.reviewText}</div>
                `;
                reviewsContainer.appendChild(reviewItem);
            }
        } catch (error) {
            console.error("Error loading reviews:", error);
        }
    }

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const content = item.querySelector('span').textContent;
            switch(content) {
                case 'Profile':
                    showProfile();
                    break;
                case 'Orders':
                    showOrders();
                    break;
                case 'Reviews':
                    showReviews();
                    break;
                case 'My Profile':
                    showMyProfile();
                    break;
            }
        });
    });

    function showProfile() {
        contentArea.innerHTML = `
            <h2>Profile</h2>
            <div class="profile-info">
                <img id="user-photo" alt="User Photo">
                <p>Email: <span id="user-email"></span></p>
            </div>
        `;
        // Attach logout function to the button
        document.getElementById('logout-button').addEventListener('click', logout);

        // Fetch and display user email and photo
        onAuthStateChanged(auth, user => {
            if (user) {
                document.getElementById('user-email').textContent = user.email;
                document.getElementById('user-photo').src = user.photoURL || 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0e/65/af/dd/photo4jpg.jpg?w=1200&h=-1&s=1';
            }
        });
    }

    async function logout() {
        try {
            await signOut(auth);
            window.location.href = "/aonix/pages/login.html";
        } catch (error) {
            console.error("Error logging out:", error);
        }
    }

    function showOrders() {
        contentArea.innerHTML = `
            <h2>Orders</h2>
            <div id="shopping-history" class="shopping-history-container"></div>
        `;
        if (auth.currentUser) {
            loadShoppingHistory(auth.currentUser.uid);
        }
    }

    function showReviews() {
        contentArea.innerHTML = `
            <h2>Reviews</h2>
            <div id="reviews" class="reviews-container"></div>
        `;
        if (auth.currentUser) {
            loadReviewHistory(auth.currentUser.uid);
        }
    }

    function showMyProfile() {
        contentArea.innerHTML = `
            <h2>My Profile</h2>
            <div class="my-profile-info">
                <!-- Add profile content here -->
            </div>
        `;
    }

    // 預設顯示 Profile 頁面
    menuItems[0].click();
});