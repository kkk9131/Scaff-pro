"""
図面関連のPydanticスキーマ
"""
from typing import Literal, Optional
from pydantic import BaseModel


class Point(BaseModel):
    """座標点"""
    x: float
    y: float


class Bounds(BaseModel):
    """境界"""
    minX: float
    minY: float
    maxX: float
    maxY: float


class ExtractedOutline(BaseModel):
    """抽出された外周線"""
    vertices: list[Point]
    floor: int
    color: str


class ExtractedEntrance(BaseModel):
    """抽出された出入口"""
    id: str
    position: Point
    type: Literal["main-entrance", "back-door", "other"]
    width: float  # mm
    label: str


class ExtractedDimension(BaseModel):
    """抽出された寸法線"""
    id: str
    start: Point
    end: Point
    value: float  # mm
    label: str


class ProcessedDrawingData(BaseModel):
    """処理された図面データ"""
    originalUrl: str
    processedUrl: str
    outlines: list[ExtractedOutline]
    entrances: list[ExtractedEntrance]
    dimensions: list[ExtractedDimension]
    scale: float
    bounds: Bounds


class DrawingUploadResponse(BaseModel):
    """図面アップロードレスポンス"""
    id: str
    name: str
    type: str
    url: str
    floor: Optional[int] = None
    status: Literal["uploading", "processing", "ready", "error"]
    processedData: Optional[ProcessedDrawingData] = None
    errorMessage: Optional[str] = None
