/* =========================================================
   CAMPUSCART - UNIFIED API ENGINE (MONGODB + EXPRESS BACKEND)
   ========================================================= */

(function () {
    const API_BASE = '/api';

    window.CampusCart = {
        apiBase: API_BASE,

        getUser: function () {
            try {
                const stored = localStorage.getItem("campuscart_user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && parsed.name) {
                        return { ...parsed, isLoggedIn: true };
                    }
                }
                return { isLoggedIn: false };
            } catch (e) {
                return { isLoggedIn: false };
            }
        },

        setUser: function (userObj) {
            localStorage.setItem("campuscart_user", JSON.stringify({ ...userObj, isLoggedIn: true }));
            this.renderHeader();
            this.updateDashboardUser();
        },

        logout: function () {
            localStorage.removeItem("campuscart_user");
            window.location.href = "campuscart.html";
        },

        // API Async Methods
        fetchProducts: async function (queryParams = {}) {
            try {
                const params = new URLSearchParams(queryParams).toString();
                const res = await fetch(`${API_BASE}/products?${params}`);
                if (!res.ok) throw new Error('Failed to fetch products');
                return await res.json();
            } catch (err) {
                console.error("API Error fetchProducts:", err);
                return [];
            }
        },

        fetchProductById: async function (id) {
            try {
                const res = await fetch(`${API_BASE}/products/${id}`);
                if (!res.ok) return null;
                return await res.json();
            } catch (err) {
                console.error("API Error fetchProductById:", err);
                return null;
            }
        },

        fetchFavorites: async function () {
            try {
                const user = this.getUser();
                if (!user.isLoggedIn) return { favorites: [], products: [] };
                const res = await fetch(`${API_BASE}/favorites?userId=${user.id || user.email || 'guest'}`);
                if (!res.ok) throw new Error('Failed to fetch favorites');
                return await res.json();
            } catch (err) {
                console.error("API Error fetchFavorites:", err);
                return { favorites: [], products: [] };
            }
        },

        toggleFavorite: async function (productId) {
            try {
                const user = this.getUser();
                if (!user.isLoggedIn) {
                    this.showToast("Please login to save favorites", "info");
                    setTimeout(() => { window.location.href = "login.html"; }, 1200);
                    return false;
                }
                const res = await fetch(`${API_BASE}/favorites/toggle`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id || user.email || 'guest', productId: String(productId) })
                });
                const data = await res.json();
                this.showToast(data.isAdded ? "Added to Favorites" : "Removed from Favorites", data.isAdded ? "success" : "info");
                this.renderHeader();
                return data.isAdded;
            } catch (err) {
                console.error("API Error toggleFavorite:", err);
                return false;
            }
        },

        fetchMessages: async function () {
            try {
                const user = this.getUser();
                if (!user.isLoggedIn) return [];
                const res = await fetch(`${API_BASE}/messages?userId=${user.id || user.email || 'guest'}`);
                if (!res.ok) throw new Error('Failed to fetch messages');
                return await res.json();
            } catch (err) {
                console.error("API Error fetchMessages:", err);
                return [];
            }
        },

        sendMessage: async function (threadId, text) {
            try {
                const res = await fetch(`${API_BASE}/messages/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ threadId, text, sender: 'buyer' })
                });
                return await res.json();
            } catch (err) {
                console.error("API Error sendMessage:", err);
                return null;
            }
        },

        startChatWithProduct: async function (productId) {
            try {
                const user = this.getUser();
                if (!user.isLoggedIn) {
                    this.showToast("Please login to chat with seller", "info");
                    setTimeout(() => { window.location.href = "login.html"; }, 1200);
                    return;
                }
                const res = await fetch(`${API_BASE}/messages/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id || user.email, buyerName: user.name || "Student", productId: String(productId) })
                });
                const data = await res.json();
                if (data.success && data.thread) {
                    window.location.href = `messages.html?threadId=${data.thread.threadId}`;
                }
            } catch (err) {
                console.error("API Error startChatWithProduct:", err);
            }
        },

        showToast: function (text, type = "info") {
            let toast = document.getElementById("cc-toast");
            if (!toast) {
                toast = document.createElement("div");
                toast.id = "cc-toast";
                document.body.appendChild(toast);
            }
            toast.className = `cc-toast cc-toast-${type} show`;
            toast.textContent = text;
            setTimeout(() => { toast.classList.remove("show"); }, 3000);
        },

        updateDashboardUser: function () {
            const userNameEl = document.getElementById("userName");
            if (userNameEl) {
                const user = this.getUser();
                if (user.isLoggedIn && user.name) {
                    userNameEl.textContent = user.name.split(" ")[0];
                } else {
                    userNameEl.textContent = "Student";
                }
            }
        },

        // SVG icon helpers
        _svgHeart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>`,
        _svgChat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path></svg>`,
        _svgUser: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        _svgCart: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

        renderHeader: async function () {
            const navContainer = document.querySelector(".navbar .nav-container");
            if (!navContainer) return;
            const user = this.getUser();
            const currentPage = window.location.pathname.split("/").pop() || "index.html";

            if (user.isLoggedIn) {
                const favData = await this.fetchFavorites();
                const favCount = favData.favorites ? favData.favorites.length : 0;
                const threads = await this.fetchMessages();
                const unreadCount = threads ? threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0) : 0;
                const firstName = user.name ? user.name.split(" ")[0] : "Profile";

                navContainer.innerHTML = `
                    <a href="home.html" class="logo">
                        ${this._svgCart}
                        <span>CampusCart</span>
                    </a>
                    <nav class="nav-links">
                        <a href="home.html" class="${currentPage === 'home.html' ? 'active' : ''}">Home</a>
                        <a href="products.html" class="${currentPage === 'products.html' ? 'active' : ''}">Browse</a>
                        <a href="sell.html" class="${currentPage === 'sell.html' ? 'active' : ''}">Sell</a>
                        <a href="favorites.html" class="${currentPage === 'favorites.html' ? 'active' : ''} nav-badge-item" title="Favorites">
                            ${this._svgHeart} ${favCount > 0 ? `<span class="nav-badge">${favCount}</span>` : ''}
                        </a>
                        <a href="messages.html" class="${currentPage === 'messages.html' ? 'active' : ''} nav-badge-item" title="Messages">
                            ${this._svgChat} ${unreadCount > 0 ? `<span class="nav-badge">${unreadCount}</span>` : ''}
                        </a>
                        <a href="my-listings.html" class="${currentPage === 'my-listings.html' ? 'active' : ''}">My Listings</a>
                        <a href="profile.html" class="btn btn-primary ${currentPage === 'profile.html' ? 'active' : ''}">
                            ${this._svgUser} ${firstName}
                        </a>
                    </nav>
                `;
            } else {
                navContainer.innerHTML = `
                    <a href="campuscart.html" class="logo">
                        ${this._svgCart}
                        <span>CampusCart</span>
                    </a>
                    <nav class="nav-links">
                        <a href="campuscart.html">Home</a>
                        <a href="campuscart.html#categories">Categories</a>
                        <a href="campuscart.html#how-it-works">How It Works</a>
                        <a href="login.html" class="nav-login">Login</a>
                        <a href="register.html" class="btn btn-primary">Get Started</a>
                    </nav>
                `;
            }
        }
    };

    document.addEventListener("DOMContentLoaded", function () {
        window.CampusCart.renderHeader();
        window.CampusCart.updateDashboardUser();
    });
})();
