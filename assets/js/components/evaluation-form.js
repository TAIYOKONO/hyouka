// components/evaluation-form.js の全コード（自己評価保存ロジック実装版）
/**
 * 評価入力フォームコンポーネント
 */
class EvaluationForm {
    constructor() {
        this.mode = 'self';
        this.allUsers = [];
        this.allJobTypes = [];
        this.currentStructure = null;
        this.container = document.getElementById('evaluation-form-container');
        this.bindEventsOnce();
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
        this.eventsBound = true;
    }

    async loadForEvaluator(evaluationId) {
        this.container.innerHTML = `<div class="page-content"><p>評価者モードの読み込み中...</p></div>`;
        // このロジックは次のステップで実装します
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

    async handleJobTypeChange(jobTypeId) {
        this.clearEvaluationSections();
        if (!jobTypeId) return;
        try {
            this.currentStructure = await window.api.getEvaluationStructure(jobTypeId);
            this.buildEvaluationSections();
            this.setFieldsDisabled(this.mode !== 'self', this.mode !== 'evaluator');
        } catch (error) {
            console.error('評価構造の読み込みに失敗:', error);
        }
    }

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
        
        const allItems = (this.currentStructure.categories || []).flatMap(c => (c.items || []).map(i => ({...i, categoryName: c.categoryName})));
        container.innerHTML = allItems.length > 0 ? buildSectionHTML(allItems) : '<p>評価項目がありません。</p>';
    }

    setFieldsDisabled(isSelfDisabled, isEvaluatorDisabled) {
        document.querySelectorAll('.self').forEach(el => el.disabled = isSelfDisabled);
        document.querySelectorAll('.evaluator').forEach(el => el.disabled = isEvaluatorDisabled);
    }
    
    collectFormData() {
        const form = document.getElementById('evaluation-form');
        const formData = new FormData(form);
        const subordinateId = formData.get('subordinateId');
        const selectedUser = this.allUsers.find(u => u.id === subordinateId);

        const selfRatings = {};
        if (this.currentStructure && this.currentStructure.categories) {
            this.currentStructure.categories.forEach(category => {
                (category.items || []).forEach(item => {
                    const score = form.querySelector(`select[name="self_rating_${item.itemName}"]`)?.value;
                    const comment = form.querySelector(`textarea[name="self_comment_${item.itemName}"]`)?.value;
                    if (score) {
                        selfRatings[`${category.categoryName}_${item.itemName}`] = {
                            score: parseFloat(score),
                            comment: comment || ''
                        };
                    }
                });
            });
        }
        
        return {
            subordinateId: subordinateId,
            subordinateName: selectedUser?.name || '',
            jobTypeId: formData.get('jobTypeId'),
            period: formData.get('evaluationPeriod'),
            selfRatings: selfRatings,
            evaluatorRatings: {}, // 評価者評価はまだ空
            selfOverallComment: formData.get('overallComment'),
            evaluatorOverallComment: '',
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
                        <div id="evaluation-items-container"></div>
                        <div class="form-section">
                            <h3>総合コメント</h3>
                            <div class="form-group"><textarea id="overall-comment" name="overallComment" rows="4" class="self" placeholder
