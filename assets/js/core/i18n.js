// assets/js/core/i18n.js の全コード（フェーズ3改修版）
/**
 * i18n.js - 建設業評価システム 多言語対応
 * 外部JSONファイルとリアルタイムAPI翻訳を組み合わせたハイブリッドシステム
 */

class HybridTranslationSystem {
    constructor() {
        this.currentLanguage = localStorage.getItem('app_language') || 'ja';
        this.translations = {}; // 動的に読み込むため、初期状態は空
        this.isLoaded = false;
        this.gasApiUrl = 'YOUR_GAS_API_URL'; // Google Apps Script APIのURL（後で設定）
        this.translationCache = new Map(JSON.parse(localStorage.getItem('translation_cache') || '[]'));
    }

    /**
     * 指定された言語の翻訳ファイルを読み込む
     * @param {string} lang - 言語コード (e.g., 'ja', 'vi', 'en')
     */
    async loadLanguage(lang) {
        if (this.translations[lang]) {
            return; // 既に読み込み済み
        }
        try {
            const response = await fetch(`/locales/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
            this.translations[lang] = await response.json();
        } catch (error) {
            console.error(error);
            this.translations[lang] = {}; // 失敗した場合は空のオブジェクトを設定
        }
    }

    /**
     * システムの初期化。現在の言語の翻訳ファイルを読み込む。
     */
    async init() {
        await this.loadLanguage(this.currentLanguage);
        this.isLoaded = true;
        console.log(`🌐 Translation for '${this.currentLanguage}' loaded.`);
    }

    /**
     * キーまたはフリーテキストを翻訳する
     * @param {string} key - 翻訳キー
     * @param {string} [fallbackText] - キーが見つからない場合のフォールバックテキスト
     * @returns {Promise<string>} 翻訳されたテキスト
     */
    async t(key, fallbackText = key) {
        if (!this.isLoaded) await this.init();

        const langDict = this.translations[this.currentLanguage] || {};
        
        // 1. 辞書翻訳を優先
        if (langDict[key]) {
            return langDict[key];
        }

        // 2. 日本語の場合は、キーが見つからなければフォールバックテキストをそのまま返す
        if (this.currentLanguage === 'ja') {
            return fallbackText;
        }

        // 3. リアルタイム翻訳（キャッシュ優先）
        const textToTranslate = fallbackText;
        const cacheKey = `${textToTranslate}_${this.currentLanguage}`;
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        // 4. API翻訳を実行
        try {
            const translated = await this.translateWithAPI(textToTranslate);
            this.translationCache.set(cacheKey, translated);
            this.saveCacheToStorage();
            return translated;
        } catch (error) {
            console.warn(`Translation API failed for "${textToTranslate}":`, error);
            return textToTranslate; // 失敗した場合は元のテキストを返す
        }
    }

    /**
     * 言語を切り替える
     * @param {string} lang - 新しい言語コード
     */
    async setLanguage(lang) {
        if (lang === this.currentLanguage && this.isLoaded) return;

        this.currentLanguage = lang;
        localStorage.setItem('app_language', lang);
        
        // 新しい言語のファイルを読み込み、UIを更新
        await this.loadLanguage(lang);
        await this.updatePageTranslations();
        
        console.log(`🌐 Language changed to: ${lang}`);
    }

    /**
     * ページ上のdata-i18n属性を持つ要素のテキストを全て更新する
     */
    async updatePageTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        for (const element of elements) {
            const key = element.dataset.i18n;
            const fallback = element.textContent;
            element.textContent = await this.t(key, fallback);
        }
    }

    /**
     * Google Apps Script APIによるリアルタイム翻訳
     * @param {string} text - 翻訳するテキスト
     * @returns {Promise<string>} 翻訳結果
     */
    async translateWithAPI(text) {
        if (!this.gasApiUrl || this.gasApiUrl === 'YOUR_GAS_API_URL') {
            throw new Error('GAS API URL not configured');
        }
        
        const params = new URLSearchParams({ text: text, source: 'ja', target: this.currentLanguage });
        const response = await fetch(`${this.gasApiUrl}?${params}`);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        
        const data = await response.json();
        if (data.code === 200 && data.translated) {
            return data.translated;
        } else {
            throw new Error(data.error || 'Unknown API error');
        }
    }
    
    /**
     * 翻訳キャッシュをLocalStorageに保存する
     */
    saveCacheToStorage() {
        localStorage.setItem('translation_cache', JSON.stringify(Array.from(this.translationCache.entries())));
    }
}

// グローバルインスタンスを生成して初期化
const i18nManager = new HybridTranslationSystem();
window.i18n = i18nManager; // グローバルアクセスポイント

// アプリケーション起動時に初期化を実行
document.addEventListener('DOMContentLoaded', () => {
    i18nManager.init();
});
