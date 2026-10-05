/* =========================================================
   CAMPUSCART - PRODUCT DETAILS (REAL PRODUCT IMAGES + API)
   ========================================================= */

let currentProduct = null;

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    const productDetails = document.getElementById("productDetails");
    const productNotFound = document.getElementById("productNotFound");

    if (!productId) {
        if (productDetails) productDetails.style.display = "none";
        if (productNotFound) productNotFound.style.display = "block";
        return;
    }

    currentProduct = await window.CampusCart.fetchProductById(productId);

    if (currentProduct) {
        if (productNotFound) productNotFound.style.display = "none";
        if (productDetails) {
            productDetails.style.display = "grid";
            renderProductDetails(currentProduct, productDetails);
            // Set initial reserve button state based on current product status
            updateReserveButton(currentProduct.status || 'available', currentProduct.reservedBy || '');
        }
    } else {
        if (productDetails) productDetails.style.display = "none";
        if (productNotFound) productNotFound.style.display = "block";
    }

});

function renderProductDetails(product, container) {
    const id = product._id || product.customId;
    const isFav = window.CampusCart.isFavorite ? window.CampusCart.isFavorite(id) : false;
    const imgMarkup = product.imageUrl ? `<img src="${product.imageUrl}" class="product-detail-img" style="width: 100%; max-height: 380px; object-fit: cover; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.08);" alt="${escapeHTML(product.name)}">` : `<div class="product-image-placeholder">${getProductIcon(product.category)}</div>`;

    container.innerHTML = `
        <div class="product-image-section">
            <div class="product-main-image">
                ${imgMarkup}
            </div>
        </div>

        <div class="product-information">
            <div class="product-category">${formatCategory(product.category)}</div>
            <h1>${escapeHTML(product.name)}</h1>
            <div class="product-price">₹${product.price}</div>
            <div class="product-condition">
                <span class="condition-badge">${formatCondition(product.condition)} Condition</span>
            </div>
            <div class="product-divider"></div>
            <div class="product-description">
                <h2>Description</h2>
                <p>${escapeHTML(product.description)}</p>
            </div>
            <div class="product-info-grid">
                <div class="info-item">
                    <span class="info-label">Category</span>
                    <strong>${formatCategory(product.category)}</strong>
                </div>
                <div class="info-item">
                    <span class="info-label">Condition</span>
                    <strong>${formatCondition(product.condition)}</strong>
                </div>
                <div class="info-item">
                    <span class="info-label">Meeting Location</span>
                    <strong>${formatLocation(product.location)}</strong>
                </div>
                <div class="info-item">
                    <span class="info-label">Seller</span>
                    <strong>${escapeHTML(product.sellerName || "Campus Student")}</strong>
                </div>
            </div>

            <div class="product-actions" style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="btn btn-primary product-contact-btn" onclick="contactSeller()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:6px"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>Contact Seller
                </button>
                <button class="btn btn-outline favorite-product-btn ${isFav ? 'favorite-active' : ''}" onclick="toggleFavorite(this)">
                    ${isFav ? '♥ Favorited' : '♡ Favorite'}
                </button>
            </div>

            <button class="reserve-btn" style="margin-top: 16px; width: 100%; padding: 14px; background: #10b981; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer;" onclick="reserveItem()">
                Reserve This Item
            </button>

            <div class="safety-box" style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; display: flex; gap: 12px;">
                <div class="safety-icon" style="font-size: 1.5rem;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                    <h3 style="font-size: 1rem; margin-bottom: 4px;">Campus Safety Guarantee</h3>
                    <p style="font-size: 0.85rem; color: #64748b;">Meet inside campus library or canteen and verify item condition before paying.</p>
                </div>
            </div>
        </div>
    `;
}

function getProductIcon(cat) {
    const icons = { books: "📚", electronics: "💻", lab: "🔬", stationery: "✏️", hostel: "🏠", accessories: "🎒" };
    return icons[cat] || "📦";
}

