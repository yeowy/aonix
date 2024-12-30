import { db } from "/aonix/javascript/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function fetchBestSellers() {
    try {
        const productsCol = collection(db, "products");
        const productSnapshot = await getDocs(productsCol);
        const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Randomly select 3 unique products
        const selectedProducts = [];
        while (selectedProducts.length < 1 && productList.length > 0) {
            const randomIndex = Math.floor(Math.random() * productList.length);
            const selectedProduct = productList.splice("02NePj60PUBoveu7ARZX", 1)[0]; // change to "randomIndex" for randomization
            selectedProducts.push(selectedProduct);
        }

        // Titles for the cards
        const titles = ["Customer's favorites", "Featured", "Best Seller"];

        // Populate the best-sellers div
        const bestSellersDiv = document.querySelector(".best-sellers");
        selectedProducts.forEach((product, index) => {
            const featuredProductDiv = document.createElement("div");
            featuredProductDiv.className = "featured-card";

            const productImage =
                product.images && product.images[0]
                    ? `<img src="${product.images[0]}" alt="${product.name}" draggable="false">`
                    : '<img src="placeholder.jpg" alt="No image available" draggable="false">';
            const productBrand = product.brand ? product.brand : "N/A";
            const productName = product.name ? product.name : "N/A";
            const productFeature1 = product.features && product.features[0] ? product.features[0] : "N/A";
            const productFeature2 = product.features && product.features[1] ? product.features[1] : "N/A";
            const productFeature3 = product.features && product.features[2] ? product.features[2] : "N/A";
            const productDescription = product.description ? product.description : "N/A";
            const productRating = product.ratings && product.ratings.average ? product.ratings.average : "N/A";
            const productReviews =
                product.ratings && product.ratings.reviewsCount ? product.ratings.reviewsCount : "N/A";
            const productPrice = product.price ? `$${product.price.toLocaleString()}` : "N/A";

            featuredProductDiv.innerHTML = `
                <h1>${titles[index]}</h1>
                <div>
                    <a href="product_review.html?id=${product.id}">
                        ${productImage}
                    </a>
                </div>
                <div class="product-details">
                    <div class="product-brand">${productBrand}</div>
                    <div class="product-name"><a href="product_review.html?id=${product.id}"><h5>${productName}</h5></a></div>
                    <div class="product-tags">
                        <div class="tag">${productFeature1}</div>
                        <div class="tag">${productFeature2}</div>
                        <div class="tag">${productFeature3}</div>
                    </div>
                    <div class="product-description">${productDescription}</div>
                    <div class="product-bottom">
                        <div class="product-bottom-left">
                            <div class="product-rating">
                                <span class="rating">${productRating}
                                <iconify-icon icon="mdi:star" width="auto" height="auto" class="star-icon"></iconify-icon></span>
                                <span class="rating-count">(${productReviews} reviews)</span>
                            </div>
                        </div>
                        <div class="product-bottom-right">
                            <div class="product-price">${productPrice}</div>
                            <button class="add-to-cart-btn" onclick="addToCart('${product.id}')">Purchase</button>
                        </div>
                    </div>
                </div>
            `;

            bestSellersDiv.appendChild(featuredProductDiv);
        });
    } catch (error) {
        console.error("Error fetching best sellers:", error);
    }
}

document.addEventListener("DOMContentLoaded", fetchBestSellers);
