/* =========================================================
   CAMPUSCART - MESSAGES PAGE LOGIC (CONNECTED TO API)
   ========================================================= */

let activeThreadId = null;

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    activeThreadId = params.get("threadId");

    await renderThreads();
    if (activeThreadId) {
        selectThread(activeThreadId);
    }
});

async function renderThreads() {
    const list = document.getElementById("threadsList");
    if (!list) return;

    const threads = await window.CampusCart.fetchMessages();

    if (!threads || threads.length === 0) {
        list.innerHTML = `<div style="padding: 20px; text-align: center; color: #64748b;">No messages yet</div>`;
        return;
    }

    if (!activeThreadId) {
        activeThreadId = threads[0].threadId;
    }

    list.innerHTML = "";
    threads.forEach(t => {
        const item = document.createElement("div");
        item.className = `thread-item ${t.threadId === activeThreadId ? 'active' : ''}`;
        item.onclick = () => selectThread(t.threadId);
        item.innerHTML = `
            <div style="font-weight: 600; display: flex; justify-content: space-between;">
                <span>${t.productIcon || '📦'} ${escapeHTML(t.productName)}</span>
                <small style="color: #6366f1;">₹${t.productPrice}</small>
            </div>
            <div style="font-size: 0.85rem; color: #64748b; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHTML(t.lastMessage || '')}
            </div>
        `;
        list.appendChild(item);
    });
}

async function selectThread(threadId) {
    activeThreadId = threadId;
    const threads = await window.CampusCart.fetchMessages();
    const thread = threads.find(t => t.threadId === threadId);
    if (!thread) return;

    document.getElementById("chatItemTitle").textContent = thread.productName;
    document.getElementById("chatSellerName").textContent = `Seller: ${thread.sellerName}`;
    document.getElementById("chatProductPrice").textContent = `₹${thread.productPrice}`;

    renderMessages(thread);
    renderThreads();
}

function renderMessages(thread) {
    const container = document.getElementById("chatMessages");
    container.innerHTML = "";
    thread.messages.forEach(m => {
        const bubble = document.createElement("div");
        bubble.className = `chat-bubble ${m.sender}`;
        bubble.innerHTML = `
            <div>${escapeHTML(m.text)}</div>
            <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 4px; text-align: right;">${m.timestamp}</div>
        `;
        container.appendChild(bubble);
    });
    container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById("messageInput");
    const text = input.value.trim();
    if (!text || !activeThreadId) return;

    input.value = "";
    const result = await window.CampusCart.sendMessage(activeThreadId, text);
    if (result && result.thread) {
        renderMessages(result.thread);
        renderThreads();

        // Simulated quick seller reply
        setTimeout(async () => {
            await fetch('http://localhost:5000/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threadId: activeThreadId,
                    text: "Sounds good! I can meet you near the campus library entrance.",
                    sender: 'seller'
                })
            });
            const updatedThreads = await window.CampusCart.fetchMessages();
            const updatedThread = updatedThreads.find(t => t.threadId === activeThreadId);
            if (updatedThread) {
                renderMessages(updatedThread);
                renderThreads();
            }
        }, 1200);
    }
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
}
