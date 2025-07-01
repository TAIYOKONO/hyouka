/**
 * i18n.js - 建設業評価システム ハイブリッド多言語対応
 * 辞書翻訳 + リアルタイムAPI翻訳システム
 */

class HybridTranslationSystem {
    constructor() {
        this.currentLanguage = 'ja';
        this.gasApiUrl = 'YOUR_GAS_API_URL'; // Google Apps Script APIのURL（後で設定）
        
        // 翻訳辞書（高品質な固定翻訳）
        this.translations = {
            ja: {
                // システム基本
                'system.title': '建設業評価システム',
                'system.subtitle': 'システムにログインしてください',
                
                // ログイン
                'login.email': 'メールアドレス',
                'login.password': 'パスワード',
                'login.submit': 'ログイン',
                'login.demo': 'デモアカウント',
                'login.welcome': 'さん、おかえりなさい！',
                'login.failed': 'ログインに失敗しました',
                
                // ナビゲーション
                'nav.dashboard': '📊 ダッシュボード',
                'nav.evaluations': '📋 評価一覧',
                'nav.logout': 'ログアウト',
                
                // ダッシュボード
                'dashboard.title': '📊 ダッシュボード',
                'dashboard.total': '総評価数',
                'dashboard.completed': '完了済み',
                'dashboard.average': '平均評価',
                'dashboard.items': '評価項目数',
                'dashboard.recent': '📈 最近の活動',
                
                // 評価
                'evaluation.new': '📝 新規評価作成',
                'evaluation.list': '📋 評価一覧',
                'evaluation.basic': '📋 基本情報',
                'evaluation.ratings': '⭐ 項目別評価',
                'evaluation.chart': '📊 評価チャート（リアルタイム更新）',
                
                // 評価カテゴリ
                'category.safety': '安全性',
                'category.safety_desc': '安全ルールの遵守、危険予知能力',
                'category.quality': '品質',
                'category.quality_desc': '作業品質、仕上がりの精度',
                'category.efficiency': '効率性',
                'category.efficiency_desc': '作業スピード、時間管理',
                'category.teamwork': 'チームワーク',
                'category.teamwork_desc': '協調性、チーム貢献度',
                'category.communication': 'コミュニケーション',
                'category.communication_desc': '報告・連絡・相談',
                
                // フォーム
                'form.period': '評価期間',
                'form.target': '評価対象者',
                'form.save': '💾 評価を保存',
                'form.cancel': 'キャンセル',
                'form.not_entered': '未入力',
                
                // アクション
                'action.back': '← 評価一覧に戻る',
                'action.new': '➕ 新規評価',
                'action.detail': '👁️ 詳細',
                'action.dashboard': '🏠 ダッシュボード',
                
                // テーブル
                'table.id': 'ID',
                'table.target': '評価対象者',
                'table.evaluator': '評価者',
                'table.period': '評価期間',
                'table.rating': '総合評価',
                'table.status': 'ステータス',
                'table.updated': '更新日',
                'table.actions': '操作',
                
                // メッセージ
                'message.saved': '評価を保存しました！',
                'message.loading': '読み込み中...',
                'message.translating': '翻訳中...',
                'message.translation_failed': '翻訳に失敗しました',
                
                // 建設業界専用語句
                'construction.safety_first': '安全第一',
                'construction.work_site': '作業現場',
                'construction.supervisor': '現場監督',
                'construction.worker': '作業員',
                'construction.trainee': '技能実習生',
                'construction.helmet': 'ヘルメット',
                'construction.safety_vest': '安全ベスト',
                'construction.tools': '工具',
                'construction.materials': '資材'
            },
            
            vi: {
                // システム基本
                'system.title': 'Hệ thống Đánh giá Ngành Xây dựng',
                'system.subtitle': 'Vui lòng đăng nhập vào hệ thống',
                
                // ログイン
                'login.email': 'Địa chỉ email',
                'login.password': 'Mật khẩu',
                'login.submit': 'Đăng nhập',
                'login.demo': 'Tài khoản Demo',
                'login.welcome': ', chào mừng bạn trở lại!',
                'login.failed': 'Đăng nhập thất bại',
                
                // ナビゲーション
                'nav.dashboard': '📊 Bảng điều khiển',
                'nav.evaluations': '📋 Danh sách đánh giá',
                'nav.logout': 'Đăng xuất',
                
                // ダッシュボード
                'dashboard.title': '📊 Bảng điều khiển',
                'dashboard.total': 'Tổng số đánh giá',
                'dashboard.completed': 'Đã hoàn thành',
                'dashboard.average': 'Điểm trung bình',
                'dashboard.items': 'Số tiêu chí',
                'dashboard.recent': '📈 Hoạt động gần đây',
                
                // 評価
                'evaluation.new': '📝 Tạo đánh giá mới',
                'evaluation.list': '📋 Danh sách đánh giá',
                'evaluation.basic': '📋 Thông tin cơ bản',
                'evaluation.ratings': '⭐ Đánh giá theo tiêu chí',
                'evaluation.chart': '📊 Biểu đồ đánh giá (Cập nhật thời gian thực)',
                
                // 評価カテゴリ
                'category.safety': 'An toàn',
                'category.safety_desc': 'Tuân thủ quy tắc an toàn, nhận biết nguy hiểm',
                'category.quality': 'Chất lượng',
                'category.quality_desc': 'Chất lượng công việc, độ chính xác',
                'category.efficiency': 'Hiệu quả',
                'category.efficiency_desc': 'Tốc độ làm việc, quản lý thời gian',
                'category.teamwork': 'Làm việc nhóm',
                'category.teamwork_desc': 'Khả năng hợp tác, đóng góp nhóm',
                'category.communication': 'Giao tiếp',
                'category.communication_desc': 'Báo cáo, liên lạc, tham vấn',
                
                // フォーム
                'form.period': 'Kỳ đánh giá',
                'form.target': 'Người được đánh giá',
                'form.save': '💾 Lưu đánh giá',
                'form.cancel': 'Hủy',
                'form.not_entered': 'Chưa nhập',
                
                // アクション
                'action.back': '← Quay lại danh sách',
                'action.new': '➕ Đánh giá mới',
                'action.detail': '👁️ Chi tiết',
                'action.dashboard': '🏠 Bảng điều khiển',
                
                // テーブル
                'table.id': 'ID',
                'table.target': 'Người được đánh giá',
                'table.evaluator': 'Người đánh giá',
                'table.period': 'Kỳ đánh giá',
                'table.rating': 'Điểm tổng thể',
                'table.status': 'Trạng thái',
                'table.updated': 'Ngày cập nhật',
                'table.actions': 'Thao tác',
                
                // メッセージ
                'message.saved': 'Đã lưu đánh giá thành công!',
                'message.loading': 'Đang tải...',
                'message.translating': 'Đang dịch...',
                'message.translation_failed': 'Dịch thuật thất bại',
                
                // 建設業界専用語句
                'construction.safety_first': 'An toàn trên hết',
                'construction.work_site': 'Công trường',
                'construction.supervisor': 'Giám sát công trường',
                'construction.worker': 'Công nhân',
                'construction.trainee': 'Thực tập sinh kỹ năng',
                'construction.helmet': 'Mũ bảo hiểm',
                'construction.safety_vest': 'Áo bảo hộ',
                'construction.tools': 'Dụng cụ',
                'construction.materials': 'Vật liệu'
            },
            
            en: {
                // 将来の英語対応用（基本のみ）
                'system.title': 'Construction Industry Evaluation System',
                'system.subtitle': 'Please log in to the system',
                'login.email': 'Email Address',
                'login.password': 'Password',
                'login.submit': 'Login',
                'nav.dashboard': '📊 Dashboard',
                'nav.evaluations': '📋 Evaluations',
                'category.safety': 'Safety',
                'category.quality': 'Quality',
                'category.efficiency': 'Efficiency',
                'category.teamwork': 'Teamwork',
                'category.communication': 'Communication'
            }
        };
        
        // 翻訳キャッシュ（API結果を保存）
        this.translationCache = new Map();
        
        // 翻訳中フラグ
        this.isTranslating = false;
        
        // 翻訳失敗時のフォールバック
        this.fallbackEnabled = true;
        
        this.init();
    }
    
