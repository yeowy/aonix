import { getCookie, setCookie } from './base.js';
import { fetchProducts } from "./products.js";
import { auth, db } from './firebase-config.js';
import { addDoc, collection, query, orderBy, getDocs, doc, getDoc, setDoc, updateDoc, increment, deleteDoc, onSnapshot, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize cart data from cookies or empty array
let cart = JSON.parse(getCookie("cart")) || [];
let products = [];
let allProducts = [];
let filteredProducts = [];
let selectedCategories = [];
let currentPage = 0;
let productsPerPage = parseInt(getCookie("productsPerPage"), 10) || 3;

// Initialize product display
async function initProducts() {
    try {
        const allProductsSnapshot = await fetchAllProducts();
        allProducts = allProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Fetch all products
async function fetchAllProducts() {
    const productsQuery = query(collection(db, 'products'), orderBy('name'));
    return await getDocs(productsQuery);
}

// Toggle cart modal visibility
window.toggleCart = function () {
    updateCartDisplay();
    const cartModal = document.getElementById("cartModal");
    if (cartModal.style.display === "block") {
        cartModal.style.display = "none";
    } else {
        cartModal.style.display = "block";
    }
};

// Listen for cart changes in Firestore and update UI in real time
function listenCartChanges() {
    const user = auth.currentUser;
    if (!user) return;
    const cartRef = collection(db, "users", user.uid, "cart");
    onSnapshot(cartRef, () => {
        updateCartDisplay();
    });
}

// Add product to cart or update quantity
window.addToCart = async function(productId) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to add items to the cart!");
        return;
    }
    try {
        const cartItemRef = doc(db, "users", user.uid, "cart", productId);
        const snapshot = await getDoc(cartItemRef);
        if (snapshot.exists()) {
            await updateDoc(cartItemRef, { quantity: increment(1) });
        } else {
            const product = allProducts.find(p => p.id === productId);
            await setDoc(cartItemRef, {
                productId: product.id,
                quantity: 1
            });
        }
        updateCartDisplay(); // Ensure cart display is updated after adding item
    } catch (error) {
        console.error("Error adding to cart:", error);
    }
};

// Remove product from cart
window.removeFromCart = async function(productId) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in!");
        return;
    }
    try {
        const cartItemRef = doc(db, "users", user.uid, "cart", productId);
        await deleteDoc(cartItemRef);
        updateCartDisplay(); // Ensure cart display is updated after removing item
    } catch (error) {
        console.error("Error removing from cart:", error);
    }
};

// Display or update cart UI
export async function updateCartDisplay() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");
    const user = auth.currentUser;

    if (!user || !cartItems) {
        cartItems.innerHTML = `<div class="empty-cart">
            <iconify-icon icon="mdi:cart-off"></iconify-icon>
            <p>Your cart is empty</div>`;
        cartCount.textContent = "0";
        cartTotal.textContent = "0";
        return;
    }

    try {
        const cartRef = collection(db, "users", user.uid, "cart");
        const snapshot = await getDocs(cartRef);
        let total = 0, count = 0, html = "";

        for (const docSnap of snapshot.docs) {
            const item = docSnap.data();
            const product = allProducts.find(p => p.id === item.productId);
            if (product) {
                total += product.price * item.quantity;
                count += item.quantity;
                html += `<div class="cart-item">
                    <img src="${product.images[0]}" alt="${product.name}">
                    <div class="cart-item-info">
                        <h7>${product.name}</h7>
                        <div class="price-quantity">
                            <span class="price">$${product.price.toLocaleString()}</span>
                            <div class="quantity-controls">
                                <button onclick="updateQuantity('${product.id}', -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQuantity('${product.id}', 1)">+</button>
                            </div>
                        </div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart('${product.id}')">
                        <iconify-icon icon="mdi:delete"></iconify-icon>
                    </button>
                </div>`;
            }
        }

        cartItems.innerHTML = html || `<div class="empty-cart">
            <iconify-icon icon="mdi:cart-off"></iconify-icon>
            <p>Your cart is empty</div>`;
        cartCount.textContent = count;
        cartTotal.textContent = total.toLocaleString();
    } catch (error) {
        console.error("Error fetching cart data:", error);
    }
}

// Update item quantity in cart
window.updateQuantity = async function (productId, change) {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in!");
        return;
    }
    try {
        const cartItemRef = doc(db, "users", user.uid, "cart", productId);
        const snapshot = await getDoc(cartItemRef);
        if (snapshot.exists()) {
            const newQuantity = snapshot.data().quantity + change;
            if (newQuantity <= 0) {
                await deleteDoc(cartItemRef);
            } else {
                await updateDoc(cartItemRef, { quantity: newQuantity });
            }
            updateCartDisplay(); // Ensure cart display is updated after quantity change
        }
    } catch (error) {
        console.error("Error updating quantity:", error);
    }
};

// Handle checkout process
window.checkout = async function () {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to checkout!");
        return;
    }

    try {
        const cartRef = collection(db, "users", user.uid, "cart");
        const cartSnapshot = await getDocs(cartRef);
        if (cartSnapshot.empty) {
            alert("Your cart is empty!");
            return;
        }

        // Create a new order document in the "purchases" collection
        const userPurchasesRef = collection(db, "users", user.uid, "purchases");
        const newOrderRef = await addDoc(userPurchasesRef, {
            orderDate: new Date().toISOString(),
            status: "Pending"
        });

        // Add products as sub-collections under the new order document
        const orderProductsRef = collection(newOrderRef, "products");
        for (const docSnap of cartSnapshot.docs) {
            const item = docSnap.data();
            const product = allProducts.find(p => p.id === item.productId);
            if (!product) continue;
            await addDoc(orderProductsRef, {
                productId: item.productId,
                itemName: product.name,
                price: product.price,
                quantity: item.quantity
            });
        }

        // Clear cart in Firestore
        for (const docSnap of cartSnapshot.docs) {
            await deleteDoc(docSnap.ref);
        }
        cart = [];
        setCookie("cart", JSON.stringify(cart), 7);
        await updateCartDisplay();
        window.open("https://buy.stripe.com/test_8wMeY86wQ2N2cEwdQT", "_blank");
        window.location.href = "member.html";
    } catch (error) {
        console.error("Checkout error:", error);
    }
};

// Initialize page on load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");
    cart = JSON.parse(getCookie("cart")) || [];
    initProducts();
    updateCartDisplay();
    auth.onAuthStateChanged(user => {
        if (user) listenCartChanges();
    });
});
