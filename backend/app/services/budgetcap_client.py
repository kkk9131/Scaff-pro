"""
BudgetCap プロキシ経由で Gemini API を呼び出すクライアント
OpenAI形式でリクエスト、Geminiネイティブ形式でレスポンス
"""
import os
import base64
import httpx
from typing import Optional, Union
from pathlib import Path


class BudgetCapGeminiClient:
    """BudgetCap経由でGemini APIを呼び出すクライアント"""

    PROXY_URL = "https://btvjysmcareurvbmhnkv.supabase.co/functions/v1/proxy"
    PROVIDER = "gemini"

    def __init__(self, api_key: Optional[str] = None):
        """
        初期化

        Args:
            api_key: BudgetCap API キー（省略時は環境変数から取得）
        """
        self.api_key = api_key or os.getenv("BUDGETCAP_API_KEY")
        if not self.api_key:
            raise ValueError("BUDGETCAP_API_KEY 環境変数が設定されていません")

    def _get_headers(self) -> dict:
        """リクエストヘッダーを生成"""
        return {
            "X-API-Key": self.api_key,
            "X-Provider": self.PROVIDER,
            "Content-Type": "application/json",
        }

    def _build_messages(
        self,
        prompt: str,
        image_data: Optional[bytes] = None,
        mime_type: str = "image/jpeg"
    ) -> list:
        """
        OpenAI形式のmessages配列を構築

        Args:
            prompt: テキストプロンプト
            image_data: 画像のバイトデータ（オプション）
            mime_type: 画像のMIMEタイプ
        """
        if image_data:
            # 画像付きメッセージ（OpenAI Vision形式）
            base64_image = base64.b64encode(image_data).decode("utf-8")
            content = [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{base64_image}"
                    }
                }
            ]
        else:
            # テキストのみ
            content = prompt

        return [{"role": "user", "content": content}]

    def generate_content(
        self,
        model: str,
        prompt: str,
        image_data: Optional[bytes] = None,
        mime_type: str = "image/jpeg",
        timeout: float = 120.0
    ) -> str:
        """
        Gemini APIを呼び出してコンテンツを生成

        Args:
            model: 使用するモデル名（例: "gemini-2.5-flash-lite"）
            prompt: テキストプロンプト
            image_data: 画像のバイトデータ（オプション）
            mime_type: 画像のMIMEタイプ
            timeout: タイムアウト秒数

        Returns:
            生成されたテキスト
        """
        messages = self._build_messages(prompt, image_data, mime_type)

        payload = {
            "model": model,
            "messages": messages,
        }

        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                self.PROXY_URL,
                headers=self._get_headers(),
                json=payload
            )
            response.raise_for_status()

        result = response.json()

        # Gemini APIのレスポンス構造からテキストを抽出
        # 通常: candidates[0].content.parts[0].text
        try:
            candidates = result.get("candidates", [])
            if not candidates:
                raise ValueError(f"レスポンスにcandidatesがありません: {result}")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if not parts:
                raise ValueError(f"レスポンスにpartsがありません: {result}")

            return parts[0].get("text", "")
        except (KeyError, IndexError) as e:
            raise ValueError(f"レスポンスのパースに失敗しました: {e}\nレスポンス: {result}")

    def generate_content_from_file(
        self,
        model: str,
        prompt: str,
        image_path: Union[str, Path],
        timeout: float = 120.0
    ) -> str:
        """
        ファイルパスから画像を読み込んでコンテンツを生成

        Args:
            model: 使用するモデル名
            prompt: テキストプロンプト
            image_path: 画像ファイルのパス
            timeout: タイムアウト秒数

        Returns:
            生成されたテキスト
        """
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"画像ファイルが見つかりません: {image_path}")

        # MIMEタイプを拡張子から推定
        mime_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        mime_type = mime_types.get(path.suffix.lower(), "image/jpeg")

        image_data = path.read_bytes()
        return self.generate_content(model, prompt, image_data, mime_type, timeout)


# シングルトンインスタンス（遅延初期化）
_client: Optional[BudgetCapGeminiClient] = None


def get_client() -> BudgetCapGeminiClient:
    """BudgetCapクライアントのシングルトンインスタンスを取得"""
    global _client
    if _client is None:
        _client = BudgetCapGeminiClient()
    return _client
