The MicroPOS Barcode Scanning System is a complete point-of-sale solution that integrates with your inventory management system. It allows staff to:
- Scan or search for products using barcodes
- Build a shopping cart in real-time
- Calculate totals automatically
- Process payments via Cash or GCash
- Generate transaction records

## [WRENCH_ICON] Database Setup

### Step 1: Run Database Schema
Execute the consolidated database schema with barcode support:

```bash
# In MySQL Workbench or your MySQL client:
source db_design/micropos_db.sql
```

This creates/updates:
- `barcode` column to the `products` table
- Index for faster barcode lookups
- `status` and `payment_method` columns to `transactions` table

### Step 2: Populate Barcodes

Add barcodes to your products. You have two options:

**Option A: Add barcodes manually**
```sql
UPDATE products SET barcode = 'EAN1234567890' WHERE product_id = 1;
UPDATE products SET barcode = 'EAN1234567891' WHERE product_id = 2;
-- Continue for all products
```

**Option B: Generate barcodes programmatically**
```sql
-- Generate simple sequential barcodes
UPDATE products SET barcode = CONCAT('PROD', LPAD(product_id, 8, '0')) WHERE barcode IS NULL;
```

**Option C: Import from your existing system**
If you already have barcodes, import them via CSV or API.

## [ROCKET_ICON] System Architecture

### Frontend Flow

```
POS Page (/pos) 
  ├── Barcode Mode
  │   ├── Manual barcode input
  │   └── Press Enter to scan
  ├── Search Mode
  │   ├── Search by name/barcode
  │   └── Click to add product
  └── Camera Mode
      ├── HTML5 camera access
      └── Real-time scanning (requires barcode library)
```

### Backend Flow

```
API Endpoints (/pos/api/)
  ├── POST /scan → Lookup product by barcode
  ├── GET /products → Search products
  ├── POST /checkout → Create transaction
  ├── GET /transactions → View history
  └── GET /transactions/:id → View receipt
```

## [PHONE_ICON] Step-by-Step Usage Guide

### Part 1: Setting Up Products with Barcodes

**For Physical Products (Canned Goods, Snacks, Beverages):**

1. Get the product's actual barcode number (usually on the packaging)
2. In the database, update the product:
   ```sql
   UPDATE products 
   SET barcode = '8888123456789' 
   WHERE product_id = 5 AND name = 'Piattos Sour Cream';
   ```

**For Services (GCash Load, Cellphone Load):**
- Services don't need barcodes (no stock to track)
- They'll appear in results when searched by name

### Part 2: Making a Sale

**1. Navigate to POS**
- URL: `http://localhost:3000/pos`
- You'll see the barcode scanner interface

**2. Scan First Product**
- Default mode is "Barcode"
- Product barcode appears on physical packaging
- Two methods:
  - **Manual Method**: Type the barcode directly and press Enter
  - **Camera Method**: Click "Camera" tab and let the system detect the barcode

Example barcode formats:
- UPC/EAN: `8888123456789` (13 digits)
- Your system barcodes: `PROD00000001` (Product ID format)

**3. Add More Products**
- Repeat scanning for each product
- System auto-increments quantity if same product scanned twice
- Cart updates in real-time on the right panel

**4. View & Edit Cart**
- See all items on the right sidebar
- Adjust quantities with +/- buttons
- Real-time total calculation
- Remove items with delete button

**5. Process Checkout**
- Click "Checkout" button
- Choose payment method:
  - **Cash**: Enter amount paid, get change calculation
  - **GCash**: Provide reference number and customer details
- Click "Complete Payment"
- System creates transaction record

**6. Confirm Receipt**
- Transaction ID generated
- Sale recorded in database
- Staff can start new sale

## [CARD_ICON] Payment Methods

### Cash Payment

```
User Flow:
1. Select "Cash" payment method
2. Enter amount paid by customer
3. System calculates change automatically
4. Confirm payment
5. Transaction processed
```

Data stored:
- `transactions.status` = "Completed"
- `transactions.payment_method` = "Cash"
- `payments.amount_paid` = entered amount

### GCash Payment

```
User Flow:
1. Select "GCash" payment method
2. Upload your GCash Payment QR code (or drag & drop)
3. Enter:
   - Reference Number (from receipt)
   - Customer's GCash Number
   - Customer's Name
4. Confirm payment
5. Transaction processed
```

GCash Account Setup:
- Prepare your GCash Payment QR code image (screenshot from your GCash app)
- During checkout, upload the QR code
- Customer scans the QR code to send payment
- Reference tracked in `transactions` table

## [LINK_ICON] Database Relationships

```
Product Scanned
     ↓
products (barcode lookup)
     ↓
Add to Cart (Frontend state)
     ↓
Checkout Initiated
     ↓
Create Transaction
     ├── transactions (main record)
     ├── transaction_orders (line items)
     ├── product_batches (stock update)
     └── payments (payment proof)
```

## [CHART_ICON] Transaction Recording

When a sale completes, these records are created:

**1. Transaction Record**
```sql
INSERT INTO transactions (...) VALUES
(transaction_id, customer_id, staff_id, total_price, 'Completed', 'Cash', NOW());
```

**2. Order Line Items**
```sql
INSERT INTO transaction_orders (...) VALUES
(transaction_id, product_id, price_each, quantity);
```

**3. Stock Deduction**
```sql
UPDATE product_batches 
SET stock_quantity = stock_quantity - quantity
WHERE product_id = ? AND status = 'On Shelves';
```

