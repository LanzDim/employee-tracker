DROP DATABASE IF EXISTS employeesDB;

CREATE DATABASE employeesDB;

Use employeesDB;

CREATE TABLE department (
    id INT NO NULL AUTO_INCREMENT,
    name VARCHAR(45) NULL,
    PRIMARY KEY (id)
)

CREATE TABLE role (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(45) NULL,
    salary DECIMAL(10.3) NULL,
    department_id INT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE employe (
    id INT NOT NULL AUTO_INCREMENT,
    first_name VARCHAR(45) NULL,
    last_name VARCHAR(45) NULL,
    role_id INT NULL,
    maanger_id INT NULL,
    PRIMARY KEY(id)
);