"""Claude Vision API Service

建築図面解析のためのClaude Vision統合サービス
"""

import base64
import os
from pathlib import Path
from typing import Any

import anthropic
from anthropic.types import MessageParam


class ClaudeVisionService:
    """Claude Vision API ラッパー"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = "claude-3-5-sonnet-20241022"

    def analyze_floor_plan(
        self,
        image_path: str | Path,
        extract_outline: bool = True,
        extract_entrance: bool = True,
        extract_back_door: bool = True,
        extract_roof: bool = False,
    ) -> dict[str, Any]:
        """
        平面図を解析し、必要な情報を抽出

        Args:
            image_path: 図面画像のパス
            extract_outline: 外周線を抽出するか
            extract_entrance: 玄関位置を抽出するか
            extract_back_door: 勝手口位置を抽出するか
            extract_roof: 屋根形状を抽出するか（立面図の場合）

        Returns:
            dict: 解析結果
                {
                    "outline": [[x, y], ...],  # 外周ポリゴン頂点
                    "entrance": {"position": [x, y], "confidence": 0.95},
                    "back_door": {"position": [x, y], "confidence": 0.88},
                    "roof_type": "切妻",
                    "scale": "1:100",
                    "confidence": 0.92
                }
        """
        # 画像をBase64エンコード
        image_data = self._encode_image(image_path)
        media_type = self._get_media_type(image_path)

        # プロンプト生成
        prompt = self._build_floor_plan_prompt(
            extract_outline=extract_outline,
            extract_entrance=extract_entrance,
            extract_back_door=extract_back_door,
            extract_roof=extract_roof,
        )

        # Claude Vision API呼び出し
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": media_type,
                                    "data": image_data,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )

            # JSON応答をパース
            import json

            result_text = response.content[0].text

            # JSON部分を抽出（```json ... ``` で囲まれている場合があるため）
            if "```json" in result_text:
                json_start = result_text.find("```json") + 7
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()
            elif "```" in result_text:
                json_start = result_text.find("```") + 3
                json_end = result_text.find("```", json_start)
                result_text = result_text[json_start:json_end].strip()

            result = json.loads(result_text)
            return result

        except Exception as e:
            raise RuntimeError(f"Claude Vision API call failed: {e}")

    def _encode_image(self, image_path: str | Path) -> str:
        """画像をBase64エンコード"""
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def _get_media_type(self, image_path: str | Path) -> str:
        """ファイル拡張子からメディアタイプを取得"""
        suffix = Path(image_path).suffix.lower()
        media_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        return media_types.get(suffix, "image/jpeg")

    def _build_floor_plan_prompt(
        self,
        extract_outline: bool,
        extract_entrance: bool,
        extract_back_door: bool,
        extract_roof: bool,
    ) -> str:
        """平面図解析用プロンプトを生成"""

        extraction_targets = []
        if extract_outline:
            extraction_targets.append(
                "1. **外周線**: 建物の外壁ライン（太線のみ、寸法線や補助線は除外）\n"
                "   - 時計回りに頂点座標を抽出\n"
                "   - `outline`: [[x1, y1], [x2, y2], ...]"
            )
        if extract_entrance:
            extraction_targets.append(
                "2. **玄関位置**: メインエントランスの中心座標\n"
                "   - `entrance`: {\"position\": [x, y], \"confidence\": 0-1.0}"
            )
        if extract_back_door:
            extraction_targets.append(
                "3. **勝手口位置**: 裏口・サブエントランスの中心座標\n"
                "   - `back_door`: {\"position\": [x, y], \"confidence\": 0-1.0}"
            )
        if extract_roof:
            extraction_targets.append(
                "4. **屋根形状**: 屋根のタイプを分類\n"
                "   - `roof_type`: \"切妻\" | \"寄棟\" | \"陸屋根\" | \"片流れ\" | \"その他\""
            )

        targets_text = "\n".join(extraction_targets)

        prompt = f"""
あなたは建築図面解析の専門家です。
この平面図から以下の情報をJSON形式で正確に抽出してください。

## 抽出対象

{targets_text}

## 除外するもの

❌ 寸法線（細線、矢印付き）
❌ 文字・注記・寸法数値
❌ 家具・設備記号
❌ ハッチング（材質表現）
❌ 破線（建具・隠れ線）
❌ 補助線・グリッド線

## 抽出するもの

✅ 外壁線（太線）
✅ 構造壁線（太線）
✅ 玄関・勝手口の位置（開口部マーク）

## 出力形式

必ず以下のJSON形式で出力してください：

```json
{{
  "outline": [[x1, y1], [x2, y2], [x3, y3], ...],
  "entrance": {{"position": [x, y], "confidence": 0.95}},
  "back_door": {{"position": [x, y], "confidence": 0.88}},
  "roof_type": "切妻",
  "scale": "1:100",
  "confidence": 0.92,
  "notes": "解析時の注意点や補足情報"
}}
```

## 注意事項

- 座標は画像の左上を原点(0,0)とするピクセル座標で指定
- 外周線は閉じたポリゴンとして抽出（最初と最後の頂点は異なる）
- 検出できない項目は null を返す
- confidence は 0.0-1.0 の範囲で自信度を示す
- scale が判読できる場合は抽出（例: "1:100"）

正確な抽出を心がけてください。
"""
        return prompt.strip()


# シングルトンインスタンス
_claude_service: ClaudeVisionService | None = None


def get_claude_service() -> ClaudeVisionService:
    """ClaudeVisionServiceのシングルトンインスタンスを取得"""
    global _claude_service
    if _claude_service is None:
        _claude_service = ClaudeVisionService()
    return _claude_service
