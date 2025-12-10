"""
Gemini 1.5 Flash を使用した建築図面外周座標抽出サービス
"""
import os
import json
import base64
from pathlib import Path
from typing import Optional

import google.generativeai as genai
from PIL import Image
from pydantic import BaseModel


class CoordinatePoint(BaseModel):
    """座標点"""
    point: str
    x: float
    y: float


class DimensionLine(BaseModel):
    """寸法線"""
    label: str  # 寸法線のラベル（例: "X1-X2", "Y1-Y2"）
    value_mm: float  # 読み取った寸法値 (mm)
    direction: str  # "horizontal" or "vertical"
    raw_text: str  # 図面上に記載されたテキスト


class OutlineExtractionResult(BaseModel):
    """外周座標抽出結果"""
    dimensions: list[DimensionLine]  # 読み取った寸法線
    coordinates: list[CoordinatePoint]
    width_mm: float
    height_mm: float


class GeminiOutlineExtractor:
    """Gemini 1.5 Flash を使用した建築図面外周座標抽出クラス"""

    def __init__(self):
        """初期化: Google API Keyの設定"""
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY 環境変数が設定されていません")

        genai.configure(api_key=api_key)
        # Use gemini-2.5-flash-lite (user specified)
        self.model = genai.GenerativeModel("gemini-2.5-flash-lite")

    def _build_prompt(self) -> str:
        """プロンプトを構築"""
        return """あなたは建築積算のプロです。この図面画像を解析し、以下の手順で「数値」と「形状情報」のみを抽出してください。座標計算は行わないでください。

1. 【重要】図面内に記載されている「寸法線」の数値を読み取ってください（OCR）。
2. 図面の左下を原点とし、建物全体の「最大幅 (X方向)」と「最大奥行 (Y方向)」を特定してください。
3. 読み取った寸法に基づき、以下のJSONフォーマットでデータを出力してください。

## 出力フォーマット (JSONのみ)
{
  "width_mm": 数値 (建物全体の幅),
  "height_mm": 数値 (建物全体の奥行),
  "shape": "rectangle",
  "dimensions": [
    {"label": "X全体", "value_mm": 数値, "direction": "horizontal", "raw_text": "読み取った文字"},
    {"label": "Y全体", "value_mm": 数値, "direction": "vertical", "raw_text": "読み取った文字"}
  ]
}

- 歪みは無視し、数値（寸法値）を正としてください。
- 現在は単純な長方形の建物として最大外形寸法を抽出してください。
- coordinates項目は不要です（システム側で計算します）。
"""

    def extract_outline_from_file(self, image_path: str) -> OutlineExtractionResult:
        """
        ローカル画像ファイルから建物外周座標を抽出
        """
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"画像ファイルが見つかりません: {image_path}")

        image = Image.open(path)
        prompt = self._build_prompt()
        response = self.model.generate_content([prompt, image])
        return self._parse_response(response.text)

    def extract_outline_from_bytes(self, image_bytes: bytes, mime_type: str = "image/jpeg") -> OutlineExtractionResult:
        """
        バイトデータから建物外周座標を抽出
        """
        prompt = self._build_prompt()
        image_part = {
            "mime_type": mime_type,
            "data": image_bytes
        }
        response = self.model.generate_content([prompt, image_part])
        return self._parse_response(response.text)

    def _calculate_coordinates(self, width: float, height: float) -> list[CoordinatePoint]:
        """
        幅と高さから長方形の座標を計算する（Python側ロジック）
        原点(0,0)から左回りまたは右回りで定義
        """
        # 単純な矩形: (0,0) -> (0, H) -> (W, H) -> (W, 0)
        # 左下 -> 左上 -> 右上 -> 右下
        return [
            CoordinatePoint(point="p1", x=0, y=0),
            CoordinatePoint(point="p2", x=0, y=height),
            CoordinatePoint(point="p3", x=width, y=height),
            CoordinatePoint(point="p4", x=width, y=0),
        ]

    def _parse_response(self, response_text: str) -> OutlineExtractionResult:
        """
        Geminiのレスポンスをパースし、座標をPython側で計算して付与
        """
        text = response_text.strip()
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
            # 失敗時はログに出してエラー
            raise ValueError(f"JSONのパースに失敗しました: {e}\nレスポンス: {response_text}")

        width_mm = float(data.get("width_mm", 0))
        height_mm = float(data.get("height_mm", 0))

        # Python側で座標計算
        coordinates = self._calculate_coordinates(width_mm, height_mm)

        dimensions = [
            DimensionLine(**dim)
            for dim in data.get("dimensions", [])
        ]

        return OutlineExtractionResult(
            dimensions=dimensions,
            coordinates=coordinates,
            width_mm=width_mm,
            height_mm=height_mm
        )


# CLI用のメイン関数
if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv

    # .envファイルを読み込み
    load_dotenv()

    if len(sys.argv) < 2:
        print("使用方法: python gemini_outline_extractor.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    try:
        extractor = GeminiOutlineExtractor()
        result = extractor.extract_outline_from_file(image_path)

        print("抽出結果:")
        print(json.dumps(result.model_dump(), indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"エラー: {e}")
        sys.exit(1)
