// assets/js/pages/goal-approvals.js (新規作成)
/**
 * goal-approvals.js - 個人目標の承認ページ
 */
async function showGoalApprovalsPage() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '個人目標の承認' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>承認待ちの目標を読み込み中...</p></div>`;

    try {
        const pendingGoals = await api.getPendingGoals();
        
        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header"><h1 class="page-title">個人目標の承認</h1></div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>申請者</th>
                                    <th>評価期間</th>
                                    <th>申請日</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendingGoals.length === 0 ? `<tr><td colspan="4" style="text-align: center;">承認待ちの目標はありません。</td></tr>` : ''}
                                ${pendingGoals.map(goalDoc => `
                                    <tr>
                                        <td>${goalDoc.userId}</td> <td>${goalDoc.period}</td>
                                        <td>${new Date(goalDoc.updatedAt.seconds * 1000).toLocaleDateString()}</td>
                                        <td>
                                            <button class="btn btn-secondary btn-sm btn-view-goal" data-id="${goalDoc.id}">内容確認</button>
                                            <button class="btn btn-success btn-sm btn-approve-goal" data-id="${goalDoc.id}">承認</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

    } catch (error) {
        console.error("Failed to load pending goals:", error);
        mainContent.innerHTML = `<div class="page-content"><p>読み込みに失敗しました。</p></div>`;
    }
}
