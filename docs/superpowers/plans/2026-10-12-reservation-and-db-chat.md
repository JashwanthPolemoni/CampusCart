# Reservation Flow and Database Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the product reservation flow and build real peer-to-peer database messaging between registered student accounts by email/username on Render free tier and MongoDB Atlas.

**Architecture:** Mongoose schema enhancements for products and multi-party message threads; REST endpoints for reserving/unreserving and thread lifecycle; client-side authentication fix, reservation popup modal with seller chat CTA, and smart visibility-based polling in `messages.html`.

**Tech Stack:** Node.js, Express, MongoDB/Mongoose, Vanilla HTML/CSS/JavaScript.

## Global Constraints
- Target compatibility: Render Free Tier, MongoDB Atlas M0.
- No WebSockets; use lightweight visibility-aware REST polling (3.5s) to avoid keep-alive resource limits on free tier.
- Store email and name in participant models to enable cross-account lookup.

---

### Task 1: Schema Updates for Products and Messages

**Files:**
- Modify: `models/Product.js`
- Modify: `models/Message.js`
- Modify: `seed.js`

- [ ] **Step 1: Update `models/Product.js`**
Add `reservedByName` and `sellerEmail` fields to `Product`:
```javascript
reservedByName: { type: String, default: '' },
sellerEmail: { type: String, default: '' }
```

- [ ] **Step 2: Update `models/Message.js`**
Update `messageItemSchema` and `threadSchema` to support participants (`participants: [String]`, `participantDetails: [{ email, name }]`, `senderEmail`, `senderName`):
```javascript
const messageItemSchema = new mongoose.Schema({
    senderEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true }
}, { timestamps: true });

const threadSchema = new mongoose.Schema({
    threadId: { type: String, required: true, unique: true },
    productId: { type: String, default: '' },
    productName: { type: String, default: '' },
    productPrice: { type: Number, default: 0 },
    productIcon: { type: String, default: '💬' },
    participants: [{ type: String, required: true }],
    participantDetails: [{
        email: { type: String, required: true },
        name: { type: String, default: 'Student' }
    }],
    lastMessage: { type: String, default: '' },
    lastSenderEmail: { type: String, default: '' },
    messages: [messageItemSchema]
}, { timestamps: true });
```

- [ ] **Step 3: Update `seed.js` default products**
Ensure seed products include a valid `sellerEmail` (e.g., `rahul@college.edu`, `priya@college.edu`, or `jashwanth@college.edu`) so buyer-seller connections have clear destinations.

---

### Task 2: Backend Routes for Reservation and Chat

**Files:**
- Modify: `routes/productRoutes.js`
- Modify: `routes/messageRoutes.js`

- [ ] **Step 1: Update `routes/productRoutes.js` reservation endpoints**
Ensure `/:id/reserve` sets `reservedBy`, `reservedByName`, `reservedAt`, and checks current status. Ensure `/:id/unreserve` verifies the requester matches `reservedBy` and resets status to `'available'`.

- [ ] **Step 2: Update `routes/messageRoutes.js`**
Implement:
1. `GET /api/messages?email=...` - Returns all threads where `participants: email`.
2. `POST /api/messages/start` - Checks/creates thread between `senderEmail` and `targetEmail` with product details if supplied.
3. `POST /api/messages/send` - Appends message with `senderEmail` and `senderName`, updates `lastMessage`.
4. `GET /api/messages/thread/:threadId` - Returns specific thread for auto-polling.
5. `GET /api/messages/search-users?query=...` - Searches registered `User` by name or email.

---

### Task 3: Client App Helpers & Login Redirect

**Files:**
- Modify: `js/app.js`
- Modify: `js/login.js`

- [ ] **Step 1: Add helper methods in `js/app.js`**
Add:
- `CampusCart.getUser()` alias `CampusCart.getCurrentUser()` for backwards compatibility.
- Updated `startChatWithProduct({ productId, sellerEmail, sellerName, productName })` accepting target seller.
- Updated `fetchMessages(email)` passing logged-in user email.
- Updated `sendMessage(threadId, text)` sending `senderEmail` and `senderName`.

- [ ] **Step 2: Support redirect query in `js/login.js`**
After successful login, check `const redirect = new URLSearchParams(window.location.search).get('redirect')`. If present, redirect to `redirect` rather than `home.html`.

---

### Task 4: Product Details Reservation UI & Modal

**Files:**
- Modify: `js/product-details.js`
- Modify: `product-details.html`

- [ ] **Step 1: Fix user authentication check in `js/product-details.js`**
Replace broken check with `const user = window.CampusCart.getUser();`. If `!user.isLoggedIn`, redirect to `login.html?redirect=...`.

- [ ] **Step 2: Implement Reservation Confirmation Modal & Status Badges**
In `product-details.html`, add modal markup for reservation confirmation:
- Title: *"🎉 Item Reserved!"*
- Button: *"💬 Chat with Seller"*
- Button: *"Close"*
Update `updateReserveButton(status, reservedBy)`:
- If `status === 'reserved'` and `reservedBy === user.email`: button is *"✅ Reserved by You — Cancel Reservation"*.
- If `status === 'reserved'` and `reservedBy !== user.email`: button is *"🔒 Already Reserved by another student"* (disabled).
- If `status === 'available'`: button is *"Reserve This Item"* (active).

- [ ] **Step 3: Connect "Contact Seller" and Modal "Chat with Seller"**
Call `window.CampusCart.startChatWithProduct` passing product details and seller email/name.

---

### Task 5: Peer-to-Peer Database Chat UI & Polling

**Files:**
- Modify: `messages.html`
- Modify: `js/messages.js`

- [ ] **Step 1: Remove fake bot timeout in `js/messages.js`**
Completely remove simulated seller reply timer.

- [ ] **Step 2: Render threads with other participant name**
Display the other party's name as the thread title, and product tag if applicable.

- [ ] **Step 3: Render chat bubbles by sender**
Align right for `senderEmail === currentUser.email` (labeled "You"), left for other participant.

- [ ] **Step 4: Implement Smart Visibility-Aware Polling**
Set up an interval (3500ms) that fetches `/api/messages/thread/:activeThreadId` when `!document.hidden` and updates messages without page flicker.

- [ ] **Step 5: Add "New Chat" user search modal in `messages.html`**
Add modal allowing search for registered students by email or username, and initiating a direct chat.

---

### Task 6: End-to-End Verification

- [ ] **Step 1: Seed / Verify database accounts**
Ensure demo and test accounts exist in MongoDB.
- [ ] **Step 2: Verify reservation flow**
Test reservation, modal popup, "already reserved" view for other users, and cancellation.
- [ ] **Step 3: Verify peer-to-peer messaging**
Send message from User A to User B; switch/open User B; verify message received and reply sent back.
