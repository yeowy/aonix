import products from './products.js';

// 從 URL 獲取商品 ID
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// 獲取或初始化評論數據
let reviews = JSON.parse(localStorage.getItem('productReviews')) || {};
let currentRating = 0;

// 初始化頁面
function initPage() {
    const product = products.find(p => p.id === productId);
    if (!product) {
        window.location.href = '/aonix/pages/store.html';
        return;
    }

    // 填充商品信息
    document.querySelector('.product-name').textContent = product.name;
    document.querySelector('.product-description').textContent = product.description;
    document.querySelector('.product-price').textContent = `$${product.price.toLocaleString()}`;
    
    // 創建並設置商品圖片
    const productImage = document.createElement('img');
    productImage.src = product.image;
    document.querySelector('.product-image').appendChild(productImage);

    // 更新評分摘要
    updateRatingSummary();
    
    // 載入評論列表
    loadReviews();
}

// 更新評分摘要
function updateRatingSummary() {
    const productReviews = reviews[productId] || [];
    const totalReviews = productReviews.length;
    
    // 計算平均評分
    let averageRating;
    if (totalReviews > 0) {
        const sumOfRatings = productReviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = (sumOfRatings / totalReviews).toFixed(1);
    } else {
        averageRating = '0.0';
    }

    // 更新UI
    document.querySelector('.rating-number').textContent = averageRating;
    document.querySelector('.total-reviews').textContent = `${totalReviews} 則評論`;

    // 更新平均評分的星星
    const averageStars = document.createElement('div');
    averageStars.className = 'star';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('iconify-icon');
        star.setAttribute('width', '24');
        star.setAttribute('height', '24');
        star.setAttribute('icon', i <= averageRating ? 'mdi:star' : 'mdi:star-outline');
        star.style.color = 'gold';
        averageStars.appendChild(star);
    }
    const existingStars = document.querySelector('.average-rating .star');
    if (existingStars) {
        existingStars.replaceWith(averageStars);
    } else {
        document.querySelector('.average-rating').appendChild(averageStars);
    }
}

// 載入評論列表
function loadReviews() {
    const reviewsList = document.querySelector('.reviews-list');
    const productReviews = reviews[productId] || [];

    if (productReviews.length === 0) {
        reviewsList.innerHTML = '<h2>商品評論</h2><p class="no-reviews">暫無評論</p>';
        return;
    }

    reviewsList.innerHTML = `
        <h2>商品評論</h2>
        ${productReviews.map((review, index) => `
            <div class="review-item" data-index="${index}">
                <div class="review-header">
                    <div class="star">
                        ${Array(5).fill('').map((_, i) => `
                            <iconify-icon 
                                icon="${i < review.rating ? 'mdi:star' : 'mdi:star-outline'}"
                                width="20" 
                                height="20"
                                style="color: gold;"
                            ></iconify-icon>
                        `).join('')}
                    </div>
                    <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div class="review-content">
                    ${review.content}
                    <div class="review-actions">
                        <button class="edit-btn" onclick="editReview(${index})">
                            <iconify-icon icon="mdi:pencil"></iconify-icon>
                        </button>
                        <button class="delete-btn" onclick="deleteReview(${index})">
                            <iconify-icon icon="mdi:delete"></iconify-icon>
                        </button>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// 處理評論提交
document.getElementById('reviewForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 檢查是否已評分
    if (!currentRating) {
        alert('請選擇評分！');
        return;
    }

    const content = e.target.querySelector('textarea').value;
    
    // 檢查評論長度
    if (content.length < 10) {
        alert('評論內容至少需要10個字！');
        return;
    }

    // 創建新評論
    const newReview = {
        rating: currentRating,
        content,
        date: new Date().toISOString()
    };

    // 添加到評論列表
    if (!reviews[productId]) {
        reviews[productId] = [];
    }
    reviews[productId].unshift(newReview);

    // 保存到 localStorage
    localStorage.setItem('productReviews', JSON.stringify(reviews));

    // 重置表單
    e.target.reset();
    currentRating = 0;
    const starIcons = document.querySelectorAll('.rating-area .star-icon');
    starIcons.forEach(icon => icon.setAttribute('icon', 'mdi:star-outline'));
    document.querySelector('.rating-text').textContent = '請選擇評分';

    // 更新頁面
    updateRatingSummary();
    loadReviews();
});

// 處理星星評分
document.querySelectorAll('.rating-area .star-icon').forEach(star => {
    star.addEventListener('click', function() {
        const rating = parseInt(this.getAttribute('data-index'));
        currentRating = rating;
        
        // 更新星星顯示
        document.querySelectorAll('.rating-area .star-icon').forEach((icon, index) => {
            icon.setAttribute('icon', index < rating ? 'mdi:star' : 'mdi:star-outline');
        });

    });
});

// 添加刪除評論函數
window.deleteReview = function(index) {
    if (confirm('確定要刪除這則評論嗎？')) {
        reviews[productId].splice(index, 1);
        localStorage.setItem('productReviews', JSON.stringify(reviews));
        updateRatingSummary();
        loadReviews();
    }
}

// 添加編輯評論函數
window.editReview = function(index) {
    const review = reviews[productId][index];
    const reviewItem = document.querySelector(`[data-index="${index}"]`);
    const content = reviewItem.querySelector('.review-content');
    
    // 創建編輯表單
    const editForm = document.createElement('form');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
        <textarea required minlength="10" maxlength="500">${review.content}</textarea>
        <div class="edit-actions">
            <button type="submit" class="save-btn">保存</button>
            <button type="button" class="cancel-btn">取消</button>
        </div>
    `;

    // 替換原有內容為編輯表單
    content.innerHTML = '';
    content.appendChild(editForm);

    // 處理表單提交
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newContent = editForm.querySelector('textarea').value;
        
        if (newContent.length < 10) {
            alert('評論內容至少需要10個字！');
            return;
        }

        reviews[productId][index].content = newContent;
        localStorage.setItem('productReviews', JSON.stringify(reviews));
        loadReviews();
    });

    // 處理取消編輯
    editForm.querySelector('.cancel-btn').addEventListener('click', () => {
        loadReviews();
    });
}

// 頁面加載時初始化
document.addEventListener('DOMContentLoaded', initPage); 