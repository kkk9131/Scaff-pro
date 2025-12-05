"""
足場計算に使用する型定義
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Tuple


class MemberType(Enum):
    """部材種別"""
    COLUMN = "支柱"           # 支柱
    LEDGER = "布材"           # 布材
    HANDRAIL = "手すり"       # 手すり
    BRACKET = "ブラケット"    # ブラケット
    STAIR = "階段"            # 階段
    ADVANCE_RAIL = "先行手すり"  # 先行手すり
    BRACE = "筋交"            # 筋交
    JACK = "ジャッキ"         # ジャッキ
    HANE = "ハネ"             # ハネ


class FaceDirection(Enum):
    """面方向"""
    NORTH = "北面"
    SOUTH = "南面"
    EAST = "東面"
    WEST = "西面"


@dataclass
class Point2D:
    """2D座標"""
    x: float
    y: float


@dataclass
class Point3D:
    """3D座標"""
    x: float
    y: float
    z: float


@dataclass
class BuildingOutline:
    """建物外周ポリライン"""
    vertices: List[Point2D]  # 頂点リスト（直角多角形）
    
    def get_bounding_box(self) -> Tuple[Point2D, Point2D]:
        """外接矩形を取得"""
        if not self.vertices:
            return Point2D(0, 0), Point2D(0, 0)
        
        min_x = min(v.x for v in self.vertices)
        max_x = max(v.x for v in self.vertices)
        min_y = min(v.y for v in self.vertices)
        max_y = max(v.y for v in self.vertices)
        
        return Point2D(min_x, min_y), Point2D(max_x, max_y)


@dataclass
class HeightCondition:
    """高さ条件"""
    floor_count: int = 2           # 階数
    floor_height: float = 2850.0   # 階高（mm）
    eaves_height: float = 5700.0   # 軒高（mm）
    max_height: float = 7000.0     # 最高高さ（mm）


@dataclass
class ScaffoldSpec:
    """足場仕様テンプレート"""
    standard_span: float = 1800.0      # 標準スパン（mm）
    floor_pitch: float = 1900.0        # 階高ピッチ（mm）
    available_spans: List[float] = field(
        default_factory=lambda: [1800, 1500, 1200, 900, 600, 355, 300, 150]
    )


@dataclass
class ScaffoldMember:
    """足場部材"""
    member_type: MemberType        # 部材種別
    length: float                  # 長さ（mm）
    face: FaceDirection            # 面
    position_start: Point3D        # 開始位置
    position_end: Point3D          # 終了位置


@dataclass
class ScaffoldResult:
    """足場計算結果"""
    members: List[ScaffoldMember]  # 部材リスト
    
    def get_quantity_by_type_and_face(self) -> dict:
        """部材種別×面ごとの数量を集計"""
        result = {}
        for member in self.members:
            key = (member.member_type.value, member.length, member.face.value)
            result[key] = result.get(key, 0) + 1
        return result
