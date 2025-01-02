// Import fetchProducts from products.js
import { fetchProducts } from "./products.js";
import { auth, db } from './firebase-config.js';
import { addDoc, collection } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize cart data from localStorage or empty array
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let products = []; // Global variable to store fetched products
let selectedCategories = []; // Array to store selected categories

// Initialize product display
async function initProducts() {
    const productGrid = document.getElementById("productGrid");
    if (!productGrid) {
        console.error("找不到 productGrid 元素");
        return;
    }

    try {
        products = await fetchProducts(); // Store fetched products in the global variable
        updateCategoryCounts(products);
        displayProducts(products);
        openEssentialsDropdown(); // Open Essentials dropdown on page load
    } catch (error) {
        console.error("Error fetching products:", error);
    }
}

// Open Essentials dropdown on page load
function openEssentialsDropdown() {
    const essentialsDropdown = document.querySelector(".category-dropdown-content[data-category='processors']");
    if (essentialsDropdown) {
        essentialsDropdown.classList.add("active");
        const essentialsButton = essentialsDropdown.previousElementSibling.querySelector(".category-btn iconify-icon");
        if (essentialsButton) {
            essentialsButton.classList.add("active");
        }
    }
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
        const countElement = document.createElement("div");
        countElement.className = "category-count";
        countElement.textContent = `${count}`;
        item.appendChild(countElement);
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
                    <div class="product-name"><h5>${product.name}</h5></div>
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
    const product = products.find(p => p.id === productId); // Use the global products variable
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));
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
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartDisplay();
        }
    }
};

// Remove item from cart
window.removeFromCart = function (productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(cart));
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
        localStorage.removeItem("cart");
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
            item.classList.remove('selected');
        } else {
            selectedCategories.push(category);
            item.classList.add('selected');
        }
        
        filterProducts();
    });
});

// Filter products based on selected categories
function filterProducts() {
    const filteredProducts = selectedCategories.length === 0
        ? products
        : products.filter(product => selectedCategories.includes(product.category.toLowerCase()));
    
    // 更新所有下拉選單的箭頭顏色
    updateDropdownArrows();
    
    displayProducts(filteredProducts);
}

// 添加新函數來更新箭頭顏色
function updateDropdownArrows() {
    document.querySelectorAll('.category-dropdown').forEach(dropdown => {
        const dropdownContent = dropdown.querySelector('.category-dropdown-content');
        const icon = dropdown.querySelector('.category-btn iconify-icon');
        const categoryItems = dropdownContent.querySelectorAll('.category-item');
        
        // 檢查這個下拉選單中是否有被選中的項目
        const hasSelectedItem = Array.from(categoryItems).some(item => 
            selectedCategories.includes(item.getAttribute('data-category'))
        );
        
        // 更新箭頭顏色
        if (icon) {
            if (hasSelectedItem) {
                icon.style.color = 'var(--accent-color)'; // 使用紅色
            } else {
                icon.style.color = ''; // 恢復默認顏色
            }
        }
    });
}

// Search products
document.getElementById("filterSearchInput").addEventListener("input", e => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = products.filter(
        product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
});

document.getElementById("searchInput").addEventListener("input", e => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = products.filter(
        product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
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
    initProducts();
    updateCartDisplay(); // Ensure cart display is updated when the page loads
});

// 在渲染產品或更新頁面時，確保不會改變背景色
function renderProducts(products) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = '';  // 清空現有內容
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        // 這裡不要設置背景色，使用 CSS 中定義的背景
        
        // ... 其他產品卡片內容 ...
    });
}
