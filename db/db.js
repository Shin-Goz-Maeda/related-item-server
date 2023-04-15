// 各種インポート
const mysql = require("mysql2");
const env = require("dotenv").config();


// DBへアクセス情報（ローカル）
// exports.db = mysql.createConnection({
//   host: process.env.DB_KEY1,
//   user: process.env.DB_KEY2,
//   password: process.env.DB_KEY3,
//   database: process.env.DB_KEY4
// });

// DBへアクセス情報（cloudSQL）
exports.db = mysql.createPool({
  user: process.env.CLOUD_SQL_USERNAME,
  password: process.env.CLOUD_SQL_PASSWORD,
  database: process.env.CLOUD_SQL_DATABASE_NAME,
  socketPath: process.env.CLOUD_SQL_CONNECTION_NAME
});