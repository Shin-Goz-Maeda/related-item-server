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

app.listen(3001, () => {
  console.log(" 3001 Server Start!")
});