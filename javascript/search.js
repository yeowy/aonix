function toggleHint() {
    const hint = document.getElementById('searchHint');
    if (hint.style.display === 'none' || hint.style.display === '') {
        hint.style.display = 'block'; 
    } else {
        hint.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 為所有箭頭按鈕添加點擊事件
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // 防止事件冒泡
            
            // 獲取對應的下拉內容
            const dropdownContent = btn.closest('.category-header').nextElementSibling;
            
            // 切換 active 類
            dropdownContent.classList.toggle('active');
            btn.classList.toggle('active');
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    // 為所有分類項目添加點擊事件
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            // 切換當前項目的選中狀態
            item.classList.toggle('selected');
            
            // 獲取選中的分類
            const category = item.getAttribute('data-category');
            
            // 這裡可以添加篩選商品的邏輯
            filterProducts(category, item.classList.contains('selected'));
        });
    });
});

// 篩選商品的函數
function filterProducts(category, isSelected) {
    // 獲取所有選中的分類
    const selectedCategories = Array.from(document.querySelectorAll('.category-item.selected'))
        .map(item => item.getAttribute('data-category'));
    
    // 如果沒有選中的分類，顯示所有商品
    if (selectedCategories.length === 0) {
        displayProducts(products);
        return;
    }
    
    // 篩選符合選中分類的商品
    const filteredProducts = products.filter(product => 
        selectedCategories.includes(product.category.toLowerCase())
    );
    
    // 顯示篩選後的商品
    displayProducts(filteredProducts);
}