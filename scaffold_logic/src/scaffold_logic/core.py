"""
足場割付計算 コアロジック

このモジュールは既存の足場計算ロジックをラップし、
外周ポリラインから足場配置を算出する機能を提供します。
"""
from typing import List, Optional

from .types import (
    BuildingOutline,
    HeightCondition,
    ScaffoldSpec,
    ScaffoldResult,
    ScaffoldMember,
    MemberType,
    FaceDirection,
    Point3D,
)


def calculate_scaffold(
    outline: BuildingOutline,
    height_condition: HeightCondition,
    scaffold_spec: Optional[ScaffoldSpec] = None,
    ng_areas: Optional[List] = None,
) -> ScaffoldResult:
    """
    足場の自動割付を行う

    Args:
        outline: 建物外周ポリライン（直角多角形）
        height_condition: 高さ条件（階数、階高、軒高など）
        scaffold_spec: 足場仕様テンプレート（省略時はデフォルト値）
        ng_areas: 足場設置禁止エリア（開口など）

    Returns:
        ScaffoldResult: 足場部材の配置情報と数量集計用データ
    """
    if scaffold_spec is None:
        scaffold_spec = ScaffoldSpec()
    
    if ng_areas is None:
        ng_areas = []
    
    # TODO: 既存の足場計算ロジックを呼び出す
    # 現在はダミーの結果を返す
    
    members: List[ScaffoldMember] = []
    
    # 外接矩形を取得
    min_pt, max_pt = outline.get_bounding_box()
    width = max_pt.x - min_pt.x
    depth = max_pt.y - min_pt.y
    
    # ダミーの支柱を配置（四隅）
    corners = [
        (min_pt.x, min_pt.y, FaceDirection.SOUTH),
        (max_pt.x, min_pt.y, FaceDirection.EAST),
        (max_pt.x, max_pt.y, FaceDirection.NORTH),
        (min_pt.x, max_pt.y, FaceDirection.WEST),
    ]
    
    for x, y, face in corners:
        # 支柱を追加
        members.append(ScaffoldMember(
            member_type=MemberType.COLUMN,
            length=height_condition.eaves_height,
            face=face,
            position_start=Point3D(x, y, 0),
            position_end=Point3D(x, y, height_condition.eaves_height),
        ))
    
    return ScaffoldResult(members=members)


def get_scaffold_summary(result: ScaffoldResult) -> dict:
    """
    足場計算結果のサマリを取得

    Args:
        result: 足場計算結果

    Returns:
        dict: 部材種別×長さ×面ごとの数量
    """
    return result.get_quantity_by_type_and_face()
