// components/evaluation-form.js の全コード（タブUI版）
/**
 * 評価入力フォームコンポーネント
 */
class EvaluationForm {
    constructor() {
        this.currentEvaluation = null;
        this.isEditing = false;
        this.isDirty = false;
        this.allUsers = [];
        this.allJobTypes = [];
        this.currentStructure = null;
    }

    async openNewEvaluation() {
        const container = document.getElementById('evaluation-form-container');
        if (!container) return;
        container.innerHTML = this.getFormHTML();
        await this.loadInitialData();
        this.bindEvents();
    }

    async loadInitialData() {
        try {
            [this.allUsers, this.allJobTypes] = await Promise.all([
                window.api.getUsers(),
                window.api.getTargetJobTypes()
            ]);
            this.populateSelect('subordinate-select', this.allUsers, 'id', 'name');
            this.populateSelect('job-type-select', this.allJobTypes, 'id', 'name');
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

    bindEvents() {
        const form = document.getElementById('evaluation-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        form.addEventListener('change', e => {
            if (e.target.id === 'job-type-select') {
                this.handleJobTypeChange(e.target.value);
            }
        });

        const tabContainer = document.querySelector('.tab-navigation');
        if(tabContainer) {
            tabContainer.addEventListener('click', e => {
                if (e.target.matches('.tab-item')) {
                    const tabId = e.target.dataset.tab;
                    this.activateTab(tabId);
                }
            });
        }
    }
    
    activateTab(tabId) {
        document.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        
        document.querySelector(`.tab-item[data-tab="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
    }

    async handleJobTypeChange(jobTypeId) {
        this.clearEvaluationSections();
        if (!jobTypeId) return;
        try {
            this.currentStructure = await window.api.getEvaluationStructure(jobTypeId);
            this.buildEvaluationSections();
        } catch (error) {
            console.error('評価構造の読み込みに失敗:', error);
            showNotification('評価構造の読み込みに失敗しました', 'error');
        }
    }

    clearEvaluationSections() {
        const quantitativeContainer = document.getElementById('quantitative-items');
        const qualitativeContainer = document.getElementById('qualitative-items');
        if (quantitativeContainer) quantitativeContainer.innerHTML = '';
        if (qualitativeContainer) qualitativeContainer.innerHTML = '';
    }

    buildEvaluationSections() {
        const quantitativeContainer = document.getElementById('quantitative-items');
        const qualitativeContainer = document.getElementById('qualitative-items');
        if (!quantitativeContainer || !qualitativeContainer) return;
        
        if (!this.currentStructure || !this.currentStructure.categories || this.currentStructure.categories.length === 0) {
            quantitativeContainer.innerHTML = '<p>この職種には評価項目が設定されていません。</p>';
            return;
        }

        const quantitativeHtml = [];
        const qualitativeHtml = [];

        this.currentStructure.categories.forEach((category, catIndex) => {
            (category.items || []).forEach((item, itemIndex) => {
                const itemHtml = `
                    <div class="form-group evaluation-item-row">
                        <label>${category.categoryName} - ${item.itemName}</label>
                        <div class="rating-controls">
                            <input type="number" min="1" max="5" step="0.5" class="rating-input" data-cat-index="${catIndex}" data-item-index="${itemIndex}">
                            <textarea placeholder="コメント..." rows="2" class="comment-input" data-cat-index="${catIndex}" data-item-index="${itemIndex}"></textarea>
                        </div>
                    </div>
                `;
                if (item.itemType === 'quantitative') {
                    quantitativeHtml.push(itemHtml);
                } else {
                    qualitativeHtml.push(itemHtml);
                }
            });
        });

        quantitativeContainer.innerHTML = quantitativeHtml.length ? quantitativeHtml.join('') : '<p>定量的評価の項目はありません。</p>';
        qualitativeContainer.innerHTML = qualitativeHtml.length ? qualitativeHtml.join('') : '<p>定性的評価の項目はありません。</p>';
    }
    
    collectFormData() {
        const form = document.getElementById('evaluation-form');
        const formData = new FormData(form);
        const subordinateId = formData.get('subordinateId');
        const selectedUser = this.allUsers.find(u => u.id === subordinateId);

        const ratings = {};
        form.querySelectorAll('.rating-input').forEach(input => {
            if (input.value) {
                const catIndex = input.dataset.catIndex;
                const itemIndex = input.dataset.itemIndex;
                const key = `cat${catIndex}_item${itemIndex}`;
                ratings[key] = {
                    score: parseFloat(input.value),
                    comment: form.querySelector(`.comment-input[data-cat-index="${catIndex}"][data-item-index="${itemIndex}"]`).value
                };
            }
        });

        const scores = Object.values(ratings).map(r => r.score).filter(s => s);
        const overallRating = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

        return {
            subordinateId: subordinateId,
            subordinateName: selectedUser?.name || '',
            jobTypeId: formData.get('jobTypeId'),
            period: formData.get('evaluationPeriod'),
            ratings: ratings,
            overallRating: parseFloat(overallRating),
            overallComment: formData.get('overallComment'),
        };
    }

    async handleSubmit() {
        const evaluationData = this.collectFormData();
        if (!evaluationData.subordinateId || !evaluationData.jobTypeId || !evaluationData.period) {
            return showNotification('基本情報の必須項目を選択してください。', 'error');
        }
        try {
            await window.api.createEvaluation(evaluationData);
            showNotification('評価を提出しました！', 'success');
            router.navigate('/evaluations');
        } catch (error) {
            console.error('評価の提出に失敗:', error);
            showNotification('評価の提出に失敗しました。', 'error');
        }
    }

    getFormHTML() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 id="form-title">新規評価作成</h1>
                    <div>
                        <button type="button" class="btn-cancel" id="cancel-btn" onclick="router.navigate('/evaluations')">キャンセル</button>
                        <button type="submit" class="btn btn-primary" id="submit-btn" form="evaluation-form">評価を提出</button>
                    </div>
                </div>
                <div class="page-content">
                    <form id="evaluation-form">
                        <div class="form-section">
                            <h3>基本情報</h3>
                            <div class="form-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
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
                                        <option value="2025年下期">2025年下期</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div class="tab-ui">
                            <div class="tab-navigation">
                                <div class="tab-item active" data-tab="quantitative-panel">定量的評価</div>
                                <div class="tab-item" data-tab="qualitative-panel">定性的評価</div>
                            </div>
                            <div class="tab-content">
                                <div id="quantitative-panel" class="tab-panel active">
                                    <div id="quantitative-items"></div>
                                </div>
                                <div id="qualitative-panel" class="tab-panel">
                                    <div id="qualitative-items"></div>
                                </div>
                            </div>
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

window.evaluationForm = new EvaluationForm();
