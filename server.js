// express設定
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// db設定インポート
const { db } = require("./db/db");

// firebase設定インポート
const { auth } = require("./firebase/firebase");

// 共通する定数
const {
  WithdrawalState,
  MailVerifiedState,
  dateState,
  HOST_DOMAIN
} = require("./constants/constants");

// firebaseメソッド
const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged
} = require("firebase/auth");


// server動作確認
app.get("/", (req, res) => {
  try {
    res.send("<h1>hello</h1>");
    return;
  } catch (err) {
    console.log(err);
  };
});


// すべてのアイテム情報をDBから取得する
app.get("/get-image", (req, res) => {
  try {
    const SQL = "SELECT brand, item_category, item_name, item_img_url, id FROM items_info";
    db.query(SQL, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
        return;
      };
    });
  } catch (err) {
    console.log(err);
  };
});


// DBから指定のアイテム情報の詳細を取得する
app.get("/item/:id", (req, res) => {
  try {
    // アドレスから取得するアイテムのIDを取得する。
    const id = req.params.id;
    const SQL = "SELECT brand, item_category, item_name, item_img_url, item_info, instagram_embed_code FROM items_info INNER JOIN instagram_items_info ON items_info.item_id = instagram_items_info.item_id WHERE instagram_items_info.item_id = ?";
    db.query(SQL, [id], (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
        return;
      };
    });
  } catch (err) {
    console.log(err);
  };
});


// firebaseのメールアドレス/PW認証を使用したログイン処理
app.post("/login-mail", (req, res) => {
  try {
    // ログインフォームに入力された値をクライアントから取得
    const email = req.body.email;
    const password = req.body.password;

    // firebaseのログインメソッド
    signInWithEmailAndPassword(auth, email, password)
      .then((result) => {
        // ログインユーザーのメール認証状況を確認
        if (result.user.emailVerified) {
          // メールアドレス認証が完了しているメールアドレスはDB-users-user_stateを"2"に変更する。
          db.query("UPDATE users SET user_state = ?, updated_at = ? WHERE mail_address = ?", [MailVerifiedState.user_mailVerified_ok, dateState.updatedAt, email]);
          res.send(result);
          return;
        } else {
          // メール認証を完了していない場合
          res.json({error: "not_mailVerified"});
          return;
        };
      })
      .catch((error) => {
        // ログイン時に出たエラーをクライアントに送信しブラウザに表示する。
        res.send(error);
        return;
      });
  } catch (err) {
    console.log(err);
  };
});