    init() {
        console.log('🌐 Hybrid Translation System initialized');
        
        // LocalStorageから翻訳キャッシュを復元
        this.loadCacheFromStorage();
        
        // 言語設定を復元
        const savedLanguage = localStorage.getItem('app_language');
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
    }
    
    /**
     * 翻訳キーまたはフリーテキストを翻訳
     * @param {string} key - 翻訳キーまたはテキスト
     * @param {string} fallbackText - フォールバックテキスト
     * @returns {Promise<string>} 翻訳結果
     */
    async translate(key, fallbackText = null) {
        // 1. 辞書翻訳を優先（システム語句）
        if (this.translations[this.currentLanguage] && 
            this.translations[this.currentLanguage][key]) {
            return this.translations[this.currentLanguage][key];
        }
        
        // 2. フリーテキストの場合はAPI翻訳
        const textToTranslate = fallbackText || key;
        
        // 日本語の場合はそのまま返す
        if (this.currentLanguage === 'ja') {
            return textToTranslate;
        }
        
        // 3. キャッシュチェック
        const cacheKey = `${textToTranslate}_${this.currentLanguage}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }
        
        // 4. API翻訳実行
        try {
            const translated = await this.translateWithAPI(textToTranslate);
            this.translationCache.set(cacheKey, translated);
            this.saveCacheToStorage();
            return translated;
        } catch (error) {
            console.warn('Translation API failed:', error);
            return this.fallbackEnabled ? textToTranslate : key;
        }
    }
    
    /**
     * Google Apps Script API翻訳
     * @param {string} text - 翻訳するテキスト
     * @returns {Promise<string>} 翻訳結果
     */
    async translateWithAPI(text) {
        if (!this.gasApiUrl || this.gasApiUrl === 'YOUR_GAS_API_URL') {
            throw new Error('GAS API URL not configured');
        }
        
        const params = new URLSearchParams({
            text: text,
            source: 'ja',
            target: this.currentLanguage
        });
        
        this.isTranslating = true;
        
        try {
            const response = await fetch(`${this.gasApiUrl}?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.code === 200 && data.translated) {
                return data.translated;
            } else {
                throw new Error(data.error || 'Translation failed');
            }
        } finally {
            this.isTranslating = false;
        }
    }
    
    /**
     * 言語設定
     * @param {string} lang - 言語コード
     */
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.warn(`Language '${lang}' not supported`);
            return;
        }
        
        this.currentLanguage = lang;
        localStorage.setItem('app_language', lang);
        
        // ページの翻訳を更新
        this.updatePageTranslations();
        
        console.log(`🌐 Language changed to: ${lang}`);
    }
    
    /**
     * ページ翻訳更新
     */
    async updatePageTranslations() {
        // 1. data-i18n属性の要素を翻訳
        const i18nElements = document.querySelectorAll('[data-i18n]');
        for (const element of i18nElements) {
            const key = element.getAttribute('data-i18n');
            try {
                const translated = await this.translate(key);
                element.textContent = translated;
            } catch (error) {
                console.warn(`Translation failed for key: ${key}`, error);
            }
        }
        
        // 2. 固定要素の翻訳
        await this.updateFixedElements();
        
        // 3. フリーテキスト翻訳
        await this.translateFreeTextElements();
    }
    
    /**
     * 固定要素の翻訳更新
     */
    async updateFixedElements() {
        const elements = {
            'header-title': 'system.title',
            'login-title': 'system.title',
            'login-subtitle': 'system.subtitle',
            'email-label': 'login.email',
            'password-label': 'login.password',
            'login-submit': 'login.submit',
            'demo-title': 'login.demo'
        };
        
        for (const [id, key] of Object.entries(elements)) {
            const element = document.getElementById(id);
            if (element) {
                try {
                    const translated = await this.translate(key);
                    element.textContent = translated;
                } catch (error) {
                    console.warn(`Translation failed for element ${id}:`, error);
                }
            }
        }
    }
    
    /**
     * フリーテキスト要素の翻訳
     */
    async translateFreeTextElements() {
        // data-translate="free"が付いた要素を翻訳
        const freeTextElements = document.querySelectorAll('[data-translate="free"]');
        
        for (const element of freeTextElements) {
            const originalText = element.getAttribute('data-original') || element.textContent;
            
            // 元のテキストを保存
            if (!element.getAttribute('data-original')) {
                element.setAttribute('data-original', originalText);
            }
            
            if (originalText.trim()) {
                try {
                    const translated = await this.translate(null, originalText);
                    element.textContent = translated;
                } catch (error) {
                    console.warn('Free text translation failed:', error);
                }
            }
        }
    }
    
    /**
     * 入力フィールドのリアルタイム翻訳
     * @param {HTMLInputElement} inputElement - 入力要素
     * @returns {Promise<string>} 翻訳結果
     */
    async translateInput(inputElement) {
        const text = inputElement.value.trim();
        if (!text) return '';
        
        try {
            return await this.translate(null, text);
        } catch (error) {
            console.warn('Input translation failed:', error);
            return text;
        }
    }
    
    /**
     * 翻訳キャッシュをLocalStorageに保存
     */
    saveCacheToStorage() {
        try {
            const cacheData = Array.from(this.translationCache.entries());
            localStorage.setItem('translation_cache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to save translation cache:', error);
        }
    }
    
    /**
     * 翻訳キャッシュをLocalStorageから復元
     */
    loadCacheFromStorage() {
        try {
            const cacheData = localStorage.getItem('translation_cache');
            if (cacheData) {
                const entries = JSON.parse(cacheData);
                this.translationCache = new Map(entries);
                console.log(`🗄️ Loaded ${entries.length} cached translations`);
            }
        } catch (error) {
            console.warn('Failed to load translation cache:', error);
            this.translationCache = new Map();
        }
    }
    
    /**
     * 翻訳キャッシュをクリア
     */
    clearCache() {
        this.translationCache.clear();
        localStorage.removeItem('translation_cache');
        console.log('🗑️ Translation cache cleared');
    }
    
    /**
     * Google Apps Script APIのURL設定
     * @param {string} url - GAS API URL
     */
    setGASApiUrl(url) {
        this.gasApiUrl = url;
        console.log('🔗 GAS API URL configured');
    }
    
    /**
     * 翻訳統計情報を取得
     * @returns {Object} 統計情報
     */
    getStats() {
        return {
            currentLanguage: this.currentLanguage,
            cacheSize: this.translationCache.size,
            isTranslating: this.isTranslating,
            supportedLanguages: Object.keys(this.translations),
            dictionarySize: {
                ja: Object.keys(this.translations.ja || {}).length,
                vi: Object.keys(this.translations.vi || {}).length,
                en: Object.keys(this.translations.en || {}).length
            }
        };
    }
    
    /**
     * 翻訳プレビューを表示
     * @param {string} original - 元テキスト
     * @param {string} translated - 翻訳テキスト
     * @param {HTMLElement} targetElement - 表示先要素
     */
    showTranslationPreview(original, translated, targetElement) {
        if (!targetElement) return;
        
        // 既存のプレビューを削除
        const existingPreview = targetElement.parentNode.querySelector('.translation-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // 新しいプレビューを作成
        const preview = document.createElement('div');
        preview.className = 'translation-preview';
        preview.style.cssText = `
            margin-top: 8px;
            padding: 12px;
            background: var(--color-background);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            font-size: var(--font-size-sm);
        `;
        
        preview.innerHTML = `
            <div style="margin-bottom: 4px;">
                <strong>🌐 翻訳結果:</strong>
            </div>
            <div style="color: var(--color-text-secondary); margin-bottom: 4px;">
                元のテキスト: "${original}"
            </div>
            <div style="color: var(--color-primary); font-weight: var(--font-weight-medium);">
                翻訳後: "${translated}"
            </div>
        `;
        
        targetElement.parentNode.insertBefore(preview, targetElement.nextSibling);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (preview.parentNode) {
                preview.remove();
            }
        }, 3000);
    }
}

