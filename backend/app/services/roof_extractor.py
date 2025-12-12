"""
BudgetCap プロキシ経由で Gemini を使用した立面図からの屋根情報抽出サービス
軒出、ケラバ、屋根勾配、屋根形状を認識
"""
import os
import json
from pathlib import Path
from typing import Optional, List, Literal

from pydantic import BaseModel

from .budgetcap_client import BudgetCapGeminiClient


class RoofConfig(BaseModel):
    """屋根設定"""
    eaveOverhang: float = 0  # 軒出 (mm)
    gableOverhang: float = 0  # ケラバ出幅 (mm)
    slopeRatio: Optional[str] = None  # 勾配（例: "4/10"）
    slopeAngle: Optional[float] = None  # 傾斜角度（度）
    roofType: Literal["flat", "gable", "hip", "shed"] = "flat"  # 屋根形状
    ridgeHeight: Optional[float] = None  # 棟高さ (mm)
    rawTexts: List[str] = []  # 図面から読み取った元テキスト


class RoofExtractionResult(BaseModel):
    """屋根情報抽出結果"""
    success: bool
    config: Optional[RoofConfig] = None
    error: Optional[str] = None


class GeminiRoofExtractor:
    """BudgetCap経由でGeminiを使用した立面図からの屋根情報抽出クラス"""

    MODEL = "gemini-2.0-flash"

    def __init__(self, api_key: Optional[str] = None):
        """
        初期化: BudgetCap API Keyの設定

        Args:
            api_key: BudgetCap API キー（省略時は環境変数から取得）
        """
        self.client = BudgetCapGeminiClient(api_key)

    def _build_prompt(self) -> str:
        """プロンプトを構築"""
        return """あなたは建築積算のプロフェッショナルです。この建築図面（立面図または平面図）を解析し、屋根に関する情報を抽出してください。

## 抽出対象
1. **軒出（のきで）**: 外壁から屋根の先端までの水平距離。図面上では「軒出」「軒の出」と表記されることが多い。
2. **ケラバ**: 妻側（切妻屋根の三角部分側）の屋根の出幅。図面上では「ケラバ」「けらば出」と表記。
3. **屋根勾配**: 屋根の傾斜。「○寸勾配」「○/10」「○°」などで表記。
4. **屋根形状**:
   - flat: 陸屋根（平らな屋根）
   - gable: 切妻屋根（山形）
   - hip: 寄棟屋根（四方に傾斜）
   - shed: 片流れ屋根

## 出力フォーマット (JSONのみ)
```json
{
  "eaveOverhang": 数値またはnull (軒出 mm),
  "gableOverhang": 数値またはnull (ケラバ mm),
  "slopeRatio": "文字列またはnull" (例: "4/10", "3寸"),
  "slopeAngle": 数値またはnull (傾斜角度 度),
  "roofType": "flat" | "gable" | "hip" | "shed",
  "ridgeHeight": 数値またはnull (棟高さ mm),
  "rawTexts": ["図面から読み取った関連テキスト"]
}
```

## 注意事項
- 数値は必ず mm 単位に変換してください（例: 45cm → 450mm）
- 勾配が「4寸」の場合、slopeRatio は "4/10"、slopeAngle は約 21.8° です
- 情報が見つからない場合は null を設定してください
- rawTexts には「軒出 450」「ケラバ 300」など、読み取った元のテキストを含めてください
"""

    def extract_roof_from_file(self, image_path: str) -> RoofExtractionResult:
        """
        ローカル画像ファイルから屋根情報を抽出
        """
        path = Path(image_path)
        if not path.exists():
            return RoofExtractionResult(
                success=False,
                error=f"画像ファイルが見つかりません: {image_path}"
            )

        try:
            response_text = self.client.generate_content_from_file(
                model=self.MODEL,
                prompt=self._build_prompt(),
                image_path=image_path
            )
            config = self._parse_response(response_text)
            return RoofExtractionResult(success=True, config=config)
        except Exception as e:
            return RoofExtractionResult(success=False, error=str(e))

    def extract_roof_from_bytes(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> RoofExtractionResult:
        """
        バイトデータから屋根情報を抽出
        """
        try:
            response_text = self.client.generate_content(
                model=self.MODEL,
                prompt=self._build_prompt(),
                image_data=image_bytes,
                mime_type=mime_type
            )
            config = self._parse_response(response_text)
            return RoofExtractionResult(success=True, config=config)
        except Exception as e:
            return RoofExtractionResult(success=False, error=str(e))

    def _parse_response(self, response_text: str) -> RoofConfig:
        """
        Geminiのレスポンスをパース
        """
        text = response_text.strip()

        # マークダウンのコードブロックを除去
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)

        try:
            data = json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"JSONのパースに失敗しました: {e}\nレスポンス: {response_text}")

        # 勾配から角度を計算（未設定の場合）
        slope_angle = data.get("slopeAngle")
        slope_ratio = data.get("slopeRatio")
        if slope_angle is None and slope_ratio:
            slope_angle = self._calculate_slope_angle(slope_ratio)

        return RoofConfig(
            eaveOverhang=data.get("eaveOverhang") or 0,
            gableOverhang=data.get("gableOverhang") or 0,
            slopeRatio=slope_ratio,
            slopeAngle=slope_angle,
            roofType=data.get("roofType", "flat"),
            ridgeHeight=data.get("ridgeHeight"),
            rawTexts=data.get("rawTexts", [])
        )

    def _calculate_slope_angle(self, slope_ratio: str) -> Optional[float]:
        """
        勾配比率から角度を計算
        例: "4/10" -> 21.8°, "3寸" -> 16.7°
        """
        import math

        try:
            # "4/10" 形式
            if "/" in slope_ratio:
                parts = slope_ratio.split("/")
                rise = float(parts[0])
                run = float(parts[1])
                return round(math.degrees(math.atan(rise / run)), 1)

            # "4寸" 形式 (4寸 = 4/10)
            if "寸" in slope_ratio:
                rise = float(slope_ratio.replace("寸", ""))
                return round(math.degrees(math.atan(rise / 10)), 1)

            return None
        except:
            return None


# CLI用のメイン関数
if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv

    load_dotenv()

    if len(sys.argv) < 2:
        print("使用方法: python roof_extractor.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        extractor = GeminiRoofExtractor()
        result = extractor.extract_roof_from_file(image_path)

        print("抽出結果:")
        print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"エラー: {e}")
        sys.exit(1)
