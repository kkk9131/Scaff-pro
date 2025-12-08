# 建築図面解析システム - アーキテクチャ設計書

## 概要

本ドキュメントは、建築平面図の自動解析システムにおけるアーキテクチャ設計と技術選定の検討結果をまとめたものである。

### 要件

| 項目 | 内容 |
|------|------|
| **目標精度** | 99.9% |
| **入力形式** | PDF, DXF, 画像（JPG/PNG） |
| **抽出対象** | 外周壁、開口部（玄関・勝手口）、寸法線 |
| **方針** | コストより精度優先、ユーザー操作最小化 |

---

## 入力形式と精度上限

入力形式によって達成可能な精度の上限が決まる。

| 入力形式 | 理論的精度上限 | 理由 |
|----------|---------------|------|
| DXF/DWG | ~100% | ベクターデータ、座標・寸法が数値で存在 |
| PDF (ベクター) | ~98% | パス情報あり、テキストは別処理 |
| PDF (ラスター) | ~85-95% | 画像認識に依存 |
| JPG/PNG | ~80-90% | 完全に画像認識依存 |

**設計方針**: DXF/ベクターPDFを優先し、ラスター画像はAI Visionで補完する。

---

## アーキテクチャ推奨順位

### 比較表

| 順位 | アーキテクチャ | 精度期待値 | コスト/図面 | 実装難易度 | 本番適性 |
|------|---------------|-----------|------------|-----------|---------|
| **1** | Pydantic AI + アンサンブル | 99%+ | ~$0.06 | 中 | ✅ |
| **2** | Claude Agent SDK + Google ADK | 99%+ | ~$0.05 | 中 | ✅ |
| **3** | LangGraph 単独 | 98%+ | ~$0.05 | 高 | ✅ |
| **4** | Claude Agent SDK 単独 | 97%+ | ~$0.08 | 低 | ✅ |
| **5** | CrewAI | 95%+ | ~$0.06 | 低 | ✅ |
| **6** | OpenAI Agents SDK | 95%+ | ~$0.07 | 低 | ✅ |
| **7** | AutoGen 0.4 | 95%+ | ~$0.06 | 高 | ✅ |
| **8** | TanStack AI + Pydantic AI | 99%+ | ~$0.06 | 中 | ⚠️ Alpha |
| **9** | Dify (ノーコード) | 90%+ | ~$0.05 | 最低 | ✅ |

---

## 1位: Pydantic AI + アンサンブル（推奨）

### アーキテクチャ図

```
[入力] → [DXF Parser / PDF Parser / Vision AI] → [Pydantic AI オーケストレータ]
                                                          │
                    ┌─────────────────────────────────────┼─────────────────────────────────────┐
                    ▼                                     ▼                                     ▼
            [Gemini 2.5 Pro]                      [Claude Vision]                         [OpenCV]
                    │                                     │                                     │
                    └─────────────────────────────────────┼─────────────────────────────────────┘
                                                          ▼
                                                 [投票/重み付け統合]
                                                          │
                                                          ▼
                                                 [建築ルール検証]
                                                          │
                                              NG → [自己修正ループ max 3回]
                                                          │
                                                          ▼
                                                 [型安全な出力: FloorPlanAnalysis]
```

### 選定理由

- **型安全な出力保証**: Pydantic モデルによりランタイムエラーを激減
- **アンサンブル**: 単一モデル障害に強く、精度向上
- **MCP/A2A対応**: 将来の拡張性が高い
- **Production/Stable**: 本番利用可能な成熟度

### 技術スタック

- Pydantic AI (Python)
- Gemini 2.5 Pro + Claude Vision
- OpenCV (前処理)
- dxf-parser / pdf.js (ベクター処理)

### コード例

