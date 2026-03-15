-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema micropos_db
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema micropos_db
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `micropos_db` DEFAULT CHARACTER SET utf8 ;
USE `micropos_db` ;

-- -----------------------------------------------------
-- Table `micropos_db`.`staff`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`staff` (
  `staff_id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(254) NULL,
  `password` VARCHAR(100) NULL,
  `first_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `role` ENUM('Store Owner', 'Employee') NULL,
  `phone_number` VARCHAR(20) NULL,
  PRIMARY KEY (`staff_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `micropos_db`.`customers`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`customers` (
  `customer_id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NULL,
  `last_name` VARCHAR(100) NULL,
  `phone_number` VARCHAR(20) NULL,
  `debt_limit` DECIMAL(10,2) NULL,
  `is_blacklisted` ENUM('T', 'F') NULL,
  `facebook_profile` TEXT NULL,
  `created_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `micropos_db`.`transactions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`transactions` (
  `transaction_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT NULL,
  `staff_id` INT NULL,
  `total_price` DECIMAL(10,2) NULL,
  `date_ordered` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  INDEX `fk_transactions_customers1_idx` (`customer_id` ASC) VISIBLE,
  INDEX `fk_transactions_staff1_idx` (`staff_id` ASC) VISIBLE,
  CONSTRAINT `fk_transactions_customers1`
    FOREIGN KEY (`customer_id`)
    REFERENCES `micropos_db`.`customers` (`customer_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_transactions_staff1`
    FOREIGN KEY (`staff_id`)
    REFERENCES `micropos_db`.`staff` (`staff_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `micropos_db`.`products`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`products` (
  `product_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `product_type` ENUM('Beverages', 'Canned Goods', 'Instant Foods', 'Snacks', 'Services') NOT NULL,
  `selling_price` DECIMAL(10,2) NULL,
  PRIMARY KEY (`product_id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `micropos_db`.`transaction_orders`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`transaction_orders` (
  `transaction_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `price_each` DECIMAL(10,2) NULL,
  `quantity` INT NULL,
  PRIMARY KEY (`transaction_id`, `product_id`),
  INDEX `fk_transaction_orders_products1_idx` (`product_id` ASC) VISIBLE,
  CONSTRAINT `fk_transaction_orders_transactions1`
    FOREIGN KEY (`transaction_id`)
    REFERENCES `micropos_db`.`transactions` (`transaction_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_transaction_orders_products1`
    FOREIGN KEY (`product_id`)
    REFERENCES `micropos_db`.`products` (`product_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `micropos_db`.`product_batches`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`product_batches` (
  `product_id` INT NOT NULL,
  `batch_id` INT NOT NULL,
  `stock_quantity` INT NULL,
  `purchase_date` DATETIME NULL,
  `expiry_date` DATETIME NULL,
  `status` ENUM('On Shelves', 'Inventory', 'Reserved', 'Discontinued') NULL,
  PRIMARY KEY (`product_id`, `batch_id`),
  CONSTRAINT `fk_product_batches_products1`
    FOREIGN KEY (`product_id`)
    REFERENCES `micropos_db`.`products` (`product_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `micropos_db`.`debts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`debts` (
  `debt_id` INT NOT NULL AUTO_INCREMENT,
  `customer_id` INT NULL,
  `debt_amount` DECIMAL(10,2) NULL,
  `status` ENUM('Unpaid', 'Overdue', 'Paid') NULL,
  `debt_started` DATE NULL,
  `debt_due` DATE NULL,
  PRIMARY KEY (`debt_id`),
  INDEX `fk_debts_customers1_idx` (`customer_id` ASC) VISIBLE,
  CONSTRAINT `fk_debts_customers1`
    FOREIGN KEY (`customer_id`)
    REFERENCES `micropos_db`.`customers` (`customer_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `micropos_db`.`debt_transactions`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`debt_transactions` (
  `debt_id` INT NOT NULL,
  `transaction_id` INT NOT NULL,
  PRIMARY KEY (`debt_id`, `transaction_id`),
  INDEX `fk_debt_transactions_transactions1_idx` (`transaction_id` ASC) VISIBLE,
  CONSTRAINT `fk_debt_transactions_debts1`
    FOREIGN KEY (`debt_id`)
    REFERENCES `micropos_db`.`debts` (`debt_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_debt_transactions_transactions1`
    FOREIGN KEY (`transaction_id`)
    REFERENCES `micropos_db`.`transactions` (`transaction_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `micropos_db`.`payments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `micropos_db`.`payments` (
  `payment_id` INT NOT NULL AUTO_INCREMENT,
  `transaction_id` INT NULL,
  `debt_id` INT NULL,
  `staff_id` INT NULL,
  `amount_paid` DECIMAL(10,2) NULL,
  `payment_method` ENUM('Cash', 'GCash', 'Other') NULL DEFAULT 'Cash',
  `proof` VARCHAR(255) NULL,
  `notes` VARCHAR(255) NULL,
  `paid_at` DATETIME NULL DEFAULT current_timestamp,
  PRIMARY KEY (`payment_id`),
  INDEX `fk_payments_transactions1_idx` (`transaction_id` ASC) VISIBLE,
  INDEX `fk_payments_debts1_idx` (`debt_id` ASC) VISIBLE,
  INDEX `fk_payments_staff1_idx` (`staff_id` ASC) VISIBLE,
  CONSTRAINT `fk_payments_transactions1`
    FOREIGN KEY (`transaction_id`)
    REFERENCES `micropos_db`.`transactions` (`transaction_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_payments_debts1`
    FOREIGN KEY (`debt_id`)
    REFERENCES `micropos_db`.`debts` (`debt_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_payments_staff1`
    FOREIGN KEY (`staff_id`)
    REFERENCES `micropos_db`.`staff` (`staff_id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
