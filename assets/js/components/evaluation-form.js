// components/evaluation-form.js の全コード（新データ構造対応版）
/**
 * 評価入力フォームコンポーネント
 */
class EvaluationForm {
    constructor() {
        this.currentEvaluation = null;
        this.isEditing = false;
        this.isDirty = false;
        this.validationErrors = {};
        this.allUsers = [];
        this.allJobTypes = [];
        this.currentStructure = null;
    }

    // --- メインの呼び出し関数 ---
    async openNewEvaluation() {
        // フォームの骨格を描画
        const container = document.getElementById('evaluation-form-container');
        if (!container) return;
        container.innerHTML = this.getFormHTML();
        
        // 必要なデータを読み込み
        await this.loadInitialData();
        
        // イベントリスナーを設定
        this.bindEvents();
    }

    // --- データ読み込み ---
    async loadInitialData() {
        try {
            [this.allUsers, this.allJobTypes] = await Promise.all([
                window.api.getUsers(),
                window.api.getTargetJobTypes()
            ]);
            this.populateSelect('subordinate-select', this.allUsers, 'id', 'name');
            this.populateSelect('job-type-select', this.allJobTypes, 'id', 'name');
            // TODO: 評価期間も動的に読み込む
        } catch (error) {
            console.error('フォームデータの読み込みに失敗:', error);
            showNotification('フォームデータの読み込みに失敗しました', 'error');
        }
    }

    populateSelect(elementId, data, valueField, labelField) {
        const select = document.getElementById(elementId);
        if (!select) return;
        select.innerHTML = '<option value="">選択してください</option>';
        data.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[labelField];
            select.appendChild(option);
        });
    }

    // --- イベントリスナー ---
    bindEvents() {
        const form = document.getElementById('evaluation-form');
        if (!form) return;
        
        // 変更を検知
        form.addEventListener('change', e => {
            if (e.target.id === 'job-type-select') {
                this.handleJobTypeChange(e.target.value);
            }
        });

        // 保存ボタンなど（今後のステップで実装）
    }

    async handleJobTypeChange(jobTypeId) {
        if (!jobTypeId) {
            this.clearEvaluationSections();
            return;
        }
        try {
            this.currentStructure = await window.api.getEvaluationStructure(jobTypeId);
            this.buildEvaluationSections();
        } catch (error) {
            console.error('評価構造の読み込みに失敗:', error);
            showNotification('評価構造の読み込みに失敗しました', 'error');
        }
    }

    // --- フォーム描画 ---
    clearEvaluationSections() {
        const container = document.getElementById('evaluation-items-container');
        if (container) container.innerHTML = '';
    }

    buildEvaluationSections() {
        const container = document.getElementById('evaluation-items-container');
        if (!container) return;
        
        if (!this.currentStructure || !this.currentStructure.categories || this.currentStructure.categories.length === 0) {
            container.innerHTML = '<p>この職種には評価項目が設定されていません。</p>';
            return;
        }

        container.innerHTML = this.currentStructure.categories.map(category => `
            <div class="form-section">
                <h3>${category.categoryName}</h3>
                ${(category.items || []).map(item => `
                    <div class="form-group evaluation-item-row">
                        <label>${item.itemName}</label>
                        <div class="rating-controls">
                            <input type="number" min="1" max="5" step="0.5" class="rating-input">
                            <textarea placeholder="コメント..." rows="2" class="comment-input"></textarea>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    getFormHTML() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 id="form-title">新規評価作成</h1>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="draft-save-btn">下書き保存</button>
                        <button type="submit" class="btn-primary" id="submit-btn">評価を提出</button>
                        <button type="button" class="btn-cancel" id="cancel-btn" onclick="router.navigate('/evaluations')">キャンセル</button>
                    </div>
                </div>
                <div class="page-content">
                    <form id="evaluation-form">
                        <div class="form-section">
                            <h3>基本情報</h3>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="subordinate-select">評価対象者 <span class="required">*</span></label>
                                    <select id="subordinate-select" name="subordinateId" required></select>
                                </div>
                                <div class="form-group">
                                    <label for="job-type-select">対象職種 <span class="required">*</span></label>
                                    <select id="job-type-select" name="jobTypeId" required></select>
                                </div>
                                <div class="form-group">
                                    <label for="period-select">評価期間 <span class="required">*</span></label>
                                    <select id="period-select" name="evaluationPeriod" required>
                                        <option value="">選択してください</option>
                                        <option value="2025年上期">2025年上期</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div id="evaluation-items-container">
                            </div>

                        <div class="form-section">
                            <h3>総合コメント</h3>
                            <div class="form-group">
                                <textarea id="overall-comment" name="overallComment" rows="4" placeholder="総合的な評価コメントを入力してください"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
}

// グローバルインスタンスを作成
window.evaluationForm = new EvaluationForm();