// 従来のi18nオブジェクトとの互換性を保持
const i18n = {
    currentLanguage: 'ja',
    translator: null,
    
    init() {
        this.translator = new HybridTranslationSystem();
        this.currentLanguage = this.translator.currentLanguage;
        return this.translator;
    },
    
    t(key) {
        if (!this.translator) {
            this.init();
        }
        // 同期的な辞書翻訳のみ（従来互換）
        if (this.translator.translations[this.currentLanguage] && 
            this.translator.translations[this.currentLanguage][key]) {
            return this.translator.translations[this.currentLanguage][key];
        }
        return key;
    },
    
    async translate(key, fallbackText = null) {
        if (!this.translator) {
            this.init();
        }
        return await this.translator.translate(key, fallbackText);
    },
    
    setLanguage(lang) {
        if (!this.translator) {
            this.init();
        }
        this.currentLanguage = lang;
        this.translator.setLanguage(lang);
    },
    
    updatePageTranslations() {
        if (!this.translator) {
            this.init();
        }
        return this.translator.updatePageTranslations();
    }
};

// グローバルに公開
if (typeof window !== 'undefined') {
    window.i18n = i18n;
    window.HybridTranslationSystem = HybridTranslationSystem;
}

console.log('🌐 i18n.js loaded - Hybrid Translation System ready');
