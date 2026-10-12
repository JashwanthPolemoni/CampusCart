/* =========================================================
   CAMPUSCART - HOME DASHBOARD SCRIPT (DYNAMIC RECENT ITEMS)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    initHomeDashboard();
});

async function initHomeDashboard() {
    updateUserGreeting();
    await loadRecentProducts();
    await loadDashboardStats();
}

function updateUserGreeting() {
    const user = window.CampusCart.getUser ? window.CampusCart.getUser() : { isLoggedIn: false };
    const nameEl = document.getElementById("userName");
    if (nameEl) {
        nameEl.textContent = user.name || "Student";
    }
}

async function loadRecentProducts() {
    const container = document.getElementById("recentProductsContainer");
    if (!container) return;

    try {
        const products = await window.CampusCart.fetchProducts();

        if (!products || products.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 16px; border: 1px dashed #cbd5e1;">
                    <p style="font-size: 1.1rem; color: #64748b; margin-bottom: 12px;">No listings posted yet. Be the first to sell!</p>
                    <a href="sell.html" class="btn btn-primary">+ Post an Item</a>
                </div>
            `;
            return;
        }

        // Show the latest 4 items
        const recent = products.slice(0, 4);
        container.innerHTML = "";

        recent.forEach(item => {
            const id = item._id || item.customId;
            const isFav = window.CampusCart.isFavorite ? window.CampusCart.isFavorite(id) : false;
            const imgMarkup = item.imageUrl
                ? `<img src="${item.imageUrl}" class="product-real-img" alt="${escapeHTML(item.name)}">`
                : `<div class="product-placeholder" style="width:100%; height:180px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color:white; font-size:2.5rem;">${getProductIcon(item.category)}</div>`;

            const isReserved = item.status === 'reserved';
            const isSold = item.status === 'sold';
            let statusBadge = '';
            if (isReserved) {
                statusBadge = `<span style="position: absolute; top: 10px; left: 10px; background: rgba(225, 29, 72, 0.9); color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; z-index: 2;">Reserved</span>`;
            } else if (isSold) {
                statusBadge = `<span style="position: absolute; top: 10px; left: 10px; background: rgba(100, 116, 139, 0.9); color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; z-index: 2;">Sold</span>`;
            }

            const card = document.createElement("article");
            card.className = "dashboard-product-card";

            card.innerHTML = `
                <div class="dashboard-product-image" style="padding: 0; overflow: hidden; position: relative;">
                    ${statusBadge}
                    ${imgMarkup}
                    <button class="product-heart ${isFav ? 'favorite-active' : ''}" type="button" onclick="toggleHomeFavorite('${id}', this)">
                        ${isFav ? '♥' : '♡'}
                    </button>
                </div>
                <div class="dashboard-product-content">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                        <span class="product-category">${(item.category || '').toUpperCase()}</span>
                        <small style="color:#64748b; font-size:0.75rem;">${escapeHTML(item.sellerName || 'Student')}</small>
                    </div>
                    <h3>
                        <a href="product-details.html?id=${id}" style="text-decoration: none; color: inherit;">
                            ${escapeHTML(item.name)}
                        </a>
                    </h3>
                    <p>
                        ${formatCondition(item.condition)} • ${escapeHTML(item.location || 'Campus')}
                    </p>
                    <div class="dashboard-product-bottom">
                        <strong>₹${item.price}</strong>
                        <a href="product-details.html?id=${id}" class="view-all">
                            ${isReserved ? 'Details →' : 'View →'}
                        </a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error("Error loading recent products:", err);
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #ef4444;">Unable to load items. Please refresh.</div>`;
    }
}

async function loadDashboardStats() {
    try {
        const products = await window.CampusCart.fetchProducts();
        const statActive = document.getElementById("statActiveListings");
        if (statActive) {
            statActive.textContent = (products || []).length;
        }

        const favData = await window.CampusCart.fetchFavorites();
        const statFav = document.getElementById("statFavCount");
        if (statFav && favData && favData.favorites) {
            statFav.textContent = favData.favorites.length;
        }

        const messages = await window.CampusCart.fetchMessages();
        const statMsg = document.getElementById("statMsgCount");
        if (statMsg) {
            statMsg.textContent = (messages || []).length;
        }
    } catch (e) {
        // Stats fallback gracefully
    }
}

async function toggleHomeFavorite(productId, btn) {
    const isAdded = await window.CampusCart.toggleFavorite(productId);
    btn.textContent = isAdded ? '♥' : '♡';
    btn.style.color = isAdded ? '#dc2626' : '';
}

function getProductIcon(category) {
    const icons = { books: "📚", electronics: "💻", lab: "🔬", stationery: "✏️", hostel: "🏠", accessories: "🎒" };
    return icons[category] || "📦";
}

function formatCondition(condition) {
    const map = { new: 'Like New', good: 'Good Condition', used: 'Used' };
    return map[condition] || 'Good Condition';
}

function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
}
