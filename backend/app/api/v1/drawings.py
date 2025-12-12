"""
図面アップロードAPI
"""
import uuid
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.schemas.drawing import DrawingUploadResponse
from app.services import GeminiOutlineExtractor, OutlineExtractionResult

router = APIRouter(prefix="/drawings", tags=["drawings"])

# アップロードディレクトリ
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=DrawingUploadResponse)
async def upload_drawing(
    file: UploadFile = File(...),
    type: str = Form(...),
    floor: Optional[int] = Form(None),
):
    """
    図面ファイルをアップロードする

    - **file**: 図面ファイル（PDF, PNG, JPG, DXF）
    - **type**: 図面タイプ（plan, elevation, roof-plan, site-survey）
    - **floor**: 階層（平面図の場合）
    """
    # ファイルID生成
    file_id = str(uuid.uuid4())

    # ファイル拡張子取得
    original_name = file.filename or "unknown"
    suffix = Path(original_name).suffix.lower()

    # サポートするファイル形式
    allowed_extensions = {".pdf", ".png", ".jpg", ".jpeg", ".dxf"}
    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"サポートされていないファイル形式です: {suffix}",
        )

    # ファイル保存
    file_path = UPLOAD_DIR / f"{file_id}{suffix}"
    try:
        async with aiofiles.open(file_path, "wb") as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ファイル保存に失敗しました: {e}")

    return DrawingUploadResponse(
        id=file_id,
        name=original_name,
        type=type,
        url=f"/api/v1/drawings/file/{file_id}{suffix}",
        floor=floor,
        status="ready",
    )


@router.get("/file/{filename}")
async def get_drawing_file(filename: str):
    """アップロードされた図面ファイルを取得する"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    # Content-Typeを決定
    suffix = file_path.suffix.lower()
    media_type_map = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".dxf": "application/dxf",
    }
    media_type = media_type_map.get(suffix, "application/octet-stream")

    return FileResponse(file_path, media_type=media_type)


@router.delete("/{drawing_id}")
async def delete_drawing(drawing_id: str):
    """図面ファイルを削除する"""
    deleted = False
    for file_path in UPLOAD_DIR.glob(f"{drawing_id}*"):
        file_path.unlink()
        deleted = True

    if not deleted:
        raise HTTPException(status_code=404, detail="図面が見つかりません")

    return {"message": "削除しました", "id": drawing_id}


class ExtractOutlineRequest(BaseModel):
    """外周座標抽出リクエスト"""
    file_id: str
    floor: Optional[int] = None


@router.post("/extract-outline", response_model=OutlineExtractionResult)
async def extract_outline(file: UploadFile = File(...), floor: Optional[int] = Form(None)):
    """
    建築図面から建物外周座標を抽出する（Gemini使用）
    """
    # ... (same file validation logic) ...
    filename = file.filename or "unknown"
    suffix = Path(filename).suffix.lower()
    allowed_extensions = {".png", ".jpg", ".jpeg"}

    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"サポートされていない画像形式です: {suffix}。PNG, JPGのみ対応しています。",
        )

    mime_type_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }
    mime_type = mime_type_map.get(suffix, "image/jpeg")

    try:
        content = await file.read()
        extractor = GeminiOutlineExtractor()
        # Pass floor to extractor
        result = extractor.extract_outline_from_bytes(content, mime_type, floor=floor)
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"座標抽出に失敗しました: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"エラーが発生しました: {e}")


@router.post("/extract-outline-by-id")
async def extract_outline_by_id(request: ExtractOutlineRequest):
    """
    アップロード済み図面から建物外周座標を抽出する（Gemini使用）
    """
    # ファイルを検索
    file_path = None
    for ext in [".png", ".jpg", ".jpeg"]:
        candidate = UPLOAD_DIR / f"{request.file_id}{ext}"
        if candidate.exists():
            file_path = candidate.resolve()  # 絶対パスに変換
            break

    if not file_path:
        raise HTTPException(status_code=404, detail="ファイルが見つかりません")

    # MIMEタイプ決定
    suffix = file_path.suffix.lower()
    mime_type_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }
    mime_type = mime_type_map.get(suffix, "image/jpeg")

    try:
        with open(file_path, "rb") as f:
            content = f.read()

        extractor = GeminiOutlineExtractor()
        # Pass floor from request to extractor
        result = extractor.extract_outline_from_bytes(content, mime_type, floor=request.floor)

        return result.model_dump()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=f"座標抽出に失敗しました: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"エラーが発生しました: {e}")


# ==================== 屋根情報抽出 API ====================

from app.services.roof_extractor import GeminiRoofExtractor, RoofExtractionResult


@router.post("/extract-roof", response_model=RoofExtractionResult)
async def extract_roof(file: UploadFile = File(...)):
    """
    建築図面（立面図）から屋根情報を抽出する（Gemini使用）
    
    抽出される情報:
    - 軒出（eaveOverhang）
    - ケラバ（gableOverhang）
    - 屋根勾配（slopeRatio, slopeAngle）
    - 屋根形状（roofType: flat/gable/hip/shed）
    """
    filename = file.filename or "unknown"
    suffix = Path(filename).suffix.lower()
    allowed_extensions = {".png", ".jpg", ".jpeg"}

    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"サポートされていない画像形式です: {suffix}。PNG, JPGのみ対応しています。",
        )

    mime_type_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }
    mime_type = mime_type_map.get(suffix, "image/jpeg")

    try:
        content = await file.read()
        extractor = GeminiRoofExtractor()
        result = extractor.extract_roof_from_bytes(content, mime_type)
        return result
    except ValueError as e:
        return RoofExtractionResult(success=False, error=f"屋根情報抽出に失敗しました: {e}")
    except Exception as e:
        return RoofExtractionResult(success=False, error=f"エラーが発生しました: {e}")


class ExtractRoofRequest(BaseModel):
    """屋根抽出リクエスト"""
    file_id: str


@router.post("/extract-roof-by-id", response_model=RoofExtractionResult)
async def extract_roof_by_id(request: ExtractRoofRequest):
    """
    アップロード済み図面から屋根情報を抽出する（Gemini使用）
    """
    # ファイルを検索
    file_path = None
    for ext in [".png", ".jpg", ".jpeg"]:
        candidate = UPLOAD_DIR / f"{request.file_id}{ext}"
        if candidate.exists():
            file_path = candidate.resolve()
            break

    if not file_path:
        # PDF等の場合は変換機能があればよいが、現状は画像のみ対応とする
        return RoofExtractionResult(success=False, error="ファイルが見つかりません、またはサポートされていない形式です")

    try:
        extractor = GeminiRoofExtractor()
        # ファイルパスを渡して抽出
        result = extractor.extract_roof_from_file(str(file_path))
        return result
    except Exception as e:
        return RoofExtractionResult(success=False, error=f"エラーが発生しました: {e}")
