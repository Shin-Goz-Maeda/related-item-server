// express設定
const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

// db設定インポート
const { db } = require("../related-item-server/db/db");

// firebase設定インポート
const { auth } = require("../related-item-server/firebase/firebase");

// firebaseメソッド
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification
} = require("firebase/auth");


// server動作確認
app.get("/", (req, res) => {
  res.send("<h1>hello</h1>");
});


// すべてのアイテム情報をDBから取得する
app.get("/getImage", (req, res) => {
  const SQL = "SELECT brand, item_category, item_name, item_img_url, id FROM items_info";
  db.query(SQL, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    };
  });
});


// DBから指定のアイテム情報の詳細を取得する
app.get("/item/:id", (req, res) => {
  // アドレスから取得するアイテムのIDを取得する。
  const id = req.params.id;
  const SQL = "SELECT brand, item_category, item_name, item_img_url, item_info, instagram_embed_code FROM items_info INNER JOIN instagram_items_info ON items_info.item_id = instagram_items_info.item_id WHERE instagram_items_info.item_id = ?";
  db.query(SQL, [id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    };
  });
});


// firebaseのメールアドレス/PW認証を使用したログイン処理
app.post("/login-mail", (req, res) => {
  // ログインフォームに入力された値をクライアントから取得
  const email = req.body.email;
  const password = req.body.password;

  // firebaseのログインメソッド
  signInWithEmailAndPassword(auth, email, password)
    .then((result) => {
      // ログインユーザーのメール認証状況を確認
      if (result.user.emailVerified) {
        // メールアドレス認証が完了しているメールアドレスはDB-users-user_stateを"2"に変更する。
        let userState = 2;
        db.query("UPDATE users SET user_state = ? WHERE mail_address = ?", [userState, email]);
        res.send(result);
      } else {
        // メール認証を完了して再ログインを促すようにする。
        res.status(401).send(result);
      };
    })
    .catch((error) => {
      // ログイン時に出たエラーをクライアントに送信しブラウザに表示する。
      res.send(error);
    });
});