function formatCategory(cat) {
    return (cat || '').toUpperCase();
}

function formatCondition(cond) {
    const c = { new: "Like New", good: "Good", used: "Used" };
    return c[cond] || cond;
}

function formatLocation(loc) {
    const l = { college: "College Campus", library: "Central Library", canteen: "Campus Canteen", hostel: "Hostel Area" };
    return l[loc] || "Campus";
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}

function contactSeller() {
    if (currentProduct) {
        const id = currentProduct._id || currentProduct.customId;
        window.CampusCart.startChatWithProduct(id);
    }
}

async function toggleFavorite(button) {
    if (!currentProduct) return;
    const id = currentProduct._id || currentProduct.customId;
    const isAdded = await window.CampusCart.toggleFavorite(id);
    if (isAdded) {
        button.classList.add("favorite-active");
        button.innerHTML = "♥ Favorited";
    } else {
        button.classList.remove("favorite-active");
        button.innerHTML = "♡ Favorite";
    }
}

function reserveItem() {
    if (!currentProduct) return;

    // Check if user is logged in
    const user = window.CampusCart.getCurrentUser ? window.CampusCart.getCurrentUser() : null;
    const userName = user ? (user.name || user.email) : localStorage.getItem('campuscart_username');

    if (!userName) {
        window.CampusCart.showToast('Please log in to reserve this item.', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return;
    }

    const id = currentProduct._id || currentProduct.customId;

    fetch(`/api/products/${id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservedBy: userName })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentProduct = data.product;
            window.CampusCart.showToast('🎉 Item reserved! Contact the seller to arrange pickup.', 'success');
            updateReserveButton('reserved', userName);
        } else {
            window.CampusCart.showToast(data.error || 'Could not reserve item.', 'error');
        }
    })
    .catch(() => {
        window.CampusCart.showToast('Network error. Please try again.', 'error');
    });
}

function cancelReservation() {
    if (!currentProduct) return;

    const user = window.CampusCart.getCurrentUser ? window.CampusCart.getCurrentUser() : null;
    const userName = user ? (user.name || user.email) : localStorage.getItem('campuscart_username');
    const id = currentProduct._id || currentProduct.customId;

    fetch(`/api/products/${id}/unreserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservedBy: userName })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            currentProduct = data.product;
            window.CampusCart.showToast('Reservation cancelled.', 'success');
            updateReserveButton('available', '');
        } else {
            window.CampusCart.showToast(data.error || 'Could not cancel reservation.', 'error');
        }
    })
    .catch(() => {
        window.CampusCart.showToast('Network error. Please try again.', 'error');
    });
}

function updateReserveButton(status, reservedBy) {
    const btn = document.querySelector('.reserve-btn');
    if (!btn) return;

    const user = window.CampusCart.getCurrentUser ? window.CampusCart.getCurrentUser() : null;
    const userName = user ? (user.name || user.email) : localStorage.getItem('campuscart_username');

    if (status === 'available') {
        btn.disabled = false;
        btn.style.background = '#10b981';
        btn.style.cursor = 'pointer';
        btn.style.opacity = '1';
        btn.onclick = reserveItem;
        btn.textContent = 'Reserve This Item';
    } else if (status === 'reserved') {
        if (reservedBy === userName) {
            // Current user reserved it — show cancel option
            btn.disabled = false;
            btn.style.background = '#ef4444';
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
            btn.onclick = cancelReservation;
            btn.textContent = '✅ Reserved by You — Cancel Reservation';
        } else {
            // Someone else reserved it
            btn.disabled = true;
            btn.style.background = '#94a3b8';
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.7';
            btn.onclick = null;
            btn.textContent = '🔒 Already Reserved';
        }
    } else if (status === 'sold') {
        btn.disabled = true;
        btn.style.background = '#94a3b8';
        btn.style.cursor = 'not-allowed';
        btn.style.opacity = '0.7';
        btn.onclick = null;
        btn.textContent = '❌ Item Sold';
    }
}