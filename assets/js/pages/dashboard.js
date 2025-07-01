/**
 * dashboard.js - ダッシュボードページ (Firestore連携版)
 */
async function showDashboard() {
    app.currentPage = 'dashboard';
    updateBreadcrumbs([{ label: 'ダッシュボード' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>読み込み中...</p></div>`;

    try {
        const evaluations = await api.getEvaluations();
        const evaluationCategories = await api.getEvaluationCategories();

        const completedEvaluations = evaluations.filter(e => e.status === 'completed');
        const totalRating = completedEvaluations.reduce((sum, e) => sum + e.overallRating, 0);
        const averageRating = completedEvaluations.length > 0 ? (totalRating / completedEvaluations.length).toFixed(1) : 'N/A';

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header"><h1 class="page-title">ダッシュボード</h1></div>
                <div class="page-content">
                    <div class="stats-grid">
                        <div class="stat-card"><div class="stat-number">${evaluations.length}</div><div class="stat-label">総評価数</div></div>
                        <div class="stat-card"><div class="stat-number">${completedEvaluations.length}</div><div class="stat-label">完了済み</div></div>
                        <div class="stat-card"><div class="stat-number">${averageRating}</div><div class="stat-label">平均評価</div></div>
                        <div class="stat-card"><div class="stat-number">${evaluationCategories.length}</div><div class="stat-label">評価項目数</div></div>
                    </div>
                    <h3>最近の活動</h3>
                    <div class="table-container">
                        <table class="table">
                            <thead><tr><th>評価対象者</th><th>評価者</th><th>評価期間</th><th>ステータス</th><th>更新日</th><th>操作</th></tr></thead>
                            <tbody>
                                ${evaluations.length === 0 ? `<tr><td colspan="6" style="text-align: center;">データがありません</td></tr>` : ''}
                                ${evaluations.map(e => `
                                    <tr>
                                        <td>${e.subordinate||''}</td><td>${e.evaluator||''}</td><td>${e.period||''}</td>
                                        <td>${e.status||''}</td><td>${e.updatedAt ? new Date(e.updatedAt.seconds * 1000).toLocaleDateString() : ''}</td>
                                        <td><button class="btn btn-secondary" onclick="router.navigate('/evaluations/${e.id}')">詳細</button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error("Failed to show dashboard:", error);
        mainContent.innerHTML = `<div class="page-content"><p>ダッシュボードの読み込みに失敗しました。</p></div>`;
    }
}