## [TARGET_ICON] Connecting Items to Barcodes - Complete Process

### Method 1: Manual Assignment (Small Store)

**Step 1: Get Product Barcodes**
- Find product on packaging or box
- Or check with supplier for barcode

**Step 2: Update Database**
```sql
-- Update one product
UPDATE products SET barcode = '8888000001' WHERE product_id = 1;

-- Verify
SELECT product_id, name, barcode FROM products;
```

**Step 3: Test Scan**
- Go to POS page
- Enter barcode
- Product should appear

### Method 2: Bulk Import (Large Store)

**Step 1: Prepare CSV File** (products_with_barcodes.csv)
```
product_id,barcode
1,8888000001
2,8888000002
3,8888000003
```

**Step 2: Load into MySQL**
```sql
LOAD DATA LOCAL INFILE '/path/to/products_with_barcodes.csv'
INTO TABLE products
FIELDS TERMINATED BY ','
IGNORE 1 ROWS
(product_id, barcode);
```

### Method 3: Auto-Generate Barcodes

**For products without existing barcodes:**
```sql
-- Generate sequential barcodes based on product_id
UPDATE products 
SET barcode = CONCAT('PROD', LPAD(product_id, 8, '0'))
WHERE barcode IS NULL;

-- Result: PROD00000001, PROD00000002, etc.
```

Then print labels and associate them with physical products.

## [PRINTER_ICON] Barcode Label Printing

After assigning barcodes, print labels:

**Using Online Barcode Generator:**
1. Visit: https://barcode.tec-it.com/
2. Enter barcode number
3. Select format (Code128 or EAN13 depending on your barcode)
4. Generate and print
5. Attach label to product packaging or shelf

**Recommended Setup:**
- Attach main barcode to product
- Attach shelf code to inventory label
- Write product name on label for easy identification

## [SEARCH_ICON] Troubleshooting

### Product Not Found When Scanning

**Problem**: "Product not found" error

**Solution**:
1. Verify barcode exists in database:
   ```sql
   SELECT * FROM products WHERE barcode = 'YOUR_BARCODE';
   ```
2. Check for typos in database entry
3. Ensure barcode column was added via migration

### Camera Not Working

**Problem**: Camera button doesn't activate

**Solution**:
1. Check browser permissions (allow camera access)
2. Only works with HTTPS (or localhost)
3. Alternative: Use barcode/search mode

### Stock Not Updating

**Problem**: Product stock doesn't decrease after sale

**Solution**:
1. Verify product has active batch with "On Shelves" status
2. Check batch doesn't have future expiry date
3. Run: `SELECT * FROM product_batches WHERE product_id = ?;`

## [TRENDING_UP_ICON] Real-Time Calculations

The system automatically calculates:

### Cart Total = Sum of (price × quantity)

```javascript
subtotal = sum(item.price * item.quantity)
tax = subtotal * TAX_RATE (default 0%)
total = subtotal + tax
```

### Change Calculation (Cash Payment)

```javascript
change = amount_paid - total
```

If change < 0, payment is insufficient.

## [LOCK_ICON] Security & Validation

1. **Stock Validation**: System checks if product is in stock before adding
2. **Expired Products**: Skips batches with past expiry dates
3. **Price Integrity**: Always pulled from database, not frontend
4. **Transaction Atomicity**: All-or-nothing checkou (uses database transactions)

## [DOCUMENT_ICON] API Reference

### POST /pos/api/scan
Scan/lookup a product by barcode.

**Request:**
```json
{
  "barcode": "8888123456789"
}
```

**Response (Success):**
```json
{
  "success": true,
  "product": {
    "id": 5,
    "name": "Piattos Sour Cream",
    "barcode": "8888123456789",
    "price": 42.00,
    "stock": 15,
    "type": "Product"
  }
}
```

### GET /pos/api/products
Search for products.

**Request:** `/pos/api/products?search=piattos&category=all`

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": 5,
      "name": "Piattos Sour Cream",
      "barcode": "8888123456789",
      "price": 42.00,
      "stock": 15,
      "type": "Product"
    }
  ]
}
```

### POST /pos/api/checkout
Process a transaction.

**Request:**
```json
{
  "items": [
    { "product_id": 5, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ],
  "payment_method": "Cash"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": 42,
  "total_price": 126.00,
  "items_count": 3,
  "payment_method": "Cash"
}
```

## [FLAG_ICON] Next Steps

1. **Run Database Schema**
   ```sql
   source db_design/micropos_db.sql
   ```

2. **Add Barcodes to Products**
   - Use one of the three methods above

3. **Prepare GCash QR Code**
   - Open your GCash app
   - Go to Payment Settings → Request Money or Show QR
   - Take a screenshot of your GCash QR code
   - Save it for easy access during checkout

4. **Test the System**
   - Navigate to `/pos`
   - Try scanning a product
   - Complete a test transaction

5. **Generate Barcode Labels**
   - Print labels for all products
   - Attach to packaging/shelves

6. **Train Staff**
   - Show how to use barcode scanner
   - Practice with test products
   - Review payment methods

## [HELP_ICON] Support

For issues or questions about:
- **Barcode Setup**: Check database schema in [db_design/micropos_db.sql](../db_design/micropos_db.sql)
- **Frontend Issues**: Check browser console for errors
- **Backend Issues**: Check server logs for SQL errors
- **Camera Scanning**: Requires barcode detection library (e.g., QuaggaJS)

