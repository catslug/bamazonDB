var inquirer = require("inquirer");
var mysql = require("mysql");
var connection = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "",
	database: "bamazonDB" 
 });

function openTheStore() {
	console.log("Hi, friend! We are a unique shop full of odds and wonders. Find the special thing that's right for you.")
	callTheProducts();
}

function callTheProducts() {
  	connection.connect(function(err) {
  		if (err) throw err; 
  		listTheProducts();
  	})
}

function listTheProducts() {
	connection.query("SELECT id, product_name, price FROM products", function(err, result) {
		if (err) throw err;
		for (var i = 0; i < result.length; i++) {
			console.log("ID: " + result[i].id + ", Product: " + result[i].product_name + ", Price: " + result[i].price);
		}
		whatWouldYouLikeToBuy();
	})
}

function whatWouldYouLikeToBuy() {
	inquirer.prompt([
		{
			type: "input",
			message: "Please type in the ID of the product you would like to acquire.",
			name: "customerProdID"
		}]).then(function(answers) {

			// Validate the input
			getTheProductName(answers.customerProdID);
		})
}

function getTheProductName(prodID) {
	connection.query("SELECT product_name FROM products WHERE id=" + prodID, function(err, result) {
		if (err) throw err;
		howManyWouldYouLikeToBuy(result[0].product_name);
	})
}

function howManyWouldYouLikeToBuy(product) {
	inquirer.prompt([
		{
			type: "input",
			message: "What quantity of " + product + " would you like to buy?",
			name: "howMany"
		}
	]).then(function(answers) {
		completeThePurchase(answers.howMany, product);
	})
}

function completeThePurchase(quantity, product) {
	connection.query("SELECT id, stock_quantity, price FROM products WHERE product_name=?", [product], function(err, result) {
		if (err) throw err;
		else if (parseFloat(quantity) > parseFloat(result[0].stock_quantity)) {
			console.log("Oopsies. We don't have that many left."); // ask if they would like to purchase all we have or input new quantity
		} else {
			decrementStock(result[0].id, quantity, result[0].stock_quantity);
			alertPrice(quantity, result[0].price);
		}
	})
}

function decrementStock(prodID, quantity, stock) {
	var newStockQuantity = parseFloat(stock) - parseFloat(quantity); 
	connection.query("UPDATE products SET stock_quantity=" + newStockQuantity + " WHERE id=" + prodID), function(err, result) {
		if (err) throw err;
	} 
}

function alertPrice(quantity, price) {
	var customerInvoice = parseFloat(quantity) * parseFloat(price);
	console.log("You've completed your purchase for " + customerInvoice);
	askIfKeepShopping();
}

function askIfKeepShopping() {
	inquirer.prompt([
		{
			type: "confirm",
			message: "Would you like to keep shopping?",
			name: "confirm"
		}
		]).then(function(answers) {
			connection.end(); // IS THIS IN THE RIGHT PLACE I DON'T KNOW ANYMORE UGH
			var customerSaid = answers.confirm ? openTheStore() : closeTheStore();
		})
}

function closeTheStore() {
	console.log("Okay, thanks for being a rad customer!");
}

openTheStore();