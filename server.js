const mysql = require("mysql");
const inquirer = require("inquirer");
require("console.table");

// Create a MySQL connection
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "PlacePassWordHere",
  database: "employeesDB"
});

// Connect to the MySQL server
connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected as ID: " + connection.threadId);
  firstPrompt();
});

// Prompt the user for the action to perform
function firstPrompt() {
  inquirer
    .prompt({
      type: "list",
      name: "task",
      message: "What would you like to do?",
      choices: [
        "View Employees",
        "View Employees by Department",
        "Add Employee",
        "Remove Employee",
        "Update Employee Role",
        "Add Role",
        "Exit"
      ]
    })
    .then(function ({ task }) {
      switch (task) {
        case "View Employees":
          viewEmployees();
          break;
        case "View Employees by Department":
          viewEmployeesByDepartment();
          break;
        case "Add Employee":
          addEmployee();
          break;
        case "Remove Employee":
          removeEmployee();
          break;
        case "Update Employee Role":
          updateEmployeeRole();
          break;
        case "Add Role":
          addRole();
          break;
        case "Exit":
          connection.end();
          break;
      }
    });
}

// View all employees
function viewEmployees() {
  console.log("Viewing all employees...\n");
  const query = `
    SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employee e
    LEFT JOIN role r ON e.role_id = r.id
    LEFT JOIN department d ON d.id = r.department_id
    LEFT JOIN employee m ON m.id = e.manager_id
  `;
  connection.query(query, function (err, res) {
    if (err) throw err;
    console.table(res);
    console.log("Employees viewed!\n");
    firstPrompt();
  });
}

// View employees by department
function viewEmployeesByDepartment() {
  console.log("Viewing employees by department...\n");
  const query = `
    SELECT d.id, d.name, r.salary AS budget
    FROM employee e
    LEFT JOIN role r ON e.role_id = r.id
    LEFT JOIN department d ON d.id = r.department_id
    GROUP BY d.id, d.name
  `;
  connection.query(query, function (err, res) {
    if (err) throw err;
    const departmentChoices = res.map(data => ({
      value: data.id,
      name: data.name
    }));
    console.table(res);
    console.log("Department view succeeded!\n");
    promptDepartment(departmentChoices);
  });
}

// Prompt the user to choose a department
function promptDepartment(departmentChoices) {
  inquirer
    .prompt([
      {
        type: "list",
        name: "departmentId",
        message: "Which department would you like to choose?",
        choices: departmentChoices
      }
    ])
    .then(function ({ departmentId }) {
      console.log("Department ID:", departmentId);
      const query = `
        SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department 
        FROM employee e
        JOIN role r ON e.role_id = r.id
        JOIN department d ON d.id = r.department_id
        WHERE d.id = ?
      `;
      connection.query(query, departmentId, function (err, res) {
        if (err) throw err;
        console.table("Response:", res);
        console.log(res.length + " employees viewed!\n");
        firstPrompt();
      });
    });
}

// Add a new employee
function addEmployee() {
  console.log("Inserting a new employee...");
  const query = "SELECT r.id, r.title, r.salary FROM role r";
  connection.query(query, function (err, res) {
    if (err) throw err;
    const roleChoices = res.map(({ id, title, salary }) => ({
      value: id,
      name: `${title} (Salary: ${salary})`
    }));
    console.table(res);
    inquirer
      .prompt([
        {
          type: "input",
          name: "first_name",
          message: "Enter the employee's first name:"
        },
        {
          type: "input",
          name: "last_name",
          message: "Enter the employee's last name:"
        },
        {
          type: "list",
          name: "roleId",
          message: "Choose the employee's role:",
          choices: roleChoices
        }
      ])
      .then(function (answer) {
        console.log(answer);
        const query = "INSERT INTO employee SET ?";
        const employee = {
          first_name: answer.first_name,
          last_name: answer.last_name,
          role_id: answer.roleId
        };
        connection.query(query, employee, function (err, res) {
          if (err) throw err;
          console.table(res);
          console.log(res.affectedRows + " employee inserted!\n");
          firstPrompt();
        });
      });
  });
}

// Remove an employee
function removeEmployee() {
  console.log("Removing an employee...");
  const query = "SELECT id, first_name, last_name FROM employee";
  connection.query(query, function (err, res) {
    if (err) throw err;
    const deleteEmployeeChoices = res.map(({ id, first_name, last_name }) => ({
      value: id,
      name: `${id} - ${first_name} ${last_name}`
    }));
    console.table(res);
    inquirer
      .prompt([
        {
          type: "list",
          name: "employeeId",
          message: "Choose the employee you want to remove:",
          choices: deleteEmployeeChoices
        }
      ])
      .then(function ({ employeeId }) {
        const query = "DELETE FROM employee WHERE ?";
        connection.query(query, { id: employeeId }, function (err, res) {
          if (err) throw err;
          console.table(res);
          console.log(res.affectedRows + " employee deleted!\n");
          firstPrompt();
        });
      });
  });
}

// Update an employee's role
function updateEmployeeRole() {
  console.log("Updating an employee's role...");
  const employeeQuery = `
    SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department
    FROM employee e
    JOIN role r ON e.role_id = r.id
    JOIN department d ON d.id = r.department_id
    JOIN employee m ON m.id = e.manager_id
  `;
  connection.query(employeeQuery, function (err, res) {
    if (err) throw err;
    const employeeChoices = res.map(({ id, first_name, last_name }) => ({
      value: id,
      name: `${first_name} ${last_name}`
    }));
    console.table(res);
    inquirer
      .prompt([
        {
          type: "list",
          name: "employeeId",
          message: "Choose the employee you want to update:",
          choices: employeeChoices
        }
      ])
      .then(function ({ employeeId }) {
        const roleQuery = "SELECT id, title FROM role";
        connection.query(roleQuery, function (err, res) {
          if (err) throw err;
          const roleChoices = res.map(({ id, title }) => ({
            value: id,
            name: title
          }));
          console.table(res);
          inquirer
            .prompt([
              {
                type: "list",
                name: "roleId",
                message: "Choose the new role:",
                choices: roleChoices
              }
            ])
            .then(function ({ roleId }) {
              const query = "UPDATE employee SET ? WHERE ?";
              connection.query(
                query,
                [{ role_id: roleId }, { id: employeeId }],
                function (err, res) {
                  if (err) throw err;
                  console.table(res);
                  console.log(res.affectedRows + " employee updated!\n");
                  firstPrompt();
                }
              );
            });
        });
      });
  });
}

// Add a new role
function addRole() {
  console.log("Adding a new role...");
  const departmentQuery = "SELECT id, name FROM department";
  connection.query(departmentQuery, function (err, res) {
    if (err) throw err;
    const departmentChoices = res.map(({ id, name }) => ({
      value: id,
      name: name
    }));
    console.table(res);
    inquirer
      .prompt([
        {
          type: "input",
          name: "title",
          message: "Enter the role title:"
        },
        {
          type: "input",
          name: "salary",
          message: "Enter the role salary:"
        },
        {
          type: "list",
          name: "departmentId",
          message: "Choose the department for the role:",
          choices: departmentChoices
        }
      ])
      .then(function (answer) {
        const query = "INSERT INTO role SET ?";
        const role = {
          title: answer.title,
          salary: answer.salary,
          department_id: answer.departmentId
        };
        connection.query(query, role, function (err, res) {
          if (err) throw err;
          console.table(res);
          console.log(res.affectedRows + " role inserted!\n");
          firstPrompt();
        });
      });
  });
}
