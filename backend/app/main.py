"""
FastAPI アプリケーション エントリポイント
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv

# .envファイルを読み込み
load_dotenv()

from app.api.v1 import drawings

app = FastAPI(
    title="Scaff-Pro API",
    description="足場SaaSツール バックエンドAPI",
    version="0.1.0",
)

# CORS設定（開発環境用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーター登録
app.include_router(drawings.router, prefix="/api/v1")

# アップロードディレクトリ作成
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
async def root():
    """ヘルスチェック用エンドポイント"""
    return {"message": "Scaff-Pro API is running", "version": "0.1.0"}


@app.get("/api/v1/health")
async def health_check():
    """APIヘルスチェック"""
    return {"status": "healthy"}
