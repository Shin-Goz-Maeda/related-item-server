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
        // メールアドレス認証が完了しているアドレスはDBのuser_stateを2に変更する。
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
app.post("/signup", (req, res) => {
  // メモ：後ほど削除予定
  /* DBにメールアドレスの登録がないかを判定
  * DBに登録がなかったらfirebaseに登録
  * サインアップページを登録アドレスに誘導
  * メール認証アドレスからリンクをクリック
  * ログインしてサービス利用開始
  */
  const email = req.body.email;
  const password = req.body.password;
  const createdAt = req.body.createdAt;
  let updatedAt = req.body.updatedAt;
  let user = "";
  let userState = 0;

  // DBにすでに登録されているアドレスがないかをチェックする。
  db.query("SELECT COUNT(mail_address) AS email FROM users WHERE mail_address = ?", [email], (err, result) => {
    if(result[0].email === 0) {
      console.log(result)
      const SQL1 = "INSERT INTO users (user_state, mail_address, created_at, updated_at) VALUE (?, ?, ?, ?)";
      db.query(SQL1, [userState, email, createdAt, updatedAt], (err, result) => {
          // メールアドレス/PWをfirebaseに登録する
          createUserWithEmailAndPassword(auth, email, password)
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
                    console.log(result + "signupDB");
                  }
                })
              }
              sendEmailVerification(auth.currentUser)
                .then((result) => {
                  console.log(result + "sendEmail")
                })
                .catch((err) => {
                  console.log(err)
                })
            })
            .catch((err) => {
              res.send(err)
            })
      });
    } else {
      console.log("このメールアドレスは登録されています。");
    }
  });
});

app.listen(3001, () => {
  console.log(" 3001 Server Start!")
});
