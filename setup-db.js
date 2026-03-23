const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let connection;

  try {
    // Connect to MySQL (without specifying database first)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true, // Allow multiple SQL statements
    });

    console.log('Connected to MySQL');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'db_design', 'micropos_db.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Running database schema...');
    
    // Execute all SQL statements
    await connection.query(sqlContent);

    console.log('✓ Database setup complete!');
    console.log('✓ All tables created/updated with barcode support');

  } catch (error) {
    console.error('Error setting up database:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nMySQL is not running or not accessible');
      console.error('Make sure MySQL service is running on localhost:3306');
    } else if (error.code === 'ER_ACCESS_DENIED_FOR_USER') {
      console.error('\nDatabase credentials are incorrect');
      console.error('Check your .env file for DB_USER and DB_PASSWORD');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

module.exports = setupDatabase;
