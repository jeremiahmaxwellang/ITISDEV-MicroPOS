
const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const fileUpload = require('express-fileupload');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mySqlPool = require('./config/database');
const setupDatabase = require('../setup-db');

const app = express();
const port = process.env.PORT || 3000;
app.set("view engine", 'hbs');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: true
});

app.use(session({
    name: 'micropos.sid',
    secret: process.env.SESSION_SECRET || 'micropos-dev-session-secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));
app.use(fileUpload({
    createParentPath: true,
    limits: {
        fileSize: 8 * 1024 * 1024
    },
    abortOnLimit: true,
    useTempFiles: false
}));

// Serve static files from the "public" directory
app.use(express.static(path.join(process.cwd(), './public')));
app.use('/images', express.static(path.join(process.cwd(), './images')));
global.viewsPath = path.join(process.cwd(), 'views');

// Routes 
app.use("/", require("./routes/authRoutes")); // login routes
app.use("/debts", require("./routes/debtRoutes")); // Debt Tracker routes
app.use("/reports", require("./routes/reportsRoutes")); // Reports API routes
app.use("/products", require("./routes/productRoutes")); // Products page and API routes
app.use("/pos", require("./routes/posRoutes")); // POS and barcode scanning routes
app.use("/transaction-verification", require("./routes/transaction_verificationRoutes")); // Transaction verification module


// Ensure DB schema is set up before starting the server
setupDatabase().then(() => {
    mySqlPool.query('SELECT 1').then(() => {
        console.log(`MySQL ${process.env.DB_NAME} Connected`);
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }).catch((err) => {
        console.error('MySQL connection failed:', err);
        process.exit(1);
    });
}).catch((err) => {
    console.error('Database setup failed:', err);
    process.exit(1);
});

