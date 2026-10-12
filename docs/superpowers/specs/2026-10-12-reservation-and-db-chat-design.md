# CampusCart: Reservation Flow and Peer-to-Peer Database Chat Specification

**Date:** 2026-10-12  
**Status:** Approved  
**Target Environments:** Localhost, Render Free Tier, MongoDB Atlas (M0 Free Tier)

---

## 1. Executive Summary

CampusCart currently exhibits two critical usability issues:
1. **Reservation Auth Loop:** When a user clicks "Reserve This Item" on `product-details.html`, it falsely claims the user is not logged in and redirects to `login.html`. This occurs due to calling non-existent `CampusCart.getCurrentUser()` and reading the wrong localStorage key.
2. **Simulated Chat Bot:** The messaging system (`messages.html` & `routes/messageRoutes.js`) uses a hardcoded simulated bot reply after 1.5 seconds and binds threads solely to a single `userId`. Real buyers and sellers cannot message one another between separate student accounts in MongoDB.

This specification outlines the architecture, database schema updates, API contracts, and UI components to:
- Properly reserve items in MongoDB, display reservation status across all accounts, show a confirmation modal to the reserver with a quick option to open chat, and allow reservation cancellation by the reserver.
- Enable true peer-to-peer messaging between registered student accounts by email or username, with support for product-initiated discussions and direct 1-to-1 chats.
- Maintain minimal resource footprint for Render free tier and MongoDB Atlas M0 free tier.

---

## 2. Reservation System Architecture

### 2.1 Authentication & Redirect Preservation
- In `js/product-details.js`, update authentication detection:
  ```javascript
  const user = window.CampusCart.getUser();
  ```
- If `!user.isLoggedIn`:
  - Show toast: *"Please log in to reserve this item."*
  - Redirect to: `login.html?redirect=${encodeURIComponent(window.location.href)}`
  - In `js/login.js`, check `new URLSearchParams(window.location.search).get('redirect')`. If present, redirect the user back to the originating page upon successful login instead of defaulting strictly to `home.html`.

