// components/evaluation-form.js の全コード（不具合修正・完成版）
/**
 * 評価入力フォームコンポーネント
 */
class EvaluationForm {
    constructor() {
        this.currentEvaluation = null;
        this.mode = 'self'; // 'self' or 'evaluator'
        this.allUsers = [];
        this.allJobTypes = [];
        this.currentStructure = null;
        this.container = document.getElementById('evaluation-form-container');
        this.eventsBound = false; // イベントリスナーが登録済みかどうかのフラグ
        this.bindEventsOnce(); // コンストラクタで一度だけイベントリスナーを登録
    }

    async open(mode = 'self', evaluationId = null) {
        this.mode = mode;
        if (!this.container) return;
        
        if (this.mode === 'evaluator') {
            await this.loadForEvaluator(evaluationId);
        } else {
            this.container.innerHTML = this.getFormHTML();
            await this.loadInitialData();
            this.setFieldsDisabled(false, true); // 自己評価は有効、評価者評価は無効
        }
    }

    bindEventsOnce() {
        if (this.eventsBound || !this.container) return;

        this.container.addEventListener('submit', e => {
            if (e.target.id === 'evaluation-form') {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        this.container.addEventListener('change', e => {
            if (e.target.id === 'job-type-select') {
                this.handleJobTypeChange(e.target.value);
            }
        });

        this.container.addEventListener('click', e => {
            if (e.target.matches('.tab-item')) {
                this.activateTab(e.target.dataset.tab);
            } else if (e.target.id === 'cancel-btn') {
                router.navigate('/evaluations');
            }
        });

        this.eventsBound = true;
    }

    async loadForEvaluator(evaluationId) {
        this.container.innerHTML = `<div class="page-content"><p>評価者モードの読み込み中...</p></div>`;
        // このロジックは今後のステップで実装します
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

    activateTab(tabId) {
        this.container.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        this.container.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        this.container.querySelector(`.tab-item[data-tab="${tabId}"]`).classList.add('active');
        this.container.querySelector(`#${tabId}`).classList.add('active');
    }

    async handleJobTypeChange(jobTypeId) {
        this.clearEvaluationSections();
        if (!jobTypeId) return;
        try {
            this.currentStructure = await window.api.getEvaluationStructure(jobTypeId);
            this.buildEvaluationSections();
            this.setFieldsDisabled(this.mode !== 'self', this.mode !== 'evaluator');
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

        const buildSectionHTML = (items) => {
            if (!items || items.length === 0) return '';
            const groupedByCategory = items.reduce((acc, item) => {
                (acc[item.categoryName] = acc[item.categoryName] || []).push(item);
                return acc;
            }, {});

            return Object.entries(groupedByCategory).map(([categoryName, categoryItems]) => `
                <div class="form-section">
                    <h4>${categoryName}</h4>
                    ${categoryItems.map(item => `
                        <div class="evaluation-item-row-grid">
                            <div class="self-evaluation-col">
                                <h5>${item.itemName}</h5>
                                <div class="form-group"><select class="rating-select self" name="self_rating_${item.itemName}"><option value="">選択</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div>
                                <div class="form-group"><textarea placeholder="自己評価コメント" rows="3" class="comment-input self" name="self_comment_${item.itemName}"></textarea></div>
                            </div>
                            <div class="evaluator-evaluation-col">
                                <h5>${item.itemName}</h5>
                                <div class="form-group"><select class="rating-select evaluator" name="evaluator_rating_${item.itemName}"><option value="">選択</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></div>
                                <div class="form-group"><textarea placeholder="評価者コメント" rows="3" class="comment-input evaluator" name="evaluator_comment_${item.itemName}"></textarea></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        };
        
        const quantitativeItems = (this.currentStructure.categories || []).flatMap(c => (c.items || []).filter(i => i.itemType === 'quantitative').map(i => ({...i, categoryName: c.categoryName})));
        const qualitativeItems = (this.currentStructure.categories || []).flatMap(c => (c.items || []).filter(i => i.itemType === 'qualitative').map(i => ({...i, categoryName: c.categoryName})));

        quantitativeContainer.innerHTML = quantitativeItems.length > 0 ? buildSectionHTML(quantitativeItems) : '<p>定量的評価の項目はありません。</p>';
        qualitativeContainer.innerHTML = qualitativeItems.length > 0 ? buildSectionHTML(qualitativeItems) : '<p>定性的評価の項目はありません。</p>';
    }

    setFieldsDisabled(isSelfDisabled, isEvaluatorDisabled) {
        document.querySelectorAll('.self').forEach(el => el.disabled = isSelfDisabled);
        document.querySelectorAll('.evaluator').forEach(el => el.disabled = isEvaluatorDisabled);
    }
    
    async handleSubmit() {
        // (このロジックは今後のステップで実装します)
        console.log("Submit button clicked");
    }

    getFormHTML() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 id="form-title">評価入力</h1>
                    <button type="submit" class="btn btn-primary" id="submit-btn" form="evaluation-form">評価を提出</button>
                </div>
                <div class="page-content">
                    <form id="evaluation-form">
                        <div class="form-section evaluation-form-header">
                            <div class="evaluation-form-header-info">
                                <span><strong>評価対象者:</strong> <select id="subordinate-select" name="subordinateId" required></select></span>
                                <span><strong>評価期間:</strong> <select id="period-select" name="evaluationPeriod" required><option value="">選択</option><option value="2025年上期">2025年上期</option><option value="2025年下期">2025年下期</option></select></span>
                                <span><strong>役職:</strong> <select id="job-type-select" name="jobTypeId" required></select></span>
                            </div>
                        </div>
                        <div class="tab-ui">
                            <div class="tab-navigation">
                                <div class="tab-item active" data-tab="quantitative-panel">定量的評価</div>
                                <div class="tab-item" data-tab="qualitative-panel">定性的評価</div>
                            </div>
                            <div class="tab-content">
                                <div id="quantitative-panel" class="tab-panel active"><div id="quantitative-items"></div></div>
                                <div id="qualitative-panel" class="tab-panel"><div id="qualitative-items"></div></div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
}
window.evaluationForm = new EvaluationForm();
