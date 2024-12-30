import {getCookie, setCookie} from './base.js';

// Import fetchProducts from products.js
import { fetchProducts } from "./products.js";
import { auth, db } from './firebase-config.js';
import { addDoc, collection, query, orderBy, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize cart data from cookies or empty array
let cart = JSON.parse(getCookie("cart")) || [];
let products = []; // Global variable to store fetched products
let allProducts = []; // Global variable to store all products
let filteredProducts = []; // Global variable to store filtered products
let selectedCategories = []; // Array to store selected categories
let currentPage = 0; // Current page index
let productsPerPage = parseInt(getCookie("productsPerPage"), 10) || 3; // Default number of products per page

// Initialize product display
async function initProducts() {
    const productGrid = document.getElementById("productGrid");
    if (!productGrid) {
        console.error("找不到 productGrid 元素");
        return;
    }

    // Set the productsPerPage dropdown to the correct value
    const productsPerPageDropdown = document.getElementById("products-per-page");
    if (productsPerPageDropdown) {
        productsPerPageDropdown.value = productsPerPage;
    }

    try {
        // Fetch all products for filters and category counts
        const allProductsSnapshot = await fetchAllProducts();
        allProducts = allProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        updateCategoryCounts(allProducts);

        // Set filteredProducts to allProducts initially
        filteredProducts = allProducts;

        // Display products for the current page
        displayProductsForPage(currentPage);
        updatePaginationButtons();
        openEssentialsDropdown(); // Open Essentials dropdown on page load
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Function to open Essentials dropdown on page load
function openEssentialsDropdown() {
    const essentialsDropdown = document.querySelector('.category-dropdown-content[data-category="processors"]');
    const essentialsIcon = document.querySelector('.category-header .category-btn iconify-icon');
    if (essentialsDropdown) {
        essentialsDropdown.classList.add('active');
    }
    if (essentialsIcon) {
        essentialsIcon.classList.add('active');
    }
}

// Fetch all products
async function fetchAllProducts() {
    const productsQuery = query(collection(db, 'products'), orderBy('name'));
    return await getDocs(productsQuery);
}

// Display products for the current page
function displayProductsForPage(page) {
    const start = page * productsPerPage;
    const end = start + productsPerPage;
    const productsToDisplay = filteredProducts.slice(start, end);
    displayProducts(productsToDisplay);
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
function displayProducts(productsToDisplay) {
    const productGrid = document.getElementById("productGrid");
    productGrid.innerHTML = productsToDisplay
        .map(
            product =>
            `<div class="product-card">
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
                                <span class="rating">${product.ratings.average}
                                <iconify-icon
                                icon="mdi:star"
                                width="auto"
                                height="auto"
                                class="star-icon">
                                </iconify-icon></span>
                                <span class="rating-count">(${product.ratings.reviewsCount} reviews)</span>    
                            </div>
                        </div>

                        <div class="product-bottom-right">
                            <div class="product-price">$${product.price.toLocaleString()}</div>
                            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">Purchase</button>
                        </div> 
                    </div>
                </div>
        </div>`
        )
        .join("");
}

// Toggle cart modal visibility
window.toggleCart = function () {
    const cartModal = document.getElementById("cartModal");
    if (cartModal.style.display === "block") {
        cartModal.style.display = "none";
    } else {
        cartModal.style.display = "block";
    }
};

// Add product to cart
window.addToCart = function (productId) {
    const product = allProducts.find(p => p.id === productId); // Use the global allProducts variable
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    // Save to cookies
    setCookie("cart", JSON.stringify(cart), 7);
    updateCartDisplay();
};

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById("cartItems");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");

    // Update cart count in header
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        cartItems.innerHTML = `<div class="empty-cart">
                <iconify-icon icon="mdi:cart-off" ></iconify-icon>
                <p>Your cart is empty</p>
            </div>`;
        cartTotal.textContent = "0";
        return;
    }

    // Display cart items
    cartItems.innerHTML = cart
        .map(
            item =>
                `<div class="cart-item">
            <img src="${item.images[0]}" alt="${item.name}">
            <div class="cart-item-info">
                <h7>${item.name}</h7>
                <div class="price-quantity">
                    <span class="price">$${item.price.toLocaleString()}</span>
                    <div class="quantity-controls">
                        <button onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)">+</button>
                    </div>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart('${item.id}')">
                <iconify-icon icon="mdi:delete"></iconify-icon>
            </button>
        </div>`
        )
        .join("");

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotal.textContent = total.toLocaleString();
}

// Update item quantity in cart
window.updateQuantity = function (productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCookie("cart", JSON.stringify(cart), 7);
            updateCartDisplay();
        }
    }
};

// Remove item from cart
window.removeFromCart = function (productId) {
    cart = cart.filter(item => item.id !== productId);
    setCookie("cart", JSON.stringify(cart), 7);
    updateCartDisplay();
};

// Handle checkout process
window.checkout = async function () {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to checkout!");
        return;
    }

    try {
        const purchaseHistoryRef = collection(db, 'users', user.uid, 'shoppingHistory');
        for (const item of cart) {
            await addDoc(purchaseHistoryRef, {
                itemName: item.name,
                purchaseDate: new Date().toISOString(),
                price: item.price,
                quantity: item.quantity,
                productId: item.id // Add productId to the purchase history
            });
        }
        alert("Thank you for your purchase!");
        cart = [];
        setCookie("cart", JSON.stringify(cart), 7); // Clear the cart cookie
        updateCartDisplay();
        toggleCart();
    } catch (error) {
        console.error("Error saving purchase history:", error);
    }
};

// Filter products by category
document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", () => {
        const category = item.getAttribute("data-category");
        const index = selectedCategories.indexOf(category);
        if (index > -1) {
            selectedCategories.splice(index, 1);
        } else {
            selectedCategories.push(category);
        }
        filterProducts();
    });
});

// Filter products based on selected categories
function filterProducts() {
    filteredProducts = selectedCategories.length === 0
        ? allProducts
        : allProducts.filter(product => selectedCategories.includes(product.category.toLowerCase()));
    currentPage = 0; // Reset to the first page
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
    currentPage = 0; // Reset to the first page
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
    currentPage = 0; // Reset to the first page
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
        }
    });
});

// Initialize page on load
document.addEventListener("DOMContentLoaded", () => {
    console.log("Page loaded");
    cart = JSON.parse(getCookie("cart")) || []; // Reload cart from cookies
    initProducts();
    updateCartDisplay(); // Ensure cart display is updated when the page loads
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
    currentPage = 0; // Reset to the first page
    displayProductsForPage(currentPage);
    updatePaginationButtons();
});