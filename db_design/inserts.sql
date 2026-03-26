
USE `micropos_db`;

-- Auto-generated from live database contents
-- Generated at: 2026-03-26T00:12:05.246Z

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
(1, 'Charles', 'Duelas', '09208070262', '1000.00', 'F', 'https://facebook.com/kaloy.mendoza', '2026-03-26 02:30:02.000'),
(2, 'Baby', 'Aquino', '09601385340', '1000.00', 'F', 'https://facebook.com/ate.baby', '2026-03-26 02:30:02.000'),
(3, 'Rosie', 'Villanueva', '09213845024', '1000.00', 'T', 'https://facebook.com/rosie.villanueva', '2026-03-26 02:30:02.000'),
(4, 'Choy', 'Garcia', '09171941380', '1000.00', 'F', 'https://facebook.com/kuya.choy', '2026-03-26 02:30:02.000'),
(5, 'Nena', 'Flores', '09991112233', '1000.00', 'F', NULL, '2026-03-26 02:30:02.000'),
(6, 'Charles', 'Duelas', '09208070262', '1000.00', 'F', 'https://facebook.com/kaloy.mendoza', '2026-03-26 05:15:46.000'),
(7, 'Baby', 'Aquino', '09601385340', '1000.00', 'F', 'https://facebook.com/ate.baby', '2026-03-26 05:15:46.000'),
(8, 'Rosie', 'Villanueva', '09213845024', '1000.00', 'T', 'https://facebook.com/rosie.villanueva', '2026-03-26 05:15:46.000'),
(9, 'Choy', 'Garcia', '09171941380', '1000.00', 'F', 'https://facebook.com/kuya.choy', '2026-03-26 05:15:46.000'),
(10, 'Nena', 'Flores', '09991112233', '1000.00', 'F', NULL, '2026-03-26 05:15:46.000'),
(11, 'Charles Kevin', 'Duelas', '09524854773', '1000.00', 'F', NULL, '2026-03-26 06:08:54.000'),
(12, 'Lianne Maxene', 'Balbastro', '09275630095', '1000.00', 'F', NULL, '2026-03-26 07:07:08.000'),
(13, 'Juan', 'Karlos', '09524854773', '1000.00', 'F', NULL, '2026-03-26 07:16:04.000');

-- PRODUCTS
INSERT INTO `products` (`product_id`, `barcode`, `name`, `volume`, `product_type`, `selling_price`, `reorder_threshold`, `near_expiry_days`, `photo`) VALUES
(1, NULL, 'Load / E-Load', NULL, 'Services', '10.00', 5, 14, NULL),
(2, NULL, 'Cash-In / Cash-Out', NULL, 'Services', '20.00', 5, 14, NULL),
(4, '4800361339568', 'Nescafe Instant Coffee', '91.2g', 'Coffee', '10.00', 5, 14, '/uploads/product-photos/product-1774473825409-063e4163.jpg'),
(5, '4800016644801', 'Piattos Cheese', '40g', 'Snacks', '30.00', 5, 14, '/uploads/product-photos/product-1774474065345-8fdad045.webp'),
(6, '4807770270291', 'Lucky Me Pancit Canton Kalamansi', '80g', 'Instant Foods', '20.00', 5, 14, '/uploads/product-photos/product-1774474289540-77568141.jpg'),
(7, '5060250610829', 'Nissin Cup Noodles Seafood', '60g', 'Instant Foods', '44.00', 5, 14, '/uploads/product-photos/product-1774474436039-e164d929.jpg'),
(8, '8713108000033', 'Yakult', '400ml', 'Beverages', '320.00', 5, 14, '/uploads/product-photos/product-1774474939619-d9ec7b18.jpg'),
(9, '12345665788567575632', 'Nestle Chuckie', '250ml', 'Beverages', '32.00', 5, 14, '/uploads/product-photos/product-1774476768619-89d56e4a.png');

-- PRODUCT_BATCHES
INSERT INTO `product_batches` (`batch_id`, `product_id`, `stock_quantity`, `purchase_date`, `expiry_date`, `status`) VALUES
(2, 4, 497, '2026-03-26 05:23:47.000', NULL, 'On Shelves'),
(3, 5, 35, '2026-03-26 05:27:47.000', NULL, 'On Shelves'),
(4, 6, 93, '2026-03-26 05:30:45.000', NULL, 'On Shelves'),
(5, 7, 28, '2026-03-26 05:34:24.000', NULL, 'On Shelves'),
(6, 8, 11, '2026-03-26 05:42:21.000', NULL, 'On Shelves'),
(7, 9, 3, '2026-03-26 06:12:50.000', NULL, 'On Shelves');

