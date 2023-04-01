// ユーザーステータス
exports.userState = {
  // 退会ステータス
  user_not_withdrawal: 0,
  user_withdrawal: 1,

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
exports.sendError = "1";