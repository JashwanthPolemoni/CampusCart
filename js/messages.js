/* =========================================================
   CAMPUSCART - REAL PEER-TO-PEER DATABASE CHAT
   ========================================================= */

let activeThreadId = null;
let currentPollInterval = null;
let lastRenderedMessageCount = 0;

document.addEventListener("DOMContentLoaded", async function () {
    const user = window.CampusCart.getUser();
    if (!user.isLoggedIn || !user.email) {
        window.CampusCart.showToast("Please log in to access messages.", "info");
        const currentUrl = encodeURIComponent(window.location.href);
        setTimeout(() => { window.location.href = `login.html?redirect=${currentUrl}`; }, 1200);
        return;
    }

    const badge = document.getElementById("currentUserBadge");
    if (badge) {
        badge.textContent = `Logged in as: ${user.name || user.email} (${user.email})`;
    }

    const params = new URLSearchParams(window.location.search);
    activeThreadId = params.get("threadId");

    await renderThreads();

    if (activeThreadId) {
        await selectThread(activeThreadId);
    }

    initNewChatModal();
    startPolling();
});

// Clean up polling if tab is hidden to conserve server resources
function startPolling() {
    if (currentPollInterval) clearInterval(currentPollInterval);

    currentPollInterval = setInterval(async () => {
        if (document.hidden) return; // Conserve battery & server quota
        if (!activeThreadId) return;

        try {
            const res = await fetch(`/api/messages/thread/${activeThreadId}`);
            if (!res.ok) return;
            const data = await res.json();
            if (data.success && data.thread) {
                if (data.thread.messages.length !== lastRenderedMessageCount) {
                    renderMessages(data.thread);
                    await renderThreads(false); // Update lastMessage preview without resetting active
                }
            }
        } catch (e) {
            // Network glitch, silently ignore
        }
    }, 3500);
}

async function renderThreads(autoSelectFirst = true) {
    const list = document.getElementById("threadsList");
    if (!list) return;

    const user = window.CampusCart.getUser();
    const currentUserEmail = (user.email || '').toLowerCase();

    const threads = await window.CampusCart.fetchMessages();

    if (!threads || threads.length === 0) {
        list.innerHTML = `
            <div style="padding: 30px 20px; text-align: center; color: #94a3b8; font-size: 0.9rem;">
                <p>No conversations yet.</p>
                <button class="btn btn-primary" onclick="openNewChatModal()" style="margin-top: 10px; padding: 6px 14px; font-size: 0.85rem;">
                    Start a New Chat
                </button>
            </div>
        `;
        return;
    }

    if (!activeThreadId && autoSelectFirst && threads.length > 0) {
        activeThreadId = threads[0].threadId;
    }

    _cachedMessagesThreads = threads || [];
    filterMessagesThreads("");

    const sideSearch = document.getElementById("sideSearchInput");
    if (sideSearch) {
        sideSearch.oninput = () => filterMessagesThreads(sideSearch.value.trim());
    }
}

let _cachedMessagesThreads = [];

