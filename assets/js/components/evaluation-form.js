// assets/js/components/evaluation-form.js の全コード（フェーズ2改修完了版）
/**
 * 評価入力フォームコンポーネント
 */
class EvaluationForm {
    constructor() {
        this.currentEvaluation = null;
        this.mode = 'self'; // 'self' or 'evaluator'
        this.allUsers = [];
        this.allJobTypes = [];
        this.currentStructure = null; // 定量的評価の構造
        this.personalGoals = null;    // 定性的評価（個人目標）のデータ
        this.container = document.getElementById('evaluation-form-container');

        // イベントリスナーが複数登録されるのを防ぐフラグ
        this.eventsBound = false;
        // 初回ロード時に一度だけイベントリスナーを登録
        this.bindEventsOnce();
    }

    /**
     * フォームを開き、初期化する
     * @param {string} mode - 'self' (自己評価) または 'evaluator' (他者評価)
     * @param {string|null} evaluationId - 評価ドキュメントID (編集・評価者モード時)
     */
    async open(mode = 'self', evaluationId = null) {
        this.mode = mode;
        if (!this.container) return;
        
        // 既存のコンテンツをクリア
        this.container.innerHTML = this.getFormHTML();

        // 評価者モードの場合は、既存の評価データを読み込む
        if (this.mode === 'evaluator' && evaluationId) {
            // TODO: 評価者モードのデータ読み込み処理を実装
            await this.loadForEvaluator(evaluationId);
        } else {
            // 自己評価モードの初期データ読み込み
            await this.loadInitialData();
            // 入力欄の有効/無効を設定 (自己評価は有効、評価者評価は無効)
            this.setFieldsDisabled(false, true);
        }
    }

