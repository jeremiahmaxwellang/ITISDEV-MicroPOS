USE `micropos_db`;

-- Auto-generated from live database contents
-- Generated at: 2026-03-25T18:32:55.558Z

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `debt_transactions`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `transaction_orders`;
TRUNCATE TABLE `debts`;
TRUNCATE TABLE `transactions`;
TRUNCATE TABLE `reported_products`;
TRUNCATE TABLE `product_batches`;
TRUNCATE TABLE `payment_proofs`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `customers`;
TRUNCATE TABLE `staff`;
SET FOREIGN_KEY_CHECKS = 1;

-- STAFF
INSERT INTO `staff` (`staff_id`, `email`, `password`, `first_name`, `last_name`, `role`, `phone_number`) VALUES
(1, 'juan.delacruz@store.com', 'owner123', 'Juan', 'Dela Cruz', 'Store Owner', '09171234567'),
(2, 'maria.santos@store.com', 'employee123', 'Maria', 'Santos', 'Employee', '09281234567'),
(3, 'pedro.reyes@store.com', 'employee456', 'Pedro', 'Reyes', 'Employee', '09351234567');

-- CUSTOMERS
INSERT INTO `customers` (`customer_id`, `first_name`, `last_name`, `phone_number`, `debt_limit`, `is_blacklisted`, `facebook_profile`, `created_at`) VALUES
(1, 'Charles', 'Duelas', '09208070262', '1000.00', 'F', 'https://facebook.com/kaloy.mendoza', '2026-03-26 02:30:02'),
(2, 'Baby', 'Aquino', '09601385340', '1000.00', 'F', 'https://facebook.com/ate.baby', '2026-03-26 02:30:02'),
(3, 'Rosie', 'Villanueva', '09213845024', '1000.00', 'T', 'https://facebook.com/rosie.villanueva', '2026-03-26 02:30:02'),
(4, 'Choy', 'Garcia', '09171941380', '1000.00', 'F', 'https://facebook.com/kuya.choy', '2026-03-26 02:30:02'),
(5, 'Nena', 'Flores', '09991112233', '1000.00', 'F', NULL, '2026-03-26 02:30:02');

-- PRODUCTS
INSERT INTO `products` (`product_id`, `barcode`, `name`, `volume`, `product_type`, `selling_price`, `photo`) VALUES
(1, NULL, 'Softdrinks (330ml)', NULL, 'Beverages', '25.00', NULL),
(2, NULL, 'Rice (1kg)', NULL, 'Canned Goods', '55.00', '/uploads/product-photos/product-1774422315762-a11cbb68.jpg'),
(3, NULL, 'Cooking Oil (500ml)', NULL, 'Canned Goods', '78.00', '/uploads/product-photos/product-1774422092154-719198de.jpg'),
(4, NULL, 'Instant Noodles', NULL, 'Instant Foods', '15.00', '/uploads/product-photos/product-1774422223277-d1401c11.png'),
(5, NULL, 'Load / E-Load', NULL, 'Services', '10.00', '/uploads/product-photos/product-1774422267145-a8724701.png'),
(6, NULL, 'Photocopy (per page)', NULL, 'Services', '3.00', NULL),
(7, NULL, 'Coffee Sachet', NULL, 'Beverages', '8.00', NULL);

-- PRODUCT_BATCHES
INSERT INTO `product_batches` (`batch_id`, `product_id`, `stock_quantity`, `purchase_date`, `expiry_date`, `status`) VALUES
(1, 1, 120, '2026-02-01 08:00:00', '2027-02-01 00:00:00', 'On Shelves'),
(2, 1, 60, '2026-02-15 08:00:00', '2027-02-15 00:00:00', 'Inventory'),
(3, 2, 200, '2026-02-05 08:00:00', NULL, 'On Shelves'),
(4, 3, 50, '2026-01-20 08:00:00', '2027-01-20 00:00:00', 'On Shelves'),
(5, 4, 300, '2026-02-10 08:00:00', '2026-08-10 00:00:00', 'On Shelves'),
(6, 4, 100, '2026-01-01 08:00:00', '2026-03-01 00:00:00', 'Discontinued'),
(7, 7, 2, '2026-03-20 08:00:00', '2027-03-20 00:00:00', 'On Shelves');

-- REPORTED_PRODUCTS
-- No rows in `reported_products`

-- TRANSACTIONS
INSERT INTO `transactions` (`transaction_id`, `customer_id`, `staff_id`, `total_price`, `date_ordered`, `status`, `payment_method`) VALUES
(1, 1, 2, '300.00', '2026-03-10 10:00:00', 'Paid', 'Cash'),
(2, 1, 2, '150.00', '2026-03-12 11:00:00', 'Paid', 'Cash'),
(3, 2, 2, '700.00', '2026-02-28 09:30:00', 'Paid', 'Cash'),
(4, 3, 1, '500.00', '2026-01-23 14:00:00', 'Paid', 'Cash'),
(5, 3, 1, '450.00', '2026-01-31 15:00:00', 'Paid', 'Cash'),
(6, 4, 2, '580.00', '2026-01-25 10:00:00', 'Paid', 'Cash'),
(7, 5, 3, '93.00', '2026-03-01 13:00:00', 'Paid', 'Cash'),
(8, 5, 3, '55.00', '2026-03-05 14:00:00', 'Paid', 'Cash'),
(9, 1, 2, '80.00', '2026-03-24 09:00:00', 'Paid', 'Cash');

