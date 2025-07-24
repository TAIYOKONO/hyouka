/**
 * i18n.js - 建設業評価システム 多言語対応
 * 外部JSONファイルとリアルタイムAPI翻訳を組み合わせたハイブリッドシステム
 */
class HybridTranslationSystem {
    constructor() {
        this.currentLanguage = localStorage.getItem('app_language') || 'ja';
        this.translations = {};
        this.isLoaded = false;
        this.gasApiUrl = 'YOUR_GAS_API_URL';
        this.translationCache = new Map(JSON.parse(localStorage.getItem('translation_cache') || '[]'));
    }

    async loadLanguage(lang) {
        if (this.translations[lang]) return;
        try {
            // [修正点] パスを相対パスに変更し、ベースURLを考慮
            const response = await fetch(`locales/${lang}.json`);
            if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
            this.translations[lang] = await response.json();
        } catch (error) {
            console.error(error);
            this.translations[lang] = {};
        }
    }

    async init() {
        await this.loadLanguage(this.currentLanguage);
        this.isLoaded = true;
        console.log(`🌐 Translation for '${this.currentLanguage}' loaded.`);
    }

    async t(key, fallbackText = key) {
        if (!this.isLoaded) await this.init();
        const langDict = this.translations[this.currentLanguage] || {};
        if (langDict[key]) return langDict[key];
        if (this.currentLanguage === 'ja') return fallbackText;

        const textToTranslate = fallbackText;
        const cacheKey = `${textToTranslate}_${this.currentLanguage}`;
        if (this.translationCache.has(cacheKey)) return this.translationCache.get(cacheKey);

        try {
            const translated = await this.translateWithAPI(textToTranslate);
            this.translationCache.set(cacheKey, translated);
            this.saveCacheToStorage();
            return translated;
        } catch (error) {
            console.warn(`Translation API failed for "${textToTranslate}":`, error);
            return textToTranslate;
        }
    }

    async setLanguage(lang) {
        if (lang === this.currentLanguage && this.isLoaded) return;
        this.currentLanguage = lang;
        localStorage.setItem('app_language', lang);
        await this.loadLanguage(lang);
        await this.updatePageTranslations();
        console.log(`🌐 Language changed to: ${lang}`);
    }

    async updatePageTranslations() {
        const elements = document.querySelectorAll('[data-i18n]');
        for (const element of elements) {
            const key = element.dataset.i18n;
            const fallback = element.textContent;
            element.textContent = await this.t(key, fallback);
        }
    }

    async translateWithAPI(text) {
        if (!this.gasApiUrl || this.gasApiUrl === 'YOUR_GAS_API_URL') throw new Error('GAS API URL not configured');
        const params = new URLSearchParams({ text, source: 'ja', target: this.currentLanguage });
        const response = await fetch(`${this.gasApiUrl}?${params}`);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const data = await response.json();
        if (data.code === 200 && data.translated) return data.translated;
        throw new Error(data.error || 'Unknown API error');
    }

    saveCacheToStorage() {
        localStorage.setItem('translation_cache', JSON.stringify(Array.from(this.translationCache.entries())));
    }
}

const i18nManager = new HybridTranslationSystem();
window.i18n = i18nManager;

document.addEventListener('DOMContentLoaded', () => i18nManager.init());
