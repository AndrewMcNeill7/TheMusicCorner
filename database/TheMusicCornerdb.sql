CREATE DATABASE IF NOT EXISTS themusiccornerdb;

use themusiccornerdb;

CREATE TABLE users (
  user_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  dob DATE
);

CREATE TABLE user_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255),
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);


DROP TABLE user_history;
