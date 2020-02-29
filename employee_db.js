const inquirer = require('inquirer');
const cTable = require('console.table');
const mysql = require('mysql');
const PORT = process.env.PORT || 3306;

const connection = mysql.createConnection({
  host: 'localhost',
  port: PORT,
  user: 'root',
  password: 'mesmes',
  database: 'employee_tracker'
});

connection.connect(function (err) {
  if (err) throw err;
  runUserRequest();

});


function runUserRequest() {
  //Run an inquirer promptto capture user input
  inquirer
    .prompt({
      name: "userPreference",
      type: "rawlist",
      message: "What would you like to do?",
      choices: [
        "View All Employees",
        "View All Employees By Department",
        "View All Employees By Manager",
        "Add Employee",
        "Remove Employee",
        "Update Employee Role",
        "Update Employee Manager",
        "Done"
      ]
    })
    .then(answer => {
      switch (answer.userPreference) {
        case "View All Employees":
          listAllEmployees();
          break;

        case "View All Employees By Department":
          employeesByDepartment();
          break;

        case "View All Employees By Manager":
          employeeByManager();
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

        case "Update Employee Manager":
          updateEmployeeManager();
          break;
      }
    });
}

async function addEmployee() {

  connection.query("SELECT * FROM role;", (err, roleRes) => {

    inquirer.prompt([{
      type: "input",
      message: "Please Enter Employee's First Name ",
      name: "firstName"
    }, {
      type: "input",
      message: "Please Enter Employee's Last Name ",
      name: "lastName"
    }, {
      type: "list",
      message: "What is Employee's Role?",
      name: "empRole",
      choices: roleRes.map(role => {
        return role.title;
      })
    }]).then((employeeInfo) => {
      connection.query("SELECT * FROM department;", (err, depRes) => {
          inquirer.prompt([{
            type: "list",
            message: "What is Employee's Department?",
            name: "depTitle",
            choices: depRes.map(dep => {
              return dep.name;
            })
          }]).then(departmentInfo => {

            let currentRole = roleRes.map(role => {

              if (role.title === employeeInfo.empRole) {
                return role;
              };
            });

            let currentDep = depRes.map(dep => {

              if (dep.name === departmentInfo.depTitle) {
                return dep.id;
              };
            });

            connection.query("INSERT INTO employee SET ?", {
              first_name: employeeInfo.firstName,
              last_name: employeeInfo.lastName,
              role_id: currentRole[0].id,
              manager_id: 1
            }, )

            connection.end();
          })
        }

      )

    })
  })

}


function listAllEmployees() {

  let query = "SELECT   e.id AS 'ID', e.first_name AS 'First Name', e.last_name AS 'Last Name', r.title AS 'Title', r.Salary AS 'Salary',d.name AS Department FROM employee e LEFT JOIN role r ON e.role_id = r.id LEFT JOIN department d ON r.department_id = d.id;";

  connection.query(query, (err, res) => {

    if (err) throw err;

    console.table(res)

    runUserRequest();
  });
}


function employeesByDepartment() {
  connection.query("SELECT * FROM department;", (err, depRes) => {

    inquirer.prompt([{
      type: "list",
      message: "Which Department Employee's do you want to see?",
      name: "depName",
      choices: depRes.map(dep => {
        return dep.name;
      })
    }]).then((res) => {
      let currentDep = depRes.map(dep => {
        if (dep.name === res.depName) {
          return dep;
        };
      });
      connection.query("SELECT  e.id AS 'ID', e.first_name AS 'First Name', e.last_name AS 'Last Name', r.title AS 'Title', d.name AS 'Department' FROM employee e RIGHT JOIN role r ON e.role_id = r.id RIGHT JOIN  department d ON r.department_id = d.id WHERE ?;", {
          'd.id': currentDep[0].id
        },
        (err, res) => {
          console.log("currentDep = " + JSON.stringify(currentDep));
          if (err) throw err;
          console.table(res)
          connection.end()
        })
    })
  })
}


function employeeByManager() {
  connection.query("SELECT * FROM employee RIGHT JOIN role ON employee.manager_id = role.id;", (err, empRes) => {

    inquirer.prompt([{
      type: "list",
      message: "View employee's under Manager : ",
      name: "mngName",
      choices: empRes.map(mng => {
        return `${mng.first_name} ${mng.last_name}`;
      })
    }]).then((res) => {
      let currentMng = empRes.map(mng => {
        if (`${mng.first_name} ${mng.last_name}` === res.mngName) {
          return mng;
        };
      });
      connection.query("SELECT  id AS 'ID', first_name AS 'First Name', last_name AS 'Last Name' FROM employee  WHERE ?;", {
          manager_id: currentMng[0].id
        },
        (err, res) => {
          console.log("currentMng = " + JSON.stringify(currentMng));
          if (err) throw err;
          console.table(res)
          connection.end()
        })
    })
  })
}


function removeEmployee() {
  connection.query("SELECT id, first_name AS 'First Name', last_name AS 'Last Name' FROM employee;", (err, empRes) => {
    let empId;
    inquirer.prompt([{
      type: "list",
      message: "Select employee you would like to Delete",
      name: "empName",
      choices: empRes.map(emp => {
        return `${emp.id} - ${emp['First Name']} ${emp['Last Name']}`;
      })
    }]).then(res => {
      empRes.forEach(emp => {
        if (res.empName === `${emp.id} - ${emp['First Name']} ${emp['Last Name']}`) {
          empId = emp.id;
        }
      });
      connection.query("DELETE FROM employee WHERE ? ;", {
          id: empId
        },
        (err) => {
          if (err) throw err;
          connection.end()

        })
    })
  })
}

function updateEmployeeRole() {
  connection.query("SELECT e.id, e.first_name AS 'First Name', e.last_name AS 'Last Name', r.title AS 'Title' FROM employee E LEFT JOIN role r ON e.role_id = r.id;", (err, empRes) => {
    let empId;
    inquirer.prompt([{
      type: "list",
      message: "Select employee you would like to Update",
      name: "empName",
      choices: empRes.map(emp => {
        return `${emp.id} - ${emp['First Name']} ${emp['Last Name']} ${emp['Title']}`;
      })
    }]).then(res => {
      connection.query("SELECT * FROM role;", (err, roleRes) => {

        inquirer.prompt([{
          type: "list",
          message: "Which Department Employee's do you want to see?",
          name: "roleTitle",
          choices: roleRes.map(role => {
            return role.title;
          })
        }]).then((res) => {
          let currentRole = roleRes.map(role => {
            if (role.title === res.roleTitle) {
              return role;
            };
          });

          empRes.forEach(emp => {
            if (res.empName === `${emp.id} - ${emp['First Name']} ${emp['Last Name']} ${emp['Title']}`) {
              empId = emp.id;
            }
          });
          connection.query("UPDATE employee SET ? WHERE ? ;", [
            {
              role_id: currentRole[0].id
            },
            {
              id: empId
            },
          ],
            (err) => {
              if (err) throw err;
              connection.end()

            })
        })
      })
    })
  })
}