```python
from pydantic_ai import Agent
from pydantic import BaseModel
from typing import Literal

class Opening(BaseModel):
    type: Literal["entrance", "service_door", "window"]
    wall_index: int
    position_ratio: float  # 0-1
    width_mm: float

class Dimension(BaseModel):
    value_mm: float
    target: str
    start_px: tuple[float, float]
    end_px: tuple[float, float]

class FloorPlanAnalysis(BaseModel):
    outer_walls: list[list[tuple[float, float]]]  # 閉ポリゴン
    openings: list[Opening]
    dimensions: list[Dimension]
    confidence: float

# 型安全なエージェント定義
floor_plan_agent = Agent(
    'google-gla:gemini-2.5-pro',
    result_type=FloorPlanAnalysis,
    system_prompt="""建築平面図解析の専門家として、
    外周壁、開口部、寸法線を正確に抽出してください。"""
)
```

---

## 2位: Claude Agent SDK + Google ADK

### アーキテクチャ図

```
[入力] → [入力判定]
              │
    ┌─────────┴─────────┐
    ▼                   ▼
[DXF/PDF]           [画像]
    │                   │
    ▼                   ▼
[ローカル処理]    ┌─────┴─────┐
    │            ▼           ▼
    │     [Claude SDK]  [Google ADK]
    │     [Subagent]    [Gemini Agent]
    │            │           │
    │            └─────┬─────┘
    │                  ▼
    │           [結果統合]
    │                  │
    └────────┬─────────┘
             ▼
      [Claude Skills: 建築ルール検証]
             │
             ▼
      [出力]
```

### 選定理由

- 両社の最新SDK活用
- Skills で建築知識を再利用可能
- Subagent 並列実行で高速
- モデル間フォールバック可能

### 技術スタック

- Claude Agent SDK (TypeScript/Python)
- Google ADK (Python)
- Gemini 2.5 Pro + Claude Vision

---

## 3位: LangGraph 単独

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                        LangGraph                                 │
│                                                                 │
│  [START] → [入力判定] → [前処理] → [Vision解析] → [検証]        │
│               │            │           │           │            │
│               │ DXF        │           │           │ NG         │
│               ▼            │           │           ▼            │
│          [DXF Parser]      │           │      [修正Agent]       │
│               │            │           │           │            │
│               └────────────┴───────────┴───────────┘            │
│                                   │                              │
│                                   ▼                              │
│                              [END: 出力]                         │
└─────────────────────────────────────────────────────────────────┘
```

### 選定理由

- 複雑な条件分岐を視覚的に管理
- 状態永続化（中断・再開可能）
- リトライ・エラーハンドリング最強
- チェックポイント機能

---

## 4位: Claude Agent SDK 単独

### アーキテクチャ図

```
[入力] → [メインAgent] → [解析Subagent] → [検証Subagent] → [出力]
                              │                  │
                              ▼                  ▼
                      [Skill: Vision解析]  [Skill: 建築ルール]
```

### 選定理由

- 単一SDKで完結
- 学習コスト低
- Claude Vision の精度が高い

### 制限

- Claude依存
- アンサンブル不可

---

## 5位: CrewAI

### コード例

```python
from crewai import Agent, Task, Crew, Process

analyzer = Agent(
    role='建築図面解析士',
    goal='図面から外周壁・開口部・寸法線を正確に抽出',
    backstory='建築CADと画像認識の専門家',
    llm='gemini/gemini-2.5-pro',
    tools=[vision_tool, opencv_tool]
)

validator = Agent(
    role='建築検査官',
    goal='解析結果の建築的妥当性を検証',
    backstory='一級建築士として20年の経験',
    llm='anthropic/claude-sonnet-4',
    tools=[architecture_rules_tool]
)

crew = Crew(
    agents=[analyzer, validator],
    tasks=[analysis_task, validation_task],
    process=Process.sequential
)
```

### 選定理由

- 最も直感的
- 学習コスト最低
- ロールベースで理解しやすい

### 制限

- 細かい制御が難しい
- 複雑なエラーハンドリングに限界

---

## 6位: OpenAI Agents SDK

### アーキテクチャ図

```
[入力] → [Orchestrator Agent] → [Handoff] → [Analyzer Agent] → [Validator Agent]
                                                                       │
                                                               [Guardrails]
                                                                       │
                                                                       ▼
                                                                   [出力]
