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
