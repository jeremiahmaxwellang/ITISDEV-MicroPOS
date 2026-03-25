const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function ensureSessionTable(connection, databaseName) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS \`${databaseName}\`.\`sessions\` (
      \`session_id\` varchar(128) COLLATE utf8mb4_bin NOT NULL,
      \`expires\` int(11) unsigned NOT NULL,
      \`data\` mediumtext COLLATE utf8mb4_bin,
      PRIMARY KEY (\`session_id\`),
      KEY \`expires\` (\`expires\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
  `);
}

async function ensureProductsPhotoColumn(connection, databaseName) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'products'
       AND COLUMN_NAME = 'photo'
     LIMIT 1`,
    [databaseName]
  );

  if (!rows.length) {
    await connection.query(
      `ALTER TABLE \`${databaseName}\`.\`products\`
       ADD COLUMN \`photo\` MEDIUMTEXT NULL COMMENT 'Local uploaded product photo URL' AFTER \`selling_price\``
    );
    console.log('✓ Added products.photo column');
  }
}

async function ensureDebtsModeOfPaymentColumn(connection, databaseName) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'debts'
       AND COLUMN_NAME = 'mode_of_payment'
     LIMIT 1`,
    [databaseName]
  );

  if (!rows.length) {
    await connection.query(
      `ALTER TABLE \`${databaseName}\`.\`debts\`
       ADD COLUMN \`mode_of_payment\` ENUM('Cash', 'GCash', 'Other') NOT NULL DEFAULT 'Cash' AFTER \`debt_amount\``
    );
    console.log('✓ Added debts.mode_of_payment column');
  }
}

async function setupDatabase() {
  let connection;

  try {
    const databaseName = process.env.DB_NAME || 'micropos_db';

    // Connect to MySQL (without specifying database first)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true, // Allow multiple SQL statements
    });

    console.log('Connected to MySQL');

    const [schemaRows] = await connection.query(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ? LIMIT 1',
      [databaseName]
    );

    let hasExistingTables = false;

    if (schemaRows.length > 0) {
      const [tableRows] = await connection.query(
        'SELECT COUNT(*) AS tableCount FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
        [databaseName]
      );

      if (Number(tableRows[0].tableCount) > 0) {
        hasExistingTables = true;
      }
    }

    if (hasExistingTables) {
      console.log(`Database ${databaseName} already exists with tables. Skipping full schema setup to preserve data.`);
    } else {
      // Read the SQL file
      const sqlFilePath = path.join(__dirname, 'db_design', 'micropos_db.sql');
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

      console.log('Running database schema...');

      // Execute all SQL statements
      await connection.query(sqlContent);

      console.log('✓ Database setup complete!');
      console.log('✓ All tables created/updated with barcode support');
    }

    await ensureSessionTable(connection, databaseName);
    console.log('✓ Session table verified');

    await ensureProductsPhotoColumn(connection, databaseName);
    console.log('✓ Products photo column verified');

    await ensureDebtsModeOfPaymentColumn(connection, databaseName);
    console.log('✓ Debts mode_of_payment column verified');

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