function filterMessagesThreads(query) {
    const list = document.getElementById("threadsList");
    if (!list) return;

    const user = window.CampusCart.getUser();
    const currentUserEmail = (user.email || '').toLowerCase();
    const threads = _cachedMessagesThreads || [];

    const filtered = threads.filter(t => {
        if (!query) return true;
        const q = query.toLowerCase();
        const other = getOtherParticipant(t, currentUserEmail);
        return (other.name || '').toLowerCase().includes(q) ||
               (other.email || '').toLowerCase().includes(q) ||
               (t.productName || '').toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
        list.innerHTML = `<div style="padding: 30px 16px; text-align: center; color: #8696a0; font-size: 0.85rem;">No chats matching "${escapeHTML(query)}"</div>`;
        return;
    }

    list.innerHTML = "";
    filtered.forEach(t => {
        const item = document.createElement("div");
        item.className = `thread-item ${t.threadId === activeThreadId ? 'active' : ''}`;
        item.onclick = () => selectThread(t.threadId);

        const other = getOtherParticipant(t, currentUserEmail);
        const name = other.name || 'Campus Student';
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

        const productTag = t.productName && t.productName !== 'Direct Conversation'
            ? `<span style="font-size: 0.72rem; background: #e0e7ff; padding: 2px 6px; border-radius: 4px; color: #4338ca; margin-left: 6px;">${escapeHTML(t.productName)}</span>`
            : '';

        item.innerHTML = `
            <div class="wa-avatar" style="width: 44px; height: 44px; font-size: 1rem; background: #25d366; flex-shrink: 0;">
                ${initials}
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #111b21; font-size: 0.95rem;">${escapeHTML(name)}</span>
                    <small style="color: #667781; font-size: 0.75rem;">${t.productPrice > 0 ? `₹${t.productPrice}` : ''}</small>
                </div>
                <div style="display: flex; align-items: center; margin-top: 2px;">
                    <span style="font-size: 0.75rem; color: #00a884;">${other.email}</span>
                    ${productTag}
                </div>
                <div style="font-size: 0.82rem; color: #667781; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${escapeHTML(t.lastMessage || 'No messages yet')}
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function getOtherParticipant(thread, currentUserEmail) {
    if (thread.participantDetails && thread.participantDetails.length > 0) {
        const other = thread.participantDetails.find(p => (p.email || '').toLowerCase() !== currentUserEmail);
        if (other) return { name: other.name || 'Campus Student', email: other.email };
    }

    if ((thread.sellerEmail || '').toLowerCase() === currentUserEmail) {
        return { name: thread.buyerName || 'Buyer', email: thread.buyerEmail || '' };
    } else {
        return { name: thread.sellerName || 'Seller', email: thread.sellerEmail || '' };
    }
}

async function selectThread(threadId) {
    activeThreadId = threadId;
    const user = window.CampusCart.getUser();
    const currentUserEmail = (user.email || '').toLowerCase();

    try {
        const res = await fetch(`/api/messages/thread/${threadId}`);
        const data = await res.json();
        if (!data.success || !data.thread) return;

        const thread = data.thread;
        const other = getOtherParticipant(thread, currentUserEmail);
        const name = other.name || 'Student';
        const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

        const titleEl = document.getElementById("chatItemTitle");
        const sellerEl = document.getElementById("chatSellerName");
        const priceEl = document.getElementById("chatProductPrice");
        const badgeEl = document.getElementById("chatProductBadge");
        const avatarEl = document.getElementById("mainHeaderAvatar");

        if (titleEl) titleEl.textContent = name;
        if (sellerEl) sellerEl.textContent = `${other.email} • Online`;
        if (avatarEl) avatarEl.textContent = initials;

        if (thread.productName && thread.productName !== 'Direct Conversation') {
            if (badgeEl) {
                badgeEl.style.display = "inline-block";
                badgeEl.textContent = `📦 ${thread.productName}`;
            }
            if (priceEl && thread.productPrice > 0) {
                priceEl.textContent = `₹${thread.productPrice}`;
            } else if (priceEl) {
                priceEl.textContent = '';
            }
        } else {
            if (badgeEl) badgeEl.style.display = "none";
            if (priceEl) priceEl.textContent = '';
        }

        renderMessages(thread);
        renderThreads(false);
    } catch (e) {
        console.error("Error selecting thread:", e);
    }
}

function renderMessages(thread) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const user = window.CampusCart.getUser();
    const currentUserEmail = (user.email || '').toLowerCase();

    container.innerHTML = "";
    lastRenderedMessageCount = thread.messages ? thread.messages.length : 0;

    if (!thread.messages || thread.messages.length === 0) {
        container.innerHTML = `<div style="margin: auto; text-align: center; color: #8696a0;">Say hello to start the conversation!</div>`;
        return;
    }

    thread.messages.forEach(m => {
        const isMine = (m.senderEmail || '').toLowerCase() === currentUserEmail;
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${isMine ? 'mine' : 'theirs'}`;
        bubble.innerHTML = `
            ${!isMine ? `<div style="font-size: 0.72rem; font-weight: 700; color: #008069; margin-bottom: 2px;">${escapeHTML(m.senderName || 'Student')}</div>` : ''}
            <div>${escapeHTML(m.text)}</div>
            <div style="font-size: 0.65rem; color: #667781; margin-top: 4px; text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 4px;">
                <span>${escapeHTML(m.timestamp || '')}</span>
                ${isMine ? `<span style="color: #53bdeb; font-weight: 700;">✓✓</span>` : ''}
            </div>
        `;
        container.appendChild(bubble);
    });

    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById("messageInput");
    const text = input ? input.value.trim() : "";
    if (!text || !activeThreadId) return;

    input.value = "";
    const result = await window.CampusCart.sendMessage(activeThreadId, text);
    if (result && result.thread) {
        renderMessages(result.thread);
        renderThreads(false);
    } else {
        window.CampusCart.showToast("Failed to send message. Please try again.", "error");
    }
}

// =========================================================
// NEW DIRECT CHAT MODAL LOGIC
// =========================================================
function openNewChatModal() {
    const modal = document.getElementById("newChatModal");
    if (modal) modal.style.display = "flex";
}

function closeNewChatModal() {
    const modal = document.getElementById("newChatModal");
    if (modal) modal.style.display = "none";
}

function initNewChatModal() {
    const openBtn = document.getElementById("openNewChatBtn");
    const closeBtn = document.getElementById("closeNewChatBtn");
    const modal = document.getElementById("newChatModal");
    const searchInput = document.getElementById("userSearchInput");
    const searchBtn = document.getElementById("searchUsersBtn");
    const directBtn = document.getElementById("directChatByEmailBtn");

    if (openBtn) openBtn.onclick = openNewChatModal;
    if (closeBtn) closeBtn.onclick = closeNewChatModal;

    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeNewChatModal();
        };
    }

    if (searchBtn && searchInput) {
        searchBtn.onclick = () => performUserSearch(searchInput.value.trim());
        searchInput.onkeypress = (e) => {
            if (e.key === 'Enter') performUserSearch(searchInput.value.trim());
        };
    }

    if (directBtn && searchInput) {
        directBtn.onclick = async () => {
            const email = searchInput.value.trim().toLowerCase();
            if (!email || !email.includes('@')) {
                alert("Please enter a valid student email address.");
                return;
            }
            startChatWithTargetUser(email, email.split('@')[0]);
        };
    }
}

