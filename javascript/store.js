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
    const productGrid = document.getElementById("productGrid");
    if (!productGrid) {
        console.error("找不到 productGrid 元素");
    }

    const productsPerPageDropdown = document.getElementById("products-per-page");
    if (productsPerPageDropdown) {
        productsPerPageDropdown.value = productsPerPage;
    }

    try {
        const allProductsSnapshot = await fetchAllProducts();
        allProducts = allProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCategoryCounts(allProducts);

        filteredProducts = allProducts;

        // Check for category filter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        if (category) {
            selectedCategories.push(category);
            highlightSelectedCategory(category);
            filterProducts();
        } else {
            await displayProductsForPage(currentPage);
            updatePaginationButtons();
        }
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Highlight selected category
function highlightSelectedCategory(category) {
    const categoryItem = document.querySelector(`.category-item[data-category="${category}"]`);
    if (categoryItem) {
        categoryItem.classList.add("selected");
    }
}

// Fetch all products
async function fetchAllProducts() {
    const productsQuery = query(collection(db, 'products'), orderBy('name'));
    return await getDocs(productsQuery);
}

// Display products for the current page
async function displayProductsForPage(page) {
    const start = page * productsPerPage;
    const end = start + productsPerPage;
    const productsToDisplay = filteredProducts.slice(start, end);
    await displayProducts(productsToDisplay);
}

// Update pagination buttons
function updatePaginationButtons() {
    const nextButton = document.getElementById('next-button');
    const prevButton = document.getElementById('prev-button');

    nextButton.disabled = filteredProducts.length <= productsPerPage;
    prevButton.disabled = filteredProducts.length <= productsPerPage;
}

// Update category counts
function updateCategoryCounts(products) {
    const categoryCounts = products.reduce((counts, product) => {
        const category = product.category.toLowerCase();
        counts[category] = (counts[category] || 0) + 1;
        counts["all"] = (counts["all"] || 0) + 1;
        return counts;
    }, {});

    document.querySelectorAll(".category-count").forEach(span => {
        const category = span.getAttribute("data-category");
        span.textContent = categoryCounts[category] || 0;
    });

    document.querySelectorAll(".category-item").forEach(item => {
        const category = item.getAttribute("data-category");
        const count = categoryCounts[category] || 0;
        const countElement = item.querySelector(".category-count");
        if (countElement) {
            countElement.textContent = `${count}`;
        } else {
            const newCountElement = document.createElement("div");
            newCountElement.className = "category-count";
            newCountElement.textContent = `${count}`;
            item.appendChild(newCountElement);
        }
    });
}

// Display products
async function displayProducts(productsToDisplay) {
    const productGrid = document.getElementById("productGrid");
    const productHTML = await Promise.all(productsToDisplay.map(async product => {
        const reviews = await fetchReviews(product.id);
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) : '0.0';

        return `
            <div class="product-card">
                <div class="product-img">
                    <a href="product_review.html?id=${product.id}">
                        <img src="${product.images[0]}" alt="${product.name}" draggable="false">
                    </a>
                </div>
                <div class="product-details">
                    <div class="product-brand">${product.brand}</div>
                    <div class="product-name"><a href="product_review.html?id=${product.id}"><h5>${product.name}</h5></a></div>
                    <div class="product-tags">
                        <div class="tag">${product.features[0]}</div>
                        <div class="tag">${product.features[1]}</div>    
                        <div class="tag">${product.features[2]}</div>    
                    </div>
                    <div class="product-description">${product.description}</div>
                    <div class="product-bottom">
                        <div class="product-bottom-left">
                            <div class="product-rating">
                                <span class="rating">${averageRating}
                                <iconify-icon
                                icon="mdi:star"
                                width="auto"
                                height="auto"
                                class="star-icon">
                                </iconify-icon></span>
                                <span class="rating-count">(${totalReviews} reviews)</span>    
                            </div>
                        </div>
                        <div class="product-bottom-right">
                            <div class="product-price">$${product.price.toLocaleString()}</div>
                            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">Purchase</button>
                        </div> 
                    </div>
                </div>
            </div>`;
    }));
    productGrid.innerHTML = productHTML.join("");
}

// Fetch reviews from Firestore
async function fetchReviews(productId) {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Filter products by category
document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", () => {
        const category = item.getAttribute("data-category");
        const index = selectedCategories.indexOf(category);
        if (index > -1) {
            selectedCategories.splice(index, 1);
            item.classList.remove("selected");
        } else {
            selectedCategories.push(category);
            item.classList.add("selected");
        }
        filterProducts();
    });
});

// Filter products based on selected categories
function filterProducts() {
    filteredProducts = selectedCategories.length === 0
        ? allProducts
        : allProducts.filter(product => selectedCategories.includes(product.category.toLowerCase()));
    currentPage = 0;
    displayProductsForPage(currentPage);
    updatePaginationButtons();
}

// Search products
document.getElementById("filterSearchInput").addEventListener("input", e => {
    const searchTerm = e.target.value.toLowerCase();
    filteredProducts = allProducts.filter(
        product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
    );
    currentPage = 0;
    displayProductsForPage(currentPage);
    updatePaginationButtons();
});

document.getElementById("searchInput").addEventListener("input", e => {
    const searchTerm = e.target.value.toLowerCase();
    filteredProducts = allProducts.filter(
        product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
    );
    currentPage = 0;
    displayProductsForPage(currentPage);
    updatePaginationButtons();
});

// Toggle dropdown visibility
document.querySelectorAll(".category-header").forEach(header => {
    header.addEventListener("click", () => {
        const dropdownContent = header.nextElementSibling;
        const icon = header.querySelector(".category-btn iconify-icon");
        if (dropdownContent) {
            dropdownContent.classList.toggle("active");
        }
        if (icon) {
            icon.classList.toggle("active");
            icon.style.transform = icon.classList.contains("active") ? "rotate(180deg)" : "rotate(0deg)";
        }
    });
});

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

// Pagination buttons event listeners
document.getElementById('next-button').addEventListener('click', () => {
    currentPage = (currentPage + 1) % Math.ceil(filteredProducts.length / productsPerPage);
    displayProductsForPage(currentPage);
    updatePaginationButtons();
});

document.getElementById('prev-button').addEventListener('click', () => {
    currentPage = (currentPage - 1 + Math.ceil(filteredProducts.length / productsPerPage)) % Math.ceil(filteredProducts.length / productsPerPage);
    displayProductsForPage(currentPage);
    updatePaginationButtons();
});

// Products per page dropdown event listener
document.getElementById('products-per-page').addEventListener('change', (e) => {
    productsPerPage = parseInt(e.target.value, 10);
    setCookie("productsPerPage", productsPerPage, 7);
    currentPage = 0;
    displayProductsForPage(currentPage);
    updatePaginationButtons();
});
