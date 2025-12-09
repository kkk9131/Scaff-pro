"""
図面アップロードAPI
"""
import uuid
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse

from app.schemas.drawing import DrawingUploadResponse

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
