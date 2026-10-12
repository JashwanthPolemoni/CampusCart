/* =========================================================
   CAMPUSCART - MY LISTINGS (REAL IMAGES + API)
   ========================================================= */

const listingsGrid = document.getElementById("myListingsGrid");
const noListings = document.getElementById("noListings");
const listingCount = document.getElementById("listingCount");

document.addEventListener("DOMContentLoaded", function () {
    loadListings();
});

async function loadListings() {
    if (!listingsGrid) return;

    const user = window.CampusCart.getUser();
    if (!user.isLoggedIn) {
        listingsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: white; border-radius: 16px;">
                <p style="font-size: 1.1rem; color: #64748b; margin-bottom: 16px;">Please log in to view and manage your posted items.</p>
                <a href="login.html?redirect=my-listings.html" class="btn btn-primary">Login Now</a>
            </div>
        `;
        if (listingCount) listingCount.textContent = "0";
        return;
    }

    listingsGrid.innerHTML = "<p>Loading your listings...</p>";
    const allProducts = await window.CampusCart.fetchProducts();

    const userEmail = (user.email || '').toLowerCase();
    const userName = (user.name || '').toLowerCase();

    // Filter to only items owned by this student
    const myListings = (allProducts || []).filter(item => {
        const prodEmail = (item.sellerEmail || '').toLowerCase();
        const prodName = (item.sellerName || '').toLowerCase();
        return (prodEmail && prodEmail === userEmail) || (prodName && prodName === userName);
    });

    if (listingCount) listingCount.textContent = myListings.length;
    listingsGrid.innerHTML = "";

    if (myListings.length === 0) {
        if (noListings) {
            noListings.style.display = "block";
            noListings.innerHTML = `
                <div class="no-listings-icon">📦</div>
                <h2>No Active Listings Yet</h2>
                <p>You haven't listed any items for sale yet. Post an item to sell it to fellow campus students!</p>
                <a href="sell.html" class="btn btn-primary" style="margin-top: 12px;">+ Post an Item for Sale</a>
            `;
        }
        return;
    }

    if (noListings) noListings.style.display = "none";

    myListings.forEach(item => {
        const id = item._id || item.customId;
        const statusBadge = item.status === 'reserved'
            ? `<span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">RESERVED</span>`
            : (item.status === 'sold'
                ? `<span style="background: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">SOLD</span>`
                : `<span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;">ACTIVE</span>`);

        const imgMarkup = item.imageUrl ? `<img src="${item.imageUrl}" style="width: 100%; height: 160px; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px;" alt="${escapeHTML(item.name)}">` : `<div class="my-listing-image">${getIcon(item.category)}</div>`;

        const card = document.createElement("div");
        card.className = "my-listing-card";

        card.innerHTML = `
            ${imgMarkup}

            <div class="my-listing-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span class="listing-category">${formatCategory(item.category)}</span>
                    ${statusBadge}
                </div>
                <h3>${escapeHTML(item.name)}</h3>
                <p>${escapeHTML(item.description)}</p>
                <div class="listing-price">₹${item.price}</div>
                <div class="listing-meta">
                    <span>${formatCondition(item.condition)}</span>
                    <span>📍 ${formatLocation(item.location)}</span>
                </div>
                <div class="listing-actions">
                    <a href="product-details.html?id=${id}" class="btn btn-outline">View</a>
                    <a href="edit-listing.html?id=${id}" class="btn btn-outline edit-listing-btn">✏ Edit</a>
                    <button class="delete-listing-btn" onclick="deleteListing('${id}')">🗑 Delete</button>
                </div>
            </div>
        `;
        listingsGrid.appendChild(card);
    });
}

async function deleteListing(id) {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    const user = window.CampusCart.getUser();
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: user.email, userName: user.name })
        });
        const data = await res.json();
        if (data.success) {
            window.CampusCart.showToast("Listing deleted successfully", "info");
            loadListings();
        } else {
            alert(data.error || "Failed to delete listing.");
        }
    } catch (err) {
        alert("Server connection error.");
    }
}

function getIcon(cat) {
    const icons = { books: "📚", electronics: "💻", lab: "🔬", stationery: "✏️", hostel: "🏠", accessories: "🎒" };
    return icons[cat] || "📦";
}

function formatCategory(cat) { return (cat || '').toUpperCase(); }
function formatCondition(cond) { return cond || 'Good'; }
function formatLocation(loc) { return loc || 'Campus'; }
function escapeHTML(str) { const div = document.createElement("div"); div.textContent = str || ""; return div.innerHTML; }