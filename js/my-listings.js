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

    listingsGrid.innerHTML = "<p>Loading listings...</p>";
    const products = await window.CampusCart.fetchProducts();

    if (listingCount) listingCount.textContent = products.length;

    listingsGrid.innerHTML = "";

    if (!products || products.length === 0) {
        if (noListings) noListings.style.display = "block";
        return;
    }

    if (noListings) noListings.style.display = "none";

    products.forEach(item => {
        const id = item._id || item.customId;
        const imgMarkup = item.imageUrl ? `<img src="${item.imageUrl}" style="width: 100%; height: 160px; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px;" alt="${escapeHTML(item.name)}">` : `<div class="my-listing-image">${getIcon(item.category)}</div>`;

        const card = document.createElement("div");
        card.className = "my-listing-card";

        card.innerHTML = `
            ${imgMarkup}

            <div class="my-listing-content">
                <span class="listing-category">${formatCategory(item.category)}</span>
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

    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
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