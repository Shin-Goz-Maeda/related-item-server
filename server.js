const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const env = require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_KEY1,
  user: process.env.DB_KEY2,
  password: process.env.DB_KEY3,
  database: process.env.DB_KEY4
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000/item/1')
  res.send("<h1>hello</h1>");
});

// すべてのitem情報をDBから取得する
app.get("/getImage", (req, res) => {
  let SQL = "SELECT brand, itemCategory, itemName, itemImgUrl, id FROM ItemsInfo";

  db.query(SQL, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// 指定のitem情報をDBから取得する
app.get("/item/:id", (req, res) => {
  const id = req.params.id;
  let SQL = "SELECT brand, itemCategory, itemName, itemImgUrl, itemInfo FROM ItemsInfo WHERE itemId = ?";
  db.query(SQL, [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result[0]);
    }
  });
});

app.listen(3001, () => {
  console.log(" 3001 Server Start!")
});
