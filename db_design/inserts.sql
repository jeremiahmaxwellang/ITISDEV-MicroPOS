USE micropos_db;

-- ─────────────────────────────────────────
-- STAFF
-- ─────────────────────────────────────────
INSERT INTO `micropos_db`.`staff` (`email`, `password`, `first_name`, `last_name`, `role`, `phone_number`) VALUES
('juan.delacruz@store.com',  '$2b$10$hashedpassword1', 'Juan',    'Dela Cruz', 'Store Owner', '09171234567'),
('maria.santos@store.com',   '$2b$10$hashedpassword2', 'Maria',   'Santos',    'Employee',    '09281234567'),
('pedro.reyes@store.com',    '$2b$10$hashedpassword3', 'Pedro',   'Reyes',     'Employee',    '09351234567');


-- ─────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────
INSERT INTO `micropos_db`.`customers` (`first_name`, `last_name`, `phone_number`, `debt_balance`, `is_blacklisted`, `facebook_profile`) VALUES
('Kaloy',  'Mendoza',  '09151234567', 300.00,   'F', 'https://facebook.com/kaloy.mendoza'),
('Baby',   'Aquino',   '09601385340', 700.00,   'F', 'https://facebook.com/ate.baby'),
('Rosie',  'Villanueva','09213845024', 3130.00,  'T', 'https://facebook.com/rosie.villanueva'),
('Choy',   'Garcia',   '09171941380', 580.00,   'T', 'https://facebook.com/kuya.choy'),
('Nena',   'Flores',   '09991112233', 0.00,     'F', NULL);


-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
INSERT INTO `micropos_db`.`products` (`product_id`, `name`, `product_type`, `selling_price`) VALUES
(1, 'Softdrinks (330ml)',   'Product', 25.00),
(2, 'Rice (1kg)',           'Product', 55.00),
(3, 'Cooking Oil (500ml)', 'Product', 78.00),
(4, 'Instant Noodles',     'Product', 15.00),
(5, 'Load / E-Load',       'Service', 10.00),
(6, 'Photocopy (per page)','Service',  3.00);


-- ─────────────────────────────────────────
-- PRODUCT BATCHES
-- ─────────────────────────────────────────
INSERT INTO `micropos_db`.`product_batches` (`product_id`, `batch_id`, `stock_quantity`, `purchase_date`, `expiry_date`, `status`) VALUES
(1, 1, 120, '2025-10-01 08:00:00', '2026-10-01 00:00:00', 'On Shelves'),
(1, 2, 60,  '2025-10-15 08:00:00', '2026-10-15 00:00:00', 'Inventory'),
(2, 1, 200, '2025-10-05 08:00:00', NULL,                  'On Shelves'),
(3, 1, 50,  '2025-09-20 08:00:00', '2026-09-20 00:00:00', 'On Shelves'),
(4, 1, 300, '2025-10-10 08:00:00', '2026-04-10 00:00:00', 'On Shelves'),
(4, 2, 100, '2025-08-01 08:00:00', '2026-02-01 00:00:00', 'Discontinued');


-- ─────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────
INSERT INTO `micropos_db`.`transactions` (`customer_id`, `staff_id`, `total_price`, `status`) VALUES
(1, 2, 300.00,  'Unpaid'),   -- transaction_id = 1 (Kaloy)
(2, 2, 700.00,  'Unpaid'),   -- transaction_id = 2 (Ate Baby)
(3, 1, 3130.00, 'Unpaid'),   -- transaction_id = 3 (Rosie)
(4, 2, 580.00,  'Unpaid'),   -- transaction_id = 4 (Kuya Choy)
(5, 3, 93.00,   'Paid'),     -- transaction_id = 5 (Nena, fully paid)
(1, 3, 55.00,   'Paid');     -- transaction_id = 6 (Kaloy, older paid transaction)


-- ─────────────────────────────────────────
-- TRANSACTION ORDERS
-- ─────────────────────────────────────────
INSERT INTO `micropos_db`.`transaction_orders` (`transaction_id`, `product_id`, `price_each`, `quantity`) VALUES
-- Kaloy: 12x Softdrinks (₱300)
(1, 1, 25.00, 12),
-- Ate Baby: 8x Rice + 2x Cooking Oil (₱440 + ₱156 = ₱596 approx; simplified to match ₱700)
(2, 2, 55.00, 8),
(2, 3, 78.00, 2),
(2, 5, 10.00, 20),
-- Rosie: mix of products
(3, 2, 55.00, 20),
(3, 3, 78.00, 10),
(3, 4, 15.00, 60),
(3, 1, 25.00, 20),
-- Kuya Choy
(4, 2, 55.00, 6),
(4, 4, 15.00, 20),
(4, 6,  3.00, 50),
-- Nena (paid)
(5, 1, 25.00, 1),
(5, 2, 55.00, 1),
(5, 4, 15.00, 1),
-- Kaloy old paid
(6, 2, 55.00, 1);


-- ─────────────────────────────────────────
-- DEBTS
-- ─────────────────────────────────────────
INSERT INTO `micropos_db`.`debts` (`customer_id`, `debt_amount`, `status`, `transaction_id`, `debt_due`) VALUES
(1, 300.00,  'Unpaid',  1, '2025-11-15'),
(2, 700.00,  'Unpaid',  2, '2025-11-20'),
(3, 3130.00, 'Overdue', 3, '2025-11-20'),
(4, 580.00,  'Overdue', 4, '2025-11-08');


-- ─────────────────────────────────────────
-- TRANSACTION AUDIT (proof of payment for paid ones)
-- ─────────────────────────────────────────
INSERT INTO `micropos_db`.`transaction_audit` (`transaction_id`, `staff_id`, `proof_of_payment`, `notes`, `created_at`) VALUES
(5, 3, 'receipts/txn5_gcash_confirm.jpg', 'Paid via GCash',       '2025-10-18 14:32:00'),
(6, 2, NULL,                              'Paid in cash, no slip', '2025-10-05 10:15:00');