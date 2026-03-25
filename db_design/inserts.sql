USE micropos_db;

-- Reset seeded tables so this script can be re-run safely
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `debt_transactions`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `transaction_orders`;
TRUNCATE TABLE `debts`;
TRUNCATE TABLE `transactions`;
TRUNCATE TABLE `product_batches`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `customers`;
TRUNCATE TABLE `staff`;
SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────
-- STAFF
-- ─────────────────────────────────────────
INSERT INTO `staff` (`email`, `password`, `first_name`, `last_name`, `role`, `phone_number`) VALUES
('juan.delacruz@store.com', 'owner123',    'Juan',  'Dela Cruz', 'Store Owner', '09171234567'),
('maria.santos@store.com',  'employee123', 'Maria', 'Santos',    'Employee',    '09281234567'),
('pedro.reyes@store.com',   'employee456', 'Pedro', 'Reyes',     'Employee',    '09351234567');


-- ─────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────
INSERT INTO `customers` (`first_name`, `last_name`, `phone_number`, `debt_limit`, `is_blacklisted`, `facebook_profile`) VALUES
('Charles', 'Duelas',    '09208070262', 1000.00, 'F', 'https://facebook.com/kaloy.mendoza'),   -- customer_id = 1 (Unpaid)
('Baby',  'Aquino',     '09601385340', 1000.00, 'F', 'https://facebook.com/ate.baby'),         -- customer_id = 2 (Unpaid)
('Rosie', 'Villanueva', '09213845024', 1000.00, 'T', 'https://facebook.com/rosie.villanueva'),-- customer_id = 3 (Overdue)
('Choy',  'Garcia',     '09171941380', 1000.00, 'F', 'https://facebook.com/kuya.choy'),        -- customer_id = 4 (Paid)
('Nena',  'Flores',     '09991112233', 1000.00, 'F', NULL);                                    -- customer_id = 5 (Paid)


INSERT INTO `products` (`name`, `product_type`, `selling_price`, `photo`) VALUES
('Softdrinks (330ml)',    'Beverages',    25.00, NULL),   -- product_id = 1
('Rice (1kg)',            'Canned Goods', 55.00, '/uploads/product-photos/product-1774422315762-a11cbb68.jpg'),   -- product_id = 2
('Cooking Oil (500ml)',   'Canned Goods', 78.00, '/uploads/product-photos/product-1774422092154-719198de.jpg'),   -- product_id = 3
('Instant Noodles',       'Instant Foods',15.00, '/uploads/product-photos/product-1774422223277-d1401c11.png'),   -- product_id = 4
('Load / E-Load',         'Services',       10.00, '/uploads/product-photos/product-1774422267145-a8724701.png'),   -- product_id = 5
('Photocopy (per page)',  'Services',        3.00, NULL);   -- product_id = 6

-- LOW-STOCKED HOT SELLER PRODUCT FOR TESTING
INSERT INTO `products` (`name`, `product_type`, `selling_price`, `photo`) VALUES
('Coffee Sachet', 'Beverages', 8.00, NULL); -- product_id = 7


-- ─────────────────────────────────────────
-- PRODUCT BATCHES
-- ─────────────────────────────────────────
INSERT INTO `product_batches` (`product_id`, `stock_quantity`, `purchase_date`, `expiry_date`, `status`) VALUES
(1, 120, '2026-02-01 08:00:00', '2027-02-01 00:00:00', 'On Shelves'),
(1,  60, '2026-02-15 08:00:00', '2027-02-15 00:00:00', 'Inventory'),
(2, 200, '2026-02-05 08:00:00',  NULL,                 'On Shelves'),
(3,  50, '2026-01-20 08:00:00', '2027-01-20 00:00:00', 'On Shelves'),
(4, 300, '2026-02-10 08:00:00', '2026-08-10 00:00:00', 'On Shelves'),
(4, 100, '2026-01-01 08:00:00', '2026-03-01 00:00:00', 'Discontinued');

