const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "password",
  database: "related_item"
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("<h1>hello</h1>");
});

// item情報をDBから取得する
app.get("/getImage", (req, res) => {
  let SQL = "SELECT * FROM ItemsInfo";

  db.query(SQL, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});

// instagram情報をDBから取得する
app.get("/getInstagramImage", (req, res) => {
  let SQL = "SELECT itemId, instagramEmbedCode FROM InstagramItemsInfo WHERE itemId = itemId";

  db.query(SQL, (err, result) => {
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