### 2.2 MongoDB Schema Updates (`models/Product.js`)
Ensure `Product` schema supports:
- `status`: String, enum: `['available', 'reserved', 'sold']`, default: `'available'`
- `reservedBy`: String, default: `''` (Stores the reserver's email or user id)
- `reservedByName`: String, default: `''` (Stores the reserver's display name)
- `reservedAt`: Date, default: null
- `sellerEmail`: String, default: `''` (Stores the seller's email address)

### 2.3 API Endpoints (`routes/productRoutes.js`)
- `POST /api/products/:id/reserve`:
  - Payload: `{ reservedBy: email, reservedByName: name }`
  - Validation: Verify product exists and status is `'available'`. Return 409 if already reserved or sold.
  - Updates: Set `status = 'reserved'`, `reservedBy = email`, `reservedByName = name`, `reservedAt = new Date()`.
  - Returns: `{ success: true, message: 'Item reserved successfully!', product }`
- `POST /api/products/:id/unreserve`:
  - Payload: `{ reservedBy: email }`
  - Validation: Verify product exists, status is `'reserved'`, and `product.reservedBy === reservedBy`.
  - Updates: Reset `status = 'available'`, `reservedBy = ''`, `reservedByName = ''`, `reservedAt = null`.
  - Returns: `{ success: true, message: 'Reservation cancelled.', product }`

### 2.4 UI & Interactive Flow (`product-details.html` & `js/product-details.js`)
- **State A: Unreserved / Available**
  - Reserve button is active: *"Reserve This Item"* (Green accent).
  - Clicking triggers `POST /api/products/:id/reserve`.
- **State B: Reserved by Logged-in User**
  - Button text: *"✅ Reserved by You — Cancel Reservation"* (Outlined/amber state).
  - A modal popup is displayed immediately upon successful reservation:
    - Heading: *"🎉 Item Reserved!"*
    - Body: *"You have reserved this item. Contact the seller to arrange payment and campus meetup."*
    - Primary CTA: *"💬 Chat with Seller"* (Starts/opens message thread with seller).
    - Secondary CTA: *"Close"* (Dismisses modal).
  - Clicking the cancel button triggers `POST /api/products/:id/unreserve` and restores available state.
- **State C: Reserved by Another Student**
  - Button disabled: *"🔒 Already Reserved by another student"*.
  - Status banner displayed: *"This item is currently reserved. You may contact the seller to be next in line if the reservation is cancelled."*

---

## 3. Peer-to-Peer Database Chat Architecture

### 3.1 MongoDB Schema Updates (`models/Message.js`)
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
    participants: [{ type: String, required: true }], // Array of user emails, e.g. [buyerEmail, sellerEmail]
    participantDetails: [{
        email: { type: String, required: true },
        name: { type: String, default: 'Student' }
    }],
    lastMessage: { type: String, default: '' },
    lastSenderEmail: { type: String, default: '' },
    messages: [messageItemSchema]
}, { timestamps: true });
```

### 3.2 Backend Endpoints (`routes/messageRoutes.js`)
- `GET /api/messages?email=...`:
  - Retrieves all threads where `participants: email`, ordered by `updatedAt: -1`.
- `POST /api/messages/start`:
  - Payload: `{ senderEmail, senderName, targetEmail, targetName, productId }`
  - Logic:
    - Look for existing thread between `senderEmail` and `targetEmail` (and matching `productId` if provided).
    - If found, return `{ success: true, thread }`.
    - If not found, fetch product details (if `productId` supplied) and create thread with `participants: [senderEmail, targetEmail]`.
    - Returns `{ success: true, thread }`.
- `POST /api/messages/send`:
  - Payload: `{ threadId, text, senderEmail, senderName }`
  - Logic:
    - Appends message item `{ senderEmail, senderName, text, timestamp: currentTime }` to `thread.messages`.
    - Updates `lastMessage = text`, `lastSenderEmail = senderEmail`.
    - Saves thread and returns `{ success: true, thread }`.
- `GET /api/messages/thread/:threadId`:
  - Fetches the current state of a single thread by `threadId` for live polling.
- `GET /api/messages/search-users?query=...`:
  - Searches `User` collection for matching `name` or `email` (excluding current user), returning up to 5 users `{ name, email, department, college }` for starting a new chat.

### 3.3 Frontend Chat Client Updates (`messages.html` & `js/messages.js`)
- **Remove Fake Bot**: Delete simulated 1.5s timeout bot code completely.
- **Participant-Aware Thread List**:
  - Show other participant's name as the primary title in each conversation list item.
  - If linked to a product, show product tag (`📦 Product Name`).
- **Real-Time Polling Optimized for Free Tier**:
  - Poll `/api/messages/thread/:threadId` every 3.5 seconds **only when**:
    - The browser tab is active (`!document.hidden`).
    - An `activeThreadId` is selected.
  - If new messages are received, append them and auto-scroll to bottom.
- **"Start New Chat" Modal**:
  - Allows entering another student's email/username or searching registered students.
  - Clicking "Start Chat" opens the conversation immediately.
- **Bubble Differentiation**:
  - Messages sent by `currentUser.email`: Aligned right, themed primary color, tagged "You".
  - Messages sent by other party: Aligned left, themed light grey/dark surface, tagged with their name.

---

## 4. Verification & Testing Plan

1. **Authentication & Reservation Test**:
   - Log in as User A (`jashwanth@college.edu`).
   - Open a product details page.
   - Click "Reserve This Item" -> Modal appears confirming reservation with "Chat with Seller" and "Close" buttons.
   - Verify DB updates `status: 'reserved'` and `reservedBy: 'jashwanth@college.edu'`.
   - On the product details page, button displays "Reserved by You — Cancel Reservation".
   - Open the same product in an incognito window as User B -> button shows "🔒 Already Reserved by another student" and is disabled.
   - As User A, click "Cancel Reservation" -> status returns to available for all users.
2. **Direct & Product Chat Test**:
   - User A clicks "Contact Seller" or "Chat with Seller" on User B's product.
   - User A sends: "Hi, is this still available?".
   - Open User B's session in incognito/second account.
   - Navigate to `messages.html` -> User B sees thread from User A with badge/last message.
   - User B sends: "Yes, we can meet at Central Library at 4pm.".
   - Verify within 3.5s User A receives User B's message in their active chat window with zero page reload.
3. **Direct User-to-User Chat Test**:
   - On `messages.html`, click "New Chat".
   - Search/enter another registered user's email.
   - Send direct message -> both users see and can reply in real-time.
