# 45. パスパラメータでデータを取得するAPIの作成

URL のパスに含まれる ID（例: `/api/items/2`）を使って、該当するデータを1件返す API を作成した。
該当するデータがない場合は 404 と JSON のエラーメッセージを返す。

## 環境

- Node.js 22 / Express 5
- `package.json` に `"type": "module"` を指定（`import` 構文を使うため）

```bash
npm init -y
npm pkg set type=module
npm install express@5
node --watch server.js
```

## ソースコード（server.js）

```js
import express from "express";

const app = express();
const PORT = 3000;

// 仮のデータ（DBの代わりにメモリ上の配列）
const items = [
  { id: 1, name: "りんご", price: 150 },
  { id: 2, name: "バナナ", price: 100 },
  { id: 3, name: "みかん", price: 80 },
];

// 一覧を返す（確認用）
app.get("/api/items", (req, res) => {
  res.json(items);
});

// パスパラメータ :id で1件取得
app.get("/api/items/:id", (req, res) => {
  const id = Number(req.params.id); // パスパラメータは文字列なので数値に変換
  const item = items.find((item) => item.id === id);

  if (!item) {
    return res.status(404).json({ error: `id=${req.params.id} の item は見つかりません` });
  }

  res.json(item);
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} で起動しました`);
});
```

## ポイント

- ルート定義の `:id` の部分がパスパラメータ。`req.params.id` で取り出せる
- `req.params.id` は **文字列** なので、`Number()` で数値に変換してから `===` で比較する（変換しないと `"2" === 2` が false になり見つからない）
- 見つからないときは `res.status(404)` でステータスを指定してから `.json()` でエラーメッセージを返す
- `return` を付けて早期リターンしないと、404 を返した後にさらに `res.json(item)` が呼ばれてエラーになる

## 動作確認（curl）

### 存在する ID（`/api/items/2`）→ 200

```bash
curl -i http://localhost:3000/api/items/2
```

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"id":2,"name":"バナナ","price":100}
```

### 存在しない ID（`/api/items/99`）→ 404

```bash
curl -i http://localhost:3000/api/items/99
```

```
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":"id=99 の item は見つかりません"}
```

### おまけ：数値でない ID（`/api/items/abc`）

`Number("abc")` は `NaN` になり、どの id とも一致しないので同じく 404 になる。

```bash
curl http://localhost:3000/api/items/abc
```

```
{"error":"id=abc の item は見つかりません"}
```
