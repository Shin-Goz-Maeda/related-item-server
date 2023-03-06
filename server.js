const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const env = require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_KEY1,
  user: process.env.DB_KEY2,
  password: process.env.DB_KEY3,
  database: process.env.DB_KEY4,
  });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>hello</h1>");
});

// すべてのitem情報をDBから取得する
app.get("/getImage", (req, res) => {
  let SQL = "SELECT brand, item_category, item_name, item_img_url, id FROM items_info";

  db.query(SQL, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/item/:id", (req, res) => {
  const id = req.params.id;
  let SQL = "SELECT brand, item_category, item_name, item_img_url, item_info, instagram_embed_code FROM items_info INNER JOIN instagram_items_info ON items_info.item_id = instagram_items_info.item_id WHERE instagram_items_info.item_id = ?";
  db.query(SQL, [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

app.listen(3001, () => {
  console.log(" 3001 Server Start!")
});
