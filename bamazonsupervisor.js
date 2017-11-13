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
var choices = ["View Product Sales by Department", "Create New Department", "Nothing, I am done now"]

connectToDB();

function connectToDB() {
	connection.connect(function(err) {
		if (err) throw err;
		startSupervisorInterface();
	})
}

function startSupervisorInterface() {
	inquirer.prompt([
		{
			type: "list",
			message: "Captain, what would you like to do?",
			choices: choices,
			name: "whatDo"
		}
		]).then(function(answers) {
			switch (answers.whatDo) {
				case choices[0]:
					viewProductSales();
					break;
				case choices[1]:
					createNewDepartment();
					break;
				case choices[2]: 
					console.log("Thanks for all that you do, Captain. Goodbye.");
					connection.end();
					break;
				default: 
					console.log("Thanks for all that you do, Captain. Goodbye.");
					connection.end();
					break;
			}
		})
}

function viewProductSales() {
	connection.query("SELECT * FROM departments", function(err, result) {
		if (err) throw err;
		tablelize(result);
		continueSupervising();
	})
}

function createNewDepartment() {
	inquirer.prompt([
		{
			type: "input",
			message: "What is the new department's name?",
			name: "departmentName"
		}, {
			type: "input",
			message: "What are the overhead costs?",
			name: "overHead",
		}
		]).then(function(answers) {
			if (isNaN(answers.overHead)) {
				console.log("Sorry, " + answers.overHead + " is not a valid number, and therefore cannot be the over head costs. Try again.");
				createNewDepartment();
			} else {
				var newDept = {
					department_name: answers.departmentName,
					over_head_costs: answers.overHead,
					product_sales: 0
				}
				connection.query("INSERT INTO departments SET ?", newDept, function(err, result) {
					if (err) throw err;
					console.log("You added a new department which has a new ID of " + result.insertId + ".");
					continueSupervising();
				})
			}

		})
}

function continueSupervising() {
	inquirer.prompt([
	{
		type: "confirm",
		message: "Captain, would you like to do anything else?",
		name: "continue"
	}
		]).then(function(answers) {
			if (answers.continue) {
				startSupervisorInterface();
			} else {
				connection.end();
				return console.log("Thanks for all that you do, Captain. Goodbye.");
			}
		})
}

function tablelize(result) {
	var values = [];
	for (var i = 0; i < result.length; i++) {
		var totalProfit = parseFloat(result[i].product_sales) - parseFloat(result[i].over_head_costs);
		values.push([result[i].id, result[i].department_name, result[i].over_head_costs, result[i].product_sales, totalProfit]);
	}
	console.table(["Id", "Department Name", "Over Head Costs", "Product Sales", "Total Profit"], values);
}