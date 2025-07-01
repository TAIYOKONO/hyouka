/**
 * dashboard.js - ダッシュボードページ (Firestore連携版)
 */

// ★ 関数を非同期(async)に変更
async function showDashboard() {
    app.currentPage = 'dashboard';
    buildNavigation();
    updateBreadcrumbs([{ label: i18n.t('nav.dashboard') }]);
    
    const mainContent = document.getElementById('main-content');
    // ★ データ読み込み中の表示
    mainContent.innerHTML = `<div class="page-content"><p>読み込み中...</p></div>`;

    try {
        // ★ API経由で評価データを取得
        const evaluations = await api.getEvaluations();
        const evaluationCategories = await api.getEvaluationCategories();

        // ★ 取得したデータから統計情報を計算
        const completedEvaluations = evaluations.filter(e => e.status === 'completed');
        const totalRating = completedEvaluations.reduce((sum, e) => sum + e.overallRating, 0);
        const averageRating = completedEvaluations.length > 0 ? (totalRating / completedEvaluations.length).toFixed(1) : 'N/A';

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">${i18n.t('dashboard.title')}</h1>
                    <button class="btn btn-primary" onclick="router.navigate('/evaluations')">
                        ${i18n.t('nav.evaluations')}
                    </button>
                </div>
                <div class="page-content">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${evaluations.length}</div>
                            <div class="stat-label">${i18n.t('dashboard.total')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${completedEvaluations.length}</div>
                            <div class="stat-label">${i18n.t('dashboard.completed')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${averageRating}</div>
                            <div class="stat-label">${i18n.t('dashboard.average')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${evaluationCategories.length}</div>
                            <div class="stat-label">${i18n.t('dashboard.items')}</div>
                        </div>
                    </div>
                    
                    <h3>${i18n.t('dashboard.recent')}</h3>
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>${i18n.t('table.target')}</th>
                                    <th>${i18n.t('table.evaluator')}</th>
                                    <th>${i18n.t('table.period')}</th>
                                    <th>${i18n.t('table.status')}</th>
                                    <th>${i18n.t('table.updated')}</th>
                                    <th>${i18n.t('table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${evaluations.length === 0 ? `<tr><td colspan="6" style="text-align: center;">データがありません</td></tr>` : ''}
                                ${evaluations.map(evaluation => `
                                    <tr>
                                        <td>${evaluation.subordinate || 'N/A'}</td>
                                        <td>${evaluation.evaluator || 'N/A'}</td>
                                        <td>${evaluation.period || 'N/A'}</td>
                                        <td>${evaluation.status || 'N/A'}</td>
                                        <td>${evaluation.updatedAt ? new Date(evaluation.updatedAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                                        <td>
                                            <button class="btn btn-secondary" onclick="router.navigate('/evaluations/${evaluation.id}')">
                                                ${i18n.t('action.detail')}
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Failed to show dashboard:", error);
        mainContent.innerHTML = `<div class="page-content"><p>ダッシュボードの読み込みに失敗しました。</p></div>`;
    }
}
