// assets/js/pages/goal-setting.js の全コード（ロジック実装版）
/**
 * goal-setting.js - 個人目標設定ページ
 */
let goalSettingState = {
    currentGoalsDoc: null,
    goals: [],
    period: '2025年下期'
};

function renderGoalInputs() {
    const container = document.getElementById('goal-list-container');
    if (!container) return;

    if (goalSettingState.goals.length === 0) {
        container.innerHTML = '<p>「+ 目標を追加」ボタンから目標を設定してください。</p>';
    } else {
        container.innerHTML = goalSettingState.goals.map((goal, index) => `
            <div class="form-section goal-item-row" data-index="${index}" style="display: flex; gap: 1rem; align-items: flex-end;">
                <div class="form-group" style="flex-grow: 1;">
                    <label>定性目標 ${index + 1}</label>
                    <textarea class="form-control goal-text" rows="3" placeholder="具体的な目標を入力">${goal.goalText}</textarea>
                </div>
                <div class="form-group" style="flex: 0 0 120px;">
                    <label>ウェイト (%)</label>
                    <input type="number" class="form-control goal-weight" min="0" max="100" value="${goal.weight}">
                </div>
                <div class="form-group">
                    <button class="btn btn-danger btn-sm btn-remove-goal" data-index="${index}">削除</button>
                </div>
            </div>
        `).join('');
    }
    updateTotalWeight();
}

function updateTotalWeight() {
    const totalWeightEl = document.getElementById('total-weight');
    if (!totalWeightEl) return;
    const total = goalSettingState.goals.reduce((sum, goal) => sum + (goal.weight || 0), 0);
    totalWeightEl.textContent = `${total}%`;
    totalWeightEl.style.color = total === 100 ? 'green' : 'red';
}

function handleGoalDataChange() {
    const goalRows = document.querySelectorAll('.goal-item-row');
    const newGoals = [];
    goalRows.forEach(row => {
        const text = row.querySelector('.goal-text').value;
        const weight = parseInt(row.querySelector('.goal-weight').value, 10) || 0;
        newGoals.push({ goalText: text, weight: weight });
    });
    goalSettingState.goals = newGoals;
    updateTotalWeight();
}

function addGoal() {
    goalSettingState.goals.push({ goalText: '', weight: 0 });
    renderGoalInputs();
}

function removeGoal(index) {
    goalSettingState.goals.splice(index, 1);
    renderGoalInputs();
}

async function handleApplyGoals() {
    handleGoalDataChange();
    const total = goalSettingState.goals.reduce((sum, goal) => sum + (goal.weight || 0), 0);
    if (total !== 100) {
        return showNotification('合計ウェイトが100%になるように調整してください。', 'error');
    }
    if (!confirm('この内容で目標を申請しますか？申請後は編集できなくなります。')) return;

    try {
        const dataToSave = {
            id: goalSettingState.currentGoalsDoc?.id || null,
            period: goalSettingState.period,
            goals: goalSettingState.goals,
            status: 'pending_approval'
        };
        await api.saveQualitativeGoals(dataToSave);
        showNotification('目標を申請しました。管理者の承認をお待ちください。', 'success');
        document.getElementById('btn-apply-goals').disabled = true;
    } catch (error) {
        console.error('Failed to apply goals:', error);
        showNotification('目標の申請に失敗しました。', 'error');
    }
}

async function loadGoalsForPeriod(period) {
    goalSettingState.period = period;
    const currentUser = window.authManager.getCurrentUser();
    try {
        const doc = await api.getQualitativeGoals(currentUser.uid, period);
        goalSettingState.currentGoalsDoc = doc;
        goalSettingState.goals = doc ? doc.goals : [];
        renderGoalInputs();

        const isEditable = !doc || doc.status === 'draft';
        document.querySelectorAll('#goal-list-container input, #goal-list-container textarea, #btn-add-goal, #btn-apply-goals').forEach(el => {
            el.disabled = !isEditable;
        });
        if (!isEditable) {
             showNotification('この期間の目標は申請済みか承認済みのため編集できません。', 'info');
        }
    } catch(error) {
        console.error("Failed to load goals:", error);
    }
}

function setupGoalSettingEventListeners() {
    const container = document.getElementById('main-content');
    
    const handleClick = (e) => {
        if (e.target.id === 'btn-add-goal') addGoal();
        if (e.target.id === 'btn-apply-goals') handleApplyGoals();
        if (e.target.classList.contains('btn-remove-goal')) removeGoal(parseInt(e.target.dataset.index));
    };
    const handleInput = (e) => {
        if (e.target.classList.contains('goal-text') || e.target.classList.contains('goal-weight')) {
            handleGoalDataChange();
        }
    };
    const handlePeriodChange = (e) => {
        if (e.target.id === 'goal-period-select') {
            loadGoalsForPeriod(e.target.value);
        }
    };

    container.removeEventListener('click', handleClick);
    container.removeEventListener('input', handleInput);
    document.getElementById('goal-period-select')?.removeEventListener('change', handlePeriodChange);

    container.addEventListener('click', handleClick);
    container.addEventListener('input', handleInput);
    document.getElementById('goal-period-select')?.addEventListener('change', handlePeriodChange);
}

async function showGoalSettingPage() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '個人目標設定' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">個人目標設定</h1>
                <div>
                    <select id="goal-period-select" class="form-control" style="display: inline-block; width: auto; margin-right: 1rem;">
                        <option value="2025年上期">2025年上期</option>
                        <option value="2025年下期" selected>2025年下期</option>
                    </select>
                    <button id="btn-apply-goals" class="btn btn-primary">承認を申請する</button>
                </div>
            </div>
            <div class="page-content">
                <div class="form-section">
                    <p>今期の定性目標を設定し、合計ウェイトが100%になるようにしてください。</p>
                </div>
                <div id="goal-list-container"><p>読み込み中...</p></div>
                <div style="margin-top: 1rem;">
                    <button id="btn-add-goal" class="btn btn-secondary">+ 目標を追加</button>
                </div>
                <hr style="margin: 2rem 0;">
                <div style="text-align: right; font-size: 1.2rem; font-weight: bold;">
                    合計ウェイト: <span id="total-weight">0%</span>
                </div>
            </div>
        </div>`;
    
    setupGoalSettingEventListeners(); 
    loadGoalsForPeriod(document.getElementById('goal-period-select').value);
}
