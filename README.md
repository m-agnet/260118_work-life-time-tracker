# Work Life Time Tracker

作業時間を計測し、作業内容をタグ付きで記録・可視化できるWebアプリケーション

## 技術スタック

### バックエンド
- **言語**: Python 3.11+
- **フレームワーク**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **データベース**: SQLite
- **API形式**: REST
- **日時処理**: datetime / pytz

### フロントエンド
- **テンプレート**: Jinja2
- **スタイル**: Tailwind CSS
- **JavaScript**: Vanilla JS
- **グラフ描画**: Chart.js

### その他
- **パッケージ管理**: Poetry
- **開発サーバー**: Uvicorn
- **フォーマッター**: Black
- **Linter**: Ruff

## 機能概要

### 1. タイマー機能
- スタート/ストップボタンで作業時間を計測
- リアルタイムで経過時間を表示
- ストップ後、作業内容の詳細とタグを入力
- 複数タグの選択・新規作成が可能

### 2. 記録管理
- 作業内容を以下の情報で保存
  - 開始時刻 / 終了時刻
  - 作業時間（秒単位）
  - 詳細説明
  - タグ（複数可）

### 3. 記録一覧
- すべての記録をテーブル形式で表示
- 日付別フィルタリング（今日 / 今週 / 今月）
- 記録の削除機能

### 4. 分析・可視化
- **タグ別作業時間**: 円グラフで割合を表示
- **日別作業時間**: 棒グラフで推移を表示
- **統計情報**:
  - 総作業時間
  - 作業記録数
  - 平均作業時間
- **期間フィルタ**: 今日 / 今週 / 今月 / すべて

## ディレクトリ構成

```
work-life-time-tracker/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI メインアプリケーション
│   ├── database.py             # データベース設定
│   ├── api/
│   │   └── __init__.py         # API エンドポイント
│   ├── models/
│   │   └── __init__.py         # SQLAlchemy モデル定義
│   ├── schemas/
│   │   └── __init__.py         # Pydantic スキーマ
│   ├── services/
│   │   └── __init__.py         # ビジネスロジック
│   ├── templates/
│   │   ├── base.html           # ベーステンプレート
│   │   ├── index.html          # タイマー/トップページ
│   │   ├── records.html        # 記録一覧ページ
│   │   └── analysis.html       # 分析ページ
│   └── static/
│       ├── css/
│       └── js/
│           ├── timer.js        # タイマー機能
│           ├── records.js      # 記録一覧機能
│           └── analysis.js     # 分析ページ機能
├── migrations/                 # Alembic マイグレーション（準備済み）
├── pyproject.toml              # Poetry プロジェクト設定
├── README.md                   # このファイル
└── work_tracker.db             # SQLite データベース（自動生成）
```

## 環境構築

### 前提条件
- Python 3.11以上
- Poetryがインストール済み

### インストール手順

1. **リポジトリをクローン**
   ```bash
   git clone <repository-url>
   cd work-life-time-tracker
   ```

2. **依存関係をインストール**
   ```bash
   poetry install
   ```

3. **仮想環境に入る**
   ```bash
   poetry shell
   ```

## 起動方法

### 開発環境での起動

```bash
poetry run uvicorn app.main:app --reload
```

または

```bash
poetry shell
uvicorn app.main:app --reload
```

アプリケーションは `http://localhost:8000` で起動します。

### 初回起動時
- 最初の起動時に自動的にSQLiteデータベース（`work_tracker.db`）が生成されます
- テーブルも自動的に作成されます

## 使用方法

### 1. トップページ（タイマー）
1. 「スタート」ボタンをクリック
2. 作業を開始
3. 作業終了時に「ストップ」ボタンをクリック
4. 作業詳細とタグを入力
5. 「保存」ボタンで記録を保存

### 2. 記録一覧ページ
- すべての作業記録を確認
- フィルタで期間を絞込可能
- 不要な記録は削除可能

### 3. 分析ページ
- タグ別の作業時間を円グラフで視覚化
- 日別の作業時間を棒グラフで表示
- 統計情報（総時間、記録数、平均時間）を確認
- 期間フィルタで期間ごとの分析が可能

## API エンドポイント

### タイムトラッキング

**記録作成**
```http
POST /api/records
Content-Type: application/json

{
  "start_time": "2024-01-18T10:00:00",
  "end_time": "2024-01-18T11:30:00",
  "duration": 5400,
  "description": "ドキュメント作成",
  "tag_ids": [1, 2],
  "tag_names": ["新規タグ"]
}
```

**記録取得（フィルタ可能）**
```http
GET /api/records?skip=0&limit=100&start_date=2024-01-18T00:00:00&end_date=2024-01-18T23:59:59
```

**記録削除**
```http
DELETE /api/records/{record_id}
```

**特定記録取得**
```http
GET /api/records/{record_id}
```

### 分析

**サマリー取得**
```http
GET /api/records/summary?start_date=2024-01-18T00:00:00&end_date=2024-01-18T23:59:59
```

レスポンス例:
```json
{
  "by_tag": [
    {"tag_name": "開発", "total_duration": 7200},
    {"tag_name": "ドキュメント", "total_duration": 3600}
  ],
  "by_date": [
    {"date": "2024-01-18", "total_duration": 10800, "record_count": 2}
  ]
}
```

### タグ

**タグ一覧取得**
```http
GET /api/tags
```

## データベーススキーマ

### Record テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INTEGER | 主キー |
| start_time | DATETIME | 開始時刻 |
| end_time | DATETIME | 終了時刻 |
| duration | INTEGER | 作業時間（秒） |
| description | TEXT | 詳細説明 |
| created_at | DATETIME | 作成日時 |

### Tag テーブル
| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | INTEGER | 主キー |
| name | VARCHAR(100) | タグ名（ユニーク） |

### record_tag テーブル（中間テーブル）
| カラム名 | 型 | 説明 |
|---------|-----|------|
| record_id | INTEGER | Record テーブルへの外部キー |
| tag_id | INTEGER | Tag テーブルへの外部キー |

## コード品質

アプリケーション内のコード品質ツール:

### Formatting
```bash
poetry run black app/
```

### Linting
```bash
poetry run ruff check app/
```

## トラブルシューティング

### ポート8000が既に使用されている場合
```bash
poetry run uvicorn app.main:app --reload --port 8001
```

### データベースをリセットしたい場合
```bash
rm work_tracker.db
# 次回起動時に自動的に再作成されます
poetry run uvicorn app.main:app --reload
```

### モジュールが見つからないエラー
```bash
# 依存関係を再インストール
poetry install
poetry shell
```

## ブラウザ対応
- Chrome / Edge (推奨)
- Firefox
- Safari

## ライセンス
MIT License

## サポート
問題が発生した場合は、GitHubでIssueを作成してください。

## 今後の拡張予定
- [ ] ユーザー認証機能
- [ ] データエクスポート（CSV/PDF）
- [ ] リマインダー機能
- [ ] 目標設定機能
- [ ] チーム共有機能
- [ ] モバイルアプリ化