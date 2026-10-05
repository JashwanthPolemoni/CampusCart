/* =========================================================
   CAMPUSCART - FAVORITES PAGE SCRIPT (REAL IMAGES + API)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    renderFavorites();
});

async function renderFavorites() {
    const grid = document.getElementById("favoritesGrid");
    const noFavs = document.getElementById("noFavorites");
    const countEl = document.getElementById("favCount");
    if (!grid) return;

    grid.innerHTML = "<p>Loading favorites...</p>";

    const favData = await window.CampusCart.fetchFavorites();
    const favProducts = favData.products || [];

    countEl.textContent = favProducts.length;

    if (favProducts.length === 0) {
        grid.style.display = "none";
        noFavs.style.display = "block";
        return;
    }

    grid.style.display = "grid";
    noFavs.style.display = "none";
    grid.innerHTML = "";

    favProducts.forEach(item => {
        const id = item._id || item.customId;
        const imgMarkup = item.imageUrl ? `<img src="${item.imageUrl}" class="product-real-img" alt="${escapeHTML(item.name)}">` : `<div class="product-placeholder">${getIcon(item.category)}</div>`;

        const card = document.createElement("article");
        card.className = "market-product-card";
        card.innerHTML = `
            <div class="market-product-image">
                ${imgMarkup}
                <button class="market-heart" onclick="removeFavorite('${id}', event)" title="Remove Favorite" style="color: #dc2626;">♥</button>
            </div>
            <div class="market-product-content">
                <span class="product-card-category">${item.category ? item.category.toUpperCase() : 'GENERAL'}</span>
                <h3>${escapeHTML(item.name)}</h3>
                <p class="product-card-description">${escapeHTML(item.description)}</p>
                <div class="product-card-bottom">
                    <strong>₹${item.price}</strong>
                    <span class="product-condition-small">${item.condition || 'Good'}</span>
                </div>
                <div class="product-card-footer" style="display: flex; gap: 8px; margin-top: 12px;">
                    <a href="product-details.html?id=${id}" class="product-view-btn">View →</a>
                    <button onclick="window.CampusCart.startChatWithProduct('${id}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;">💬 Chat</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function removeFavorite(id, event) {
    event.preventDefault();
    event.stopPropagation();
    await window.CampusCart.toggleFavorite(id);
    renderFavorites();
}

function getIcon(cat) {
    const icons = { books: "📚", electronics: "💻", lab: "🔬", stationery: "✏️", hostel: "🏠", accessories: "🎒" };
    return icons[cat] || "📦";
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}
