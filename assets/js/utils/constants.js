/**
 * Constants - 評価ツール
 * アプリケーション全体で使用する定数を定義
 */

// グローバル名前空間の作成
window.EvaluationApp = window.EvaluationApp || {};

// 定数オブジェクト
EvaluationApp.Constants = {
  
  // === アプリケーション設定 === //
  APP: {
    NAME: '評価ツール',
    VERSION: '1.0.0',
    MODE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'development' : 'production',
    DEBUG: false, // 本番環境では false にする
    DEMO_MODE: true // デモモードフラグ
  },

  // === ルート定義 === //
  ROUTES: {
    DASHBOARD: 'dashboard',
    EVALUATIONS: 'evaluations',
    SUBORDINATES: 'subordinates',
    USERS: 'users',
    SETTINGS: 'settings',
    REPORTS: 'reports',
    LOGIN: 'login',
    PROFILE: 'profile'
  },

  // === ユーザーロール === //
  USER_ROLES: {
    ADMIN: 'admin',
    EVALUATOR: 'evaluator',
    EMPLOYEE: 'employee'
  },

  // === 役職タイプ === //
  POSITION_TYPES: {
    FIELD_WORKER: '現場作業員',
    SALES: '営業',
    MANAGER: '管理者',
    EXECUTIVE: '代表'
  },

  // === 評価ステータス === //
  EVALUATION_STATUS: {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    APPROVED_BY_EVALUATOR: 'approved_by_evaluator',
    APPROVED_BY_ADMIN: 'approved_by_admin',
    REJECTED: 'rejected'
  },

  // === 評価ステータス表示名 === //
  EVALUATION_STATUS_LABELS: {
    draft: '下書き',
    submitted: '提出済',
    approved_by_evaluator: '一次承認済',
    approved_by_admin: '評価完了',
    rejected: '差し戻し'
  },

  // === 評価基準 === //
  EVALUATION_CRITERIA: {
    // 作業員/管理者用（技術評価）
    TECHNICAL: [
      { value: 0, label: 'レベル0', description: '作業出来ない/該当しない' },
      { value: 1, label: 'レベル1', description: '補助することが出来る' },
      { value: 2, label: 'レベル2', description: '指導を受けながらであればできる' },
      { value: 3, label: 'レベル3', description: '単独で業務を行うことが出来る' },
      { value: 4, label: 'レベル4', description: '指導を行うことが出来る' },
      { value: 5, label: 'レベル5', description: '全体の現場を仕切ることが出来る（複数人の管理）' }
    ],
    
    // 営業用（達成率評価）
    SALES: [
      { value: 1, label: 'レベル1', description: '69%以下' },
      { value: 2, label: 'レベル2', description: '70%' },
      { value: 3, label: 'レベル3', description: '90%' },
      { value: 4, label: 'レベル4', description: '100%' },
      { value: 5, label: 'レベル5', description: '110%以上' }
    ],
    
    // 定性評価（全役職共通）
    QUALITATIVE: [
      { value: 1, label: 'レベル1', description: '全く実行できなかった' },
      { value: 2, label: 'レベル2', description: '一部実行出来た' },
      { value: 3, label: 'レベル3', description: '実行は出来たが設定内容以上までは出来なかった' },
      { value: 4, label: 'レベル4', description: '実行できた' },
      { value: 5, label: 'レベル5', description: '設定内容以上の事を行えた' }
    ]
  },

  // === ローカルストレージキー === //
  STORAGE_KEYS: {
    AUTH_TOKEN: 'eval_auth_token',
    REFRESH_TOKEN: 'eval_refresh_token',
    USER_DATA: 'eval_user_data',
    APP_SETTINGS: 'eval_app_settings',
    THEME: 'eval_theme',
    LANGUAGE: 'eval_language'
  },

  // === イベント名 === //
  EVENTS: {
    AUTH: {
      LOGIN_SUCCESS: 'auth:login:success',
      LOGIN_FAILED: 'auth:login:failed',
      LOGOUT: 'auth:logout',
      TOKEN_EXPIRED: 'auth:token:expired'
    },
    NAVIGATION: {
      ROUTE_CHANGE: 'navigation:route:change',
      PAGE_LOAD: 'navigation:page:load'
    },
    EVALUATION: {
      CREATED: 'evaluation:created',
      UPDATED: 'evaluation:updated',
      SUBMITTED: 'evaluation:submitted',
      APPROVED: 'evaluation:approved',
      REJECTED: 'evaluation:rejected'
    },
    NOTIFICATION: {
      SHOW: 'notification:show',
      HIDE: 'notification:hide'
    }
  },

  // === UI設定 === //
  UI: {
    // 通知の表示時間（ミリ秒）
    NOTIFICATION_DURATION: {
      SUCCESS: 5000,
      INFO: 5000,
      WARNING: 7000,
      ERROR: 10000
    },
    
    // ページ遷移のアニメーション時間（ミリ秒）
    PAGE_TRANSITION_DURATION: 300,
    
    // モーダルのアニメーション時間（ミリ秒）
    MODAL_TRANSITION_DURATION: 250,
    
    // ローディング表示の最小時間（ミリ秒）
    MIN_LOADING_DURATION: 500,
    
    // デバウンス時間（ミリ秒）
    DEBOUNCE_DELAY: 300,
    
    // オートセーブ間隔（ミリ秒）
    AUTOSAVE_INTERVAL: 30000,
    
    // チャートの色設定
    CHART_COLORS: {
      PRIMARY: '#001350',
      SECONDARY: '#6c757d',
      SUCCESS: '#198754',
      WARNING: '#ffc107',
      DANGER: '#dc3545',
      INFO: '#0dcaf0'
    }
  },

  // === バリデーション設定 === //
  VALIDATION: {
    // パスワード要件
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 128,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SYMBOLS: false
    },
    
    // ユーザー名要件
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 50,
      PATTERN: /^[a-zA-Z0-9_-]+$/
    },
    
    // メールアドレス
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    
    // 評価関連
    EVALUATION: {
      MIN_RATING: 1,
      MAX_RATING: 5,
      MAX_COMMENT_LENGTH: 1000,
      MAX_GOAL_LENGTH: 500,
      TOTAL_WEIGHT: 100
    }
  },

  // === ファイル設定 === //
  FILES: {
    // 許可するファイル形式
    ALLOWED_TYPES: {
      IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      CSV: ['text/csv']
    },
    
    // ファイルサイズ制限（バイト）
    MAX_SIZE: {
      IMAGE: 5 * 1024 * 1024,      // 5MB
      DOCUMENT: 10 * 1024 * 1024,   // 10MB
      SPREADSHEET: 10 * 1024 * 1024, // 10MB
      CSV: 1 * 1024 * 1024          // 1MB
    }
  },

  // === 日付フォーマット === //
  DATE_FORMATS: {
    FULL: 'YYYY年MM月DD日 HH:mm:ss',
    DATE_ONLY: 'YYYY年MM月DD日',
    TIME_ONLY: 'HH:mm:ss',
    SHORT: 'YYYY/MM/DD',
    ISO: 'YYYY-MM-DD',
    DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm'
  },

  // === エラーコード === //
  ERROR_CODES: {
    // 認証エラー
    AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
    AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
    
    // バリデーションエラー
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    VALIDATION_REQUIRED_FIELD: 'VALIDATION_REQUIRED_FIELD',
    VALIDATION_INVALID_FORMAT: 'VALIDATION_INVALID_FORMAT',
    
    // データエラー
    DATA_NOT_FOUND: 'DATA_NOT_FOUND',
    DATA_CONFLICT: 'DATA_CONFLICT',
    DATA_INTEGRITY_ERROR: 'DATA_INTEGRITY_ERROR',
    
    // ネットワークエラー
    NETWORK_ERROR: 'NETWORK_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    
    // ファイルエラー
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
    
    // 一般エラー
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
  },

  // === 設定可能な項目 === //
  SETTINGS: {
    // テーマ
    THEMES: ['light', 'dark', 'auto'],
    
    // 言語
    LANGUAGES: ['ja', 'en'],
    
    // タイムゾーン
    TIMEZONES: ['Asia/Tokyo', 'UTC'],
    
    // 通知設定
    NOTIFICATION_TYPES: ['email', 'browser', 'none']
  },

  // === 権限定義 === //
  PERMISSIONS: {
    // 評価関連
    EVALUATION_CREATE: 'evaluation:create',
    EVALUATION_READ: 'evaluation:read',
    EVALUATION_UPDATE: 'evaluation:update',
    EVALUATION_DELETE: 'evaluation:delete',
    EVALUATION_APPROVE: 'evaluation:approve',
    EVALUATION_SUBMIT: 'evaluation:submit',
    
    // ユーザー管理
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    
    // 設定管理
    SETTINGS_READ: 'settings:read',
    SETTINGS_UPDATE: 'settings:update',
    
    // レポート
    REPORT_VIEW: 'report:view',
    REPORT_EXPORT: 'report:export'
  }
};

// デバッグモード設定
if (EvaluationApp.Constants.APP.MODE === 'development') {
  EvaluationApp.Constants.APP.DEBUG = true;
  console.log('評価ツール - デバッグモードで起動');
}

// 定数を変更不可にする
Object.freeze(EvaluationApp.Constants);

// ログ出力（開発環境のみ）
if (EvaluationApp.Constants.APP.DEBUG) {
  console.log('EvaluationApp.Constants initialized:', EvaluationApp.Constants);
}
