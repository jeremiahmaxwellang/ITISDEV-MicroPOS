# MicroPOS
This project is developed as a requirement of ITISDEV

# Project Overview:
MicroPOS is a POS System and Inventory Management System for Sari Sari Store Owners

## Getting Started

### Dependencies

* NodeJS v22 or higher
Download here: [https://nodejs.org/en/download](https://nodejs.org/en/download)

* MySQL Server and Workbench
Download here: [https://dev.mysql.com/downloads/installer/](https://dev.mysql.com/downloads/installer/)

### Installation

* On VsCode, use [CTRL + `] to open the terminal
```
CTRL + `
``` 

* Press the + icon to use Command Prompt, DO NOT use powershell
* On command prompt, change directory to the path of the project folder. Example command below:
```
cd Downloads/ITISDEV-MicroPOS
``` 

* Use the package manager [npm] to initialize the folder as a NodeJS project.

```
npm init -y
```

* Use [npm] to install the required Node libraries
```
npm install express mysql2 dotenv hbs path express-fileupload express-session cookie-parser
```

#### Configuring the Database
* In the project folder, navigate to the 'db_design' folder
* Find the micropos_db.sql file
* Copy paste the script in MySQL Workbench and run it


### Executing program

* Go to command prompt
* Change directory to the path of the project folder. Example command below:
```
cd Downloads/ITISDEV-MicroPOS
```

* Run the Node Server
```
node src/index.js
```

* On your browser, enter the URL "localhost:3000" to access the homepage

## Help

Ensure port 3000 is free on your device before running the server

## Authors
Jeremiah Maxwell Ang
[@jeremiahmaxwellang](https://github.com/jeremiahmaxwellang)

Charles Kevin Duelas
[@Duelly01](https://github.com/Duelly01)

Justin Nicolai Lee
[@juicetice](https://github.com/juiceticedlsu)

## Acknowledgments
* Sir Raphael Gonda