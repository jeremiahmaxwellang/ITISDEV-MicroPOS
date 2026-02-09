# MicroPOS
This project is developed as a requirement of ITISDEV

# Project Overview:
MicroPOS is a POS System and Inventory Management System for Sari Sari Store Owners

## Getting Started

### Dependencies

* XAMPP Control Panel
[https://www.apachefriends.org/download.html](https://www.apachefriends.org/download.html)

* MySQL

## Installation (Please follow each tutorial in order)

#### 1. Install XAMPP
* How to Install XAMPP:
* [https://www.youtube.com/watch?v=VCHXCusltqI](https://www.youtube.com/watch?v=VCHXCusltqI)

#### 2. Run XAMPP as Administrator (make sure you always run the xampp.control app)
* How to run XAMPP as Administrator:
* [https://www.youtube.com/watch?v=29M9beAcrLw&t=1s](https://www.youtube.com/watch?v=29M9beAcrLw&t=1s)

#### 3. Click the Checkboxes for Apache and MySQL in the XAMPP.CONTROL App
* Open xampp.control in the xampp folder
* Beside 'Apache', click the checkbox []
* Beside 'MySQL', click the checkbox []

## 4. Change MySQL Port to 3307
* How to change XAMPP MySQL Port to 3307:
* [https://youtu.be/u96rVINbAUI?si=Q_RhHPAlpDtVy730](https://youtu.be/u96rVINbAUI?si=Q_RhHPAlpDtVy730)

#### 5. Clone repository into XAMPP's htdocs folder

* Download ZIP of main branch on GitHub
* Extract the project folder to your ```xampp/htdocs``` folder
* To find the htdocs folder, open your XAMPP Control Panel and press [Explorer] to open
the file location of the xampp folder.

### TBA: Creating the DATABASE
#### Step 1: Find the sql scripts in database/scripts
* Under the ```database/scripts``` subfolder, find the [???-schema.sql] script

#### Step 2: Copy paste the script into myphpadmin
1. tba

### Populating the DATABASE
1. PREREQUISITE: Ensure the [TBA] schema exists in your phpadmin databases


### Executing program

* Open XAMPP Control Panel

* Open the Apache service
- Wait for the "Apache" label on the left to be highlighted green

* Open the MySQL service
- Wait for the "MySQL" label on the left to be highlighted green

* On your browser, enter the following URL to access the login page
```
localhost/folder-name/views/login.php
```

## Help

### Issue: Cannot Delete Database in phpMyAdmin (XAMPP) — "Directory Not Empty"

If you're using XAMPP and encounter the error **"Cannot delete database, directory not empty"** in phpMyAdmin, this guide will help you resolve it safely.

---

## Problem

When attempting to delete a database via phpMyAdmin, you may see:
```Cannot delete database: Directory not empty```


This typically occurs when MySQL cannot remove the database folder from the file system due to leftover files or locked resources.

---

## Solution Steps

### 0. Try dropping the Database first

On the SQL tab in myphpadmin, use the following SQL statement:
```  DROP SCHEMA micropos_db;  ```

## If Schema is not dropping:

### 1. Stop MySQL Service

Before making any changes:

- Open **XAMPP Control Panel**
- Click **Stop** next to **MySQL**

This ensures no files are in use or locked.

---

### 2. Locate the MySQL Data Directory

Navigate to the MySQL data folder:

```C:\xampp\mysql\data\```


Find the folder named after your database (e.g., `micropos_db`).

---

### 3. Delete the Database Folder Manually

- Right-click the folder (e.g., `micropos_db`)
- Select **Delete**
- If Windows prevents deletion, restart your computer or confirm MySQL is fully stopped

---

### 4. Restart MySQL

- Return to **XAMPP Control Panel**
- Click **Start** next to **MySQL**

Your database should now be removed from phpMyAdmin.

---

## Optional Cleanup

If the folder contains leftover files like:

- `table_name.frm`
- `table_name.ibd`
- `db.opt`

### 5. Run the DB Scripts

- In the myphpadmin SQL menu, copy paste and run the following scripts:
- schema tba

Your database should now be removed from phpMyAdmin.


## Authors
Jeremiah Maxwell Ang
[@jeremiahmaxwellang](https://github.com/jeremiahmaxwellang)

Charles Kevin Duelas
[@Duelly01](https://github.com/Duelly01)

Justin Nicolai Lee
[@juicetice](https://github.com/juiceticedlsu)