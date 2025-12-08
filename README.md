# CoC6 シナリオビューワ (KP 向け)

Call of Cthulhu 6 版の KP がセッション当日に使うことを想定したシナリオ管理・閲覧用の静的 Web アプリです。  
シーン／NPC／技能テンプレ／フローチャートをまとめ、ココフォリア用のキャラエクスポートにも対応します。すべてブラウザ内完結で外部送信は行いません。

## 主な機能
- シーン一覧と詳細表示、SAN/技能ヒント/BGM/背景/NPC 登場管理
- NPC 管理：ステータス自動計算（HP/MP/DB）、一般技能・戦闘技能の別管理、ダメージ計算、Q&A、登場シーン紐付け
- 技能テンプレ管理：CoC6 標準テンプレ読み込み、検索・全選択、戦闘技能にはダメージ入力対応
- フローチャート：シーン間の流れを可視化・ドラッグ移動
- ココフォリア出力：NPC を Clipboard API 形式でコピー（秘匿/SAN コマンドオプション）
- 履歴 Undo、トースト通知、ローカル自動保存（localStorage）

## データポリシー
- シナリオデータはブラウザのメモリと `localStorage` のみで保持。
- 明示的なエクスポート操作時のみ JSON をダウンロード。ネットワーク送信・解析タグ・外部 API 呼び出しは実装していません。
- 共有端末では利用後に「空にする」かブラウザのストレージ削除を推奨。

## 開発環境
- Node.js 18+ を推奨
- React 19 + TypeScript + Vite

### セットアップ & 実行
```bash
npm install
npm run dev     # 開発サーバ
npm run build   # 本番ビルド（dist/ に出力）
npm run preview # ビルド済みをローカル確認
```

## デプロイ (Cloudflare Pages)
1. GitHub にリポジトリを push（このプロジェクトは `dist` を生成する静的サイトです）。
2. Cloudflare Pages でリポジトリを選択し、Build command を `npm run build`、Build output directory を `dist` に設定。
3. `_headers` に CSP などのセキュリティヘッダーを含めているため追加設定不要。HTTPS リダイレクトを有効化すると Clipboard の失敗を防ぎやすくなります。

## セキュリティとプライバシー
- 外部通信なし。CSP/Permissions-Policy/X-Frame-Options 等を `public/_headers` に設定済み（Cloudflare Pages で配信時に適用）。
- `dangerouslySetInnerHTML` 未使用で、ユーザー入力は React のエスケープを通ります。
- クリップボードへの書き込みはユーザー操作後のみ。HTTPS での利用を推奨。

## ライセンス
現状ライセンス未設定（必要に応じて追記してください）。