    /**
     * イベントリスナーを一度だけコンテナに登録する
     */
    bindEventsOnce() {
        if (this.eventsBound || !this.container) return;

        // フォーム全体の送信イベント
        this.container.addEventListener('submit', e => {
            if (e.target.id === 'evaluation-form') {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        // フォーム内の変更イベント（イベント委譲）
        this.container.addEventListener('change', async (e) => {
            // 職種が変更された場合
            if (e.target.id === 'job-type-select') {
                await this.handleJobTypeChange(e.target.value);
            }
            // 評価対象者または期間が変更された場合
            if (e.target.id === 'subordinate-select' || e.target.id === 'period-select') {
                await this.handleGoalSourceChange();
            }
        });

        // フォーム内のクリックイベント（イベント委譲）
        this.container.addEventListener('click', e => {
            // タブの切り替え
            if (e.target.matches('.tab-item')) {
                this.activateTab(e.target.dataset.tab);
            }
            // キャンセルボタン
            if (e.target.id === 'cancel-btn') {
                router.navigate('/evaluations');
            }
        });

        this.eventsBound = true;
    }

    /**
     * 自己評価モードで必要な初期データをAPIから取得し、セレクトボックスを生成
     */
    async loadInitialData() {
        try {
            [this.allUsers, this.allJobTypes] = await Promise.all([
                api.getUsers(),
                api.getTargetJobTypes()
            ]);
            this.populateSelect('subordinate-select', this.allUsers, 'uid', 'name'); // FirestoreのUIDを値に
            this.populateSelect('job-type-select', this.allJobTypes, 'id', 'name');
        } catch (error) {
            console.error('フォームデータの読み込みに失敗:', error);
            showNotification('フォームデータの読み込みに失敗しました', 'error');
        }
    }

    /**
     * 評価者モードで既存の評価データを読み込む（今回はスタブ）
     * @param {string} evaluationId
     */
    async loadForEvaluator(evaluationId) {
        this.container.querySelector('.page-content').innerHTML = `<p>評価者モードの読み込み中...</p>`;
        // 将来的にこの部分で評価データを読み込み、フォームを再構築する
    }
    
    /**
     * 職種が変更された際の処理
     * @param {string} jobTypeId - 選択された職種のID
     */
    async handleJobTypeChange(jobTypeId) {
        this.clearEvaluationSection('quantitative-items');
        if (!jobTypeId) return;
        try {
            this.currentStructure = await api.getEvaluationStructure(jobTypeId);
            this.buildQuantitativeSection(); // 定量的評価セクションのみを再構築
            this.setFieldsDisabled(this.mode !== 'self', this.mode !== 'evaluator');
        } catch (error) {
            console.error('評価構造の読み込みに失敗:', error);
            showNotification('評価構造の読み込みに失敗しました', 'error');
        }
    }

    /**
     * 評価対象者または評価期間が変更された際の処理
     */
    async handleGoalSourceChange() {
        this.clearEvaluationSection('qualitative-items');
        const userId = this.container.querySelector('#subordinate-select').value;
        const period = this.container.querySelector('#period-select').value;
        if (!userId || !period) return;

        try {
            this.personalGoals = await api.getQualitativeGoals(userId, period);
            this.buildQualitativeSection(); // 定性的評価セクションのみを再構築
            this.setFieldsDisabled(this.mode !== 'self', this.mode !== 'evaluator');
        } catch (error) {
            console.error('個人目標の読み込みに失敗:', error);
            showNotification('承認済みの個人目標の読み込みに失敗しました', 'error');
        }
    }

    /**
     * 指定されたセクションの内容をクリアする
     * @param {string} elementId - クリアするコンテナのID
     */
    clearEvaluationSection(elementId) {
        const container = document.getElementById(elementId);
        if (container) container.innerHTML = '';
    }

    /**
     * 定量的評価のセクションをHTMLで構築する
     */
    buildQuantitativeSection() {
        const container = document.getElementById('quantitative-items');
        if (!container) return;
        
        if (!this.currentStructure || !this.currentStructure.categories || this.currentStructure.categories.length === 0) {
            container.innerHTML = '<p>この職種には評価項目が設定されていません。</p>';
            return;
        }

        const items = (this.currentStructure.categories || []).flatMap(c => 
            (c.items || []).filter(i => i.itemType === 'quantitative').map(i => ({...i, categoryName: c.categoryName}))
        );
        
        container.innerHTML = items.length > 0 
            ? this.buildSectionHTML(items, false)
            : '<p>定量的評価の項目はありません。</p>';
    }

    /**
     * 定性的評価（個人目標）のセクションをHTMLで構築する
     */
    buildQualitativeSection() {
        const container = document.getElementById('qualitative-items');
        if (!container) return;

        if (!this.personalGoals || this.personalGoals.status !== 'approved' || !this.personalGoals.goals || this.personalGoals.goals.length === 0) {
            container.innerHTML = '<p>選択された対象者と期間に、承認済みの個人目標が設定されていません。</p>';
            return;
        }

        // 個人目標を評価項目の形式に変換してHTMLを生成
        const items = this.personalGoals.goals.map((goal, index) => ({
            itemName: goal.goalText,
            categoryName: `個人目標 ${index + 1} (ウェイト: ${goal.weight}%)`
        }));

        container.innerHTML = this.buildSectionHTML(items, true);
    }
    
    /**
     * 評価項目のHTMLを生成する共通関数
     * @param {Array} items - 評価項目の配列
     * @param {boolean} isGoal - 個人目標かどうかのフラグ
     * @returns {string} HTML文字列
     */
    buildSectionHTML(items, isGoal = false) {
        const groupedByCategory = items.reduce((acc, item) => {
            (acc[item.categoryName] = acc[item.categoryName] || []).push(item);
            return acc;
        }, {});

        return Object.entries(groupedByCategory).map(([categoryName, categoryItems]) => `
            <div class="form-section">
                <h4>${categoryName}</h4>
                ${categoryItems.map(item => `
                    <div class="evaluation-item-row-grid" data-item-name="${item.itemName}" data-item-type="${isGoal ? 'goal' : 'quantitative'}">
                        <div class="self-evaluation-col">
                            <h5>${item.itemName}</h5>
                            <div class="form-group">
                                <label>スコア (1-5)</label>
                                <select class="rating-select self">
                                    <option value="">選択</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>コメント</label>
                                <textarea placeholder="自己評価コメント" rows="3" class="comment-input self"></textarea>
                            </div>
                        </div>
                        <div class="evaluator-evaluation-col">
                            <h5>${item.itemName}</h5>
                            <div class="form-group">
                                <label>スコア (1-5)</label>
                                <select class="rating-select evaluator">
                                    <option value="">選択</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>コメント</label>
                                <textarea placeholder="評価者コメント" rows="3" class="comment-input evaluator"></textarea>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    /**
     * フォームの入力欄の有効/無効を切り替える
     * @param {boolean} isSelfDisabled - 自己評価欄を無効にするか
     * @param {boolean} isEvaluatorDisabled - 評価者評価欄を無効にするか
     */
    setFieldsDisabled(isSelfDisabled, isEvaluatorDisabled) {
        this.container.querySelectorAll('.self').forEach(el => el.disabled = isSelfDisabled);
        this.container.querySelectorAll('.evaluator').forEach(el => el.disabled = isEvaluatorDisabled);
    }
    
    /**
     * 評価提出処理
     */
    async handleSubmit() {
        const form = this.container.querySelector('#evaluation-form');
        const subordinateId = form.elements.subordinateId.value;
        const subordinateName = form.elements.subordinateId.options[form.elements.subordinateId.selectedIndex].text;
        const period = form.elements.period.value;
        const jobTypeId = form.elements.jobTypeId.value;

        if (!subordinateId || !period || !jobTypeId) {
            return showNotification('評価対象者、評価期間、役職は必須です。', 'error');
        }

        const ratings = {};
        let isValid = true;
        // 定量的・定性的の両方の評価項目を収集
        form.querySelectorAll('.evaluation-item-row-grid').forEach(row => {
            const itemName = row.dataset.itemName;
            const selfScore = parseInt(row.querySelector('.self.rating-select').value, 10);
            
            if (!selfScore) isValid = false; // 自己評価スコアは必須

            ratings[itemName] = {
                self: {
                    score: selfScore,
                    comment: row.querySelector('.self.comment-input').value,
                },
                evaluator: { // 現状は空で提出
                    score: null,
                    comment: ''
                }
            };
        });

        if (!isValid) {
            return showNotification('すべての評価項目で自己評価スコアを入力してください。', 'error');
        }

        const evaluationData = {
            subordinateId,
            subordinateName,
            period,
            jobTypeId,
            evaluatorId: null, // 評価者評価時に設定
            evaluatorName: null,
            status: 'self_assessed', // 自己評価完了ステータス
            ratings: ratings,
        };

        try {
            await api.createEvaluation(evaluationData);
            showNotification('評価を提出しました。評価者の評価をお待ちください。', 'success');
            router.navigate('/evaluations');
        } catch (error) {
            console.error("評価の提出に失敗:", error);
            showNotification(`評価の提出に失敗しました: ${error.message}`, 'error');
        }
    }

    /**
     * セレクトボックスの選択肢をデータから生成する
     * @param {string} elementId - セレクトボックスのID
     * @param {Array} data - 選択肢の元になるデータ配列
     * @param {string} valueField - value属性に使用するフィールド名
     * @param {string} labelField - 表示テキストに使用するフィールド名
     */
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

    /**
     * タブをアクティブにする
     * @param {string} tabId - アクティブにするタブパネルのID
     */
    activateTab(tabId) {
        this.container.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
        this.container.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        this.container.querySelector(`.tab-item[data-tab="${tabId}"]`).classList.add('active');
        this.container.querySelector(`#${tabId}`).classList.add('active');
    }

    /**
     * フォームの基本HTML構造を取得する
     * @returns {string} HTML文字列
     */
    getFormHTML() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 id="form-title">評価入力</h1>
                    <div>
                        <button type="button" class="btn" id="cancel-btn">キャンセル</button>
                        <button type="submit" class="btn btn-primary" id="submit-btn" form="evaluation-form">評価を提出</button>
                    </div>
                </div>
                <div class="page-content">
                    <form id="evaluation-form" onsubmit="return false;">
                        <div class="form-section evaluation-form-header">
                            <div class="evaluation-form-header-info">
                                <div class="form-group">
                                    <label><strong>評価対象者</strong></label>
                                    <select id="subordinate-select" name="subordinateId" class="form-control" required></select>
                                </div>
                                <div class="form-group">
                                    <label><strong>評価期間</strong></label>
                                    <select id="period-select" name="period" class="form-control" required>
                                        <option value="">選択</option>
                                        <option value="2025年上期">2025年上期</option>
                                        <option value="2025年下期">2025年下期</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label><strong>役職</strong></label>
                                    <select id="job-type-select" name="jobTypeId" class="form-control" required></select>
                                </div>
                            </div>
                        </div>
                        <div class="tab-ui">
                            <div class="tab-navigation">
                                <div class="tab-item active" data-tab="quantitative-panel">定量的評価</div>
                                <div class="tab-item" data-tab="qualitative-panel">定性的評価 (個人目標)</div>
                            </div>
                            <div class="tab-content">
                                <div id="quantitative-panel" class="tab-panel active">
                                    <div id="quantitative-items"><p>役職を選択してください。</p></div>
                                </div>
                                <div id="qualitative-panel" class="tab-panel">
                                    <div id="qualitative-items"><p>評価対象者と評価期間を選択してください。</p></div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }
}
window.evaluationForm = new EvaluationForm();
