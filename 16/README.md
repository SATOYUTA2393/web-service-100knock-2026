# 16. クエリパラメータ付きのリクエストを送る

## クエリパラメータとは

URLの末尾に `?キー=値` の形で付けて、サーバに追加情報を渡す仕組み。
複数ある場合は `&` でつなぐ。

```
https://example.com/search?q=curl&limit=3&sort=stars
                          └──────────┬──────────────┘
                              クエリパラメータ
```

- 検索条件・ページ番号・並び順など、「同じエンドポイントに対する条件指定」によく使われる
- GETリクエストと一緒に使われることが多い（URLに含まれるのでブックマークや共有ができる）
- URLに乗るため、パスワード等の機密情報を入れてはいけない

## 準備：動作確認用のエコーサーバ

受け取ったクエリパラメータをそのままJSONで返すサーバをローカルに立てた（Python標準ライブラリのみ）。

```python
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)      # パスとクエリ文字列に分解
        params = parse_qs(parsed.query)   # "q=curl&limit=3" → {"q": ["curl"], "limit": ["3"]}
        body = json.dumps({
            "path": parsed.path,
            "raw_query": parsed.query,
            "params": params,
        }, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)

HTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
```

```bash
python3 server.py &
```

## 1. 基本：URLに直接書く

```bash
curl "http://127.0.0.1:8000/search?q=curl&limit=3&sort=stars"
```

実行結果：

```json
{
  "path": "/search",
  "raw_query": "q=curl&limit=3&sort=stars",
  "params": {
    "q": ["curl"],
    "limit": ["3"],
    "sort": ["stars"]
  }
}
```

サーバ側で `?` 以降がキーと値に分解されて受け取れていることが分かる。

### 注意：URLはクォートで囲む

クォートなしで実行すると、シェルが `&` を「コマンドのバックグラウンド実行」と解釈してしまう。

```bash
curl -s http://127.0.0.1:8000/search?q=curl&limit=3
```

実行結果：

```json
{
  "path": "/search",
  "raw_query": "q=curl",
  "params": {
    "q": ["curl"]
  }
}
```

`&` 以降が切り捨てられ、サーバには `q=curl` しか届いていない（`limit=3` はシェル変数の代入として処理される）。
**クエリパラメータ付きのURLは必ず `"..."` で囲む。**

## 2. 日本語やスペースを含む場合：`-G` + `--data-urlencode`

URLに使えるのは半角英数と一部の記号だけなので、日本語やスペースは **URLエンコード（パーセントエンコーディング）** が必要。
curlでは `-G`（GETとして送る）と `--data-urlencode` を組み合わせると自動でエンコードしてくれる。

```bash
curl -G "http://127.0.0.1:8000/search" \
  --data-urlencode "q=博多 ラーメン" \
  --data-urlencode "page=1"
```

実行結果：

```json
{
  "path": "/search",
  "raw_query": "q=%e5%8d%9a%e5%a4%9a+%e3%83%a9%e3%83%bc%e3%83%a1%e3%83%b3&page=1",
  "params": {
    "q": ["博多 ラーメン"],
    "page": ["1"]
  }
}
```

- 「博多」→ `%e5%8d%9a%e5%a4%9a`（UTF-8のバイト列を `%XX` 形式に変換）、スペース → `+`
- サーバ側でデコードされ、元の「博多 ラーメン」として受け取れている

## 3. 実際に送られているリクエストを確認する（`-v`）

```bash
curl -G -v "http://127.0.0.1:8000/search" --data-urlencode "q=博多 ラーメン"
```

リクエスト部分（`>` が送信内容）：

```
> GET /search?q=%e5%8d%9a%e5%a4%9a+%e3%83%a9%e3%83%bc%e3%83%a1%e3%83%b3 HTTP/1.1
> Host: 127.0.0.1:8000
> User-Agent: curl/8.5.0
> Accept: */*
```

リクエストラインの **パスの一部としてクエリパラメータが送られている** ことが確認できる。
（13番のPOSTと違い、ボディではなくURLに乗っているのがポイント）

## まとめ

| やりたいこと | 書き方 |
|---|---|
| 基本 | `curl "URL?key1=val1&key2=val2"`（クォート必須） |
| 日本語・スペースを含む | `curl -G "URL" --data-urlencode "key=値"` |
| 送信内容の確認 | `-v` を付けてリクエストラインを見る |

- クエリパラメータは `?key=value&key=value` の形でURL末尾に付き、GETの条件指定に使われる
- シェルの `&` とURLエンコードが2大ハマりポイント
- POST（13番）のボディ送信と対比すると、GET＋クエリパラメータの役割が分かりやすい
