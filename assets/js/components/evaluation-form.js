// components/evaluation-form.js の全コード（新UI・新フロー対応版）
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
        this.container = null;
        this.eventsBound = false;
    }

    async open(mode = 'self', evaluationId = null) {
        this.mode = mode;
        this.container = document.getElementById('evaluation-form-container');
        if (!this.container) return;

        this.bindEventsOnce();
        
        if (this.mode === 'evaluator') {
            await this.loadForEvaluator(evaluationId);
        } else {
            await this.loadForSelf();
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

    async loadForSelf() {
        this.container.innerHTML = this.getFormHTML();
        await this.loadInitialData();
        this.setFieldsDisabled(false, true);
    }
    
    async loadForEvaluator(evaluationId) {
        this.container.innerHTML = `<div class="page-content"><p>評価者モードの読み込み中...</p></div>`;
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
        if (!quantitativeContainer || !qual
