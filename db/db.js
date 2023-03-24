// 各種インポート
const mysql = require("mysql2");
const env = require('dotenv').config();

// DBへアクセス情報
exports.db = mysql.createConnection({
  host: process.env.DB_KEY1,
  user: process.env.DB_KEY2,
  password: process.env.DB_KEY3,
  database: process.env.DB_KEY4
});