-- TRANSACTION_ORDERS
INSERT INTO `transaction_orders` (`transaction_id`, `product_id`, `price_each`, `quantity`, `load_amount`) VALUES
(1, 1, '25.00', 12, '0.00'),
(2, 2, '55.00', 1, '0.00'),
(2, 3, '78.00', 1, '0.00'),
(2, 5, '10.00', 2, '0.00'),
(3, 2, '55.00', 8, '0.00'),
(3, 3, '78.00', 2, '0.00'),
(3, 5, '10.00', 2, '0.00'),
(4, 2, '55.00', 5, '0.00'),
(4, 3, '78.00', 2, '0.00'),
(5, 1, '25.00', 10, '0.00'),
(5, 4, '15.00', 10, '0.00'),
(5, 6, '3.00', 15, '0.00'),
(6, 2, '55.00', 6, '0.00'),
(6, 4, '15.00', 10, '0.00'),
(6, 6, '3.00', 50, '0.00'),
(7, 1, '25.00', 1, '0.00'),
(7, 2, '55.00', 1, '0.00'),
(7, 4, '15.00', 1, '0.00'),
(8, 2, '55.00', 1, '0.00'),
(9, 7, '8.00', 10, '0.00');
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
('Photocopy (per page)',  'Services',        3.00, NULL),   -- product_id = 6
('GCash Cash-In',         'Services',       15.00, NULL),   -- product_id = 7 (example id)
('GCash Cash-Out',        'Services',       15.00, NULL);   -- product_id = 8 (example id)

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

-- INITIAL STOCK FOR GCASH CASH-OUT (product_id = 8)
INSERT INTO `product_batches` (`product_id`, `stock_quantity`, `purchase_date`, `expiry_date`, `status`) VALUES
(8, 5, '2026-03-25 08:00:00', NULL, 'On Shelves');



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

-- DEBTS
INSERT INTO `debts` (`debt_id`, `customer_id`, `debt_amount`, `mode_of_payment`, `status`, `debt_started`, `debt_due`) VALUES
(1, 1, '450.00', 'Cash', 'Unpaid', '2026-03-10', '2026-05-10'),
(2, 2, '700.00', 'Cash', 'Unpaid', '2026-02-28', '2026-04-28'),
(3, 3, '950.00', 'Cash', 'Overdue', '2026-01-23', '2026-02-23'),
(4, 4, '580.00', 'Cash', 'Paid', '2026-01-25', '2026-02-25'),
(5, 5, '148.00', 'Cash', 'Paid', '2026-03-01', '2026-04-01');

-- DEBT_TRANSACTIONS
INSERT INTO `debt_transactions` (`debt_id`, `transaction_id`) VALUES
(1, 1),
(1, 2),
(2, 3),
(3, 4),
(3, 5),
(4, 6),
(5, 7),
(5, 8);

-- PAYMENTS
INSERT INTO `payments` (`payment_id`, `transaction_id`, `debt_id`, `staff_id`, `amount_paid`, `payment_method`, `proof_of_payment`, `notes`, `created_at`) VALUES
(1, NULL, 4, 2, '580.00', 'GCash', 'receipts/choy_gcash.jpg', 'Paid in full via GCash', '2026-02-25 10:00:00'),
(2, NULL, 5, 3, '93.00', 'Cash', NULL, 'First payment, cash', '2026-03-15 11:00:00'),
(3, NULL, 5, 3, '55.00', 'GCash', 'receipts/nena_gcash.jpg', 'Second payment, GCash', '2026-03-20 14:00:00');

-- PAYMENT_PROOFS
INSERT INTO `payment_proofs` (`proof_id`, `staff_id`, `customer_name`, `gcash_number`, `amount_paid`, `date_paid`, `proof_image_url`, `created_at`, `updated_at`) VALUES
(1, 1, 'Justin Lee', '09208070262', '670.00', '2026-03-10', '/uploads/payment-proof/payment-proof-demo.jpg', '2026-03-26 02:30:02', '2026-03-26 02:30:02'),
(2, 2, 'Alyssa Mansueto', '09601385340', '500.00', '2026-02-28', '/uploads/payment-proof/payment-proof-demo.jpg', '2026-03-26 02:30:02', '2026-03-26 02:30:02'),
(3, 1, 'Bruce Wayne', '09213845024', '1000000.00', '2026-03-01', '/uploads/payment-proof/payment-proof-demo.jpg', '2026-03-26 02:30:02', '2026-03-26 02:30:02'),
(4, 2, 'Lianne Balbastro', '09171941380', '50.00', '2026-02-25', '/uploads/payment-proof/payment-proof-demo.jpg', '2026-03-26 02:30:02', '2026-03-26 02:30:02'),
(5, 3, 'Charles Duelas', '09991112233', '123.00', '2026-03-20', '/uploads/payment-proof/payment-proof-demo.jpg', '2026-03-26 02:30:02', '2026-03-26 02:30:02');