-- LOW STOCK BATCH FOR COFFEE SACHET
INSERT INTO `product_batches` (`product_id`, `stock_quantity`, `purchase_date`, `expiry_date`, `status`) VALUES
(7, 2, '2026-03-20 08:00:00', '2027-03-20 00:00:00', 'On Shelves');



INSERT INTO `transactions` (`customer_id`, `staff_id`, `total_price`, `date_ordered`) VALUES
-- Kaloy (Unpaid debt) — 2 transactions bundled into 1 debt  [within last 7 days]
(1, 2, 300.00, '2026-03-10 10:00:00'),   -- transaction_id = 1 (13 days ago)
(1, 2, 150.00, '2026-03-12 11:00:00'),   -- transaction_id = 2 (11 days ago)
-- Ate Baby (Unpaid debt) — 1 transaction  [within last 30 days]
(2, 2, 700.00, '2026-02-28 09:30:00'),   -- transaction_id = 3 (24 days ago)
-- Rosie (Overdue debt) — 2 transactions bundled into 1 debt  [within last 60 days]
(3, 1, 500.00, '2026-01-23 14:00:00'),   -- transaction_id = 4 (60 days ago)
(3, 1, 450.00, '2026-01-31 15:00:00'),   -- transaction_id = 5 (52 days ago)
-- Kuya Choy (Paid debt) — 1 transaction  [within last 2 months]
(4, 2, 580.00, '2026-01-25 10:00:00'),   -- transaction_id = 6 (58 days ago)
-- Nena (Paid debt) — 2 transactions bundled into 1 debt  [within last 30 days]
(5, 3,  93.00, '2026-03-01 13:00:00'),   -- transaction_id = 7 (22 days ago)
(5, 3,  55.00, '2026-03-05 14:00:00'),   -- transaction_id = 8 (18 days ago)
-- TRANSACTION FOR COFFEE SACHET (recent, hot seller)
(1, 2, 80.00, '2026-03-24 09:00:00'); -- transaction_id = 9 (1 day ago)



INSERT INTO `transaction_orders` (`transaction_id`, `product_id`, `price_each`, `quantity`) VALUES
-- Kaloy txn 1: 12x Softdrinks = ₱300
(1, 1, 25.00, 12),
-- Kaloy txn 2: 1x Rice + 1x Cooking Oil + 2x Load = ₱55 + ₱78 + ₱20 = ₱150
(2, 2, 55.00,  1),
(2, 3, 78.00,  1),
(2, 5, 10.00,  2),
-- Ate Baby txn 3: 8x Rice + 2x Cooking Oil + 2x E-Load = ₱440 + ₱156 + ₱20 = ₱700 (rounded)
(3, 2, 55.00,  8),
(3, 3, 78.00,  2),
(3, 5, 10.00,  2),
-- Rosie txn 4: 5x Rice + 2x Cooking Oil = ₱275 + ₱156 = ₱500 (rounded)
(4, 2, 55.00,  5),
(4, 3, 78.00,  2),
-- Rosie txn 5: 10x Instant Noodles + 10x Softdrinks + 15x Photocopy = ₱150 + ₱250 + ₱45 = ₱445 ~₱450
(5, 4, 15.00, 10),
(5, 1, 25.00, 10),
(5, 6,  3.00, 15),
-- Kuya Choy txn 6: 6x Rice + 10x Instant Noodles + 50x Photocopy = ₱330 + ₱150 + ₱150 = ₱580 (rounded)
(6, 2, 55.00,  6),
(6, 4, 15.00, 10),
(6, 6,  3.00, 50),
-- Nena txn 7: 1x Softdrinks + 1x Rice + 1x Instant Noodles = ₱25 + ₱55 + ₱15 = ₱93 (rounded)
(7, 1, 25.00, 1),
(7, 2, 55.00, 1),
(7, 4, 15.00, 1),
-- Nena txn 8: 1x Rice = ₱55
(8, 2, 55.00, 1),
-- COFFEE SACHET SOLD 10 UNITS IN RECENT TRANSACTION
(9, 7, 8.00, 10);


