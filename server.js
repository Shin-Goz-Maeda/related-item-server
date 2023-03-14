const express = require("express");
const app = express();
const cors = require("cors");

// db設定
const { db } = require('../related-item-server/db/db');

// firebase設定
const {
  auth,
} = require("../related-item-server/firebase/firebase");

// firebaseメソッド
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  getIdTokenResult,
} = require("firebase/auth");
const { async } = require("@firebase/util");

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

// DBからアイテム情報の詳細を取得する
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

// firebaseからメールアドレス/PWを使用したログイン処理
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userState = req.body.userState;

  console.log(email)
  console.log(password)
  signInWithEmailAndPassword(auth, email, password)
    .then((result) => {
      res.send(result)
      if (result.user.emailVerified) {
        userState = 2;
        db.query("UPDATE users SET user_state = ? WHERE mail_address = ?", [userState, email], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log(result);
          }
        }
        )
      }
    })
    .catch((err) => {
      console.log(err)
    })
});

// firebaseからメールアドレス/PWを使用したサインアップ処理
app.post("/signup", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userState = req.body.userState;
  const createdAt = req.body.createdAt;
  let updatedAt = req.body.updatedAt;
  let user = "";

  // アカウント登録した情報をDBに登録する
  const SQL1 = "INSERT INTO users (mail_address, user_state, created_at, updated_at) VALUE (?, ?, ?, ?)";
  db.query(SQL1, [email, userState, createdAt, updatedAt], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }
  });

  // メールアドレス/PWをfirebaseに登録する
  await createUserWithEmailAndPassword(auth, email, password)
    .then((result) => {
      res.send(result)
      user = getIdTokenResult.user

      // firebaseに登録が完了したらuserStateを1にする
      if (userState === 0) {
        userState = 1;
        db.query("UPDATE users SET user_state = ? WHERE mail_address = ?", [userState, email], (err, result) => {
          if (err) {
            console.log(err);
          } else {
            console.log(result);
          }
        }
        )
      }
    })
    .catch((err) => {
      console.log(err)
    })

    await sendEmailVerification(auth.currentUser)
      .then((result) => {
        console.log(result)
      })
      .catch((error) => {
        console.log(error)
      })
});

app.listen(3001, () => {
  console.log(" 3001 Server Start!")
});
