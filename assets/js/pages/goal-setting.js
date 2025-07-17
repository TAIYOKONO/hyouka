// assets/js/pages/goal-setting.js (新規作成)
/**
 * goal-setting.js - 個人目標設定ページ
 */
async function showGoalSettingPage() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '個人目標設定' }]);
    
    const mainContent = document.getElementById('main-content');

    // UIの骨格を描画
    mainContent.innerHTML = `maincontent.innerhtml = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">個人目標設定</h1>
                <div>
                    <select id="goal-period-select" class="form-control" style="display: inline-block; width: auto; margin-right: 1rem;">
                        <option value="2025年上期">2025年上期</option>
                        <option value="2025年下期">2025年下期</option>
                    </select>
                    <button id="btn-apply-goals" class="btn btn-primary">承認を申請する</button>
                </div>
            </div>
            <div class="page-content">
                <div class="form-section">
                    <p>今期の定性目標を設定し、合計ウェイトが100%になるようにしてください。</p>
                </div>
                <div id="goal-list-container">
                    </div>
                <div style="margin-top: 1rem;">
                    <button id="btn-add-goal" class="btn btn-secondary">+ 目標を追加</button>
                </div>
                <hr style="margin: 2rem 0;">
                <div style="text-align: right; font-size: 1.2rem; font-weight: bold;">
                    合計ウェイト: <span id="total-weight">0%</span>
                </div>
            </div>
        </div>
    `;

    // 今後のステップでロジックを実装します
    // setupGoalSettingEventListeners(); 
}