async function performUserSearch(query) {
    const resultsContainer = document.getElementById("searchResultsList");
    if (!resultsContainer) return;

    if (!query || query.length < 2) {
        resultsContainer.innerHTML = `<p style="font-size: 0.85rem; color: #94a3b8; text-align: center;">Type at least 2 characters to search students.</p>`;
        return;
    }

    const user = window.CampusCart.getUser();
    resultsContainer.innerHTML = `<p style="font-size: 0.85rem; color: #64748b; text-align: center;">Searching...</p>`;

    try {
        const res = await fetch(`/api/messages/search-users?query=${encodeURIComponent(query)}&currentEmail=${encodeURIComponent(user.email || '')}`);
        const data = await res.json();

        if (data.success && data.users && data.users.length > 0) {
            resultsContainer.innerHTML = "";
            data.users.forEach(u => {
                const item = document.createElement("div");
                item.className = "user-search-result";
                item.innerHTML = `
                    <div>
                        <strong style="color: #0f172a;">${escapeHTML(u.name)}</strong>
                        <div style="font-size: 0.8rem; color: #6366f1;">${escapeHTML(u.email)}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${escapeHTML(u.department || u.college || '')}</div>
                    </div>
                    <button class="btn btn-primary" style="padding: 6px 14px; font-size: 0.8rem; border-radius: 6px;">Chat</button>
                `;
                item.onclick = () => startChatWithTargetUser(u.email, u.name);
                resultsContainer.appendChild(item);
            });
        } else {
            resultsContainer.innerHTML = `<p style="font-size: 0.85rem; color: #94a3b8; text-align: center;">No registered students found matching "${escapeHTML(query)}". You can still message them using the direct email button below.</p>`;
        }
    } catch (e) {
        resultsContainer.innerHTML = `<p style="font-size: 0.85rem; color: #ef4444; text-align: center;">Error searching users.</p>`;
    }
}

async function startChatWithTargetUser(targetEmail, targetName) {
    const user = window.CampusCart.getUser();
    if (targetEmail.toLowerCase() === (user.email || '').toLowerCase()) {
        alert("You cannot start a chat with yourself.");
        return;
    }

    const result = await window.CampusCart.startDirectChat(targetEmail, targetName);
    if (result && result.success && result.thread) {
        closeNewChatModal();
        activeThreadId = result.thread.threadId;
        await renderThreads(false);
        await selectThread(activeThreadId);
    } else {
        alert(result?.error || "Could not start chat.");
    }
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}
