// Import Firebase services
import { db, auth } from './firebase-config.js';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// Initialize review data
let currentRating = 0;
let currentUser = null;

// Initialize page
async function initPage() {
    // Get product document from Firestore
    const productDoc = doc(db, 'products', productId);
    const productSnapshot = await getDoc(productDoc);
    if (!productSnapshot.exists()) {
        // Redirect to store page if product does not exist
        window.location.href = '/aonix/pages/store.html';
        return;
    }

    const product = productSnapshot.data();

    // Fill product information
    document.querySelector('.product-name').textContent = product.name;
    document.querySelector('.product-description').textContent = product.description;
    document.querySelector('.product-price').textContent = `$${product.price.toLocaleString()}`;
    
    // Create and set product image
    const productImage = document.createElement('img');
    productImage.src = product.images[0];
    document.querySelector('.product-image').appendChild(productImage);

    // Update rating summary
    updateRatingSummary();
    
    // Load reviews
    loadReviews();
}

// Update rating summary
async function updateRatingSummary() {
    const reviews = await fetchReviews();
    const totalReviews = reviews.length;
    
    // Calculate average rating
    let averageRating;
    if (totalReviews > 0) {
        const sumOfRatings = reviews.reduce((sum, review) => sum + review.rating, 0);
        averageRating = (sumOfRatings / totalReviews).toFixed(1);
    } else {
        averageRating = '0.0';
    }

    // Update UI
    document.querySelector('.rating-number').textContent = averageRating;
    document.querySelector('.total-reviews').textContent = `${totalReviews} 則評論`;

    // Update average rating stars
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

// Load reviews
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

// Handle review submission
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if rating is selected
    if (!currentRating) {
        alert('請選擇評分！');
        return;
    }

    // Check if user is logged in
    if (!currentUser) {
        alert('You must be logged in to submit a review!');
        return;
    }

    const content = e.target.querySelector('textarea').value;
    
    // Check review length
    if (content.length < 10) {
        alert('評論內容至少需要10個字！');
        return;
    }

    // Create new review
    const newReview = {
        rating: currentRating,
        content,
        date: new Date().toISOString(),
        productId,
        userId: currentUser.uid
    };

    try {
        await addDoc(collection(db, 'reviews'), newReview);
        // Reset form
        e.target.reset();
        currentRating = 0;
        const starIcons = document.querySelectorAll('.rating-area .star-icon');
        starIcons.forEach(icon => icon.setAttribute('icon', 'mdi:star-outline'));
        document.querySelector('.rating-text').textContent = '請選擇評分';

        // Update page
        updateRatingSummary();
        loadReviews();
    } catch (error) {
        console.error('Error adding review:', error);
    }
});

// Handle star rating
document.querySelectorAll('.rating-area .star-icon').forEach(star => {
    star.addEventListener('click', function() {
        const rating = parseInt(this.getAttribute('data-index'));
        currentRating = rating;
        
        // Update star display
        document.querySelectorAll('.rating-area .star-icon').forEach((icon, index) => {
            icon.setAttribute('icon', index < rating ? 'mdi:star' : 'mdi:star-outline');
        });

    });
});

// Add delete review function
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

// Add edit review function
window.editReview = function(reviewId) {
    const reviewItem = document.querySelector(`[data-index="${reviewId}"]`);
    const content = reviewItem.querySelector('.review-content');
    
    // Create edit form
    const editForm = document.createElement('form');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
        <textarea required minlength="10" maxlength="500">${content.textContent}</textarea>
        <div class="edit-actions">
            <button type="submit" class="save-btn">保存</button>
            <button type="button" class="cancel-btn">取消</button>
        </div>
    `;

    // Replace original content with edit form
    content.innerHTML = '';
    content.appendChild(editForm);

    // Handle form submission
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

    // Handle cancel edit
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

// Initialize page on load
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