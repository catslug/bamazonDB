var inquirer = require("inquirer");
var mysql = require("mysql");
var cowsay = require("cowsay");
var table = require("console.table");
var connection = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "",
	database: "bamazonDB" 
 });
var isSameShopper = false;

function openTheStore() {
	if (!isSameShopper) {
		console.log(cowsay.say({
			text: "Hi, friend! We are a unique shop full of odds and wonders. Find the special thing that's right for you.",
			e: "^^",
			T: "U"
		}));
		isSameShopper = true;
		callTheProducts();
	} else {
		listTheProducts();
	}
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
		tablelize(result);
		whatWouldYouLikeToBuy(result.length);
	})
}

function whatWouldYouLikeToBuy(totalProd) {
	inquirer.prompt([
		{
			type: "input",
			message: "Please type in the ID of the product you would like to acquire.",
			name: "customerProdID"
		}]).then(function(answers) {
			console.log(answers.customerProdID);
			if (isNaN(answers.customerProdID) || parseInt(answers.customerProdID) > totalProd + 1) {
				console.log("Sorry, that's not a valid ID.");
				whatWouldYouLikeToBuy();
			} else { 
				getTheProductName(answers.customerProdID);
			}
		})
}

function getTheProductName(prodID) {
	connection.query("SELECT product_name FROM products WHERE id=" + prodID, function(err, result) {
		if (err) throw err;
		howManyToBuy(result[0].product_name);
	})
}

function howManyToBuy(product) {
	inquirer.prompt([
		{
			type: "input",
			message: "What quantity of " + product + " would you like to buy?",
			name: "howMany"
		}
	]).then(function(answers) {
		completePurchase(answers.howMany, product);
	})
}

function completePurchase(quantity, product) {
	connection.query("SELECT id, stock_quantity, price FROM products WHERE product_name=?", [product], function(err, result) {
		if (err) throw err;
		else if (parseFloat(quantity) > parseFloat(result[0].stock_quantity)) {
			console.log("Oopsies. We don't have that many left."); 
			askIfNeedAllStock(result[0].id, result[0].stock_quantity, product, result[0].price);
		} else {
			decrementStock(result[0].id, quantity, result[0].stock_quantity);
			alertPrice(quantity, result[0].price);
		}
	})
}

function askIfNeedAllStock(id, stock, product, price) {
	inquirer.prompt([
	{
		type: "confirm",
		message: "Would you like to buy all that we have left of the " + product + " product?",
		name: "giveMeAll"
	}
		]).then(function(answers) {
			if (answers.giveMeAll) {
				decrementStock(id, stock, stock);
				alertPrice(stock, price);
			} else {
				howManyToBuy(product);
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
			var customerSaid = answers.confirm ? openTheStore() : closeTheStore();
		})
}

function tablelize(result) {
	var values = [];
	for (var i = 0; i < result.length; i++) {
		values.push([result[i].id, result[i].product_name, result[i].price]);
	}
	console.table(["Id", "Product Name", "Price"], values);
}

function closeTheStore() {
	connection.end();
	console.log(cowsay.say({
		text: "Okay, thanks for being a rad customer!",
		e: "OO",
		T: "U"
	}));
}

openTheStore();