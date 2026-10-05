require('dotenv').config();
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (e) {}
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const User = require('./models/User');
const MessageThread = require('./models/Message');

const DEFAULT_PRODUCTS = [
    {
        customId: "default-1",
        name: "Engineering Mathematics",
        category: "books",
        condition: "good",
        price: 350,
        description: "Engineering Mathematics textbook for B.Tech 2nd year students. RD Sharma edition. Good condition, all chapters intact.",
        location: "college",
        imageUrl: "images/engineering_math_book.jpg",
        sellerName: "Rahul Sharma"
    },
    {
        customId: "default-2",
        name: "Casio Scientific Calculator",
        category: "electronics",
        condition: "new",
        price: 700,
        description: "Casio FX-991ES Plus scientific calculator. Like new, used only for 3 months in 1st year. Perfect for engineering students.",
        location: "college",
        imageUrl: "images/casio_calculator.jpg",
        sellerName: "Priya Patel"
    },
    {
        customId: "default-3",
        name: "Arduino Uno Board",
        category: "lab",
        condition: "good",
        price: 450,
        description: "Original Arduino Uno R3 microcontroller board. Fully functional, suitable for electronics projects and lab experiments.",
        location: "college",
        imageUrl: "images/arduino_uno.jpg",
        sellerName: "Aniket Verma"
    },
    {
        customId: "default-4",
        name: "Bluetooth Headphones",
        category: "accessories",
        condition: "good",
        price: 900,
        description: "Sony WH-1000XM3 Bluetooth headphones. Good condition, excellent sound quality, wireless with 30hr battery.",
        location: "college",
        imageUrl: "images/bluetooth_headphones.jpg",
        sellerName: "Sneha Reddy"
    },
    {
        customId: "default-5",
        name: "Mechanical Keyboard",
        category: "electronics",
        condition: "good",
        price: 1200,
        description: "Mechanical RGB keyboard with blue switches. Great for coding and gaming. Good condition with all keys working.",
        location: "college",
        imageUrl: "images/mechanical_keyboard.jpg",
        sellerName: "Vikram Das"
    },
    {
        customId: "default-6",
        name: "Programming in Java Book",
        category: "books",
        condition: "used",
        price: 250,
        description: "Herbert Schildt's Java: The Complete Reference. Used but all pages readable. Perfect for Java programming course.",
        location: "college",
        imageUrl: "images/java_book.jpg",
        sellerName: "Amit Kumar"
    },
    {
        customId: "default-7",
        name: "ESP32 Development Board",
        category: "lab",
        condition: "new",
        price: 800,
        description: "ESP32 development board with WiFi and Bluetooth support. Like new, used for one IoT project only.",
        location: "college",
        imageUrl: "images/esp32_board.jpg",
        sellerName: "Neha Gupta"
    },
    {
        customId: "default-8",
        name: "Study Table Lamp",
        category: "hostel",
        condition: "good",
        price: 650,
        description: "LED study table lamp with adjustable brightness and color temperature. Ideal for hostel study use.",
        location: "hostel",
        imageUrl: "images/study_table_lamp.jpg",
        sellerName: "Karan Singh"
    },
    {
        customId: "default-9",
        name: "Engineering Graphics Kit",
        category: "stationery",
        condition: "new",
        price: 300,
        description: "Complete engineering graphics drawing kit including set squares, drafter, compass, protractor and pencils.",
        location: "college",
        imageUrl: "images/engineering_graphics_kit.jpg",
        sellerName: "Pooja Joshi"
    },
    {
        customId: "default-10",
        name: "Laptop Stand",
        category: "accessories",
        condition: "good",
        price: 550,
        description: "Portable adjustable aluminum laptop stand for comfortable studying. Foldable and lightweight.",
        location: "college",
        imageUrl: "images/laptop_stand.jpg",
        sellerName: "Siddharth Nair"
    },
    {
        customId: "default-11",
        name: "Drawing Tablet",
        category: "electronics",
        condition: "used",
        price: 1500,
        description: "Wacom Intuos graphics drawing tablet. Used for digital sketching and design projects. Comes with stylus pen.",
        location: "college",
        imageUrl: "images/drawing_tablet.jpg",
        sellerName: "Tanvi Rao"
    },
    {
        customId: "default-12",
        name: "College Backpack",
        category: "hostel",
        condition: "good",
        price: 1100,
        description: "Spacious 40L college backpack with dedicated laptop compartment. Comfortable straps, multiple pockets.",
        location: "college",
        imageUrl: "images/college_backpack.jpg",
        sellerName: "Manish Shah"
    },
    {
        customId: "default-13",
        name: "Sony Portable Speaker",
        category: "electronics",
        condition: "good",
        price: 1400,
        description: "Sony SRS-XB23 Bluetooth portable speaker. Waterproof, 12hr battery. Excellent bass, barely used.",
        location: "hostel",
        imageUrl: "images/sony_speaker.jpg",
        sellerName: "Divya Menon"
    },
    {
        customId: "default-14",
        name: "Data Structures & Algorithms Book",
        category: "books",
        condition: "good",
        price: 400,
        description: "CLRS - Introduction to Algorithms book. 3rd edition. Good condition, useful for competitive programming.",
        location: "library",
        imageUrl: "images/clrs_algorithms_book.jpg",
        sellerName: "Arjun Nair"
    }
];

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campuscart');
        console.log('MongoDB connected for seeding...');

        // Seed products
        await Product.deleteMany({});
        await Product.insertMany(DEFAULT_PRODUCTS);
        console.log('✔ Catalog items seeded successfully with correct product images.');

        // Seed default user
        await User.deleteMany({ email: "jashwanth@college.edu" });
        await User.create({
            name: "Jashwanth Kumar",
            email: "jashwanth@college.edu",
            password: "password123",
            college: "College of Engineering",
            department: "Computer Science & Engineering",
            year: "3rd Year",
            phone: "+91 98765 43210",
            avatar: "JK"
        });
        console.log('✔ Demo user seeded successfully.');

        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
