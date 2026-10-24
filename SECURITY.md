# 展示公開前のFirestore確認

## ソースコードから確認できた現状

- Firebase Authenticationの`signInAnonymously(auth)`を呼んでいる。
- Firestoreへの書き込みは`main.js`の`saveToFirebase`内の`setDoc`の1か所。Realtime Databaseと`addDoc`は使用していない。
- 保存先は`users/{auth.currentUser.uid}`。アイテム別サブコレクションではなく、同じドキュメントに`wallet: true`、`key: true`、`bear: true`と`updatedAt`（ISO日時文字列）をマージする。
- 追加した`firestore.rules`はこの保存構造に対応する。本人のみ読み書き・削除可能。将来の`users/{uid}/items/{itemId}`も本人のみ許可し、それ以外は拒否する。任意の深さのサブコレクションは許可しない。
- 本番に設定済みのルール、匿名認証の有効化設定、App Checkの設定は未確認。ローカルのルール追加だけでは本番の保護は変更されない。

## 残っている不整合と修正案

1. `getItem`はFirestoreへの保存完了前にlocalStorageを更新し、成功表示する。`saveToFirebase`も未ログイン時に黙って戻り、保存失敗をログ出力だけで終える。修正案：未ログイン・保存失敗を呼び出し元へ伝え、`await saveToFirebase(itemName)`成功後に取得表示する。失敗時は再試行できるエラー表示を出す。
2. Firestoreから図鑑を読み戻す処理がない。表示・回収率はlocalStorageの`wallet`などのキーだけで判定するため、サーバーと表示が食い違う。修正案：認証後に`getDoc(doc(db, "users", user.uid))`で復元し、画面の状態に反映する。
3. localStorageのキーにUIDが含まれていない。認証アカウントが変わっても同じブラウザの取得表示が残り得る。修正案：キャッシュするならUIDごとのキーを使う。旧キーを新しいUIDへ自動で引き継がない。
4. `resetData`はlocalStorageだけを消し、Firestoreの記録は消さない。修正案：リセットの用途を決め、図鑑全体のリセットなら本人のドキュメントの削除成功後に表示を戻す。
5. `updatedAt`は端末側の日時。修正案：`serverTimestamp()`へ変更する場合は日時型もTimestampへ変更し、既存データが文字列であることを考慮する。

上記は修正案であり、今回`main.js`の動作は変更していない。

## 本番への反映と確認

Firebase Consoleでプロジェクト`shibaurasai2026`のFirestore Database → ルールを開き、既存ルールを確認してから`firestore.rules`の全文を設定して公開する。CLIを使用する場合は、Firebase CLIのインストールとログイン後、次を実行する。

```sh
firebase deploy --only firestore:rules --project shibaurasai2026
```

他の機能でFirestoreを使用している場合、そのパスは今回のルールでは拒否されるため、公開前に確認する。

ルールのシミュレーターまたはEmulatorで以下を確認する（本リポジトリでは未実行）。読み取りだけでなく作成・更新・削除をそれぞれ確認する。

| 認証 | 対象 | 期待結果 |
| --- | --- | --- |
| UID=A | users/A | 読み書き許可 |
| UID=A | users/A/items/wallet | 読み書き許可 |
| UID=A | users/B | 読み書き拒否 |
| UID=A | users/B/items/wallet | 読み書き拒否 |
| 未認証 | 上記すべて | 読み書き拒否 |
| UID=A | users一覧、その他のパス | 拒否 |

公開後は別々の匿名アカウントA/Bを使い、通常のNFC取得が成功し、Bのデータにアクセスできないことを確認する。

## 防げることと追加対策

このルールは他人の図鑑へのアクセスを防ぐが、本人のデータの内容や書き込み回数は制限しない。匿名ログイン済みの利用者は「未認証」ではなく、自分の図鑑を更新できる。

現在は`?item=wallet`などのURLだけで取得するため、URLの手入力・共有でも取得できる。NFCを実際にタッチしたことの証明にはならない。取得の不正を防ぐ必要があれば、サーバー側の取得検証と、クライアントから取得フラグを直接更新させない構成を別途設計する。

大量アクセス対策にはApp Check、利用状況の監視・予算アラート等も検討する。App Checkだけで全ての悪用を防げるわけではなく、予算アラートは利用料金の上限ではない。

参考：
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/auth/web/anonymous-auth
- https://firebase.google.com/docs/app-check