```

### 選定理由

- 軽量で導入簡単
- Handoff/Guardrails が便利
- Swarm の本番版

### 制限

- OpenAI モデル中心
- Gemini/Claude連携に追加工数

---

## 7位: AutoGen 0.4

### 選定理由

- エンタープライズ向け
- 分散処理対応
- .NET対応（C#チームなら有利）

### 制限

- 学習コスト最高
- オーバーキルの可能性

---

## 8位: TanStack AI + Pydantic AI（フルスタック）

### アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                      フロントエンド                              │
│                      (React + TanStack AI)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Headless Chat UI                                        │   │
│  │  - 図面アップロード                                       │   │
│  │  - 解析進捗表示（ストリーミング）                          │   │
│  │  - 信頼度低い箇所のユーザー確認                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP Stream / SSE
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      バックエンド                                │
│                      (Python + Pydantic AI)                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  解析エージェント                                         │   │
│  │  - 型安全な FloorPlanAnalysis 出力                       │   │
│  │  - アンサンブル（Gemini + Claude）                        │   │
│  │  - 建築ルール検証                                         │   │
│  │  - 自己修正ループ                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 選定理由

- フロントエンドUI統合が強力
- 型安全（Zod + Pydantic）
- DevTools充実

### 制限

- TanStack AI が Alpha版（2025年12月リリース）
- 本番利用は6ヶ月後推奨

---

## 9位: Dify（ノーコード）

### 選定理由

- コード不要
- 最速でプロトタイプ
- 50+ビルトインツール

### 制限

- カスタマイズ限界
- 99.9%精度は困難

---

## エージェントSDK比較表

| SDK | 開発元 | 特徴 | 学習曲線 | 料金 |
|-----|--------|------|---------|------|
| **Pydantic AI** | Pydantic | 型安全、MCP/A2A対応、Durable Execution | 中 | 無料（OSS） |
| **Claude Agent SDK** | Anthropic | Skills/Subagent、Claude特化 | 中 | 無料（OSS） |
| **Google ADK** | Google | Gemini最適化、モデル非依存 | 中 | 無料（OSS） |
| **OpenAI Agents SDK** | OpenAI | 軽量、Handoff/Guardrails | 低 | 無料（OSS） |
| **LangGraph** | LangChain | グラフベース、状態管理 | 高 | 無料（OSS） |
| **CrewAI** | CrewAI | ロールベース、直感的 | 低 | 無料（OSS） |
| **AutoGen 0.4** | Microsoft | 非同期、分散対応、.NET対応 | 高 | 無料（OSS） |
| **TanStack AI** | TanStack | TypeScript、Headless UI | 中 | 無料（OSS） |
| **Dify** | Dify | ノーコード、ビジュアルUI | 最低 | 無料枠あり |

---

## LLMモデル選定

| 処理 | 推奨モデル | 理由 | コスト |
|------|-----------|------|--------|
| **画像解析（メイン）** | Gemini 2.5 Pro | コスパ最良、推論力高い | $1.25/1M入力 |
| **画像解析（検証）** | Claude Vision | 精度高い、アンサンブル用 | $3.00/1M入力 |
| **建築ルール検証** | Claude Sonnet 4 | 論理的推論に強い | $3.00/1M入力 |
| **図面清書（オプション）** | Nano Banana Pro | 4K画像生成 | $0.134-0.24/枚 |
| **DXF/ベクターPDF** | ローカル処理 | API不要 | $0 |

### モデル用途の注意

| モデル | 用途 | 寸法線解析 |
|--------|------|-----------|
| **Nano Banana Pro** | 画像生成・編集 | ❌ 不可 |
| **Gemini 2.5 Pro** | マルチモーダル解析 | ✅ 可能 |
| **Claude Vision** | マルチモーダル解析 | ✅ 可能 |
| **GPT-4o** | マルチモーダル解析 | ✅ 可能 |

**重要**: Nano Banana Pro は画像「生成」モデルであり、解析には使用できない。

---

## コスト試算（1図面あたり）

| 処理 | モデル | コスト |
|------|--------|--------|
| Gemini 解析 | Gemini 2.5 Pro | ~$0.02 |
| Claude 解析 | Claude Sonnet 4 | ~$0.03 |
| 修正ループ (1回) | Gemini | ~$0.01 |
| **合計 (画像)** | | **~$0.06** |
| DXF/ベクターPDF | ローカル処理 | **$0** |

---

## 推奨構成（99.9%精度目標）

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pydantic AI (オーケストレータ)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  入力判定 → DXF: 直接パース (100%)                              │
│          → PDF/画像: Vision解析へ                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            アンサンブル解析 (並列)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │Gemini 2.5   │  │Claude       │  │ OpenCV      │     │   │
│  │  │Pro          │  │Vision       │  │ (従来CV)    │     │   │
│  │  │(Google ADK) │  │(Claude SDK) │  │             │     │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │   │
│  │         └────────────────┼────────────────┘            │   │
│  │                          ▼                              │   │
│  │                   投票/重み付け統合                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              建築ルール検証 (Pydantic Model)              │   │
│  │  - 壁閉合チェック                                        │   │
│  │  - 開口部-壁整合性                                       │   │
│  │  - 寸法-実測整合性                                       │   │
│  │  → 不整合: 自己修正ループ (max 3回)                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│                   信頼度 < 95%? → ユーザー確認UI               │
│                             │                                   │
│                             ▼                                   │
│                       最終出力                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 建築ルール検証項目

99.9%精度を達成するための検証ルール:

| 検証項目 | 説明 | 重要度 |
|----------|------|--------|
| 外周壁閉合 | 外周壁が閉じたポリゴンを形成しているか | 必須 |
| 開口部-壁整合性 | 開口部が壁上に正しく配置されているか | 必須 |
| 寸法-実測整合性 | 寸法線の値と実際の図形サイズが一致するか | 必須 |
| 壁厚妥当性 | 壁厚が建築的に妥当な範囲（100-500mm）か | 警告 |
| 開口幅妥当性 | 玄関幅が妥当な範囲（700-1800mm）か | 警告 |

---

## 実装フェーズ

### Phase 1: 基盤構築（1-2週間）

- [ ] DXFパーサー実装
- [ ] PDFベクター/ラスター判定
- [ ] 統一データモデル定義
- [ ] 基本的な検証ルール実装

### Phase 2: AI Vision統合（2-3週間）

- [ ] Gemini 2.5 Pro 統合
- [ ] OpenCV前処理パイプライン
- [ ] 建築ルール検証の完全実装
- [ ] 単一モデルでの精度検証

### Phase 3: 高精度化（2-3週間）

- [ ] Claude Vision追加（アンサンブル）
- [ ] 自己修正ループ実装
- [ ] 信頼度スコアリング精緻化
- [ ] エッジケース対応

### Phase 4: 最終調整（1-2週間）

- [ ] 大量テストデータでの検証
- [ ] 信頼度閾値チューニング
- [ ] UIでの確認フロー最適化
- [ ] コスト最適化

---

## 参考リンク

### エージェントSDK

- [Pydantic AI](https://ai.pydantic.dev/)
- [Claude Agent SDK - Subagents](https://docs.claude.com/en/docs/agent-sdk/subagents)
- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [CrewAI](https://www.crewai.com/)
- [Microsoft AutoGen](https://microsoft.github.io/autogen/)
- [TanStack AI](https://tanstack.com/ai/latest)
- [Dify](https://dify.ai/)

### LLMモデル

- [Gemini 2.5 Pro](https://ai.google.dev/gemini-api/docs/models)
- [Claude Vision](https://docs.anthropic.com/claude/docs/vision)
- [Nano Banana Pro (Gemini 3 Pro Image)](https://blog.google/technology/ai/nano-banana-pro/)

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-08 | 初版作成 |
