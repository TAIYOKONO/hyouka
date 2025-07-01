/**
 * 評価入力フォームコンポーネント
 * 建設業界の評価項目に特化したフォーム管理
 */
class EvaluationForm {
    constructor() {
        this.currentEvaluation = null;
        this.isEditing = false;
        this.isDirty = false;
        this.validationErrors = {};
        this.autoSaveTimer = null;
        
        this.initializeForm();
        this.bindEvents();
    }

    initializeForm() {
        this.createFormStructure();
        this.setupAutoSave();
    }

    createFormStructure() {
        const container = document.getElementById('evaluation-form-container');
        if (!container) return;

        container.innerHTML = `
            <div class="evaluation-form-wrapper">
                <div class="form-header">
                    <h2 id="form-title">新規評価</h2>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" id="draft-save-btn">
                            下書き保存
                        </button>
                        <button type="button" class="btn-primary" id="submit-btn">
                            評価を提出
                        </button>
                        <button type="button" class="btn-cancel" id="cancel-btn">
                            キャンセル
                        </button>
                    </div>
                </div>

                <form id="evaluation-form" class="evaluation-form">
                    <!-- 基本情報 -->
                    <div class="form-section">
                        <h3>評価対象者情報</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="subordinate-select">評価対象者 <span class="required">*</span></label>
                                <select id="subordinate-select" name="subordinateId" required>
                                    <option value="">選択してください</option>
                                </select>
                                <div class="error-message" id="subordinate-error"></div>
                            </div>
                            <div class="form-group">
                                <label for="period-select">評価期間 <span class="required">*</span></label>
                                <select id="period-select" name="evaluationPeriod" required>
                                    <option value="">選択してください</option>
                                </select>
                                <div class="error-message" id="period-error"></div>
                            </div>
                        </div>
                    </div>

                    <!-- 定量評価 -->
                    <div class="form-section">
                        <h3>定量評価</h3>
                        <div class="quantitative-section" id="quantitative-evaluations">
                            <!-- 動的に生成 -->
                        </div>
                    </div>

                    <!-- 定性評価 -->
                    <div class="form-section">
                        <h3>定性評価</h3>
                        <div class="qualitative-section" id="qualitative-evaluations">
                            <!-- 動的に生成 -->
                        </div>
                    </div>

                    <!-- 総合評価 -->
                    <div class="form-section">
                        <h3>総合評価</h3>
                        <div class="form-group">
                            <label for="overall-rating">総合評価 <span class="required">*</span></label>
                            <div class="rating-input">
                                <div class="rating-buttons" id="overall-rating">
                                    ${[1,2,3,4,5].map(value => `
                                        <button type="button" class="rating-btn" data-value="${value}">
                                            ${value}
                                        </button>
                                    `).join('')}
                                </div>
                                <input type="hidden" name="overallRating" id="overall-rating-value">
                            </div>
                            <div class="error-message" id="overall-rating-error"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="overall-comment">総合コメント</label>
                            <textarea 
                                id="overall-comment" 
                                name="overallComment" 
                                rows="4" 
                                placeholder="総合的な評価コメントを入力してください"
                            ></textarea>
                        </div>
                    </div>

                    <!-- 改善提案 -->
                    <div class="form-section">
                        <h3>改善提案・指導内容</h3>
                        <div class="form-group">
                            <label for="improvement-suggestions">改善提案</label>
                            <textarea 
                                id="improvement-suggestions" 
                                name="improvementSuggestions" 
                                rows="3"
                                placeholder="具体的な改善提案を記入してください"
                            ></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="guidance-content">指導内容</label>
                            <textarea 
                                id="guidance-content" 
                                name="guidanceContent" 
                                rows="3"
                                placeholder="実施した指導内容を記入してください"
                            ></textarea>
                        </div>
                    </div>

                    <!-- 次回目標 -->
                    <div class="form-section">
                        <h3>次回評価に向けた目標設定</h3>
                        <div class="form-group">
                            <label for="next-goals">目標設定</label>
                            <textarea 
                                id="next-goals" 
                                name="nextGoals" 
                                rows="3"
                                placeholder="次回評価期間での目標を設定してください"
                            ></textarea>
                        </div>
                    </div>
                </form>

                <!-- 保存状況表示 -->
                <div class="save-status" id="save-status">
                    <span class="save-indicator">自動保存済み</span>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // フォーム送信
        const form = document.getElementById('evaluation-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }

        // ボタンイベント
        document.addEventListener('click', (e) => {
            if (e.target.id === 'submit-btn') {
                this.handleSubmit();
            } else if (e.target.id === 'draft-save-btn') {
                this.saveDraft();
            } else if (e.target.id === 'cancel-btn') {
                this.handleCancel();
            } else if (e.target.classList.contains('rating-btn')) {
                this.handleRatingClick(e.target);
            }
        });

        // フォーム変更監視
        document.addEventListener('input', (e) => {
            if (e.target.closest('#evaluation-form')) {
                this.markAsDirty();
                this.clearError(e.target.name);
            }
        });

        // 選択変更
        document.addEventListener('change', (e) => {
            if (e.target.id === 'subordinate-select') {
                this.handleSubordinateChange(e.target.value);
            } else if (e.target.id === 'period-select') {
                this.handlePeriodChange(e.target.value);
            }
        });

        // ページ離脱警告
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = '未保存の変更があります。ページを離れますか？';
            }
        });
    }

    async loadFormData() {
        try {
            // 評価対象者一覧を読み込み
            const subordinates = await window.api.getSubordinates();
            this.populateSubordinateSelect(subordinates);

            // 評価期間一覧を読み込み
            const periods = await window.api.getEvaluationPeriods();
            this.populatePeriodSelect(periods);

        } catch (error) {
            console.error('フォームデータの読み込みに失敗:', error);
            window.notification.show('フォームデータの読み込みに失敗しました', 'error');
        }
    }

    populateSubordinateSelect(subordinates) {
        const select = document.getElementById('subordinate-select');
        if (!select) return;

        select.innerHTML = '<option value="">選択してください</option>';
        subordinates.forEach(subordinate => {
            const option = document.createElement('option');
            option.value = subordinate.id;
            option.textContent = `${subordinate.name} (${subordinate.position})`;
            select.appendChild(option);
        });
    }

    populatePeriodSelect(periods) {
        const select = document.getElementById('period-select');
        if (!select) return;

        select.innerHTML = '<option value="">選択してください</option>';
        periods.forEach(period => {
            const option = document.createElement('option');
            option.value = period.id;
            option.textContent = `${period.name} (${period.startDate} 〜 ${period.endDate})`;
            select.appendChild(option);
        });
    }

    async handleSubordinateChange(subordinateId) {
        if (!subordinateId) {
            this.clearEvaluationSections();
            return;
        }

        try {
            // 評価項目を読み込み
            const categories = await window.api.getEvaluationCategories();
            this.buildEvaluationSections(categories);

            // 既存の評価があるかチェック
            const periodId = document.getElementById('period-select').value;
            if (periodId) {
                await this.checkExistingEvaluation(subordinateId, periodId);
            }

        } catch (error) {
            console.error('評価項目の読み込みに失敗:', error);
            window.notification.show('評価項目の読み込みに失敗しました', 'error');
        }
    }

    async handlePeriodChange(periodId) {
        const subordinateId = document.getElementById('subordinate-select').value;
        if (subordinateId && periodId) {
            await this.checkExistingEvaluation(subordinateId, periodId);
        }
    }

    async checkExistingEvaluation(subordinateId, periodId) {
        try {
            const existingEvaluation = await window.api.getEvaluation(subordinateId, periodId);
            if (existingEvaluation) {
                this.loadExistingEvaluation(existingEvaluation);
                this.isEditing = true;
                document.getElementById('form-title').textContent = '評価編集';
            }
        } catch (error) {
            // 既存評価がない場合は新規作成
            this.isEditing = false;
            document.getElementById('form-title').textContent = '新規評価';
        }
    }

    buildEvaluationSections(categories) {
        const quantitativeContainer = document.getElementById('quantitative-evaluations');
        const qualitativeContainer = document.getElementById('qualitative-evaluations');

        if (!quantitativeContainer || !qualitativeContainer) return;

        // 定量評価セクション
        const quantitativeCategories = categories.filter(cat => cat.type === 'quantitative');
        quantitativeContainer.innerHTML = quantitativeCategories.map(category => `
            <div class="evaluation-category">
                <h4>${category.name}</h4>
                ${category.items.map(item => `
                    <div class="evaluation-item">
                        <label class="item-label">${item.name}</label>
                        <div class="rating-input">
                            <div class="rating-buttons" data-name="quantitative_${item.id}">
                                ${[1,2,3,4,5].map(value => `
                                    <button type="button" class="rating-btn" data-value="${value}">
                                        ${value}
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" name="quantitative_${item.id}" class="rating-value">
                        </div>
                        <textarea 
                            name="quantitative_comment_${item.id}" 
                            placeholder="コメント（任意）" 
                            rows="2"
                            class="item-comment"
                        ></textarea>
                    </div>
                `).join('')}
            </div>
        `).join('');

        // 定性評価セクション
        const qualitativeCategories = categories.filter(cat => cat.type === 'qualitative');
        qualitativeContainer.innerHTML = qualitativeCategories.map(category => `
            <div class="evaluation-category">
                <h4>${category.name}</h4>
                ${category.items.map(item => `
                    <div class="evaluation-item">
                        <label class="item-label">${item.name}</label>
                        <div class="rating-input">
                            <div class="rating-buttons" data-name="qualitative_${item.id}">
                                ${[1,2,3,4,5].map(value => `
                                    <button type="button" class="rating-btn" data-value="${value}">
                                        ${value}
                                    </button>
                                `).join('')}
                            </div>
                            <input type="hidden" name="qualitative_${item.id}" class="rating-value">
                        </div>
                        <textarea 
                            name="qualitative_comment_${item.id}" 
                            placeholder="具体的な評価理由を記入してください" 
                            rows="3"
                            class="item-comment"
                            required
                        ></textarea>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    clearEvaluationSections() {
        const quantitativeContainer = document.getElementById('quantitative-evaluations');
        const qualitativeContainer = document.getElementById('qualitative-evaluations');
        
        if (quantitativeContainer) quantitativeContainer.innerHTML = '';
        if (qualitativeContainer) qualitativeContainer.innerHTML = '';
    }

    handleRatingClick(button) {
        const value = parseInt(button.dataset.value);
        const container = button.closest('.rating-buttons');
        const hiddenInput = container.parentNode.querySelector('.rating-value');
        
        // 既存の選択をクリア
        container.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // 新しい選択を設定
        button.classList.add('selected');
        hiddenInput.value = value;
        
        this.markAsDirty();
    }

    loadExistingEvaluation(evaluation) {
        // 基本情報
        document.getElementById('subordinate-select').value = evaluation.subordinateId;
        document.getElementById('period-select').value = evaluation.evaluationPeriod;
        
        // 評価データ
        Object.keys(evaluation.ratings || {}).forEach(key => {
            const hiddenInput = document.querySelector(`input[name="${key}"]`);
            if (hiddenInput) {
                hiddenInput.value = evaluation.ratings[key];
                const container = hiddenInput.closest('.rating-input').querySelector('.rating-buttons');
                const button = container.querySelector(`[data-value="${evaluation.ratings[key]}"]`);
                if (button) button.classList.add('selected');
            }
        });

        // コメント
        Object.keys(evaluation.comments || {}).forEach(key => {
            const textarea = document.querySelector(`textarea[name="${key}"]`);
            if (textarea) textarea.value = evaluation.comments[key];
        });

        // 総合評価
        if (evaluation.overallRating) {
            document.getElementById('overall-rating-value').value = evaluation.overallRating;
            const overallButton = document.querySelector(`#overall-rating [data-value="${evaluation.overallRating}"]`);
            if (overallButton) overallButton.classList.add('selected');
        }

        // その他のフィールド
        const fields = ['overallComment', 'improvementSuggestions', 'guidanceContent', 'nextGoals'];
        fields.forEach(field => {
            const element = document.getElementById(field.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (element && evaluation[field]) {
                element.value = evaluation[field];
            }
        });

        this.currentEvaluation = evaluation;
        this.isDirty = false;
    }

    validateForm() {
        this.validationErrors = {};
        const form = document.getElementById('evaluation-form');
        if (!form) return false;

        const formData = new FormData(form);

        // 必須フィールドのチェック
        if (!formData.get('subordinateId')) {
            this.addError('subordinate', '評価対象者を選択してください');
        }

        if (!formData.get('evaluationPeriod')) {
            this.addError('period', '評価期間を選択してください');
        }

        if (!formData.get('overallRating')) {
            this.addError('overall-rating', '総合評価を選択してください');
        }

        // 定性評価のコメント必須チェック
        const qualitativeComments = document.querySelectorAll('textarea[name*="qualitative_comment_"]');
        qualitativeComments.forEach(textarea => {
            if (!textarea.value.trim()) {
                const itemId = textarea.name.replace('qualitative_comment_', '');
                this.addError(`qualitative_comment_${itemId}`, 'コメントは必須です');
            }
        });

        return Object.keys(this.validationErrors).length === 0;
    }

    addError(field, message) {
        this.validationErrors[field] = message;
        const errorElement = document.getElementById(`${field}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearError(field) {
        if (this.validationErrors[field]) {
            delete this.validationErrors[field];
            const errorElement = document.getElementById(`${field}-error`);
            if (errorElement) {
                errorElement.textContent = '';
                errorElement.style.display = 'none';
            }
        }
    }

    clearAllErrors() {
        Object.keys(this.validationErrors).forEach(field => {
            this.clearError(field);
        });
        this.validationErrors = {};
    }

    async handleSubmit() {
        this.clearAllErrors();
        
        if (!this.validateForm()) {
            window.notification.show('入力内容を確認してください', 'error');
            return;
        }

        const formData = this.collectFormData();
        
        try {
            let result;
            if (this.isEditing) {
                result = await window.api.updateEvaluation(this.currentEvaluation.id, formData);
                window.notification.show('評価を更新しました', 'success');
            } else {
                result = await window.api.createEvaluation(formData);
                window.notification.show('評価を提出しました', 'success');
            }

            this.isDirty = false;
            
            // 評価一覧ページに戻る
            if (window.router) {
                window.router.navigate('/evaluations');
            }

        } catch (error) {
            console.error('評価の保存に失敗:', error);
            window.notification.show('評価の保存に失敗しました', 'error');
        }
    }

    async saveDraft() {
        if (!this.isDirty) {
            window.notification.show('変更がありません', 'info');
            return;
        }

        const formData = this.collectFormData();
        formData.status = 'draft';

        try {
            if (this.isEditing) {
                await window.api.updateEvaluation(this.currentEvaluation.id, formData);
            } else {
                const result = await window.api.createEvaluation(formData);
                this.currentEvaluation = result;
                this.isEditing = true;
            }

            this.isDirty = false;
            this.updateSaveStatus('下書き保存しました');
            window.notification.show('下書きを保存しました', 'success');

        } catch (error) {
            console.error('下書きの保存に失敗:', error);
            window.notification.show('下書きの保存に失敗しました', 'error');
        }
    }

    collectFormData() {
        const form = document.getElementById('evaluation-form');
        const formData = new FormData(form);
        
        const data = {
            subordinateId: formData.get('subordinateId'),
            evaluationPeriod: formData.get('evaluationPeriod'),
            overallRating: parseInt(formData.get('overallRating')),
            overallComment: formData.get('overallComment'),
            improvementSuggestions: formData.get('improvementSuggestions'),
            guidanceContent: formData.get('guidanceContent'),
            nextGoals: formData.get('nextGoals'),
            ratings: {},
            comments: {},
            evaluatedAt: new Date().toISOString(),
            evaluatorId: window.auth.getCurrentUser()?.id
        };

        // 評価値とコメントを収集
        form.querySelectorAll('input[type="hidden"].rating-value').forEach(input => {
            if (input.value) {
                data.ratings[input.name] = parseInt(input.value);
            }
        });

        form.querySelectorAll('textarea.item-comment').forEach(textarea => {
            if (textarea.value.trim()) {
                data.comments[textarea.name] = textarea.value.trim();
            }
        });

        return data;
    }

    handleCancel() {
        if (this.isDirty) {
            if (!confirm('未保存の変更があります。破棄しますか？')) {
                return;
            }
        }

        if (window.router) {
            window.router.navigate('/evaluations');
        }
    }

    markAsDirty() {
        this.isDirty = true;
        this.scheduleAutoSave();
    }

    setupAutoSave() {
        // 自動保存は5分間隔
        this.autoSaveInterval = setInterval(() => {
            if (this.isDirty && this.isEditing) {
                this.autoSave();
            }
        }, 5 * 60 * 1000);
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        // 30秒後に自動保存
        this.autoSaveTimer = setTimeout(() => {
            if (this.isDirty && this.isEditing) {
                this.autoSave();
            }
        }, 30000);
    }

    async autoSave() {
        if (!this.isEditing || !this.isDirty) return;

        try {
            const formData = this.collectFormData();
            formData.status = 'draft';
            
            await window.api.updateEvaluation(this.currentEvaluation.id, formData);
            this.isDirty = false;
            this.updateSaveStatus('自動保存済み');

        } catch (error) {
            console.error('自動保存に失敗:', error);
            this.updateSaveStatus('自動保存失敗', 'error');
        }
    }

    updateSaveStatus(message, type = 'success') {
        const statusElement = document.getElementById('save-status');
        if (statusElement) {
            const indicator = statusElement.querySelector('.save-indicator');
            if (indicator) {
                indicator.textContent = message;
                indicator.className = `save-indicator ${type}`;
                
                // 3秒後に非表示
                setTimeout(() => {
                    if (type === 'success') {
                        indicator.textContent = '';
                    }
                }, 3000);
            }
        }
    }

    // 新規評価フォームを開く
    async openNewEvaluation(subordinateId = null, periodId = null) {
        await this.loadFormData();
        
        if (subordinateId) {
            document.getElementById('subordinate-select').value = subordinateId;
            await this.handleSubordinateChange(subordinateId);
        }
        
        if (periodId) {
            document.getElementById('period-select').value = periodId;
            await this.handlePeriodChange(periodId);
        }

        this.isEditing = false;
        this.isDirty = false;
        document.getElementById('form-title').textContent = '新規評価';
    }

    // 既存評価の編集を開く
    async openEditEvaluation(evaluationId) {
        try {
            await this.loadFormData();
            const evaluation = await window.api.getEvaluationById(evaluationId);
            
            if (evaluation) {
                this.loadExistingEvaluation(evaluation);
                this.isEditing = true;
                document.getElementById('form-title').textContent = '評価編集';
            }

        } catch (error) {
            console.error('評価の読み込みに失敗:', error);
            window.notification.show('評価の読み込みに失敗しました', 'error');
        }
    }

    destroy() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
    }
}

// グローバルインスタンス
window.evaluationForm = new EvaluationForm();
