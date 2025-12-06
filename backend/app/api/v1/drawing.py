"""Drawing analysis API endpoints"""
import tempfile
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.services.claude_service import get_claude_service

router = APIRouter(prefix="/drawing", tags=["drawing"])


class AnalysisOptions(BaseModel):
    """Drawing analysis options"""

    extract_outline: bool = Field(True, description="外周線を抽出するか")
    extract_entrance: bool = Field(True, description="玄関位置を抽出するか")
    extract_back_door: bool = Field(True, description="勝手口位置を抽出するか")
    extract_roof: bool = Field(False, description="屋根形状を抽出するか（立面図の場合）")


class AnalysisResult(BaseModel):
    """Drawing analysis result"""

    outline: list[list[float]] | None = Field(None, description="外周ポリゴン頂点")
    entrance: dict[str, Any] | None = Field(None, description="玄関位置と信頼度")
    back_door: dict[str, Any] | None = Field(None, description="勝手口位置と信頼度")
    roof_type: str | None = Field(None, description="屋根タイプ")
    scale: str | None = Field(None, description="図面スケール")
    confidence: float = Field(0.0, description="全体の信頼度")
    notes: str | None = Field(None, description="解析時の注意点や補足情報")


@router.post("/analyze", response_model=AnalysisResult)
async def analyze_drawing(
    file: UploadFile = File(..., description="解析する図面画像（PNG, JPEG, GIF, WebP）"),
    extract_outline: bool = True,
    extract_entrance: bool = True,
    extract_back_door: bool = True,
    extract_roof: bool = False,
) -> AnalysisResult:
    """
    平面図を解析し、必要な情報を抽出

    Args:
        file: 図面画像ファイル
        extract_outline: 外周線を抽出するか
        extract_entrance: 玄関位置を抽出するか
        extract_back_door: 勝手口位置を抽出するか
        extract_roof: 屋根形状を抽出するか（立面図の場合）

    Returns:
        AnalysisResult: 解析結果
    """
    # ファイルタイプチェック
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="画像ファイルのみサポートされています")

    # 一時ファイルに保存
    try:
        suffix = Path(file.filename or "image.jpg").suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # Claude Vision APIで解析
        claude_service = get_claude_service()
        result = claude_service.analyze_floor_plan(
            image_path=tmp_path,
            extract_outline=extract_outline,
            extract_entrance=extract_entrance,
            extract_back_door=extract_back_door,
            extract_roof=extract_roof,
        )

        return AnalysisResult(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"図面解析エラー: {str(e)}")

    finally:
        # 一時ファイルを削除
        if "tmp_path" in locals():
            Path(tmp_path).unlink(missing_ok=True)


@router.get("/health")
async def health_check():
    """Drawing analysis service health check"""
    try:
        claude_service = get_claude_service()
        return {"status": "healthy", "model": claude_service.model}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
