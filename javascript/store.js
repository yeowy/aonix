// Import fetchProducts from products.js
import { fetchProducts } from './products.js';

// Initialize cart data from localStorage or empty array
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = []; // Global variable to store fetched products

// Initialize product display
async function initProducts() { 
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) {
        console.error('找不到 productGrid 元素');
        return;
    }

    try {
        products = await fetchProducts(); // Store fetched products in the global variable
        updateCategoryCounts(products);
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Update category counts
function updateCategoryCounts(products) {
    const categoryCounts = products.reduce((counts, product) => {
        const category = product.category.toLowerCase();
        counts[category] = (counts[category] || 0) + 1;
        counts['all'] = (counts['all'] || 0) + 1;
        return counts;
    }, {});

    document.querySelectorAll('.category-count').forEach(span => {
        const category = span.getAttribute('data-category');
        span.textContent = categoryCounts[category] || 0;
    });
}

// Display products
function displayProducts(productsToDisplay) {
    const productGrid = document.getElementById('productGrid');
    productGrid.innerHTML = productsToDisplay.map(product => 
        `<div class="product-card">
            <img src="${product.images[0]}" alt="${product.name}">
            <h5>${product.name}</h5>
            <div class="product-description">${product.description}</div>
            <p class="product-price">$${product.price.toLocaleString()}</p>
            <div class="button-container">
                <button><a href="/aonix/pages/product_review.html?id=${product.id}">Product Review</a></button>
                <button onclick="addToCart('${product.id}')">Add to Cart</button>
            </div>
        </div>`
    ).join('');
}

// Toggle cart modal visibility
window.toggleCart = function() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal.style.display === 'block') {
        cartModal.style.display = 'none';  
    } else {
        cartModal.style.display = 'block';  
    }
};

// Add product to cart
window.addToCart = function(productId) {
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
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
};

// Update cart display
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    // Update cart count in header
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cart.length === 0) {
        cartItems.innerHTML = 
            `<div class="empty-cart">
                <iconify-icon icon="mdi:cart-off" ></iconify-icon>
                <p>Your cart is empty</p>
            </div>`   
        ;
        cartTotal.textContent = '0';
        return;
    }
    
    // Display cart items
    cartItems.innerHTML = cart.map(item => 
        `<div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
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
    ).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toLocaleString();
}

// Update item quantity in cart
window.updateQuantity = function(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartDisplay();
        }
    }
};

// Remove item from cart
window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartDisplay();
};

// Handle checkout process
window.checkout = function() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    alert('Thank you for your purchase!');
    cart = [];
    localStorage.removeItem('cart');
    updateCartDisplay();
    toggleCart();
};

// Filter products by category
document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
        const category = item.getAttribute('data-category');
        if (category === 'all') {
            displayProducts(products);
        } else {
            const filteredProducts = products.filter(product => product.category.toLowerCase() === category);
            displayProducts(filteredProducts);
        }
    });
});

// Search products
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    displayProducts(filteredProducts);
});

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded');
    initProducts();
    updateCartDisplay(); // Ensure cart display is updated when the page loads
});



