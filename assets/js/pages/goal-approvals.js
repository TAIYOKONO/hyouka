// assets/js/pages/goal-approvals.js の全コード（ロジック実装版）
/**
 * goal-approvals.js - 個人目標の承認ページ
 */
async function showGoalApprovalsPage() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '個人目標の承認' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>承認待ちの目標を読み込み中...</p></div>`;

    try {
        const [pendingGoals, allUsers] = await Promise.all([
            api.getPendingGoals(),
            api.getUsers()
        ]);

        const usersById = allUsers.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {});
        
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
                                        <td>${usersById[goalDoc.userId] || goalDoc.userId}</td>
                                        <td>${goalDoc.period}</td>
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
        
        // ▼▼▼ ここからイベントリスナーを追加 ▼▼▼
        attachGoalApprovalEventListeners();

    } catch (error) {
        console.error("Failed to load pending goals:", error);
        mainContent.innerHTML = `<div class="page-content"><p>読み込みに失敗しました。</p></div>`;
    }
}

function attachGoalApprovalEventListeners() {
    const mainContent = document.getElementById('main-content');

    mainContent.addEventListener('click', async (e) => {
        const target = e.target;

        // 「承認」ボタンの処理
        if (target.classList.contains('btn-approve-goal')) {
            const docId = target.dataset.id;
            if (confirm('この目標申請を承認しますか？')) {
                try {
                    await api.updateQualitativeGoalStatus(docId, 'approved');
                    showNotification('目標を承認しました', 'success');
                    showGoalApprovalsPage(); // 承認後にリストを再読み込み
                } catch (error) {
                    console.error("Failed to approve goal:", error);
                    showNotification('承認処理に失敗しました', 'error');
                }
            }
        }

        // 「内容確認」ボタンの処理（今後のステップで実装）
        if (target.classList.contains('btn-view-goal')) {
            const docId = target.dataset.id;
            // TODO: 目標の詳細をモーダルで表示する機能
            alert(`ID: ${docId} の目標内容を確認するモーダルをここに実装します。`);
        }
    });
}
