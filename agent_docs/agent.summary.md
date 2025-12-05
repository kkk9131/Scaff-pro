# Scaff-Pro 開発進捗

このファイルはAIエージェントによる開発作業の進捗を記録します。

---

## フェーズ0: 環境構築 ✅ (2025-12-05)

### 完了項目
- [x] Next.js + TypeScript + Tailwind セットアップ完了
- [x] 必要パッケージインストール（Zustand, Konva, Three.js, react-rnd等）
- [x] ディレクトリ構造作成（features, hooks, store等）
- [x] FastAPI + Python セットアップ完了
- [x] Python仮想環境作成・パッケージインストール
- [x] scaffold_logic パッケージ作成完了（types.py, core.py）
- [x] フロントエンド・バックエンド起動確認済み

### 起動コマンド
```bash
# フロントエンド（http://localhost:3000）
cd frontend && npm run dev

# バックエンド（http://localhost:8000）
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
```

---

## フェーズ1: Screen B（キャンバス画面）UI構築 🔜

*次のフェーズ*

---

## 更新履歴
| 日付 | 内容 |
|------|------|
| 2025-12-05 | フェーズ0完了、要件定義更新（アイソメ図、パース、参照用図面ビューア追加）、技術スタックをNext.jsに変更 |
