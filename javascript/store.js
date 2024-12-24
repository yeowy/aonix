// 使用相對路徑導入
import products from '../javascript/products.js';

// 購物車數據
let cart = [];

// 初始化商品展示
function initProducts() { 
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) {
        console.error('找不到 productGrid 元素');
        return;
    }

    // 商品介面
    productGrid.innerHTML = products.map(product => 
        `<div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h5>${product.name}</h5>
            <h7 class="product-description">${product.description}</h7>
            <p class="product-price">$${product.price.toLocaleString()}</p>
            <button ><a href="/aonix/pages/#.html">商品評價</a></button>
            <button onclick="addToCart('${product.id}')">加入購物車</button>
            
        </div>`
        
    ).join('');
}

// 購物車相關功能

// 關閉購物車 x
window.toggleCart = function() {
    const cartModal = document.getElementById('cartModal');
    if (cartModal.style.display === 'block') {
        cartModal.style.display = 'none';  
    } else {
        cartModal.style.display = 'block';  
    }
};

window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartDisplay();
};

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    // 購物車紅色圈內數量
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (cart.length === 0) {
        cartItems.innerHTML = 
            `<div class="empty-cart">
                <iconify-icon icon="mdi:cart-off" ></iconify-icon>
                <p>您的購物車是空的</p>
            </div>`   
        ;
        cartTotal.textContent = '0';
        return;
    }
    
    // 購物車內介面顯示
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

window.updateQuantity = function(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartDisplay();
        }
    }
};

window.removeFromCart = function(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
};

window.checkout = function() {
    if (cart.length === 0) {
        alert('購物車是空的！');
        return;
    }
    alert('感謝您的購買！');
    cart = [];
    updateCartDisplay();
    toggleCart();
};

// 頁面加載時初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('頁面已加載');
    initProducts();
});