-- ─────────────────────────────────────────
-- DEBTS
-- One debt per customer (not per transaction).
-- Transactions are linked via debt_transactions below.
-- debt_amount = SUM of linked transactions (stored here for quick reference)
-- ─────────────────────────────────────────
INSERT INTO `debts` (`customer_id`, `debt_amount`, `status`, `debt_started`, `debt_due`) VALUES
(1, 450.00, 'Unpaid',  '2026-03-10', '2026-05-10'),   -- debt_id = 1  Kaloy   txn 1+2  ₱300+₱150
(2, 700.00, 'Unpaid',  '2026-02-28', '2026-04-28'),   -- debt_id = 2  Ate Baby txn 3   ₱700
(3, 950.00, 'Overdue', '2026-01-23', '2026-02-23'),   -- debt_id = 3  Rosie   txn 4+5  ₱500+₱450
(4, 580.00, 'Paid',    '2026-01-25', '2026-02-25'),   -- debt_id = 4  Choy    txn 6    ₱580
(5, 148.00, 'Paid',    '2026-03-01', '2026-04-01');   -- debt_id = 5  Nena    txn 7+8  ₱93+₱55


-- ─────────────────────────────────────────
-- DEBT TRANSACTIONS
-- Links which transactions belong to which debt
-- ─────────────────────────────────────────
INSERT INTO `debt_transactions` (`debt_id`, `transaction_id`) VALUES
(1, 1),   -- Kaloy debt   ← txn 1 (₱300)
(1, 2),   -- Kaloy debt   ← txn 2 (₱150)
(2, 3),   -- Ate Baby debt ← txn 3 (₱700)
(3, 4),   -- Rosie debt   ← txn 4 (₱500)
(3, 5),   -- Rosie debt   ← txn 5 (₱450)
(4, 6),   -- Choy debt    ← txn 6 (₱580)
(5, 7),   -- Nena debt    ← txn 7 (₱93)
(5, 8);   -- Nena debt    ← txn 8 (₱55)


-- ─────────────────────────────────────────
-- PAYMENTS
-- Only for paid debts (Choy and Nena).
-- Rosie is overdue — no payments made.
-- Kaloy and Ate Baby are unpaid — no payments yet.
-- ─────────────────────────────────────────
INSERT INTO `payments` (`debt_id`, `transaction_id`, `staff_id`, `amount_paid`, `payment_method`, `proof_of_payment`, `notes`, `created_at`) VALUES
-- Kuya Choy: paid in full, lump sum (no specific transaction linked)
(4, NULL, 2, 580.00, 'GCash', 'receipts/choy_gcash.jpg',  'Paid in full via GCash', '2026-02-25 10:00:00'),

-- Nena: paid in two partial payments
(5, NULL, 3,  93.00, 'Cash',  NULL,                        'First payment, cash',    '2026-03-15 11:00:00'),
(5, NULL, 3,  55.00, 'GCash', 'receipts/nena_gcash.jpg',  'Second payment, GCash',  '2026-03-20 14:00:00');


-- ─────────────────────────────────────────
-- PAYMENT PROOFS
-- Seed records for Transaction Verification module
-- ─────────────────────────────────────────
INSERT INTO `payment_proofs` (`staff_id`, `customer_name`, `gcash_number`, `amount_paid`, `date_paid`, `proof_image_url`) VALUES
(1, 'Justin Lee',   '09208070262', 670.00, '2026-03-10', '/uploads/payment-proof/payment-proof-demo.jpg'),
(2, 'Alyssa Mansueto',      '09601385340', 500.00, '2026-02-28', '/uploads/payment-proof/payment-proof-demo.jpg'),
(1, 'Bruce Wayne', '09213845024', 1000000.00, '2026-03-01', '/uploads/payment-proof/payment-proof-demo.jpg'),
(2, 'Lianne Balbastro',      '09171941380', 50.00, '2026-02-25', '/uploads/payment-proof/payment-proof-demo.jpg'),
(3, 'Charles Duelas',      '09991112233', 123.00, '2026-03-20', '/uploads/payment-proof/payment-proof-demo.jpg');