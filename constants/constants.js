const env = require('dotenv').config();

// ユーザーステータス
exports.WithdrawalState = {
  // 退会ステータス
  user_not_withdrawal: 0,
  user_withdrawal: 1,
};

exports.MailVerifiedState = {
  // メール認証状態
  user_add_DB_ok: 0,
  user_add_firebaseAuth_ok: 1,
  user_mailVerified_ok:2
};


// 日時設定
exports.dateState = {
  createdAt: Date.now(),
  updatedAt: Date.now()
};


// エラーを返すための定数
exports.SEND_ERROR = "1";

exports.HOST_DOMAIN = process.env.HOST_DOMAIN;