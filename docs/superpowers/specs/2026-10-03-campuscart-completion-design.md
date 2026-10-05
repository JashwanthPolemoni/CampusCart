# CampusCart - Full Stack Project Completion Design Document (Node.js + Express + MongoDB)

**Date:** 2026-10-03  
**Status:** Approved (Updated for MongoDB Backend Integration)  
**Author:** Antigravity AI & CampusCart Team  

---

## 1. Overview & Objectives

CampusCart is a full-stack student marketplace web application designed for buying, selling, and exchanging textbooks, electronics, lab equipment, and campus essentials.

The objective of this updated specification is to transition CampusCart into a complete full-stack web application with a Node.js + Express backend and MongoDB database.

Key deliverables:
1. **MongoDB Database & Express Backend Server (`server.js`)**: Real database schemas for Users, Products, Favorites, and Chat Messages.
2. **Catalog Seeder (`seed.js`)**: Automatically seeds the 12 default campus marketplace items into MongoDB upon setup.
3. **Core REST API Endpoints**: Authentication, Product Catalog & Search, Listing CRUD (Create, Read, Update, Delete), Favorites Management, and Real-time/Async Buyer-Seller Messaging.
4. **New Frontend Pages**: `favorites.html`, `messages.html`, and `profile.html`.
5. **Unified Frontend API Client (`js/app.js`)**: Bridge connecting all frontend pages to the Express backend (`http://localhost:5000/api`).
6. **Bug Fixes**: Resolve "Product Not Found" errors by ensuring valid MongoDB product IDs or default IDs in all product links across all pages.

---

## 2. Architecture & Directory Structure

```
CampusCart/
├── server.js                       # Express & MongoDB Server entrypoint
├── seed.js                         # Initial database seeder script
├── package.json                    # Dependencies (express, mongoose, cors, bcryptjs, jsonwebtoken)
├── config/
│   └── db.js                       # MongoDB connection setup (mongodb://localhost:27017/campuscart)
├── models/
│   ├── User.js                     # User Mongoose Schema
│   ├── Product.js                  # Product Listing Mongoose Schema
│   ├── Favorite.js                 # Favorites Mongoose Schema
│   └── Message.js                  # Chat Thread & Message Mongoose Schema
├── routes/
│   ├── authRoutes.js               # /api/auth (register, login, me)
│   ├── productRoutes.js            # /api/products (list, get, create, update, delete)
│   ├── favoriteRoutes.js           # /api/favorites (get, toggle)
│   ├── messageRoutes.js            # /api/messages (threads, send, start)
│   └── profileRoutes.js            # /api/profile (get, update)
├── index.html / campuscart.html   # Public Landing Page
├── home.html                       # Student Dashboard (Post-login)
├── products.html                   # Marketplace with search, filters & sort
├── product-details.html            # Product Details & Seller Contact
├── sell.html                       # Create Listing Form
├── my-listings.html                # Seller Dashboard (Manage user listings)
├── edit-listing.html               # Edit Existing Listing Form
├── favorites.html                  # [NEW] Saved Favorites Grid
├── messages.html                   # [NEW] Buyer-Seller Chat UI
├── profile.html                    # [NEW] Student Profile & Settings
├── login.html                      # Student Login Form
├── register.html                   # Student Registration Form
├── css/
│   └── style.css                   # Master CSS Design System
└── js/
    ├── app.js                      # Unified Frontend API Client (Auth, Nav, Toasts)
    ├── products.js                 # Marketplace & filter logic
    ├── product-details.js          # Product details renderer & buyer actions
    ├── my-listings.js              # Seller management & delete actions
    ├── favorites.js                # Saved items renderer
    ├── messages.js                 # Chat interface script
    ├── profile.js                  # Profile management script
    ├── login.js                    # Auth login script
    └── register.js                 # Auth registration script
```

---

## 3. Database Schemas (Mongoose / MongoDB)

Database URI: `mongodb://localhost:27017/campuscart`

### 3.1 User Schema (`models/User.js`)
- `name`: String (Required)
- `email`: String (Required, Unique, Lowercase)
- `password`: String (Required, Hashed)
- `college`: String (Default: "College of Engineering")
- `department`: String (Default: "Computer Science")
- `year`: String (Default: "3rd Year")
- `phone`: String (Default: "+91 98765 43210")
- `avatar`: String (Derived initials)
- `createdAt`: Date

### 3.2 Product Schema (`models/Product.js`)
- `name`: String (Required)
- `category`: String (Enum: `['books', 'electronics', 'lab', 'stationery', 'hostel', 'accessories']`)
- `condition`: String (Enum: `['new', 'good', 'used']`)
- `price`: Number (Required)
- `description`: String (Required)
- `location`: String (Enum: `['college', 'library', 'canteen', 'hostel']`)
- `seller`: ObjectId (Ref: User)
- `sellerName`: String
- `createdAt`: Date

### 3.3 Favorite Schema (`models/Favorite.js`)
- `user`: ObjectId (Ref: User)
- `product`: ObjectId (Ref: Product)
- `createdAt`: Date

### 3.4 Message Schema (`models/Message.js`)
- `threadId`: String (Unique)
- `product`: ObjectId (Ref: Product)
- `productName`: String
- `productPrice`: Number
- `productIcon`: String
- `buyer`: ObjectId (Ref: User)
- `buyerName`: String
- `seller`: ObjectId (Ref: User)
- `sellerName`: String
- `lastMessage`: String
- `lastUpdated`: Date
- `messages`: `[{ senderId: ObjectId, senderType: String, text: String, timestamp: Date }]`

---

## 4. API Endpoints Specification

### Auth (`/api/auth`)
- `POST /register`: Registers student, returns JWT token & user profile.
- `POST /login`: Validates credentials, returns JWT token.
- `GET /me`: Fetches current user profile from token.

### Products (`/api/products`)
- `GET /`: Returns all active products (supports category, search, price filters).
- `GET /:id`: Returns single product details with seller info.
- `POST /`: Creates a new product listing (requires auth).
- `PUT /:id`: Updates existing product listing (requires auth).
- `DELETE /:id`: Removes a listing (requires auth).

### Favorites (`/api/favorites`)
- `GET /`: Returns list of favorited products for logged-in user.
- `POST /toggle`: Adds/removes a product from user's favorites list.

### Messages (`/api/messages`)
- `GET /`: Returns all chat threads for logged-in user.
- `GET /:threadId`: Returns message history for a thread.
- `POST /start`: Starts a new chat thread for a product.
- `POST /send`: Appends a message to a thread.

---

## 5. Implementation & Verification Roadmap

1. Initialize Node.js dependencies (`express`, `mongoose`, `cors`, `dotenv`, `bcryptjs`, `jsonwebtoken`).
2. Write Mongoose models and database connection (`config/db.js`).
3. Write Express routes and controllers.
4. Run `seed.js` to populate database with default items.
5. Launch Express backend server on port 5000.
6. Build frontend client (`js/app.js`) to query Express API endpoints with automatic session token handling.
7. Build `favorites.html`, `messages.html`, and `profile.html`.
8. Fix all product links and test end-to-end user flows.
