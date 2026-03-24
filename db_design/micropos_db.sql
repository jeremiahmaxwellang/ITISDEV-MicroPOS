-- MicroPOS Database Schema
-- Sari-Sari Store Point of Sale System

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ─────────────────────────────────────────
DROP SCHEMA IF EXISTS `micropos_db` ;

-- -----------------------------------------------------
-- Schema micropos_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `micropos_db` DEFAULT CHARACTER SET utf8;
USE `micropos_db`;

-- -----------------------------------------------------
-- Table `staff`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `staff` (
  `staff_id`    INT          NOT NULL AUTO_INCREMENT,
  `email`       VARCHAR(254) NOT NULL UNIQUE,
  `password`    VARCHAR(100) NOT NULL,
  `first_name`  VARCHAR(100) NULL,
  `last_name`   VARCHAR(100) NULL,
  `role`        ENUM('Store Owner', 'Employee') NOT NULL DEFAULT 'Employee',
  `phone_number` VARCHAR(20) NULL,
  PRIMARY KEY (`staff_id`)
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `customers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id`      INT          NOT NULL AUTO_INCREMENT,
  `first_name`       VARCHAR(100) NULL,
  `last_name`        VARCHAR(100) NULL,
  `phone_number`     VARCHAR(20)  NULL,
  `debt_limit`       DECIMAL(10,2) NULL,
  `is_blacklisted`   ENUM('T', 'F') NOT NULL DEFAULT 'F',
  `facebook_profile` TEXT         NULL,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`)
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `products`
-- Supports both physical products and services (GCash Load, etc.)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `product_id`   INT           NOT NULL AUTO_INCREMENT,
  `barcode`      VARCHAR(255)  UNIQUE NULL COMMENT 'Barcode for POS scanning',
  `name`         VARCHAR(100)  NOT NULL,
  `product_type` ENUM('Beverages', 'Canned Goods', 'Instant Foods', 'Snacks', 'Dairy', 'Coffee', 'Services', 'Other') NOT NULL DEFAULT 'Other',
  `selling_price` DECIMAL(10,2) NULL,
  `photo`        MEDIUMTEXT    NULL COMMENT 'Base64 encoded product photo',
  PRIMARY KEY (`product_id`),
  INDEX `idx_barcode` (`barcode` ASC)
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `product_batches`
-- Each batch can have different expiry dates and statuses
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_batches` (
  `batch_id`       INT      NOT NULL AUTO_INCREMENT,
  `product_id`     INT      NOT NULL,
  `stock_quantity` INT      NULL DEFAULT 0,
  `purchase_date`  DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `expiry_date`    DATETIME NULL COMMENT 'Optional: only for perishable goods',
  `status`         ENUM('On Shelves', 'Inventory', 'Reserved', 'Discontinued') NOT NULL DEFAULT 'On Shelves',
  PRIMARY KEY (`batch_id`),
  INDEX `fk_product_batches_products_idx` (`product_id` ASC),
  CONSTRAINT `fk_product_batches_products`
    FOREIGN KEY (`product_id`)
    REFERENCES `products` (`product_id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `transactions`
-- status 'Paid' = normal sale, 'Unpaid' = utang/debt
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `transaction_id` INT           NOT NULL AUTO_INCREMENT,
  `customer_id`    INT           NULL COMMENT 'Set when customer chose utang',
  `staff_id`       INT           NULL,
  `total_price`    DECIMAL(10,2) NULL,
  `date_ordered`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status`         ENUM('Paid', 'Unpaid') NOT NULL DEFAULT 'Paid' COMMENT 'Unpaid = customer chose utang',
  `payment_method` ENUM('Cash', 'GCash', 'Other') NOT NULL DEFAULT 'Cash',
  PRIMARY KEY (`transaction_id`),
  INDEX `fk_transactions_customers_idx` (`customer_id` ASC),
  INDEX `fk_transactions_staff_idx` (`staff_id` ASC),
  CONSTRAINT `fk_transactions_customers`
    FOREIGN KEY (`customer_id`)
    REFERENCES `customers` (`customer_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_transactions_staff`
    FOREIGN KEY (`staff_id`)
    REFERENCES `staff` (`staff_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `transaction_orders`
-- Line items for each transaction
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `transaction_orders` (
  `transaction_id` INT           NOT NULL,
  `product_id`     INT           NOT NULL,
  `price_each`     DECIMAL(10,2) NULL,
  `quantity`       INT           NULL,
  `load_amount`    DECIMAL(10,2) NULL DEFAULT 0 COMMENT 'For Services: actual peso value loaded for the customer',
  PRIMARY KEY (`transaction_id`, `product_id`),
  INDEX `fk_transaction_orders_products_idx` (`product_id` ASC),
  CONSTRAINT `fk_transaction_orders_transactions`
    FOREIGN KEY (`transaction_id`)
    REFERENCES `transactions` (`transaction_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_transaction_orders_products`
    FOREIGN KEY (`product_id`)
    REFERENCES `products` (`product_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `debts`
-- Customer debt / utang records
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `debts` (
  `debt_id`      INT           NOT NULL AUTO_INCREMENT,
  `customer_id`  INT           NULL,
  `debt_amount`  DECIMAL(10,2) NULL,
  `status`       ENUM('Unpaid', 'Overdue', 'Paid') NOT NULL DEFAULT 'Unpaid',
  `debt_started` DATE          NULL DEFAULT (CURRENT_DATE),
  `debt_due`     DATE          NULL,
  PRIMARY KEY (`debt_id`),
  INDEX `fk_debts_customers_idx` (`customer_id` ASC),
  CONSTRAINT `fk_debts_customers`
    FOREIGN KEY (`customer_id`)
    REFERENCES `customers` (`customer_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `debt_transactions`
-- Links debts to transactions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `debt_transactions` (
  `debt_id`        INT NOT NULL,
  `transaction_id` INT NOT NULL,
  PRIMARY KEY (`debt_id`, `transaction_id`),
  INDEX `fk_debt_transactions_transactions_idx` (`transaction_id` ASC),
  CONSTRAINT `fk_debt_transactions_debts`
    FOREIGN KEY (`debt_id`)
    REFERENCES `debts` (`debt_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_debt_transactions_transactions`
    FOREIGN KEY (`transaction_id`)
    REFERENCES `transactions` (`transaction_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `payments`
-- Tracks payment records (cash or GCash screenshot proof)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id`       INT           NOT NULL AUTO_INCREMENT,
  `transaction_id`   INT           NULL,
  `debt_id`          INT           NULL,
  `staff_id`         INT           NOT NULL,
  `amount_paid`      DECIMAL(10,2) NULL,
  `payment_method`   ENUM('Cash', 'GCash', 'Other') NOT NULL DEFAULT 'Cash',
  `proof_of_payment` VARCHAR(255)  NULL COMMENT 'Filename of GCash screenshot',
  `notes`            VARCHAR(255)  NULL,
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`payment_id`),
  INDEX `fk_payments_transactions_idx` (`transaction_id` ASC),
  INDEX `fk_payments_debts_idx` (`debt_id` ASC),
  INDEX `fk_payments_staff_idx` (`staff_id` ASC),
  CONSTRAINT `fk_payments_transactions`
    FOREIGN KEY (`transaction_id`)
    REFERENCES `transactions` (`transaction_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_payments_debts`
    FOREIGN KEY (`debt_id`)
    REFERENCES `debts` (`debt_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_payments_staff`
    FOREIGN KEY (`staff_id`)
    REFERENCES `staff` (`staff_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `payment_proofs`
-- Transaction verification payment proofs with GCash screenshots
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_proofs` (
  `proof_id`        INT           NOT NULL AUTO_INCREMENT,
  `staff_id`        INT           NOT NULL,
  `customer_name`   VARCHAR(100)  NOT NULL,
  `gcash_number`    VARCHAR(50)   NOT NULL,
  `amount_paid`     DECIMAL(10,2) NOT NULL,
  `date_paid`       DATE          NOT NULL,
  `proof_image_url` VARCHAR(255)  NULL COMMENT 'Path to uploaded proof image',
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`proof_id`),
  INDEX `fk_payment_proofs_staff_idx` (`staff_id` ASC),
  CONSTRAINT `fk_payment_proofs_staff`
    FOREIGN KEY (`staff_id`)
    REFERENCES `staff` (`staff_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `sessions`
-- Express session store table used by express-mysql-session
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  `expires`    INT UNSIGNED NOT NULL,
  `data`       MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`),
  INDEX `idx_sessions_expires` (`expires` ASC)
) ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
