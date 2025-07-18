// assets/js/pages/goal-approvals.js の全コード（診断コード版）
/**
 * goal-approvals.js - 個人目標の承認ページ
 */

let goalApprovalsState = {
    pendingGoals: [],
    usersById: {}
};

function handleGoalApprovalsClick(e) {
    const target = e.target;
    // ===== 診断ログ【2】=====
    console.log('診断【2】: クリックイベントが発生しました。ターゲット:', target);

    if (target.matches('.btn-view-goal')) {
        openGoalDetailModal(target.dataset.id);
    } else if (target.matches('#btn-approve-goal')) {
        handleApprovalAction(target.dataset.id, 'approved');
    } else if (target.matches('#btn-reject-goal')) {
        handleApprovalAction(target.dataset.id, 'draft');
    } else if (target.matches('#btn-close-goal-modal') || target.matches('#goal-detail-modal')) {
        closeGoalDetailModal();
    }
}

async function showGoalApprovalsPage() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '個人目標の承認' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page"><div class="page-content"><p>承認待ちの目標を読み込み中...</p></div></div>`;
    
    mainContent.removeEventListener('click', handleGoalApprovalsClick);

    try {
        const [pendingGoals, allUsers] = await Promise.all([
            api.getPendingGoals(),
            api.getUsers()
        ]);

        goalApprovalsState.pendingGoals = pendingGoals;
        goalApprovalsState.usersById = allUsers.reduce((acc, user) => {
            acc[user.id] = user.name;
            return acc;
        }, {});
        
        // ===== 診断ログ【1】=====
        console.log('診断【1】: APIからデータを取得し、stateに保存しました。現在のstate:', JSON.parse(JSON.stringify(goalApprovalsState)));
        
        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header"><h1 class="page-title">個人目標の承認</h1></div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead><tr><th>申請者</th><th>評価期間</th><th>申請日</th><th>操作</th></tr></thead>
                            <tbody>${renderGoalApprovalRows()}</tbody>
                        </table>
                    </div>
                </div>
            </div>
            ${renderGoalDetailModal()}
        `;
        
        mainContent.addEventListener('click', handleGoalApprovalsClick);

    } catch (error) {
        console.error("Failed to load pending goals:", error);
        mainContent.innerHTML = `<div class="page-content"><p>読み込みに失敗しました。</p></div>`;
    }
}

function renderGoalApprovalRows() {
    if (goalApprovalsState.pendingGoals.length === 0) {
        return `<tr><td colspan="4" style="text-align: center;">承認待ちの目標はありません。</td></tr>`;
    }
    return goalApprovalsState.pendingGoals.map(goalDoc => `
        <tr>
            <td>${goalApprovalsState.usersById[goalDoc.userId] || '不明なユーザー'}</td>
            <td>${goalDoc.period}</td>
            <td>${new Date(goalDoc.updatedAt.seconds * 1000).toLocaleDateString()}</td>
            <td><button class="btn btn-secondary btn-sm btn-view-goal" data-id="${goalDoc.id}">内容確認</button></td>
        </tr>
    `).join('');
}

function renderGoalDetailModal() {
    return `<div id="goal-detail-modal" class="modal"><div class="modal-content" style="max-width: 700px;"><div class="modal-header"><h3 class="modal-title" id="goal-modal-title">目標内容の確認</h3><button class="modal-close" id="btn-close-goal-modal">&times;</button></div><div class="modal-body" id="goal-modal-body"></div><div class="modal-footer" id="goal-modal-footer" style="display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid #ddd;"></div></div></div>`;
}

function openGoalDetailModal(docId) {
    // ===== 診断ログ【3】=====
    console.log(`診断【3】: openGoalDetailModalが呼び出されました。探すID: "${docId}"`);
    console.log('診断【3.1】: findを実行する直前のstate:', JSON.parse(JSON.stringify(goalApprovalsState)));
    
    const goalDoc = goalApprovalsState.pendingGoals.find(g => g.id === docId);
    
    if (!goalDoc) {
        // ===== 診断ログ【4】=====
        console.error('診断【4】: findの検索に失敗しました。goalDocは未定義です。');
        showNotification('対象の目標データが見つかりませんでした。', 'error');
        return;
    }

    console.log('診断: findの検索に成功しました。見つかったデータ:', goalDoc);

    const modal = document.getElementById('goal-detail-modal');
    const modalBody = document.getElementById('goal-modal-body');
    const modalFooter = document.getElementById('goal-modal-footer');
    const applicantName = goalApprovalsState.usersById[goalDoc.userId] || '不明なユーザー';
    
    modalBody.innerHTML = `<div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem;"><div><strong>申請者:</strong> ${applicantName}</div><div><strong>評価期間:</strong> ${goalDoc.period}</div></div><h4>申請された目標</h4><ul style="list-style: none; padding: 0;">${goalDoc.goals.map(goal => `<li style="background: #f9f9f9; border:
