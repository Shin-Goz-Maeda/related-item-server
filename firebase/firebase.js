// firebase設定
const { initializeApp } = require('firebase/app');
const { getAuth } = require("firebase/auth");

// Google認証
const { GoogleAuthProvider } = require("firebase/auth");

// firebaseアクセス情報
const firebaseConfig = {
  apiKey: process.env.REACT_APP_APIKEY,
  authDomain: process.env.REACT_APP_AUTHDOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

// firebaseを初期化
const app = initializeApp(firebaseConfig);

// firebase認証を初期化
exports.auth = getAuth(app);

// Google認証設定
exports.googleProvider = new GoogleAuthProvider();
