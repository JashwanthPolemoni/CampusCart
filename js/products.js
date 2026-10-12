/* =========================================================
   CAMPUSCART - PRODUCTS MARKETPLACE SCRIPT (REAL IMAGES + API)
   ========================================================= */

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const priceRange = document.getElementById("priceRange");
const priceValue = document.getElementById("priceValue");
const clearFilters = document.getElementById("clearFilters");
const resultCount = document.getElementById("resultCount");
const productsGrid = document.getElementById("productsGrid");
const emptyProducts = document.getElementById("emptyProducts");

document.addEventListener("DOMContentLoaded", function () {
    loadCategoryFromURL();
    fetchAndRenderProducts();
});

async function fetchAndRenderProducts() {
    if (!productsGrid) return;

    const searchText = searchInput ? searchInput.value.trim() : "";
    const selectedCategory = document.querySelector('input[name="category"]:checked');
    const category = selectedCategory ? selectedCategory.value : "all";
    const selectedConditions = Array.from(document.querySelectorAll('input[name="condition"]:checked')).map(c => c.value);

    const queryParams = {};
    if (category && category !== "all") queryParams.category = category;
    if (searchText) queryParams.search = searchText;
    if (selectedConditions.length > 0) queryParams.condition = selectedConditions.join(',');

    // Only apply maxPrice if the user has specifically moved the slider below maximum
    if (priceRange && Number(priceRange.value) < Number(priceRange.max)) {
        queryParams.maxPrice = priceRange.value;
    }

    const products = await window.CampusCart.fetchProducts(queryParams);
    renderProductCards(products);
}

function renderProductCards(products) {
    productsGrid.innerHTML = "";

    if (!products || products.length === 0) {
        if (resultCount) resultCount.textContent = 0;
        if (emptyProducts) emptyProducts.style.display = "block";
        return;
    }

    if (emptyProducts) emptyProducts.style.display = "none";
    if (resultCount) resultCount.textContent = products.length;

    // Apply sorting
    const sortType = sortSelect ? sortSelect.value : "latest";
    products.sort((a, b) => {
        if (sortType === "low") return a.price - b.price;
        if (sortType === "high") return b.price - a.price;
        if (sortType === "name") return a.name.localeCompare(b.name);
        return 0;
    });

    products.forEach(item => {
        const id = item._id || item.customId;
        const isFav = window.CampusCart.isFavorite ? window.CampusCart.isFavorite(id) : false;
        const imgMarkup = item.imageUrl ? `<img src="${item.imageUrl}" class="product-real-img" alt="${escapeHTML(item.name)}">` : `<div class="product-placeholder">${getProductIcon(item.category)}</div>`;

        const isReserved = item.status === 'reserved';
        const isSold = item.status === 'sold';
        let statusBadge = '';
        if (isReserved) {
            statusBadge = `<span style="position: absolute; top: 12px; left: 12px; background: rgba(225, 29, 72, 0.9); color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; z-index: 2;">Reserved</span>`;
        } else if (isSold) {
            statusBadge = `<span style="position: absolute; top: 12px; left: 12px; background: rgba(100, 116, 139, 0.9); color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; z-index: 2;">Sold</span>`;
        }

        const card = document.createElement("article");
        card.className = "market-product-card";
        card.dataset.category = item.category;
        card.dataset.condition = item.condition;
        card.dataset.price = item.price;
        card.dataset.name = item.name;

        card.innerHTML = `
            <div class="market-product-image" style="position: relative;">
                ${statusBadge}
                ${imgMarkup}
                <button class="market-heart ${isFav ? 'favorite-active' : ''}" type="button" onclick="toggleCardFavorite('${id}', this)">
                    ${isFav ? '♥' : '♡'}
                </button>
            </div>
            <div class="market-product-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span class="product-category">${formatCategory(item.category)}</span>
                    <small style="color:#64748b; font-size:0.75rem;">${escapeHTML(item.sellerName || 'Student')}</small>
                </div>
                <h3>${escapeHTML(item.name)}</h3>
                <p class="product-card-description">${escapeHTML(item.description)}</p>
                <div class="market-product-bottom">
                    <strong>₹${item.price}</strong>
                    <a href="product-details.html?id=${id}">${isReserved ? 'Details →' : 'View →'}</a>
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

async function toggleCardFavorite(productId, btn) {
    const isAdded = await window.CampusCart.toggleFavorite(productId);
    btn.textContent = isAdded ? '♥' : '♡';
    btn.style.color = isAdded ? '#dc2626' : '';
}

function loadCategoryFromURL() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (!category) return;
    const categoryInput = document.querySelector(`input[name="category"][value="${category}"]`);
    if (categoryInput) {
        categoryInput.checked = true;
    }
}

function getProductIcon(category) {
    const icons = { books: "📚", electronics: "💻", lab: "🔬", stationery: "✏️", hostel: "🏠", accessories: "🎒" };
    return icons[category] || "📦";
}

function formatCategory(category) {
    return (category || '').toUpperCase();
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}

// Event Listeners
if (searchInput) searchInput.addEventListener("input", fetchAndRenderProducts);
if (sortSelect) sortSelect.addEventListener("change", fetchAndRenderProducts);
if (priceRange) {
    priceRange.addEventListener("input", function () {
        if (priceValue) {
            if (Number(priceRange.value) >= Number(priceRange.max)) {
                priceValue.textContent = "All Prices";
            } else {
                priceValue.textContent = "₹" + priceRange.value;
            }
        }
        fetchAndRenderProducts();
    });
}

document.querySelectorAll('input[name="category"]').forEach(filter => filter.addEventListener("change", fetchAndRenderProducts));
document.querySelectorAll('input[name="condition"]').forEach(filter => filter.addEventListener("change", fetchAndRenderProducts));

if (clearFilters) {
    clearFilters.addEventListener("click", function () {
        if (searchInput) searchInput.value = "";
        const allCategory = document.querySelector('input[name="category"][value="all"]');
        if (allCategory) allCategory.checked = true;
        document.querySelectorAll('input[name="condition"]').forEach(cb => cb.checked = false);
        if (priceRange) {
            priceRange.value = priceRange.max;
            if (priceValue) priceValue.textContent = "All Prices";
        }
        fetchAndRenderProducts();
    });
}