// firebaseのGoogle認証を使用したログイン処理
app.post("/login-google", (req, res) => {
  try {
    // Google認証を使ってログインした結果をクライアントから取得
    const email = req.body.email;
    const uuid = req.body.uuid;
    const provider = req.body.provider;

    // DBにメールアドレスの登録があるか&退会したユーザーではないかを確認
    db.query("SELECT user_delete FROM users WHERE mail_address = ?", [email], (err, result) => {
      // メールアドレスの登録がなく、退会ユーザーではない場合はDBに情報を追加
      if (!result[0]) {
        const SQL = "INSERT INTO users (uuid, user_state, user_delete, mail_address, provider, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?, ?)";
        db.query(SQL, [uuid, MailVerifiedState.user_mailVerified_ok, WithdrawalState.user_not_withdrawal, email, provider, dateState.createdAt, dateState.updatedAt]);

        db.query("INSERT INTO users_info (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, dateState.createdAt, dateState.updatedAt]);

        db.query("INSERT INTO users_want_to_item (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, dateState.createdAt, dateState.updatedAt]);

      } else if (result[0].user_delete === 1) {
        // 退会ユーザの場合は、退会ステータスを退会していない状態へ変更
        db.query("UPDATE users SET user_delete = ?, updated_at = ? WHERE mail_address = ?", [WithdrawalState.user_not_withdrawal, dateState.updatedAt, email]);

      } else if (result[0].user_delete === 0) {
        // 以前メールアドレスで会員登録済のユーザがGoogle認証で登録した場合
        db.query("UPDATE users SET provider = ? WHERE mail_address = ?", [provider, email]);

      } else {
        // 何らかのエラーがあった場合にコンソールに表示
        console.log(err);
      };
    });
  } catch (err) {
    console.log(err);
  };
});


// firebaseのメールアドレス/PWを使用したサインアップ処理
app.post("/signup-mail", (req, res) => {
  try {
    // サインアップフォームに入力された値をクライアントから取得
    const email = req.body.email;
    const password = req.body.password;
    const provider = "email";

    if (email && password) {
      // 登録済のユーザーではないかを確認
      db.query("SELECT user_delete FROM users WHERE mail_address = ?", [email], (err, result) => {
        if (!result[0]) {
          // 登録していないユーザーの場合は下記処理を実行
          // DB-usersにユーザ情報を追加する。
          const SQL = "INSERT INTO users (user_state, user_delete, mail_address, provider, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?)";
          db.query(SQL, [MailVerifiedState.user_add_DB_ok, WithdrawalState.user_not_withdrawal, email, provider, dateState.createdAt, dateState.updatedAt]);

          // メールアドレス/PWをfirebaseに登録する
          createUserWithEmailAndPassword(auth, email, password)
            .then((result) => {
              // ユーザー個別のIDをfirebaseから取得
              const uuid = result.user.uid;

              // クライアントにユーザー情報を送信
              res.send(result);

              db.query("SELECT user_state FROM users WHERE mail_address = ?", [email], (err, result) => {
                // firebaseに登録が完了したらuserStateを1にする
                if (result[0].user_state === 0) {
                  // DBの各テーブルに登録ユーザー情報を追加する。
                  db.query("UPDATE users SET user_state = ?, uuid = ?, updated_at = ? WHERE mail_address = ?", [MailVerifiedState.user_add_firebaseAuth_ok, uuid, dateState.updatedAt, email]);

                  db.query("INSERT INTO users_info (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, dateState.createdAt, dateState.updatedAt]);

                  db.query("INSERT INTO users_want_to_item (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, dateState.createdAt, dateState.updatedAt]);
                };

                // メール認証完了後のリダイレクトURL
                const actionCodeSettings = {
                  url: HOST_DOMAIN + "/login",
                  handleCodeInApp: false
                };

                // メール認証を行うメールを送信
                sendEmailVerification(auth.currentUser, actionCodeSettings);
              });
            })
            .catch((err) => {
              // 登録できたかった場合にコンソールにエラー表示する。
              console.log(err);
            });

        } else if (result[0].user_delete === 1) {
          // 退会ユーザの場合は、退会ステータスを退会していない状態へステータスを変更し、DB内のユーザーステータスをリセット
          db.query("UPDATE users SET user_delete = ?, updated_at = ? WHERE mail_address = ?", [WithdrawalState.user_not_withdrawal, dateState.updatedAt, email]);

          db.query("UPDATE users_info SET user_name = NULL, sex = NULL, birth_date = NULL, updated_at = ? WHERE mail_address = ?", [dateState.updatedAt, email]);

          db.query("UPDATE users_want_to_item SET want_to_item = NULL, updated_at = ? WHERE mail_address = ?", [dateState.updatedAt, email]);

          // firebaseのログインメソッド
          signInWithEmailAndPassword(auth, email, password)
            .then((result) => {
              res.send(result);
              return;
            })
            .catch((err) => {
              res.send(err);
              return;
            })
        } else {
          // Google認証を使って登録しているユーザーor既にメール認証で登録済のユーザーに対してブラウザにエラーを表示（すでに登録しているユーザーの場合は2を返す）。
          res.json({error: "already_register"});
        };
      });
    } else {
      res.json({error: "form_is_empty"});
    };
  } catch (err) {
    console.log(err);
  };
});


// firebaseのGoogle認証を使用したサインアップ処理
app.post("/signup-google", (req, res) => {
  try {
    // Google認証を使ってログインした結果をクライアントから取得
    const email = req.body.email;
    const uuid = req.body.uuid;
    const provider = req.body.provider;

    // 過去に登録したユーザではないかを確認
    db.query("SELECT user_delete FROM users WHERE mail_address = ?", [email], (err, result) => {
      if (!result[0]) {
        // 過去に登録のないユーザーの場合は、DBの各テーブルにユーザー情報を追加
        const SQL = "INSERT INTO users (uuid, user_state, user_delete, mail_address, provider, created_at, updated_at) VALUE (?, ?, ?, ?, ?, ?, ?)";
        db.query(SQL, [uuid, MailVerifiedState.user_mailVerified_ok, WithdrawalState.user_not_withdrawal, email, provider, dateState.createdAt, dateState.updatedAt]);

        db.query("INSERT INTO users_info (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, dateState.createdAt, dateState.updatedAt]);

        db.query("INSERT INTO users_want_to_item (mail_address, created_at, updated_at) VALUE (?, ?, ?)", [email, dateState.createdAt, dateState.updatedAt]);

      } else if (result[0].user_delete === 1) {
        // 退会ユーザの場合は、退会ステータスを退会していない状態へ変更
        db.query("UPDATE users SET user_delete = ?, updated_at = ? WHERE mail_address = ?", [WithdrawalState.user_not_withdrawal, dateState.updatedAt, email]);
        res.send(result[0]);

      } else if (result[0].user_delete === 0) {
        // 以前メールアドレスで会員登録済のユーザがGoogle認証で登録した場合
        db.query("UPDATE users SET provider = ? WHERE mail_address = ?", [provider, email]);

      } else {
        // 何らかのエラーがあった場合にコンソールに表示
        console.log(err);
      };
    });
  } catch (err) {
    console.log(err);
  };
});


// ユーザーが初回ログインかどうかを確認する処理
app.post("/first-login", (req, res) => {
  try {
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
        res.status(201).send(result[0]);
      };
    });
  } catch (err) {
    console.log(err);
  };
});


// 初回ログイン時orアカウント登録情報を更新した際の処理
app.post("/user-info", (req, res) => {
  try {
    // フォームに入力された値をクライアントから取得
    const email = req.body.email;
    const userName = req.body.userName;
    const birthDay = req.body.birthDay;
    const sex = req.body.selectedSex;
    const recommendItems = req.body.recommendItemJson;

    // DBの各テーブルにアカウント情報に情報を追加
    db.query("UPDATE users_info SET user_name = ?, sex = ?, birth_date = ?, updated_at = ? WHERE mail_address = ?", [userName, sex, birthDay, dateState.updatedAt, email]);

    db.query("UPDATE users_want_to_item SET want_to_item = ?, updated_at = ? WHERE mail_address = ?", [recommendItems, dateState.updatedAt, email], (err, result) => {
      if (err) {
        // 何らかのエラーが発生した場合は下記をクライアントに送信
        res.status(400).send(result[0]);
      } else {
        // 問題なく登録できた場合は下記をクライアントに送信
        res.status(200).send(result[0]);
      };
    });
  } catch (err) {
    console.log(err);
  };
});


// PWをリセットする際にDBに登録してあるかを確認する処理
app.post("/mail-check", (req, res) => {
  try {
    // フォームに入力した値を取得
    const email = req.body.email;

    db.query("SELECT mail_address FROM users WHERE mail_address = ?", [email], (err, result) => {
      if (err) {
        // 何らかのエラーが発生した場合コンソールに表示
        console.log(err);
      } else {
        // メールアドレスの登録の有無をクライアントに送信
        res.send(result);
        return;
      };
    });
  } catch (err) {
    console.log(err);
  };
});


// 退会ユーザーの処理
app.post("/withdrawal", (req, res) => {
  try {
    // フォームに入力した値を取得
    const email = req.body.email;

    // DB-user_deleteを退会済みステータスに変更
    db.query("UPDATE users SET user_delete = ?, updated_at = ? WHERE mail_address = ?", [WithdrawalState.user_withdrawal, dateState.updatedAt, email], (err, result) => {
      if (err) {
        // 何らかのエラーが発生した場合コンソールに表示
        console.log(err);
      } else {
        // 退会済にステータスが変更できた場合、結果をクライアントに送信
        res.send(result);
        return;
      };
    });
  } catch (err) {
    console.log(err);
  };
});


// 待ち受け処理
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
