# Scaff-Pro UI Design System: Luminous Blueprint & Modern Industrial

## 1. デザインコンセプト (Dual Theme)

本アプリケーションは、ユーザーの好みや環境に合わせて2つのテーマを切り替え可能です。

### Mode A: Luminous Blueprint (Default / Light Mode)
- **Concept**: Future, Trust, Clarity
- **キーワード**: 「光り輝く設計図」、「確信」、「清潔感」
- **概要**: 白と明るいグレーを基調に、建設的なブルーとSFチックなシアンの光彩（Bloom）を組み合わせた、先進的かつ信頼感のあるデザイン。

### Mode B: Modern Industrial (Dark Mode)
- **Concept**: Professional, Focus, Cyber
- **キーワード**: 「夜間の現場」、「没入感」、「サイバーパンク」
- **概要**: 深い黒とダークグレーを背景に、安全色のオレンジとネオンシアンが映える、プロフェッショナルで没入感の高いデザイン。

**Theme**: "Luminous Blueprint" (光り輝く設計図)
- **Keywords**: Bright, Modern, Sci-Fi (Near-Future), Premium, Trustworthy (Construction).
- **Core Visuals**: 
    - ベースは明るい白〜ライトグレー（建設現場の図面・書類の清潔感）。
    - アクセントに光彩（Bloom）を伴うシアン・ブルー（先進性・SF感）。
    - 重要なアクションには建設業界を想起させるセーフティオレンジを洗練させて使用。
    - 高級感のあるGlassmorphism（すりガラス）を白いパネルで表現。

## 2. カラーパレット (Variable System)

CSS変数 (`globals.css`) により、テーマ切り替え時に自動的に色がマッピングされます。

### Base Colors (Light Mode)
- **Background**: `#F8FAFC` (Slate 50) - 清潔で明るい背景。
- **Foreground**: `#0F172A` (Slate 900) - 視認性の高い黒に近い紺。
- **Canvas Bg**: `#FFFFFF` (White) - 図面作業エリア。

### Surface Colors
- **Surface 1**: `#FFFFFF` (White) - カード、パネル背景。
- **Surface 2**: `#F1F5F9` (Slate 100) - フォーム入力、ホバー状態。
- **Surface 3**: `#E2E8F0` (Slate 200) - ボーダー、区切り線。

### Brand Colors (Sci-Fi & Trust)
- **Primary (Action)**: `#3B82F6` (Blue 500) 
    - *Effect*: `box-shadow: 0 0 15px rgba(59, 130, 246, 0.5)` (Blue Bloom)
- **Secondary (Accent)**: `#06B6D4` (Cyan 500) - 情報強調、SF的装飾。
- **Warning/Construction**: `#F97316` (Orange 500) - 危険・注意・建設現場のメタファー。
    - *Refined*: 従来の原色オレンジより少しモダンなトーン。

### Status Colors
- **Success**: `#10B981` (Emerald 500)
- **Danger**: `#EF4444` (Red 500)

## 3. Typography
- **Font Family**: Inter, Roboto, or System UI.
- **Headings**: Bold, Tech-inspired spacing.
- **Monospace**: For dimensions, coordinates, and codes.

## 4. Effects & Components

### Glassmorphism (Light)
- **Class**: `.glass-panel`
- **Style**:
  ```css
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  ```

### Bloom / Tone Mapping
- 明るい背景における「発光」表現。
- ボタンやアクティブな入力欄に、同系色の淡い色の `box-shadow` を広めに設定して「滲み出し」を表現。
- **Active State**: 
  ```css
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2), 0 0 20px rgba(59, 130, 246, 0.4);
  ```

### Shadows (Depth)
- **Card Shadow**: `0 4px 6px -1px rgba(148, 163, 184, 0.3)` (Slate系の影で汚れに見えないように)
