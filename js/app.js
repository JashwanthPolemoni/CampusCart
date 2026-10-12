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
                    // Accept as logged in if we have either name or email
                    if (parsed && (parsed.name || parsed.email)) {
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

        getCurrentUser: function () {
            return this.getUser();
        },

        fetchMessages: async function () {
            try {
                const user = this.getUser();
                if (!user.isLoggedIn) return [];
                const email = encodeURIComponent((user.email || user.id || '').toLowerCase());
                const res = await fetch(`${API_BASE}/messages?email=${email}`);
                if (!res.ok) throw new Error('Failed to fetch messages');
                return await res.json();
            } catch (err) {
                console.error("API Error fetchMessages:", err);
                return [];
            }
        },

        sendMessage: async function (threadId, text) {
            try {
                const user = this.getUser();
                if (!user.isLoggedIn) return null;
                const res = await fetch(`${API_BASE}/messages/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        threadId,
                        text,
                        senderEmail: (user.email || '').toLowerCase(),
                        senderName: user.name || 'Student'
                    })
                });
                return await res.json();
            } catch (err) {
                console.error("API Error sendMessage:", err);
                return null;
            }
        },

        startChatWithProduct: async function (productId, optionalTargetEmail, optionalTargetName) {
            try {
                const user = this.getUser();
                if (!user.isLoggedIn) {
                    this.showToast("Please login to chat with seller", "info");
                    const currentUrl = encodeURIComponent(window.location.href);
                    setTimeout(() => { window.location.href = `login.html?redirect=${currentUrl}`; }, 1200);
                    return;
                }
                const res = await fetch(`${API_BASE}/messages/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        senderEmail: (user.email || '').toLowerCase(),
                        senderName: user.name || "Student",
                        targetEmail: optionalTargetEmail ? optionalTargetEmail.toLowerCase() : '',
                        targetName: optionalTargetName || '',
                        productId: String(productId)
                    })
                });
                const data = await res.json();
                if (data.success && data.thread) {
                    const currentPage = window.location.pathname.split("/").pop() || "index.html";
                    if (currentPage === "messages.html") {
                        window.location.href = `messages.html?threadId=${data.thread.threadId}`;
                    } else {
                        // Instantly open in WhatsApp dock without leaving current page!
                        await this.openDockWithThread(data.thread.threadId);
                    }
                } else if (data.error) {
                    this.showToast(data.error, "error");
                }
            } catch (err) {
                console.error("API Error startChatWithProduct:", err);
            }
        },

        startDirectChat: async function (targetEmail, targetName) {
            try {
                const user = this.getUser();
                if (!user.isLoggedIn) {
                    this.showToast("Please login to start a chat", "info");
                    return null;
                }
                const res = await fetch(`${API_BASE}/messages/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        senderEmail: (user.email || '').toLowerCase(),
                        senderName: user.name || "Student",
                        targetEmail: targetEmail.trim().toLowerCase(),
                        targetName: targetName || targetEmail
                    })
                });
                return await res.json();
            } catch (err) {
                console.error("API Error startDirectChat:", err);
                return null;
            }
        },

        // =========================================================
        // UTILITY HELPERS
        // =========================================================
        _escapeHTML: function (str) {
            const div = document.createElement('div');
            div.textContent = str || '';
            return div.innerHTML;
        },

        // =========================================================
        // WHATSAPP-STYLE FLOATING DOCK CHAT SYSTEM
        // =========================================================
        activeDockThreadId: null,
        _cachedDockThreads: [],

        initWhatsAppChat: async function () {
            const user = this.getUser();
            if (!user.isLoggedIn || !user.email) return;

            const currentPage = window.location.pathname.split("/").pop() || "index.html";
            if (currentPage === "messages.html") return; // Fullscreen page is active

            // 1. Floating WhatsApp Button
            let floatBtn = document.getElementById("waFloatingBtn");
            if (!floatBtn) {
                floatBtn = document.createElement("div");
                floatBtn.id = "waFloatingBtn";
                floatBtn.className = "wa-floating-btn";
                floatBtn.title = "CampusChat (WhatsApp Style)";
                floatBtn.innerHTML = `
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                    <span class="wa-floating-badge" id="waUnreadBadge" style="display:none;">0</span>
                `;
                document.body.appendChild(floatBtn);
            }

            // 2. Dock Window
            let dock = document.getElementById("waChatDock");
            if (!dock) {
                dock = document.createElement("div");
                dock.id = "waChatDock";
                dock.className = "wa-chat-dock";
                dock.style.display = "none";
                dock.innerHTML = `
                    <div class="wa-dock-header">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="wa-avatar" style="background: #25d366; width: 34px; height: 34px; font-size: 1rem;">💬</div>
                            <div>
                                <div class="wa-dock-title">CampusChat</div>
                                <div class="wa-dock-sub">Connected as ${this._escapeHTML(user.name ? user.name.split(" ")[0] : 'Student')}</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <a href="messages.html" title="Open Fullscreen Chat" class="wa-icon-btn" style="text-decoration:none;">⛶</a>
                            <button id="waMinimizeBtn" title="Close" class="wa-icon-btn">✕</button>
                        </div>
                    </div>

                    <div id="waThreadsView" class="wa-threads-view">
                        <div class="wa-search-bar">
                            <input type="text" id="waSearchInput" placeholder="Search chats or students...">
                        </div>
                        <div id="waThreadsList" class="wa-threads-list">
                            <div style="padding: 24px; text-align: center; color: #94a3b8; font-size: 0.85rem;">Loading chats...</div>
                        </div>
                    </div>

                    <div id="waActiveChatView" class="wa-active-chat-view" style="display: none;">
                        <div class="wa-active-header">
                            <button id="waBackBtn" class="wa-back-btn">←</button>
                            <div class="wa-avatar sm" id="waActiveAvatar">CC</div>
                            <div style="flex:1; min-width: 0;">
                                <div class="wa-contact-name" id="waActiveContactName" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Student</div>
                                <div class="wa-contact-status" id="waActiveContactStatus">Online • Campus Marketplace</div>
                            </div>
                        </div>
                        <div class="wa-messages-box" id="waMessagesBox"></div>
                        <div class="wa-input-bar">
                            <input type="text" id="waInputText" placeholder="Type a message..." onkeypress="if(event.key==='Enter') window.CampusCart.sendDockMessage()">
                            <button onclick="window.CampusCart.sendDockMessage()" class="wa-send-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(dock);

                floatBtn.onclick = () => {
                    const isShown = dock.style.display === "flex";
                    dock.style.display = isShown ? "none" : "flex";
                    if (!isShown) {
                        this.renderDockThreads();
                    }
                };

                dock.querySelector("#waMinimizeBtn").onclick = () => {
                    dock.style.display = "none";
                };

                dock.querySelector("#waBackBtn").onclick = () => {
                    document.getElementById("waActiveChatView").style.display = "none";
                    document.getElementById("waThreadsView").style.display = "flex";
                    this.activeDockThreadId = null;
                    this.renderDockThreads();
                };

                const searchInput = dock.querySelector("#waSearchInput");
                if (searchInput) {
                    searchInput.oninput = () => this.filterDockThreads(searchInput.value.trim());
                }
            }

            // Periodic background sync for unread counter & live messages
            setInterval(async () => {
                if (document.hidden) return;
                if (dock.style.display === "flex" && this.activeDockThreadId) {
                    this.pollDockThread();
                }
            }, 3500);
        },

        openDockWithThread: async function (threadId) {
            let dock = document.getElementById("waChatDock");
            if (!dock) {
                await this.initWhatsAppChat();
                dock = document.getElementById("waChatDock");
            }
            if (dock) {
                dock.style.display = "flex";
                await this.selectDockThread(threadId);
            }
        },

        renderDockThreads: async function () {
            const list = document.getElementById("waThreadsList");
            if (!list) return;

            const user = this.getUser();
            const threads = await this.fetchMessages();
            this._cachedDockThreads = threads || [];
            this.filterDockThreads("");
        },

        filterDockThreads: function (query) {
            const list = document.getElementById("waThreadsList");
            if (!list) return;
            const user = this.getUser();
            const currentUserEmail = (user.email || '').toLowerCase();
            const threads = this._cachedDockThreads || [];

            const filtered = threads.filter(t => {
                if (!query) return true;
                const q = query.toLowerCase();
                const other = (t.participantDetails || []).find(p => (p.email || '').toLowerCase() !== currentUserEmail) || {};
                return (other.name || '').toLowerCase().includes(q) ||
                       (other.email || '').toLowerCase().includes(q) ||
                       (t.productName || '').toLowerCase().includes(q);
            });

            if (filtered.length === 0) {
                list.innerHTML = `<div style="padding: 30px 16px; text-align: center; color: #94a3b8; font-size: 0.85rem;">No conversations found.</div>`;
                return;
            }

            list.innerHTML = "";
            filtered.forEach(t => {
                const other = (t.participantDetails || []).find(p => (p.email || '').toLowerCase() !== currentUserEmail) ||
                              ((t.sellerEmail || '').toLowerCase() === currentUserEmail ? { name: t.buyerName, email: t.buyerEmail } : { name: t.sellerName, email: t.sellerEmail });
                const name = other.name || 'Campus Student';
                const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                const row = document.createElement("div");
                row.className = "wa-thread-row";
                row.onclick = () => this.selectDockThread(t.threadId);
                row.innerHTML = `
                    <div class="wa-avatar sm">${initials}</div>
                    <div class="wa-thread-info">
                        <div class="wa-thread-name">
                            <span>${this._escapeHTML(name)}</span>
                            <small style="font-size:0.7rem;color:#667781;font-weight:400;">${t.productPrice > 0 ? `₹${t.productPrice}` : ''}</small>
                        </div>
                        <div class="wa-thread-preview">${this._escapeHTML(t.lastMessage || 'No messages yet')}</div>
                    </div>
                `;
                list.appendChild(row);
            });
        },

        selectDockThread: async function (threadId) {
            this.activeDockThreadId = threadId;
            const user = this.getUser();
            const currentUserEmail = (user.email || '').toLowerCase();

            try {
                const res = await fetch(`${API_BASE}/messages/thread/${threadId}`);
                const data = await res.json();
                if (!data.success || !data.thread) return;

                const thread = data.thread;
                const other = (thread.participantDetails || []).find(p => (p.email || '').toLowerCase() !== currentUserEmail) ||
                              ((thread.sellerEmail || '').toLowerCase() === currentUserEmail ? { name: thread.buyerName, email: thread.buyerEmail } : { name: thread.sellerName, email: thread.sellerEmail });

                const threadsView = document.getElementById("waThreadsView");
                const activeView = document.getElementById("waActiveChatView");
                if (threadsView) threadsView.style.display = "none";
                if (activeView) activeView.style.display = "flex";

                const nameEl = document.getElementById("waActiveContactName");
                const statusEl = document.getElementById("waActiveContactStatus");
                const avatarEl = document.getElementById("waActiveAvatar");

                if (nameEl) nameEl.textContent = other.name || 'Student';
                if (statusEl) statusEl.textContent = `${other.email || ''} • Online`;
                if (avatarEl) avatarEl.textContent = (other.name || 'ST').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                this.renderDockMessages(thread);
            } catch (e) {
                console.error("Error opening dock thread:", e);
            }
        },

        renderDockMessages: function (thread) {
            const box = document.getElementById("waMessagesBox");
            if (!box) return;

            const user = this.getUser();
            const currentUserEmail = (user.email || '').toLowerCase();

            box.innerHTML = "";
            (thread.messages || []).forEach(m => {
                const isMine = (m.senderEmail || '').toLowerCase() === currentUserEmail;
                const bubble = document.createElement("div");
                bubble.className = `wa-bubble ${isMine ? 'mine' : 'theirs'}`;
                bubble.innerHTML = `
                    ${!isMine ? `<div style="font-size:0.72rem;font-weight:700;color:#008069;margin-bottom:2px;">${this._escapeHTML(m.senderName || 'Student')}</div>` : ''}
                    <div>${this._escapeHTML(m.text)}</div>
                    <div class="wa-bubble-meta">
                        <span>${this._escapeHTML(m.timestamp || '')}</span>
                        ${isMine ? `<span style="color:#53bdeb;font-weight:bold;">✓✓</span>` : ''}
                    </div>
                `;
                box.appendChild(bubble);
            });
            box.scrollTop = box.scrollHeight;
        },

        pollDockThread: async function () {
            if (!this.activeDockThreadId) return;
            try {
                const res = await fetch(`${API_BASE}/messages/thread/${this.activeDockThreadId}`);
                const data = await res.json();
                if (data.success && data.thread) {
                    this.renderDockMessages(data.thread);
                }
            } catch (e) {}
        },

        sendDockMessage: async function () {
            const input = document.getElementById("waInputText");
            const text = input ? input.value.trim() : "";
            if (!text || !this.activeDockThreadId) return;

            input.value = "";
            const result = await this.sendMessage(this.activeDockThreadId, text);
            if (result && result.thread) {
                this.renderDockMessages(result.thread);
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
        _svgChat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`,
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
                        <a href="messages.html" class="${currentPage === 'messages.html' ? 'active' : ''} nav-badge-item" title="CampusChat (WhatsApp Style)">
                            ${this._svgChat} <span style="font-weight: 600;">Chat</span> ${unreadCount > 0 ? `<span class="nav-badge" style="background:#25d366;">${unreadCount}</span>` : ''}
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
        window.CampusCart.initWhatsAppChat();
    });
})();
