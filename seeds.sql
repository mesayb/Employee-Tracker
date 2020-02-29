DROP DATABASE IF EXISTS employee_tracker;

CREATE DATABASE employee_tracker;

USE employee_tracker;

CREATE TABLE department (
    id INT NOT NULL,
    name VARCHAR(30),
    PRIMARY KEY(id)
)

CREATE TABLE role (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(30),
    salary DECIMAL(10,2),
    department_id  INT,
    FOREIGN KEY (department_id) REFERENCES department(id)
)

CREATE TABLE employee (
    id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    role_id INT,
    manager_id  INT,
    PRIMARY KEY(id),
    FOREIGN KEY (role_id) REFERENCES role(id),
    FOREIGN KEY (manager_id) REFERENCES role(id)
)

INSERT INTO department_id (name) VALUES ('sales'),('hr'),('engineering'), ('security');

INSERT INTO role (title, salary, department_id) VALUES ('manager',100000,0001),('developer',120000,0022),('qa',100001,0022), ('sec',110000,0033);

INSERT INTO department_id (first_name, last_name, role_id,) VALUES ('sales'),('hr'),('engineering'), ('security');

