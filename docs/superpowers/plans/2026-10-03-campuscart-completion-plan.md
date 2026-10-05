# CampusCart Full Stack Completion Plan (Node.js + Express + MongoDB)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete CampusCart as a full-stack web application with a Node.js + Express + MongoDB backend, dynamic REST APIs, full database persistence, and missing frontend pages (`favorites.html`, `messages.html`, `profile.html`).

**Architecture:** Express REST API server running on port 5000 connected to MongoDB database at `mongodb://localhost:27017/campuscart`. Vanilla JS frontend client (`js/app.js`) communicating via `fetch()` API with JWT authorization.

**Tech Stack:** Node.js, Express, MongoDB, Mongoose, Cors, BcryptJS, JSONWebToken, HTML5, Vanilla CSS3, Modern ES6 JavaScript.

## Global Constraints

- Backend server entrypoint: `server.js` listening on port 5000.
- MongoDB connection string: `mongodb://localhost:27017/campuscart`.
- Database seeder (`seed.js`) populates initial 12 campus catalog items.
- All frontend pages communicate with `http://localhost:5000/api`.
- Every product card link must use valid MongoDB product `_id` query parameters (`?id=<_id>`).

---

### Task 1: Node.js Project Setup, Database Connection & Mongoose Schemas

**Files:**
- Create: `package.json`
- Create: `config/db.js`
- Create: `models/User.js`
- Create: `models/Product.js`
- Create: `models/Favorite.js`
- Create: `models/Message.js`
- Create: `seed.js`

- [ ] **Step 1: Create `package.json` and install dependencies**
Dependencies: `express`, `mongoose`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`.

- [ ] **Step 2: Create `config/db.js` for MongoDB connection**
Connects to `mongodb://localhost:27017/campuscart`.

- [ ] **Step 3: Create Mongoose Schemas**
`User.js`, `Product.js`, `Favorite.js`, `Message.js`.

- [ ] **Step 4: Create `seed.js` to seed the 12 default products**

---

### Task 2: Express Server & REST API Routes

**Files:**
- Create: `server.js`
- Create: `routes/authRoutes.js`
- Create: `routes/productRoutes.js`
- Create: `routes/favoriteRoutes.js`
- Create: `routes/messageRoutes.js`
- Create: `routes/profileRoutes.js`

- [ ] **Step 1: Implement authRoutes (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`)**
- [ ] **Step 2: Implement productRoutes (`/api/products`, `/api/products/:id`, POST/PUT/DELETE)**
- [ ] **Step 3: Implement favoriteRoutes (`/api/favorites`, `/api/favorites/toggle`)**
- [ ] **Step 4: Implement messageRoutes (`/api/messages`, `/api/messages/start`, `/api/messages/send`)**
- [ ] **Step 5: Implement profileRoutes (`/api/profile`)**
- [ ] **Step 6: Build `server.js` entrypoint**

---

### Task 3: Unified Frontend API Client (`js/app.js`)

**Files:**
- Create: `js/app.js`
- Modify: `css/style.css` (Add toast styling & nav badges)

- [ ] **Step 1: Build `js/app.js` API wrapper querying `http://localhost:5000/api`**
Provides `window.CampusCart` methods to handle API calls with JWT header fallback.

---

### Task 4: Fix Product Card Links ("Product Not Found" Bug Fix)

**Files:**
- Modify: `campuscart.html`, `home.html`, `products.html`

- [ ] **Step 1: Update product links to use real MongoDB product IDs or query handlers**

---

### Task 5: Build Favorites Page (`favorites.html` & `js/favorites.js`)

**Files:**
- Create: `favorites.html`
- Create: `js/favorites.js`

- [ ] **Step 1: Create `favorites.html` layout and connect `js/favorites.js` to `/api/favorites`**

---

### Task 6: Build Messages / Chat Page (`messages.html` & `js/messages.js`)

**Files:**
- Create: `messages.html`
- Create: `js/messages.js`

- [ ] **Step 1: Create `messages.html` split chat layout and connect to `/api/messages`**

---

### Task 7: Build Profile Page (`profile.html` & `js/profile.js`)

**Files:**
- Create: `profile.html`
- Create: `js/profile.js`

- [ ] **Step 1: Create `profile.html` student ID card view and connect to `/api/profile`**

---

### Task 8: Update Auth & Seller Forms to REST APIs

**Files:**
- Modify: `js/login.js`, `js/register.js`, `sell.html`, `js/my-listings.js`, `edit-listing.html`, `js/product-details.js`

- [ ] **Step 1: Update login/register to call `/api/auth` and store JWT**
- [ ] **Step 2: Update listing submission in `sell.html` to POST to `/api/products`**
- [ ] **Step 3: Update `my-listings.js` to fetch and delete user listings from MongoDB**
- [ ] **Step 4: Update `product-details.js` to trigger chats and favorites via REST APIs**

---

### Task 9: Start Server, Seed Database & Perform End-to-End Verification

- [ ] **Step 1: Run `node seed.js` to populate MongoDB**
- [ ] **Step 2: Start Express backend server (`node server.js`) as daemon or background process**
- [ ] **Step 3: Verify all 11 HTML pages, REST API endpoints, auth, favorites, chat, and product details**
