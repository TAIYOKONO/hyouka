// evaluations.js の全コード（フォーム統合版）
/**
 * evaluations.js - 評価関連ページ
 */
async function showEvaluations() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '評価一覧' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価一覧を読み込み中...</p></div>`;

    try {
        const evaluations = await api.getEvaluations();
        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">評価一覧</h1>
                    <div><button id="btn-new-evaluation" class="btn btn-primary">新規評価</button></div>
                </div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead><tr><th>評価対象者</th><th>評価者</th><th>評価期間</th><th>総合評価</th><th>ステータス</th><th>更新日</th><th>操作</th></tr></thead>
                            <tbody>
                                ${evaluations.length === 0 ? `<tr><td colspan="7" style="text-align: center;">データがありません</td></tr>` : ''}
                                ${evaluations.map(e => `
                                    <tr>
                                        <td>${e.subordinateName || ''}</td><td>${e.evaluatorName || ''}</td><td>${e.period || ''}</td><td>${e.overallRating || 'N/A'}/5 ⭐</td>
                                        <td>${e.status || ''}</td><td>${e.updatedAt ? new Date(e.updatedAt.seconds * 1000).toLocaleDateString() : ''}</td>
                                        <td><button class="btn btn-secondary btn-view-detail" data-id="${e.id}">詳細</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;

        document.getElementById('btn-new-evaluation')?.addEventListener('click', () => router.navigate('/evaluations/new'));
        document.querySelectorAll('.btn-view-detail').forEach(button => {
            button.addEventListener('click', (e) => router.navigate(`/evaluations/${e.currentTarget.dataset.id}`));
        });

    } catch (error) {
        console.error("Failed to show evaluations:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価一覧の読み込みに失敗しました。</p></div>`;
    }
}

// ▼▼▼ この関数を全面的に書き換えます ▼▼▼
async function showNewEvaluationForm() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '評価一覧', path: '#/evaluations' }, { label: '新規評価作成' }]);
    
    const mainContent = document.getElementById('main-content');
    // コンポーネントを配置するためのコンテナだけを用意
    mainContent.innerHTML = `<div id="evaluation-form-container"></div>`;

    // 高機能なフォームコンポーネントを呼び出す
    if (window.evaluationForm) {
        window.evaluationForm.openNewEvaluation();
    }
}

async function viewEvaluation(id) {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '評価一覧', path: '#/evaluations' }, { label: '評価詳細' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価詳細を読み込み中...</p></div>`;

    try {
        const evaluation = await api.getEvaluationById(id);
        if (!evaluation) throw new Error("評価データが見つかりません。");
        
        // 評価構造を取得して、項目名などを表示できるようにする（今後の