-- REPORTED_PRODUCTS
-- No rows in `reported_products`

-- TRANSACTIONS
INSERT INTO `transactions` (`transaction_id`, `customer_id`, `staff_id`, `total_price`, `date_ordered`, `status`, `payment_method`) VALUES
(1, NULL, 1, '150.00', '2026-03-26 05:44:38.000', 'Paid', 'GCash'),
(2, 13, 1, '826.00', '2026-03-26 07:19:53.000', 'Unpaid', 'Other'),
(3, NULL, 1, '506.00', '2026-03-26 07:33:40.000', 'Paid', 'Cash'),
(4, NULL, 1, '412.00', '2026-03-26 07:36:28.000', 'Paid', 'Cash');

-- TRANSACTION_ORDERS
INSERT INTO `transaction_orders` (`transaction_id`, `product_id`, `price_each`, `quantity`, `load_amount`) VALUES
(1, 1, '10.00', 1, '100.00'),
(1, 6, '20.00', 2, '0.00'),
(2, 4, '10.00', 1, '0.00'),
(2, 5, '30.00', 2, '0.00'),
(2, 6, '20.00', 2, '0.00'),
(2, 7, '44.00', 1, '0.00'),
(2, 8, '320.00', 2, '0.00'),
(2, 9, '32.00', 1, '0.00'),
(3, 4, '10.00', 1, '0.00'),
(3, 5, '30.00', 2, '0.00'),
(3, 6, '20.00', 2, '0.00'),
(3, 7, '44.00', 1, '0.00'),
(3, 8, '320.00', 1, '0.00'),
(3, 9, '32.00', 1, '0.00'),
(4, 4, '10.00', 1, '0.00'),
(4, 5, '30.00', 1, '0.00'),
(4, 6, '20.00', 1, '0.00'),
(4, 8, '320.00', 1, '0.00'),
(4, 9, '32.00', 1, '0.00');

-- DEBTS
INSERT INTO `debts` (`debt_id`, `customer_id`, `debt_amount`, `mode_of_payment`, `status`, `debt_started`, `debt_due`) VALUES
(1, 11, '1000.00', 'Cash', 'Unpaid', '2026-03-26 00:00:00.000', '2026-03-27 00:00:00.000'),
(2, 12, '1000.00', 'Cash', 'Unpaid', '2026-03-26 00:00:00.000', '2026-03-28 00:00:00.000'),
(3, 13, '200.00', 'Cash', 'Paid', '2026-03-26 00:00:00.000', '2026-03-26 00:00:00.000'),
(4, 13, '826.00', 'Cash', 'Unpaid', '2026-03-26 00:00:00.000', NULL);

-- DEBT_TRANSACTIONS
INSERT INTO `debt_transactions` (`debt_id`, `transaction_id`) VALUES
(4, 2);

-- PAYMENTS
INSERT INTO `payments` (`payment_id`, `transaction_id`, `debt_id`, `staff_id`, `amount_paid`, `payment_method`, `proof_of_payment`, `notes`, `created_at`) VALUES
(1, 1, NULL, 1, '150.00', 'GCash', 'proof-1774475078347-df6f4706.jpg', 'Ref: 123123123123; Name: Lianne Balbastro; Number: 09275630095', '2026-03-26 05:44:38.000'),
(2, NULL, 3, 1, '200.00', 'Cash', NULL, 'Paid in full', '2026-03-26 07:16:08.000');

-- PAYMENT_PROOFS
INSERT INTO `payment_proofs` (`proof_id`, `staff_id`, `transaction_id`, `customer_name`, `gcash_number`, `amount_paid`, `date_paid`, `proof_image_url`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Lianne Balbastro', '09275630095', '150.00', '2026-03-26 00:00:00.000', '/uploads/payment-proof/proof-1774475078347-df6f4706.jpg', '2026-03-26 05:44:38.000', '2026-03-26 05:44:38.000'),
(2, 1, 3, 'Kevin', 'CASH', '506.00', '2026-03-26 00:00:00.000', NULL, '2026-03-26 07:33:40.000', '2026-03-26 07:33:40.000'),
(3, 1, 4, 'Carlos', 'CASH', '412.00', '2026-03-26 00:00:00.000', NULL, '2026-03-26 07:36:28.000', '2026-03-26 07:36:28.000');
