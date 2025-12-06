"""
FastAPI アプリケーション エントリポイント
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import drawing_mock_router, drawing_router

app = FastAPI(
    title="Scaff-Pro API",
    description="足場SaaSツール バックエンドAPI",
    version="0.1.0",
)

# CORS設定（開発環境用）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.jsの開発サーバー
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """ヘルスチェック用エンドポイント"""
    return {"message": "Scaff-Pro API is running", "version": "0.1.0"}


@app.get("/api/v1/health")
async def health_check():
    """APIヘルスチェック"""
    return {"status": "healthy"}


# APIルーターを登録
app.include_router(drawing_router, prefix="/api/v1")
app.include_router(drawing_mock_router, prefix="/api/v1")  # Mock API (no API key required)
