var inquirer = require("inquirer");
var mysql = require("mysql");
var table = require("console.table");
var cowsay = require("cowsay");
var connection = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "",
	database: "bamazonDB" 
 });
var choices = ["View Products for Sale", "View Low Inventory", "Add to Inventory", "Add New Product", "Nothing, I am done now"];

connectToDB();

function connectToDB() {
	connection.connect(function(err) {
		if (err) throw err;
		startManagerInterface();
	})
}

function startManagerInterface() {
	inquirer.prompt([
	{
		type: "list",
		message: "Navigator, what would you like to do?",
		choices: choices,
		name: "whatDo"
	}
	]).then(function(answers) {
		console.log(answers.whatDo);
		switch (answers.whatDo) {
			case choices[0]: 
				viewProducts();
				break;
			case choices[1]:
				viewLowInventory();
				break;
			case choices[2]:
				addInventory();
				break;
			case choices[3]:
				addProduct();
				break;
			case choices[4]:
				console.log("Thanks for all that you do, Navigator. Goodbye.");
				connection.end();
			default: 
				break;
		}
	})
}

function viewProducts() {
	connection.query("SELECT id, product_name, price, stock_quantity FROM products", function (err, result) {
		if (err) throw err;
		tablelize(result);
		continueManaging();
	})
}

function viewLowInventory() {
	connection.query("SELECT stock_quantity, product_name, price, id FROM products WHERE stock_quantity < 5", function(err, result) {
		if (err) throw err; 
		tablelize(result);
		continueManaging();
	})
}

function addInventory() {
	connection.query("SELECT * FROM products", function(err, result) {
		if (err) throw err;
		var products = [];
		for (var i = 0; i < result.length; i++) {
			products.push(result[i].product_name);
		}

		inquirer.prompt([
			{
				type: "list",
				message: "Please select the product for which you would like to add inventory.",
				choices: products,
				name: "addInventoryToThis"
			}, {
				type: "input",
				message: "How many would you like to add to the existing inventory?",
				name: "addNewStockNumber" // need to validate this input 
			}
			]).then(function(answers) {
				var oldStockNumber = result[products.indexOf(answers.addInventoryToThis)].stock_quantity;
				var newStockNumber = parseInt(answers.addNewStockNumber) + parseInt(oldStockNumber);
				connection.query("UPDATE products SET ? WHERE ?", [{
					stock_quantity: newStockNumber 
				}, {
					product_name: answers.addInventoryToThis
				}], function(err, result) {
						if (err) throw err;
						console.log(`You have updated the stock quantity for ${answers.addInventoryToThis} to ${newStockNumber}.`)
						continueManaging();
					})
			})
	})
}

function addProduct() {
	inquirer.prompt([
		{
			type: "input",
			message: "What is the name of the new product you would like to add?",
			name: "productName"
		}, {
			type: "input",
			message: "What is the department for the product?",
			name: "productDept"
		}, {
			type: "input",
			message: "What is the price of the product?",
			name: "productPrice" 
		}, {
			type: "input",
			message: "What is the stock quantity of the product?",
			name: "productStock"
		}
		]).then(function(answers) {
			if (isNaN(answers.productPrice)) {
				console.log("Sorry, " + answers.productPrice + " is not a number, and therefore not a valid price. Try again.");
				addProduct();
			} else if (isNaN(answers.productStock)) {
				console.log("Sorry, " + answers.productStock + " is not a number, and therefore not a valid stock quantity. Try again.");
				addProduct();
			} else {
				var newProduct = {
					product_name: answers.productName,
					department_name: answers.productDept,
					price: answers.productPrice,
					stock_quantity: answers.productStock
				}
				connection.query("INSERT INTO products SET ?", newProduct, function(err, result) {
					console.log("You added a product at the number which has a new ID of " + result.insertId + ".");
					continueManaging();
				})
			}
		})
}

function continueManaging() {
	inquirer.prompt([
		{
			type: "confirm",
			message: "Navigator, would you like to do anything else?",
			name: "continue"
		}
		]).then(function(answers) {
			if (answers.continue) {
				startManagerInterface();
			} else {
				connection.end();
				return console.log("Thanks for all that you do, Navigator. Goodbye.")
			}
		})
}

function tablelize(result) {
	var values = [];
	for (var i = 0; i < result.length; i++) {
		values.push([result[i].id, result[i].product_name, result[i].price, result[i].stock_quantity]);
	}
	console.table(["Id", "Product Name", "Price", "Stock Quantity"], values);
}