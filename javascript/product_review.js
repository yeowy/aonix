import { db, auth } from './firebase-config.js';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// 從 URL 獲取商品 ID
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// 獲取或初始化評論數據
let currentRating = 0;
let currentUser = null;

// 初始化頁面
async function initPage() {
    const productDoc = doc(db, 'products', productId);
    const productSnapshot = await getDoc(productDoc);
    if (!productSnapshot.exists()) {
        window.location.href = '/aonix/pages/store.html';
        return;
    }

    const product = productSnapshot.data();

    // 填充商品信息
    document.querySelector('.product-name').textContent = product.name;
    document.querySelector('.product-description').textContent = product.description;
    document.querySelector('.product-price').textContent = `$${product.price.toLocaleString()}`;
    
    // 創建並設置商品圖片
    const productImage = document.createElement('img');
    productImage.src = product.images[0];
    document.querySelector('.product-image').appendChild(productImage);

    // 更新評分摘要
    updateRatingSummary();
    
    // 載入評論列表
    loadReviews();
}

// 更新評分摘要
async function updateRatingSummary() {
    const reviews = await fetchReviews();
    const totalReviews = reviews.length;
    
    // 計算平均評分
    let averageRating;
    if (totalReviews > 0) {
        const sumOfRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
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
async function loadReviews() {
    const reviewsList = document.querySelector('.reviews-list');
    const reviews = await fetchReviews();

    if (reviews.length === 0) {
        reviewsList.innerHTML = '<h2>商品評論</h2><p class="no-reviews">暫無評論</p>';
        return;
    }

    reviewsList.innerHTML = `
        <h2>商品評論</h2>
        ${reviews.map((review, index) => `
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
                        <button class="edit-btn" onclick="editReview('${review.id}')">
                            <iconify-icon icon="mdi:pencil"></iconify-icon>
                        </button>
                        <button class="delete-btn" onclick="deleteReview('${review.id}')">
                            <iconify-icon icon="mdi:delete"></iconify-icon>
                        </button>
                    </div>
                </div>
            </div>
        `).join('')}
    `;
}

// 處理評論提交
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 檢查是否已評分
    if (!currentRating) {
        alert('請選擇評分！');
        return;
    }

    // 檢查用戶是否已登錄
    if (!currentUser) {
        alert('You must be logged in to submit a review!');
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
        date: new Date().toISOString(),
        productId,
        userId: currentUser.uid
    };

    try {
        await addDoc(collection(db, 'reviews'), newReview);
        // 重置表單
        e.target.reset();
        currentRating = 0;
        const starIcons = document.querySelectorAll('.rating-area .star-icon');
        starIcons.forEach(icon => icon.setAttribute('icon', 'mdi:star-outline'));
        document.querySelector('.rating-text').textContent = '請選擇評分';

        // 更新頁面
        updateRatingSummary();
        loadReviews();
    } catch (error) {
        console.error('Error adding review:', error);
    }
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
window.deleteReview = async function(reviewId) {
    if (confirm('確定要刪除這則評論嗎？')) {
        try {
            await deleteDoc(doc(db, 'reviews', reviewId));
            updateRatingSummary();
            loadReviews();
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    }
}

// 添加編輯評論函數
window.editReview = function(reviewId) {
    const reviewItem = document.querySelector(`[data-index="${reviewId}"]`);
    const content = reviewItem.querySelector('.review-content');
    
    // 創建編輯表單
    const editForm = document.createElement('form');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
        <textarea required minlength="10" maxlength="500">${content.textContent}</textarea>
        <div class="edit-actions">
            <button type="submit" class="save-btn">保存</button>
            <button type="button" class="cancel-btn">取消</button>
        </div>
    `;

    // 替換原有內容為編輯表單
    content.innerHTML = '';
    content.appendChild(editForm);

    // 處理表單提交
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newContent = editForm.querySelector('textarea').value;
        
        if (newContent.length < 10) {
            alert('評論內容至少需要10個字！');
            return;
        }

        try {
            await updateDoc(doc(db, 'reviews', reviewId), { content: newContent });
            loadReviews();
        } catch (error) {
            console.error('Error updating review:', error);
        }
    });

    // 處理取消編輯
    editForm.querySelector('.cancel-btn').addEventListener('click', () => {
        loadReviews();
    });
}

// Fetch reviews from Firestore
async function fetchReviews() {
    const q = query(collection(db, 'reviews'), where('productId', '==', productId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 頁面加載時初始化
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
        } else {
            currentUser = null;
        }
    });
    initPage();
});