// firebaseのGoogle認証を使用したログイン処理
app.post("/login-google", (req, res) => {
  // Google認証を使ってログインした結果をクライアントから取得
  const provider = req.body.provider;
  const email = req.body.email;
  const uuid = req.body.uuid;
  const createdAt = req.body.createdAt;
  const updatedAt = null;
  const userState = 2;
  const userDelete = 0;

  // DBにメールアドレスの登録があるか&退会したユーザーではないかを確認
  db.query("SELECT mail_address, user_delete FROM users WHERE mail_address = ?", [email], (err, result) => {
    // メールアドレスの登録がなく、退会ユーザーではない場合はDBに情報を追加
    if (!result[0]) {
      const SQL1 = "INSERT INTO users (uuid, user_state, user_delete, mail_address, provider, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?, ?)";
      db.query(SQL1, [uuid, userState, userDelete, email, provider, createdAt, updatedAt]);
      db.query("INSERT INTO users_info (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, createdAt, updatedAt]);
      db.query("INSERT INTO users_want_to_item (mail_address) VALUE (?)", [email]);

    } else if (result[0].user_delete === 1) {
      // 退会ユーザの場合は、退会ステータスを退会していない状態へ変更
      db.query("UPDATE users SET user_delete = ? WHERE mail_address = ?", [userDelete, email]);

    } else if (result[0].user_delete === 0) {
      // 以前メールアドレスで会員登録済のユーザがGoogle認証で登録した場合にメールアドレス認証からGoogle認証にログイン方法が変更になった場合に下記をコンソールに表示(ログインに問題なし)
      console.log("登録されています。");

    } else if (result[0].user_delete === 0) {
      // 何らかのエラーがあった場合にコンソールに表示
      console.log(err);
    };
  });
});


// firebaseのメールアドレス/PWを使用したサインアップ処理
app.post("/signup-mail", (req, res) => {
  // サインアップフォームに入力された値をクライアントから取得
  const email = req.body.email;
  const password = req.body.password;
  const createdAt = req.body.createdAt;
  const updatedAt = req.body.updatedAt;
  const provider = "email";
  const userDelete = 0;
  let userState = 0;

  // 登録済のユーザーではないかを確認
  db.query("SELECT mail_address, user_delete FROM users WHERE mail_address = ?", [email], (err, result) => {
    // 登録していないユーザーの場合は下記処理を実行
    if (!result[0]) {
      // DB-usersにユーザ情報を追加する。
      const SQL1 = "INSERT INTO users (user_state, user_delete, mail_address, provider, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?)";
      db.query(SQL1, [userState, userDelete, email, provider, createdAt, updatedAt]);

      // メールアドレス/PWをfirebaseに登録する
      createUserWithEmailAndPassword(auth, email, password)
        .then((result) => {
          // クライアントにユーザー情報を送信
          res.send(result);
          // ユーザー個別のIDをfirebaseから取得
          const uuid = result.user.uid;

          // firebaseに登録が完了したらuserStateを1にする
          if (userState === 0) {
            userState = 1;
            // DBの各テーブルに登録ユーザー情報を追加する。
            db.query("UPDATE users SET user_state = ?, uuid = ? WHERE mail_address = ?", [userState, uuid, email]);
            db.query("INSERT INTO users_info (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, createdAt, updatedAt]);
            db.query("INSERT INTO users_want_to_item (mail_address) VALUE (?)", [email]);
          };

          // メール認証完了後のリダイレクトURL
          const actionCodeSettings = {
            url: 'http://localhost:3000/login',
            handleCodeInApp: false
          };

          // メール認証を行うメールを送信
          sendEmailVerification(auth.currentUser, actionCodeSettings);
        })
        .catch((err) => {
          // 登録できたかった場合にコンソールにエラー表示する。
          console.log(err);
        });

    } else if (result[0].mail_address && result[0].user_delete === 1) {
      // 過去に登録したことがあり、退会したユーザは別アドレスを使用するようにブラウザに表示。
      res.send("1");

    } else {
      // Google認証を使って登録しているユーザーor既にメール認証で登録済のユーザーに対してブラウザにエラーを表示。
      res.send("2");
    };
  });
});


// firebaseのGoogle認証を使用したサインアップ処理
app.post("/signup-google", (req, res) => {
  // Google認証を使ってログインした結果をクライアントから取得
  const provider = req.body.provider;
  const email = req.body.email;
  const uuid = req.body.uuid;
  const createdAt = req.body.createdAt;
  const updatedAt = null;
  const userState = 2;
  const userDelete = 0;

  // 過去に登録したユーザではないかを確認
  db.query("SELECT mail_address, user_delete FROM users WHERE mail_address = ?", [email], (err, result) => {
    if (!result[0]) {
      // 過去に登録のないユーザーの場合は、DBの各テーブルにユーザー情報を追加
      const SQL1 = "INSERT INTO users (uuid, user_state, user_delete, mail_address, provider, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?, ?)";
      db.query(SQL1, [uuid, userState, userDelete, email, provider, createdAt, updatedAt]);
      db.query("INSERT INTO users_info (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, createdAt, updatedAt]);
      db.query("INSERT INTO users_want_to_item (mail_address) VALUE (?)", [email]);
    } else if (result[0].user_delete === 1) {
      // 退会ユーザの場合は、退会ステータスを退会していない状態へ変更
      db.query("UPDATE users SET user_delete = ? WHERE mail_address = ?", [userDelete, email]);

    } else if (result[0].user_delete === 0) {
      // 以前メールアドレスで会員登録済のユーザがGoogle認証で登録した場合にメールアドレス認証からGoogle認証にログイン方法が変更になった場合に下記をコンソールに表示(ログインに問題なし)
      console.log("登録されています。");

    } else {
      // 何らかのエラーがあった場合にコンソールに表示
      console.log(err);
    };
  });
});


// ユーザーが初回ログインかどうかを確認する処理
app.post("/login-first", (req, res) => {
  // ログインフォームに入力された値をクライアントから取得
  const email = req.body.email;

  // アカウント情報が登録されていないかを確認
  db.query("SELECT user_name, sex, birth_date FROM users_info WHERE mail_address = ?", [email], (err, result) => {
    if (err) {
      // 何らかの問題が発生した場合はコンソールにエラーを表示する。
      console.log(err);

    } else if (result[0].user_name === null && result[0].sex === null && result[0].birth_date === null) {
      // 登録されていない場合は、下記をクライアントに送信
      res.status(200).send(result[0]);

    } else {
      // 登録済の場合は下記上情報をクライアントに送信
      res.status(400).send(result[0]);
    };
  });
});


// 初回ログイン時orアカウント登録情報を更新した際の処理
app.post("/user-info", (req, res) => {
  // フォームに入力された値をクライアントから取得
  const email = req.body.email;
  const userName = req.body.userName;
  const birthDay = req.body.birthDay;
  const sex = req.body.selectedSex;
  const recommendItems = req.body.recommendItemJson;

  // DBの各テーブルにアカウント情報に情報を追加
  db.query("UPDATE users_info SET user_name = ?, sex = ?, birth_date = ? WHERE mail_address = ?", [userName, sex, birthDay, email]);
  db.query("UPDATE users_want_to_item SET want_to_item = ? WHERE mail_address = ?", [ recommendItems, email], (err, result) => {
    if (err) {
      // 何らかのエラーが発生した場合は下記をクライアントに送信
      res.status(400).send(result[0]);
    } else {
      // 問題なく登録できた場合は下記をクライアントに送信
      res.status(200).send(result[0]);
    };
  });
});


// app.post("/resend-auth-mail", (req, res) => {
//   const email = req.body.email;
//   const password = req.body.password;

//   signInWithEmailAndPassword(auth, email, password)
//     .then((result) => {
//       res.send(result);
//       // メール認証完了後のリダイレクトURL
//       const actionCodeSettings = {
//         url: 'http://localhost:3000/login',
//         handleCodeInApp: false
//       };

//       sendEmailVerification(auth.currentUser, actionCodeSettings);
//     })
//     .catch((err) => {
//       res.send(err);
//     });
// });


// 退会ユーザーの処理
app.post("/withdrawal", (req, res) => {
  // フォームに入力した値を取得
  const email = req.body.email;
  const userDelete = 1;

  // DB-user_deleteを退会済みステータスに変更
  db.query("UPDATE users SET user_delete = ? WHERE mail_address = ?", [userDelete, email], (err, result) => {
    if (err) {
      // 何らかのエラーが発生した場合コンソールに表示
      console.log(err);
    } else {
      // 退会済にステータスが変更できた場合、結果をクライアントに送信
      res.send(result);
    };
  });
});


// 待ち受け処理
app.listen(3001, () => {
  console.log(" 3001 Server Start!");
});