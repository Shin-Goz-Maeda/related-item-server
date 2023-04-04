// 各種インポート
const mysql = require("mysql2");
const env = require('dotenv').config();

// DBへアクセス情報（ローカル）
exports.db = mysql.createConnection({
  host: process.env.DB_KEY1,
  user: process.env.DB_KEY2,
  password: process.env.DB_KEY3,
  database: process.env.DB_KEY4
});

// exports.db = mysql.createConnection({
//   host: "192.168.1.3",
//   port: 13306,
//   user: "quickstart-user",
//   password: "password",
//   database: "quickstart_db"
// });