
# Supermarket Scraper

## Description
Supermarket Scraper is a tool designed to extract product information from online supermarket websites. This includes product names, prices, descriptions, and other relevant data.

## Installation
To install Supermarket Scraper, follow these steps:
1. Ensure you have [Node.js](https://nodejs.org/) and npm installed.
2. Clone this repository or download the source code.
3. Navigate to the project directory and run `npm install` to install the required dependencies.

## Usage
To use Supermarket Scraper, navigate to the project directory and run:
```bash
node main.js
```
Replace `main.js` with the path to the main script file, if different.

## Features
- Extract product information from supermarket websites.

# DB io

## Description

The io module parses the .json files and inserts them into the PostgreSQL database

## Usage

To run the batch io operation do:

``` bash
node io/index.js <filepath> <supermarket name>
```

the filepath can be "files/file.json" and the supermarket name "nacional".