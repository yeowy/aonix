// member.js

import { auth, db } from "./firebase-config.js";
import { signOut, onAuthStateChanged, updateEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, getDocs, doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const menuItems = document.querySelectorAll(".menu-item");
    const contentArea = document.querySelector(".preferences-content");

    // 加載訂單歷史
    async function loadShoppingHistory(userId) {
        try {
            const purchasesRef = collection(db, "users", userId, "purchases");
            const purchasesSnapshot = await getDocs(purchasesRef);
            const shoppingHistoryContainer = document.getElementById("shopping-history");

            if (purchasesSnapshot.empty) {
                shoppingHistoryContainer.textContent = "No contents";
                return;
            }

            const orders = [];

            for (const docSnapshot of purchasesSnapshot.docs) {
                const data = docSnapshot.data();
                const orderDate = new Date(data.orderDate).toLocaleString();
                const productsRef = collection(docSnapshot.ref, "products");
                const productsSnapshot = await getDocs(productsRef);

                const items = await Promise.all(productsSnapshot.docs.map(async productDoc => {
                    const productData = productDoc.data();
                    const productDocRef = doc(db, "products", productData.productId);
                    const productDocSnapshot = await getDoc(productDocRef);
                    const productImages = productDocSnapshot.exists() ? productDocSnapshot.data().images : [];
                    return { ...productData, images: productImages };
                }));
                orders.push({ orderDate, items });
            }

            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            shoppingHistoryContainer.innerHTML = "";

            for (const order of orders) {
                const orderDiv = document.createElement("div");
                orderDiv.classList.add("order");

                const orderHeader = document.createElement("div");
                orderHeader.classList.add("order-header");
                orderHeader.textContent = `Order Date: ${order.orderDate}`;
                orderDiv.appendChild(orderHeader);

                const orderItemsDiv = document.createElement("div");
                orderItemsDiv.classList.add("order-items");

                order.items.forEach(item => {
                    const historyItem = document.createElement("div");
                    historyItem.innerHTML = `
                        <a href="/aonix/pages/product_review.html?id=${item.productId}">${item.itemName}</a>
                        <a href="/aonix/pages/product_review.html?id=${item.productId}">
                            <img src="${item.images[0]}" alt="${item.itemName}">
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
            const reviewsRef = collection(db, "users", userId, "reviews");
            const reviewsSnapshot = await getDocs(reviewsRef);
            const reviewsContainer = document.getElementById("reviews");

            if (reviewsSnapshot.empty) {
                reviewsContainer.textContent = "No reviews yet";
                return;
            }

            reviewsContainer.innerHTML = "";
            const reviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort reviews by date in descending order
            reviews.sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));

            for (const review of reviews) {
                const reviewItem = document.createElement("div");
                reviewItem.classList.add("review-item");

                const reviewDate = new Date(review.reviewDate).toLocaleString();
                const productDoc = await getDoc(doc(db, "products", review.productId));
                const productName = productDoc.exists() ? productDoc.data().name : "Unknown Product";

                // Create star rating elements
                const stars = Array(5)
                    .fill("")
                    .map(
                        (_, i) => `
                    <iconify-icon 
                        icon="${i < review.rating ? "mdi:star" : "mdi:star-outline"}"
                        width="20" 
                        height="20"
                        style="color: gold;"
                    ></iconify-icon>
                `
                    )
                    .join("");

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
        item.addEventListener("click", () => {
            menuItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");

            const content = item.querySelector("span").textContent;
            switch (content) {
                case "Profile":
                    showProfile();
                    break;
                case "Orders":
                    showOrders();
                    break;
                case "Reviews":
                    showReviews();
                    break;
                case "My Cards":
                    showMyProfile();
                    break;
            }
        });
    });

    function showProfile() {
        contentArea.innerHTML = `
            <h2>Profile</h2>
            <div class="profile-info">
                <div class="image-box"><img id="user-photo" alt=" " draggable="false"></div>
                <div class="profile-details">

                    <label for="user-displayName">Display Name:</label>
                    <div class="input-container">
                        <input type="text" id="user-displayName" disabled>
                        <button id="edit-displayName-button">
                            <iconify-icon icon="lucide:edit"></iconify-icon>
                        </button>
                        <button id="save-displayName-button" style="display:none;">
                            <iconify-icon icon="mdi:content-save"></iconify-icon>
                        </button>
                    </div>

                    <label for="user-email">Email:</label>
                    <div class="input-container">
                        <input type="text" id="user-email" disabled>
                        <button id="edit-email-button">
                            <iconify-icon icon="lucide:edit"></iconify-icon>
                        </button>
                        <button id="save-email-button" style="display:none;">
                            <iconify-icon icon="mdi:content-save"></iconify-icon>
                        </button>
                    </div>

                    <label for="user-uid">UID:</label>
                    <div class="input-container">
                        <input type="text" id="user-uid" disabled>
                    </div>
    
                    <label for="user-photoURL">Photo URL:</label>
                    <div class="input-container">
                        <input type="text" id="user-photoURL" disabled>
                        <button id="edit-photoURL-button">
                            <iconify-icon icon="lucide:edit"></iconify-icon>
                        </button>
                        <button id="save-photoURL-button" style="display:none;">
                            <iconify-icon icon="mdi:content-save"></iconify-icon>
                        </button>
                    </div>

                    
                </div>
            </div>
        `;
        // Attach logout function to the button
        document.getElementById("logout-button").addEventListener("click", logout);

        // Fetch and display user email and photo
        onAuthStateChanged(auth, async user => {
            if (user) {
                const uidInput = document.getElementById("user-uid");
                const displayNameInput = document.getElementById("user-displayName");
                const photoURLInput = document.getElementById("user-photoURL");
                const emailInput = document.getElementById("user-email");

                uidInput.value = user.uid;
                emailInput.value = user.email;

                // Fetch user profile from Firestore
                const userRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    displayNameInput.value = userData.displayName || '';
                }

                photoURLInput.value = user.photoURL;
                document.getElementById("user-photo").src =
                    user.photoURL || "https://community.fastly.steamstatic.com/economy/image/omZo-YJjnL2r9xAQz5PaYyxABqBEQKXhHMDDYZt2RMqsC6O4NomRzDzlWB3P-wtAlDWSo7zVwiBUTBZDvhB3o-ebMtSDpej5UYEIR_yPd2W7b-mzA64/360fx360f";
                    // "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0e/65/af/dd/photo4jpg.jpg?w=1200&h=-1&s=1";

                // Attach edit and save button functionality for each field
                attachEditSaveFunctionality("displayName", displayNameInput, user);
                attachEditSaveFunctionality("photoURL", photoURLInput, user);
                attachEditSaveFunctionality("email", emailInput, user);
            }
        });
    }

    function attachEditSaveFunctionality(field, inputElement, user) {
        document.getElementById(`edit-${field}-button`).addEventListener("click", () => {
            inputElement.disabled = false;
            inputElement.style.border = "1px solid red";
            inputElement.style.cursor = "text";
            document.getElementById(`edit-${field}-button`).style.display = "none";
            document.getElementById(`save-${field}-button`).style.display = "inline";
        });

        document.getElementById(`save-${field}-button`).addEventListener("click", async () => {
            const newValue = inputElement.value;
            try {
                if (field === "email") {
                    await updateEmail(user, newValue);
                } else if (field === "password") {
                    await updatePassword(user, newValue);
                } else {
                    const userRef = doc(db, "users", user.uid);
                    await setDoc(userRef, { [field]: newValue }, { merge: true });
                }
                inputElement.disabled = true;
                inputElement.style.border = "";
                inputElement.style.cursor = "not-allowed";
                document.getElementById(`edit-${field}-button`).style.display = "inline";
                document.getElementById(`save-${field}-button`).style.display = "none";
            } catch (error) {
                console.error(`Error updating ${field}:`, error);
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
            <h2>My Cards</h2>
            <div class="my-profile-info">
                <!-- Add profile content here -->
            </div>
        `;
    }

    // 預設顯示 Profile 頁面
    menuItems[0].click();
});
