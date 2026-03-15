<!-- 
  INTEGRATION: Adding POS Link to Inventory Page
  [LINK_ICON] Connect POS to existing Inventory system
-->

<!-- Add this to the inventory page topbar or navigation -->
<div class="nav-icon" title="POS" aria-label="Point of Sale">
  <a href="/pos" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
    <img class="nav-icon-img" src="/images/Icon2.png" alt="POS" aria-hidden="true">
  </a>
</div>

<!-- 
  OR add a button in the toolbar section for quick access to POS
-->

<button class="btn btn-primary" id="quickPOS" type="button" onclick="window.location.href='/pos'">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
  Quick Sale (POS)
</button>

<!-- 
  INVENTORY TO POS WORKFLOW
  
  [WORKFLOW_ICON] Complete transaction flow
  3. Clicks "Quick Sale" button
  4. Goes to POS page
  5. Can immediately start selling products
  6. Stock updates in real-time
  7. Returns to Inventory to verify stock changes
  
  EXAMPLE PRODUCT FLOW:
  ─────────────────────
  [FLOW_ICON] Product lifecycle through system
  Initial State (Inventory):
  - Piattos Sour Cream: 20 units
  - Stock Badge: ⚫ (normal)
  
  After Sale (POS):
  - Scan barcode 8888123456789
  - Add 2 units to cart
  - Checkout and pay
  - Transaction created
  
  After Transaction (Inventory):
  - Piattos Sour Cream: 18 units ✓
  - Stock updated automatically
  - Staff can verify sale
  
  DATABASE FLOW:
  ──────────────
  [DATABASE_ICON] Data movement through tables
  Step 1: Staff scans product
    └─ /pos/api/scan
       └─ Query: products + product_batches
       └─ Return: product_id, name, price, available_stock
  
  Step 2: Staff adds to cart (Frontend only)
    └─ No database change yet
    └─ Cart stored in sessionStorage
  
  Step 3: Staff clicks Checkout
    └─ /pos/api/checkout
       ├─ BEGIN TRANSACTION
       ├─ INSERT INTO transactions
       ├─ INSERT INTO transaction_orders
       ├─ UPDATE product_batches (stock_quantity - quantity)
       ├─ COMMIT TRANSACTION
       └─ RETURN transaction_id
  
  Step 4: Back to Inventory
    └─ /products/items
       └─ Query updated stock from product_batches
       └─ Display shows new quantities
  
  DATA CONSISTENCY:
  [CONSISTENCY_ICON] Ensure data accuracy
  
  Products Table (NEVER changes):
  - product_id: 1
  - name: "Piattos Sour Cream"
  - selling_price: 42.00
  - barcode: "8888123456789"
  
  Product_Batches Table (Updates per sale):
  - product_id: 1
  - batch_id: 1
  - stock_quantity: 20 → 18 (after 2 unit sale)
  - status: "On Shelves"
  - expiry_date: 2026-07-16 (future)
  
  Transactions Table (New record):
  - transaction_id: 100
  - total_price: 84.00
  - date_ordered: 2026-03-16 14:30:00
  - status: "Completed"
  - payment_method: "Cash"
  
  Transaction_Orders Table (Line items):
  - transaction_id: 100
  - product_id: 1
  - price_each: 42.00
  - quantity: 2
  
  INVENTORY INSIGHTS:
  [INSIGHTS_ICON] Dashboard view of inventory
  
  The Inventory page will show:
  
  Product: Piattos Sour Cream
  Stock: 18 (calculated from product_batches)
  Price: ₱42.00
  Actions: Edit | Delete
  
  This stock is the SUM of:
    - All "On Shelves" batches
    - With future expiry dates
    - (Minus any "Reserved" or "Discontinued")
  
  REAL-TIME UPDATE CHECK:
  [UPDATE_ICON] Check data refresh rate
  
  Query used by Inventory:
  
  SELECT
    SUM(
      CASE
        WHEN pb.status = 'Discontinued' THEN 0
        ELSE COALESCE(pb.stock_quantity, 0)
      END
    ) as stock
  FROM product_batches pb
  WHERE product_id = 1
  
  This ensures:
  1. Only active inventory counted
  2. Expired products excluded
  3. Real-time sync with POS sales
  
  STAFF WORKFLOW EXAMPLE:
  [STAFF_ICON] Day-to-day operations
  
  Morning:
    - Inventory shows: 50 Piattos in stock
    - Shelf visibility: ✓ In stock
  
  Midday Sales (via POS):
    - Sale 1: -2 units → 48 left
    - Sale 2: -3 units → 45 left
    - Sale 3: -1 unit → 44 left
  
  Afternoon Check:
    - Open Inventory page
    - Refresh to see: 44 Piattos
    - Low stock badge appears if < 5
    - Can see which batches are sold from
  
  BATCH TRACKING:
  [BOX_ICON] Multiple inventory batches
  
  If you have multiple batches of same product:
  
  Batch 1: 10 units, Expires 2026-04-15, Status: "On Shelves"
  Batch 2: 40 units, Expires 2026-06-15, Status: "On Shelves"
  Total on shelf: 50 units
  
  When POS processes sale:
    - Deducts from Batch 1 first (FIFO)
    - After Batch 1 empty, uses Batch 2
    - Inventory query sums all available batches
  
  SUGGESTED ENHANCEMENTS:
  [LIGHTBULB_ICON] Future improvement ideas
  
  1. Add "Low Stock Alert" in Inventory
     - Focus on batches with < 5 units
     - Quick reorder button
  
  2. Add "Best Seller" Report
     - Link to POS sales data
     - Show top 10 items by volume
  
  3. Add "Batch Expiry Warning"
     - Show batches expiring in 7 days
     - Suggest using FIFO in POS
  
  4. Real-time Ticker in POS
     - Show current inventory count
     - Update after each scan
  
  5. Offline Mode for POS
     - Cache products locally
     - Sync when reconnected
-->
