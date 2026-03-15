const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config();
const mySqlPool = require('./config/database');

const app = express();
const port = process.env.PORT || 3000;
app.set("view engine", 'hbs');
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

// Serve static files from the "public" directory
app.use(express.static(path.join(process.cwd(), './public')));
app.use('/images', express.static(path.join(process.cwd(), './images')));
global.viewsPath = path.join(process.cwd(), 'views');

// Routes 
app.use("/", require("./routes/authRoutes")); // login routes
app.use("/debts", require("./routes/debtRoutes")); // Debt Tracker routes
app.use("/reports", require("./routes/reportsRoutes")); // Reports API routes


mySqlPool.query('SELECT 1').then(() => {
    console.log(`MySQL ${process.env.DB_NAME} Connected`);
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

