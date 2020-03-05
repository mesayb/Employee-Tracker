const inquirer = require('inquirer');
const cTable = require('console.table');
const mysql = require('mysql');
const PORT = process.env.PORT || 3306;
let newRoleName;
let roleList;
let depList;
let mngrList;

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
  queryDepartmentList();
  inquirer
    .prompt({
      name: "userPreference",
      type: "rawlist",
      message: "What would you like to do?",
      choices: [
        "View All Employees",
        "View All Employees By Department",
        "Add Employee",
        "Remove Employee",
        "Update Employee Role",
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

        case "Add Employee":
          addEmployee();
          break;

        case "Remove Employee":
          removeEmployee();
          break;

        case "Update Employee Role":
          updateEmployeeRole();
          break;

      }
    });
}

// list all employees
function listAllEmployees() {
  let query = "SELECT   e.id AS 'ID', e.first_name AS 'First Name', e.last_name AS 'Last Name', r.title AS 'Title', r.Salary AS 'Salary',d.name AS Department FROM employee e LEFT JOIN role r ON e.role_id = r.id LEFT JOIN department d ON r.department_id = d.id;";

  connection.query(query, (err, res) => {

    if (err) throw err;

    console.table(res)

    runUserRequest();
  });
}

//add employees
async function addEmployee() {
  queryManagerList();
  connection.query("SELECT * FROM role;", async (err, roleRes) => {
    inquirer.prompt([{
      type: "input",
      message: "Please Enter Employee's First Name ",
      name: "firstName"
    }, {
      type: "input",
      message: "Please Enter Employee's Last Name ",
      name: "lastName"
    }, {
      type: "rawlist",
      message: "Employees's Manager : ",
      name: "empManager",
      choices: ['No Manager', ...(mngrList.map(mngr => {
        return `${mngr['First Name']} - ${mngr['Last Name']}`;
      }))]
    }, {
      type: "rawlist",
      message: "What is Employee's Role?",
      name: "empRole",
      choices: ['New Role', ...(roleRes.map(role => {
        return role.title;
      }))]
    }]).then(async (employeeInfo) => {
        let mngrId;
        if (employeeInfo.empManager === 'No Manager') {
          mngrId = null;
          employeeInfo.mngrId = mngrId;
        } else
        if (employeeInfo.empManager !== 'No Manager') {
          mngrList.map(mngr => {
            if (employeeInfo.empManager === `${mngr['First Name']} - ${mngr['Last Name']}`) {
              mngrId = mngr['Manager Id'];
              employeeInfo.mngrId = mngrId;
            }
          })
        }


        if (employeeInfo.empRole === 'New Role') {

          await addNewRole(employeeInfo);
          depList =  queryDepartmentList();

        } else {
          connection.query("INSERT INTO employee SET ?", {
            first_name: employeeInfo.firstName,
            last_name: employeeInfo.lastName,
            role_id: roleRes.map(el => {
              if (el.title === employeeInfo.empRole) {
                return el.id;
              }
            })[0],
            manager_id: employeeInfo.mngrId
          }, (err) => {
            if (err) {
              console.log(err)
            }
          })
        }
        listAllEmployees();
      }
    )
  })

}


function employeesByDepartment() {
  connection.query("SELECT * FROM department;", (err, depRes) => {
    inquirer.prompt([{
      type: "rawlist",
      message: "Which Department Employee's do you want to see?",
      name: "depName",
      choices: depRes.map(dep => {
        return dep.name;
      })
    }]).then((res) => {
      let currentDep;
      depRes.map(dep => {
        if (dep.name === res.depName) {
          currentDep = dep;
        };
      });

      connection.query("SELECT  e.id AS 'ID', e.first_name AS 'First Name', e.last_name AS 'Last Name', r.title AS 'Title', d.name AS 'Department' FROM employee e RIGHT JOIN role r ON e.role_id = r.id RIGHT JOIN  department d ON r.department_id = d.id WHERE ? ;", {
          'd.id': currentDep.id
        },
        (err, res) => {
          if (err) throw err
          
          console.table(res)
       
        })
    })
  })
  runUserRequest();
}


