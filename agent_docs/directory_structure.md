# 推奨ディレクトリ構成（案）

このドキュメントは、本プロジェクト（足場SaaSツール）の推奨ディレクトリ構成を示します。  
実際の運用・分割方針に応じて調整してください。

---

## 1. ルート構成（全体像）

```text
Scaff-pro/
  agent_docs/              # 仕様・設計ドキュメント
  frontend/                # フロントエンド（React + TS）
  backend/                 # バックエンド（FastAPI + Python）
  scaffold_logic/          # 足場計算ロジック（既存コード or サブモジュール）
  infra/                   # デプロイ・インフラ関連（任意）
  scripts/                 # 補助スクリプト（任意）
  README.md
```

ポイント：
- `agent_docs/` に要件定義・技術スタック・画面構成・ロードマップ等を集約。  
- アプリ本体は `frontend/` と `backend/` に明確に分離。  
- 既存の足場計算ロジックは `scaffold_logic/` として独立させ、テストしやすくする。

---

## 2. frontend ディレクトリ構成（案）

```text
frontend/
  src/
    components/        # 共通 UI コンポーネント
    features/
      projects/        # 案件一覧まわり
      planning/        # 足場計画画面（キャンバス・パネルなど）
      chat/            # チャットパネル
      quantity/        # 数量表表示
      threeD/          # 3D ビュー関連（ワイヤーフレーム表示）
      isometric/       # アイソメ図ビュー（輪郭線ベースの建物＋足場）
      perspective/     # パースビュー（透視図法表示）
      drawingViewer/   # 参照用図面ビューア（フローティングパネル）
    hooks/             # 共通フック
    store/             # Zustand ストア
    lib/               # 共通ユーティリティ（API クライアント等）
    styles/            # グローバルスタイル・Tailwind 設定など
    main.tsx
  public/
  index.html
  vite.config.ts
  package.json
```

ポイント：
- 画面単位ではなく「機能単位（features）」でディレクトリを分ける。  
- キャンバス系（Konva）は `features/planning` にまとめる。
- 3D / アイソメ / パースはそれぞれ `threeD` / `isometric` / `perspective` に分離。
- 参照用図面ビューア（フローティングパネル）は `drawingViewer` に配置。

---

## 3. backend ディレクトリ構成（案）

```text
backend/
  app/
    api/
      v1/
        routes_projects.py      # 案件関連 API
        routes_drawings.py      # 図面アップロード・取得 API
        routes_scaffold.py      # 足場計算・結果取得 API
        routes_quantity.py      # 数量取得 API
        routes_ai.py            # AI エージェント関連 API（将来含む）
      __init__.py
    core/
      config.py                 # 設定読み込み
      security.py               # 認証（将来）
    models/                     # ORM モデル（SQLAlchemy）
    schemas/                    # Pydantic スキーマ
    services/
      drawings_service.py       # 図面処理（PDF→画像等）
      scaffold_service.py       # 足場計算呼び出しラッパ
      quantity_service.py       # 数量集計ロジック
      ai_agent_service.py       # Claude エージェント呼び出し（将来）
    db/
      session.py
      init_db.py
    main.py                     # FastAPI エントリポイント
  tests/
    ...
  pyproject.toml or requirements.txt
```

ポイント：
- API レイヤ（routes）とドメインロジック（services / scaffold_logic）を分ける。  
- Claude エージェント用のサービスを `services/ai_agent_service.py` として独立させる。

---

## 4. scaffold_logic ディレクトリ構成（案）

既存の足場計算ロジックを、単体でもテストできるように整理するための構成案です。  
別リポジトリとして運用してもよく、その場合はサブモジュールとして組み込んでもよいです。

```text
scaffold_logic/
  src/
    scaffold_logic/
      __init__.py
      core.py                 # 既存のメイン計算ロジック
      geometry.py             # 外周ポリライン → 外接矩形＋入隅/出隅変換
      types.py                # 入出力用のデータクラス・型定義
  tests/
    test_core.py
    test_geometry.py
  pyproject.toml or setup.cfg
```

ポイント：
- `core.py` に「幅×奥行き＋削り/膨らまし」モデルのロジックを集約。  
- `geometry.py` で UI 側のポリラインから `core.py` が扱いやすい形に変換する。  
- `types.py` で部材種別・面・長さなどの型を定義し、`backend` からも参照できるようにする。

---

## 5. infra / scripts（任意）

```text
infra/
  docker/
    frontend.Dockerfile
    backend.Dockerfile
    docker-compose.yml
  k8s/                     # 将来 Kubernetes を使う場合

scripts/
  dev_start.sh             # 開発用起動スクリプト
  format_frontend.sh       # フォーマッタ / Lint 実行
  format_backend.sh
```

必須ではありませんが、将来的なデプロイ・開発効率化を見据えて用意しておくと便利です。

