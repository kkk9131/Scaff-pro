# Scaff-Pro Backend API

足場SaaSツール バックエンドAPI - Claude Vision APIを使用した建築図面解析機能

## セットアップ

### 1. 仮想環境の作成と有効化

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# または
.venv\Scripts\activate  # Windows
```

### 2. 依存パッケージのインストール

```bash
pip install "uvicorn[standard]" fastapi sqlalchemy alembic psycopg2-binary \
    pydantic pydantic-settings python-multipart httpx anthropic pillow
```

### 3. 環境変数の設定

`.env`ファイルを作成し、Anthropic APIキーを設定：

```bash
# .envファイルを.env.exampleからコピー
cp .env.example .env

# .envファイルを編集してAPIキーを追加
# ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
```

### 4. サーバーの起動

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

サーバーが起動したら、以下のURLでアクセス可能：
- API: http://localhost:8000
- OpenAPI Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API エンドポイント

### 図面解析 API

#### `POST /api/v1/drawing/analyze`

平面図を解析し、必要な情報を抽出します。

**リクエスト:**
- `file` (multipart/form-data): 解析する図面画像（PNG, JPEG, GIF, WebP）
- `extract_outline` (boolean, optional): 外周線を抽出するか（デフォルト: true）
- `extract_entrance` (boolean, optional): 玄関位置を抽出するか（デフォルト: true）
- `extract_back_door` (boolean, optional): 勝手口位置を抽出するか（デフォルト: true）
- `extract_roof` (boolean, optional): 屋根形状を抽出するか（デフォルト: false）

**レスポンス:**
```json
{
  "outline": [[x1, y1], [x2, y2], ...],
  "entrance": {"position": [x, y], "confidence": 0.95},
  "back_door": {"position": [x, y], "confidence": 0.88},
  "roof_type": "切妻",
  "scale": "1:100",
  "confidence": 0.92,
  "notes": "解析時の注意点や補足情報"
}
```

**curlの例:**
```bash
curl -X POST "http://localhost:8000/api/v1/drawing/analyze" \
  -F "file=@/path/to/floor_plan.png" \
  -F "extract_outline=true" \
  -F "extract_entrance=true" \
  -F "extract_back_door=true" \
  -F "extract_roof=false"
```

#### `GET /api/v1/drawing/health`

Drawing analysis serviceのヘルスチェック

**レスポンス:**
```json
{
  "status": "healthy",
  "model": "claude-3-5-sonnet-20241022"
}
```

### ヘルスチェック API

#### `GET /`
基本的なヘルスチェック

#### `GET /api/v1/health`
API v1のヘルスチェック

## プロジェクト構成

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPIアプリケーション
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── drawing.py      # 図面解析エンドポイント
│   └── services/
│       ├── __init__.py
│       └── claude_service.py   # Claude Vision APIラッパー
├── .env                        # 環境変数（git管理外）
├── .env.example                # 環境変数テンプレート
├── pyproject.toml              # プロジェクト設定
└── README.md                   # このファイル
```

## 開発

### Claude Vision APIについて

このプロジェクトは、Anthropic社のClaude Vision APIを使用して建築図面を解析します。

**解析対象:**
- ✅ 外周線（建物の外壁ライン）
- ✅ 玄関位置（メインエントランス）
- ✅ 勝手口位置（裏口・サブエントランス）
- ✅ 屋根形状（立面図の場合）

**除外対象:**
- ❌ 寸法線（細線、矢印付き）
- ❌ 文字・注記・寸法数値
- ❌ 家具・設備記号
- ❌ ハッチング（材質表現）
- ❌ 破線（建具・隠れ線）
- ❌ 補助線・グリッド線

### プロンプトエンジニアリング

`app/services/claude_service.py`の`_build_floor_plan_prompt()`メソッドで、
Claude Vision APIに送信するプロンプトを定義しています。

解析精度を向上させるために、以下の点に注意してプロンプトを設計：
1. 抽出対象と除外対象を明確に指示
2. JSON形式での出力を要求
3. 座標系（左上を原点とするピクセル座標）を明示
4. 信頼度（confidence）の報告を要求

## トラブルシューティング

### APIキーエラー
```
Service unavailable: ANTHROPIC_API_KEY environment variable not set
```

→ `.env`ファイルに正しいAPIキーが設定されているか確認してください。

### モジュールが見つからないエラー
```
No module named 'uvicorn'
```

→ 仮想環境が有効化されているか、依存パッケージがインストールされているか確認してください。

### ポート競合エラー
```
Address already in use
```

→ 8000番ポートが既に使用されている場合は、別のポートを指定してください：
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