function removeEmployee() {
  connection.query("SELECT id, first_name AS 'First Name', last_name AS 'Last Name' FROM employee;", (err, empRes) => {
    let empId;
    inquirer.prompt([{
      type: "rawlist",
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
  });
  runUserRequest();
}

function updateEmployeeRole() {
  connection.query("SELECT e.id, e.first_name AS 'First Name', e.last_name AS 'Last Name', r.title AS 'Title' FROM employee E LEFT JOIN role r ON e.role_id = r.id;", (err, empRes) => {
    let empId;
    let roleid;
    inquirer.prompt([{
      type: "rawlist",
      message: "Select employee you would like to Update",
      name: "empName",
      choices: empRes.map(emp => {
        return `${emp.id} - ${emp['First Name']} ${emp['Last Name']} ${emp['Title']}`;
      })
    }]).then(selectEmpRes => {
      connection.query("SELECT * FROM role;", (err, roleRes) => {
        inquirer.prompt([{
          type: "rawlist",
          message: "To what role would you like to update ? ",
          name: "roleTitle",
          choices: roleRes.map(role => {
            return role.title;
          })
        }]).then((res) => {
          let currentRole = [];
          roleRes.map(role => {
            if (role.title === res.roleTitle) {
              currentRole.push(role);
            };
          });

          empRes.forEach(emp => {
            if (selectEmpRes.empName === `${emp.id} - ${emp['First Name']} ${emp['Last Name']} ${emp['Title']}`) {
              return empId = emp.id;
            }
          });
          connection.query("UPDATE employee SET ? WHERE ? ;", [{
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
  });
  runUserRequest();
}



async function addNewRole(employeeInfo) {

  await inquirer.prompt([{
    name: 'newRoleTitle',
    type: 'input',
    message: "Enter new role title : ",
  }, {
    name: 'newRoleSalary',
    type: 'input',
    message: "Enter new role salary : ",
  }, {
    name: 'department',
    type: 'rawlist',
    message: 'Select Department for New Employee : ',
    choices: depList

  }]).then(async (answer) => {
    //set new roleNAME AS global variable
    newRoleName = answer.newRoleTitle;
    let department;
    if (answer.department === 'Add New Department') {
      department = await addNewDepartment(answer, employeeInfo)
    } else {
      department = depList.map(dep => {
        if (answer.department === dep.name) {
          return dep;
        }
      })
    }
  })
  runUserRequest();
}

async function addNewDepartment(roleAnswers, employeeInfo) {

  await inquirer.prompt([{
    name: "newDepartmentName",
    type: "input",
    message: "Enter new Department name : ",
  }]).then((answer) => {
    connection.query("INSERT INTO department SET name = ? ",
      [answer.newDepartmentName],
      function (err, res) {
     
        if (err) {
          console.log(err);
        } else {
          connection.query("INSERT INTO role  SET ?", {
              title: roleAnswers.newRoleTitle,
              salary: roleAnswers.newRoleSalary,
              department_id: res.insertId,
            },
            function (err, roleInsertRes) {
              if (err) {
                console.log("error : " + err)
              } else {
                queryRoleList();
                console.log("new role added");
              
                connection.query("INSERT INTO employee SET ?", {
                  first_name: employeeInfo.firstName,
                  last_name: employeeInfo.lastName,
                  role_id: roleInsertRes.insertId,
                  manager_id: employeeInfo.mngrId
                }, (err) => {
                  if (err) {
                    console.log(err)
                  }
                })
                queryRoleList();
                
              }
            }

          )
   
          return answer.newDepartmentName;
        }
        runUserRequest();
      }
    )
  })
}


function queryRoleList() {
  connection.query("SELECT * FROM role;", (err, roleRes) => {
    if (err) {
      console.log("error : " + err);
    } else {
      roleList = roleRes;
      return roleList;
    }
  })
}


function queryDepartmentList() {
  connection.query("SELECT * FROM department;", (err, depRes) => {

    if (err) {
      console.log("error : " + err);
    } else {
      let list = ['Add New Department'];
      depRes.map(dep => {
        list.push(dep.name);
      });
      depList = list;
      return list;
    }
  })
}


function queryManagerList() {
  connection.query("SELECT e.first_name AS 'First Name', e.last_name AS 'Last Name', e.manager_id AS 'Manager Id', r.title As 'Title'  FROM employee e LEFT JOIN role r ON e.manager_id = r.id ;", (err, mngrRes) => {

    if (err) {
      console.log("error : " + err);
    } else {
      mngrList = mngrRes;
      return mngrList;
    }
  })
}