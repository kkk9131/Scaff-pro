"""
図面解析サービス
平面図から建物外周線、玄関位置、寸法線を抽出する
"""
import uuid
import re
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from PIL import Image

# Floor colors for visual distinction (matching frontend)
FLOOR_COLORS = {
    1: "#3b82f6",  # blue
    2: "#10b981",  # green
    3: "#f59e0b",  # amber
    4: "#ef4444",  # red
    5: "#8b5cf6",  # purple
}


class DrawingAnalyzer:
    """図面解析クラス"""

    def __init__(self):
        self.min_contour_area = 5000  # 最小輪郭面積（ノイズ除去）
        self.entrance_keywords = ["玄関", "勝手口", "入口", "出入口", "ENTRANCE", "DOOR"]

    async def analyze_drawing(
        self,
        image_path: Path,
        drawing_type: str,
        floor: Optional[int] = None,
    ) -> dict:
        """
        図面を解析して必要な情報を抽出する

        Args:
            image_path: 画像ファイルパス
            drawing_type: 図面タイプ (plan, elevation, roof-plan, site-survey)
            floor: 階層 (平面図の場合)

        Returns:
            解析結果の辞書
        """
        # 画像読み込み
        image = cv2.imread(str(image_path))
        if image is None:
            raise ValueError(f"画像を読み込めません: {image_path}")

        # グレースケール変換
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 解析結果を格納
        result = {
            "outlines": [],
            "entrances": [],
            "dimensions": [],
            "scale": 1.0,
            "bounds": {"minX": 0, "minY": 0, "maxX": 0, "maxY": 0},
        }

        # 外周線抽出
        outlines = self._extract_outlines(gray, floor or 1)
        result["outlines"] = outlines

        # 境界計算
        if outlines:
            all_vertices = []
            for outline in outlines:
                all_vertices.extend(outline["vertices"])
            if all_vertices:
                xs = [v["x"] for v in all_vertices]
                ys = [v["y"] for v in all_vertices]
                result["bounds"] = {
                    "minX": min(xs),
                    "minY": min(ys),
                    "maxX": max(xs),
                    "maxY": max(ys),
                }

        # 玄関・出入口検出
        entrances = self._detect_entrances(image, gray)
        result["entrances"] = entrances

        # 寸法線抽出
        dimensions = self._extract_dimensions(image, gray)
        result["dimensions"] = dimensions

        # スケール推定
        result["scale"] = self._estimate_scale(image, result["dimensions"])

        return result

    def _extract_outlines(self, gray: np.ndarray, floor: int) -> list:
        """建物外周線を抽出する"""
        outlines = []

        # 二値化
        _, binary = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

        # モルフォロジー処理でノイズ除去
        kernel = np.ones((3, 3), np.uint8)
        binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel, iterations=2)
        binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)

        # 輪郭検出
        contours, hierarchy = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        # 最大面積の輪郭を建物外周とする
        if contours:
            # 面積でソート
            sorted_contours = sorted(contours, key=cv2.contourArea, reverse=True)

            for i, contour in enumerate(sorted_contours[:3]):  # 上位3つまで
                area = cv2.contourArea(contour)
                if area < self.min_contour_area:
                    continue

                # 輪郭を簡略化
                epsilon = 0.01 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)

                # 頂点を抽出
                vertices = []
                for point in approx:
                    vertices.append({"x": int(point[0][0]), "y": int(point[0][1])})

                floor_color = FLOOR_COLORS.get(floor, FLOOR_COLORS[1])

                outlines.append(
                    {
                        "vertices": vertices,
                        "floor": floor,
                        "color": floor_color,
                    }
                )

        return outlines

    def _detect_entrances(self, image: np.ndarray, gray: np.ndarray) -> list:
        """玄関・勝手口を検出する"""
        entrances = []

        # OCRで玄関キーワードを検出（pytesseractがインストールされている場合）
        try:
            import pytesseract

            # OCR実行
            text_data = pytesseract.image_to_data(
                image, lang="jpn+eng", output_type=pytesseract.Output.DICT
            )

            for i, text in enumerate(text_data["text"]):
                if not text.strip():
                    continue

                # キーワードマッチング
                for keyword in self.entrance_keywords:
                    if keyword.lower() in text.lower():
                        x = text_data["left"][i]
                        y = text_data["top"][i]
                        w = text_data["width"][i]
                        h = text_data["height"][i]

                        entrance_type = "main-entrance"
                        if "勝手口" in text or "back" in text.lower():
                            entrance_type = "back-door"

                        entrances.append(
                            {
                                "id": str(uuid.uuid4()),
                                "position": {"x": x + w // 2, "y": y + h // 2},
                                "type": entrance_type,
                                "width": 900,  # デフォルト幅
                                "label": text.strip(),
                            }
                        )
                        break

        except (ImportError, Exception):
            # pytesseractがない場合やエラー時はパターンマッチングで代用
            entrances = self._detect_door_patterns(gray)

        return entrances

    def _detect_door_patterns(self, gray: np.ndarray) -> list:
        """ドアのパターンを検出する（OCRなしの場合）"""
        entrances = []

        # エッジ検出
        edges = cv2.Canny(gray, 50, 150)

        # 円弧（ドアの開き）を検出
        circles = cv2.HoughCircles(
            edges,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=50,
            param1=100,
            param2=30,
            minRadius=20,
            maxRadius=100,
        )

        if circles is not None:
            circles = np.uint16(np.around(circles))
            for i, circle in enumerate(circles[0, :5]):  # 最大5つ
                x, y, r = circle
                entrances.append(
                    {
                        "id": str(uuid.uuid4()),
                        "position": {"x": int(x), "y": int(y)},
                        "type": "main-entrance" if i == 0 else "other",
                        "width": int(r * 2 * 10),  # 推定幅（mm）
                        "label": "玄関" if i == 0 else f"出入口{i + 1}",
                    }
                )

        return entrances

    def _extract_dimensions(self, image: np.ndarray, gray: np.ndarray) -> list:
        """寸法線と寸法値を抽出する"""
        dimensions = []

        # OCRで数値を検出
        try:
            import pytesseract

            # 数値パターン（寸法値）
            dimension_pattern = re.compile(r"(\d{1,2}[,.]?\d{3})")

            text_data = pytesseract.image_to_data(
                image, lang="jpn+eng", output_type=pytesseract.Output.DICT
            )

            for i, text in enumerate(text_data["text"]):
                if not text.strip():
                    continue

                # 寸法値パターンマッチング
                match = dimension_pattern.search(text)
                if match:
                    value_str = match.group(1).replace(",", "").replace(".", "")
                    try:
                        value = int(value_str)
                        # 建築寸法の妥当性チェック（100mm〜30000mm）
                        if 100 <= value <= 30000:
                            x = text_data["left"][i]
                            y = text_data["top"][i]
                            w = text_data["width"][i]

                            # 寸法線の始点・終点を推定（テキスト位置から左右に延長）
                            dimensions.append(
                                {
                                    "id": str(uuid.uuid4()),
                                    "start": {"x": x - 50, "y": y},
                                    "end": {"x": x + w + 50, "y": y},
                                    "value": value,
                                    "label": f"{value:,}mm",
                                }
                            )
                    except ValueError:
                        pass

        except (ImportError, Exception):
            # pytesseractがない場合やエラー時は空リスト
            pass

        return dimensions

    def _estimate_scale(self, image: np.ndarray, dimensions: list) -> float:
        """スケールを推定する（pixels per mm）"""
        if not dimensions:
            # デフォルトスケール（1:100で A3印刷想定）
            return 0.1

        # 画像サイズと寸法値から推定
        h, w = image.shape[:2]

        # 最大寸法値を使用
        max_dim = max(dimensions, key=lambda d: d["value"])
        dim_value_mm = max_dim["value"]

        # 画像の対角線（ピクセル）
        diagonal_px = np.sqrt(w ** 2 + h ** 2)

        # 推定スケール
        # 通常、図面は1:100または1:50なので、画像サイズから推定
        estimated_scale = diagonal_px / (dim_value_mm * 10)  # mm to pixels

        return min(max(estimated_scale, 0.01), 10.0)  # 範囲制限

    async def convert_pdf_to_image(self, pdf_path: Path, output_dir: Path) -> Path:
        """PDFを画像に変換する"""
        try:
            from pdf2image import convert_from_path

            images = convert_from_path(str(pdf_path), dpi=150)
            if images:
                output_path = output_dir / f"{pdf_path.stem}.png"
                images[0].save(str(output_path), "PNG")
                return output_path
            raise ValueError("PDFからの画像変換に失敗しました")
        except ImportError:
            raise ImportError("pdf2imageがインストールされていません")

    async def parse_dxf(self, dxf_path: Path) -> dict:
        """DXFファイルを解析する"""
        try:
            import ezdxf

            doc = ezdxf.readfile(str(dxf_path))
            modelspace = doc.modelspace()

            outlines = []
            dimensions = []

            # LINEエンティティを抽出
            vertices = []
            for entity in modelspace.query("LINE"):
                start = entity.dxf.start
                end = entity.dxf.end
                vertices.append({"x": start.x, "y": start.y})
                vertices.append({"x": end.x, "y": end.y})

            # POLYLINEエンティティを抽出
            for entity in modelspace.query("LWPOLYLINE"):
                poly_vertices = []
                for point in entity.get_points():
                    poly_vertices.append({"x": point[0], "y": point[1]})
                if poly_vertices:
                    outlines.append(
                        {
                            "vertices": poly_vertices,
                            "floor": 1,
                            "color": FLOOR_COLORS[1],
                        }
                    )

            # DIMENSIONエンティティを抽出
            for entity in modelspace.query("DIMENSION"):
                try:
                    defpoint = entity.dxf.defpoint
                    defpoint2 = entity.dxf.defpoint2
                    text = entity.dxf.text

                    value_match = re.search(r"(\d+)", text)
                    if value_match:
                        value = int(value_match.group(1))
                        dimensions.append(
                            {
                                "id": str(uuid.uuid4()),
                                "start": {"x": defpoint.x, "y": defpoint.y},
                                "end": {"x": defpoint2.x, "y": defpoint2.y},
                                "value": value,
                                "label": f"{value:,}mm",
                            }
                        )
                except AttributeError:
                    pass

            return {
                "outlines": outlines,
                "entrances": [],
                "dimensions": dimensions,
                "scale": 1.0,
                "bounds": self._calculate_bounds(outlines),
            }

        except ImportError:
            raise ImportError("ezdxfがインストールされていません")

    def _calculate_bounds(self, outlines: list) -> dict:
        """境界を計算する"""
        if not outlines:
            return {"minX": 0, "minY": 0, "maxX": 0, "maxY": 0}

        all_vertices = []
        for outline in outlines:
            all_vertices.extend(outline["vertices"])

        if not all_vertices:
            return {"minX": 0, "minY": 0, "maxX": 0, "maxY": 0}

        xs = [v["x"] for v in all_vertices]
        ys = [v["y"] for v in all_vertices]

        return {
            "minX": min(xs),
            "minY": min(ys),
            "maxX": max(xs),
            "maxY": max(ys),
        }
