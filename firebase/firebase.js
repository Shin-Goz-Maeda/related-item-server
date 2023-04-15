// firebase設定
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");


// firebaseアクセス情報
const firebaseConfig = {
  apiKey: process.env.APIKEY,
  authDomain: process.env.AUTHDOMAIN,
  projectId: process.env.PROJECT_ID,
  storageBucket: process.env.STORAGE_BUCKET,
  messagingSenderId: process.env.MESSAGING_SENDER_ID,
  appId: process.env.APP_APP_ID
};

// firebaseを初期化
const app = initializeApp(firebaseConfig);

// firebase認証を初期化
exports.auth = getAuth(app);
