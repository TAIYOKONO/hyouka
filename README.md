# 評価ツール

建設業向け従業員評価管理システム

## 概要

このシステムは建設業の特性に合わせて設計された従業員評価管理ツールです。現場作業員、営業、管理者それぞれの役職に応じた評価項目を設定し、効率的な人事評価プロセスを支援します。

## 主な機能

### 📊 評価管理
- **定量評価**: 技術スキルや業績の数値化
- **定性評価**: 目標設定と達成度評価
- **多段階承認**: 評価者→管理者の承認フロー
- **レポート出力**: 詳細な評価レポートの生成

### 👥 ユーザー管理
- **役割ベース**: 管理者、評価者、従業員の権限管理
- **階層構造**: 評価者と被評価者の関係設定
- **カスタムフィールド**: 企業固有の項目追加

### ⚙️ 設定管理
- **評価期間**: 半期・年次などの評価期間設定
- **評価項目**: 役職別の評価カテゴリ管理
- **評価基準**: レベル別の評価基準定義

### 📈 ダッシュボード
- **進捗管理**: 評価の提出・承認状況
- **統計表示**: チャートによる可視化
- **通知機能**: 評価期限や承認待ちの通知

## 技術スタック

- **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
- **UIフレームワーク**: Bootstrap 5
- **チャート**: Chart.js
- **アイコン**: Font Awesome
- **モジュール**: ES6 Modules

## セットアップ

### 必要要件

- モダンブラウザ（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- Webサーバー（開発時は Live Server 等）

### インストール手順

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/your-username/evaluation-tool.git
   cd evaluation-tool
   ```

2. **開発サーバーの起動**
   ```bash
   # VS Code の Live Server 拡張機能を使用する場合
   # index.html を右クリック → "Open with Live Server"
   
   # Python を使用する場合
   python -m http.server 8000
   
   # Node.js を使用する場合
   npx serve .
   ```

3. **ブラウザでアクセス**
   ```
   http://localhost:8000
   ```

### ディレクトリ構成

```
evaluation-tool/
├── index.html                 # メインエントリーポイント
├── README.md                  # プロジェクト説明
├── 
├── assets/
│   ├── css/
│   │   ├── variables.css      # CSS変数定義
│   │   ├── main.css          # メインスタイル
│   │   ├── components.css    # コンポーネント用スタイル
│   │   └── responsive.css    # レスポンシブ対応
│   │
│   ├── js/
│   │   ├── core/             # コア機能
│   │   │   ├── app.js        # メインアプリケーション
│   │   │   ├── auth.js       # 認証管理
│   │   │   ├── api.js        # API通信
│   │   │   └── router.js     # ページルーティング
│   │   │
│   │   ├── components/       # UIコンポーネント
│   │   ├── pages/           # ページコントローラー
│   │   ├── data/           # データ管理
│   │   └── utils/          # ユーティリティ
│   │
│   └── images/             # 画像ファイル
│
├── pages/                  # HTMLテンプレート
├── components/            # 再利用可能コンポーネント
├── docs/                 # ドキュメント
└── examples/            # サンプルデータ
```

## 使用方法

### 基本的な流れ

1. **ログイン**: デモモードでは自動ログイン
2. **評価入力**: 自己評価の実施
3. **評価承認**: 評価者による確認・承認
4. **レポート確認**: 評価結果の閲覧

### 役職別の機能

#### 従業員
- 自己評価の入力・提出
- 評価結果の確認
- 過去の評価履歴の閲覧

#### 評価者
- 部下の評価確認・承認
- 評価コメントの入力
- 評価対象者の管理

#### 管理者
- 全体の評価状況確認
- ユーザー管理
- システム設定

## 開発

### コーディング規約

- **JavaScript**: ES6+ モジュール形式
- **CSS**: BEM命名規則
- **HTML**: セマンティックHTML5

### ファイル命名規則

- **JavaScript**: kebab-case (例: `evaluation-form.js`)
- **CSS**: kebab-case (例: `main.css`)
- **HTML**: kebab-case (例: `dashboard.html`)

### 新機能の追加

1. **コンポーネント作成**
   ```javascript
   // assets/js/components/new-component.js
   EvaluationApp.NewComponent = class {
     constructor() {
       // 初期化処理
     }
   }
   ```

2. **CSS追加**
   ```css
   /* assets/css/components.css */
   .new-component {
     /* スタイル定義 */
   }
   ```

3. **index.html に追加**
   ```html
   <script src="assets/js/components/new-component.js"></script>
   ```

## カスタマイズ

### 色テーマの変更

`assets/css/variables.css` でカラーパレットを変更：

```css
:root {
  --color-primary: #001350;     /* メインカラー */
  --color-secondary: #6c757d;   /* セカンダリカラー */
  /* その他の色設定... */
}
```

### 評価項目の追加

`assets/js/data/evaluation-criteria.js` で評価項目を追加：

```javascript
EvaluationApp.MockData.categories.push({
  id: 8,
  name: '新しいカテゴリ',
  position_type: ['現場作業員'],
  weight: 10,
  items: [
    { id: 51, name: '新しい評価項目' }
  ]
});
```

## トラブルシューティング

### よくある問題

1. **ページが表示されない**
   - ブラウザの開発者ツールでコンソールエラーを確認
   - ファイルパスが正しいか確認

2. **スタイルが適用されない**
   - CSSファイルの読み込み順序を確認
   - ブラウザキャッシュをクリア

3. **JavaScript エラー**
   - すべての依存関係が正しく読み込まれているか確認
   - コンソールでエラー詳細を確認

### デバッグ方法

```javascript
// デバッグモードの有効化
EvaluationApp.Constants.APP.DEBUG = true;

// アプリケーション情報の確認
console.log(window.evaluationApp.getInfo());
```

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 貢献

プロジェクトへの貢献を歓迎します！

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## サポート

問題や質問がある場合は、[Issues](https://github.com/your-username/evaluation-tool/issues) ページで報告してください。

## 作者

- **作成者名** - [GitHub](https://github.com/your-username)

## 更新履歴

### v1.0.0 (2024-12-XX)
- 初期リリース
- 基本的な評価機能の実装
- ユーザー管理機能
- レポート機能

---

## 関連リンク

- [プロジェクトホームページ](https://your-username.github.io/evaluation-tool)
- [API ドキュメント](docs/api-reference.md)
- [ユーザーガイド](docs/user-guide.md)
- [開発者ガイド](docs/development.md)
