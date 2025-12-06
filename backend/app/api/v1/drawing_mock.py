"""Drawing analysis API endpoints - Mock version for development without API key"""
import random
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

router = APIRouter(prefix="/drawing-mock", tags=["drawing-mock"])


class AnalysisResult(BaseModel):
    """Drawing analysis result"""

    outline: list[list[float]] | None = Field(None, description="外周ポリゴン頂点")
    entrance: dict[str, Any] | None = Field(None, description="玄関位置と信頼度")
    back_door: dict[str, Any] | None = Field(None, description="勝手口位置と信頼度")
    roof_type: str | None = Field(None, description="屋根タイプ")
    scale: str | None = Field(None, description="図面スケール")
    confidence: float = Field(0.0, description="全体の信頼度")
    notes: str | None = Field(None, description="解析時の注意点や補足情報")


def generate_mock_outline(width: int = 800, height: int = 600) -> list[list[float]]:
    """モックの外周線座標を生成（長方形）"""
    margin = 50
    return [
        [margin, margin],
        [width - margin, margin],
        [width - margin, height - margin],
        [margin, height - margin],
    ]


def generate_mock_entrance(width: int = 800) -> dict[str, Any]:
    """モックの玄関位置を生成"""
    return {
        "position": [width // 2, 50],  # 上辺中央
        "confidence": round(random.uniform(0.85, 0.95), 2),
    }


def generate_mock_back_door(width: int = 800, height: int = 600) -> dict[str, Any]:
    """モックの勝手口位置を生成"""
    return {
        "position": [width - 50, height // 2],  # 右辺中央
        "confidence": round(random.uniform(0.75, 0.90), 2),
    }


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_drawing_mock(
    file: UploadFile = File(..., description="解析する図面画像（PNG, JPEG, GIF, WebP）"),
    extract_outline: bool = True,
    extract_entrance: bool = True,
    extract_back_door: bool = True,
    extract_roof: bool = False,
) -> AnalysisResult:
    """
    平面図を解析し、必要な情報を抽出（モック版）

    実際のClaude Vision APIの代わりに、固定のモックデータを返します。
    フロントエンド開発やデモ用途に使用してください。

    Args:
        file: 図面画像ファイル
        extract_outline: 外周線を抽出するか
        extract_entrance: 玄関位置を抽出するか
        extract_back_door: 勝手口位置を抽出するか
        extract_roof: 屋根形状を抽出するか（立面図の場合）

    Returns:
        AnalysisResult: モック解析結果
    """
    # ファイルタイプチェック
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="画像ファイルのみサポートされています")

    # モック画像サイズ（実際の画像サイズは読み込まない）
    mock_width = 800
    mock_height = 600

    # モックデータを生成
    result = AnalysisResult(
        outline=generate_mock_outline(mock_width, mock_height) if extract_outline else None,
        entrance=generate_mock_entrance(mock_width) if extract_entrance else None,
        back_door=generate_mock_back_door(mock_width, mock_height)
        if extract_back_door
        else None,
        roof_type=random.choice(["切妻", "寄棟", "陸屋根", "片流れ"]) if extract_roof else None,
        scale="1:100",
        confidence=round(random.uniform(0.80, 0.95), 2),
        notes="これはモックデータです。実際のClaude Vision APIを使用していません。",
    )

    return result


@router.get("/health")
async def health_check():
    """Drawing analysis mock service health check"""
    return {
        "status": "healthy",
        "model": "mock-v1",
        "note": "This is a mock endpoint for development without API key",
    }
