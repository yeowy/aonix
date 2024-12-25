let index = 0; 

// 計算輪播圖容器中圖片的數量
let imageCount = document.querySelectorAll(".carousel .container img").length; 
// 獲取輪播圖下方用於放置指示器的容器元素
const bottom = document.querySelector(".carousel .bottom"); 

for (let i = 0; i < imageCount; i++) { 

    const indicator = document.createElement("div"); 
    indicator.classList.add("indicator"); // 為指示器添加類名indicator

    indicator.onclick = () => setIndex(i); // 設定指示器的onclick事件

    bottom.append(indicator); // 將每個指示器添加到bottom容器中
}

// 創建自動輪播功能的函數
function createAuto() { // 
    return setInterval(() => { 
        index++; 
        refresh(); 
    }, 3000);
}

let autoTimer = createAuto(); // 存儲返回的定時器ID，用於後續清除定時器

function refresh() { 
    if (index < 0) { 
        index = imageCount - 1; // 將index設置為最後一張圖片
    } else if (index >= imageCount) { 
        index = 0; // 將index設置為第一張圖片
    }

    let carousel = document.querySelector(".carousel"); 

    let width = getComputedStyle(carousel).width; // 獲取輪播圖容器的寬度
    width = Number(width.slice(0, -2)); // 去掉單位px，並將其轉換為數字

    carousel.querySelector(".container").style.left = 
        index * width * -1.01 + "px"; // 使其顯示對應的圖片
}

let refreshWrapper = (func) => { 
    return function (...args) { 
        let result = func(...args); 
        refresh(); 

        clearInterval(autoTimer); 
        autoTimer = createAuto(); 
        return result; 
    };
};
// 向左切換圖片的函數
let leftShift = refreshWrapper(() => { 
    index--; 
});
// 向右切換圖片的函數
let rightShift = refreshWrapper(() => { 
    index++; 
});
// 直接跳轉到指定索引的圖片的函數
let setIndex = refreshWrapper((idx) => { 
    index = idx; 
});

refresh(); // 初始化時顯示正確的圖片
