/**
 * evaluations.js - 評価関連ページ (Firestore連携版)
 */

async function showEvaluations() {
    app.currentPage = 'evaluations';
    updateBreadcrumbs([
        { label: i18n.t('nav.dashboard'), path: '/dashboard' },
        { label: i18n.t('nav.evaluations'), path: '/evaluations' }
    ]);

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価一覧を読み込み中...</p></div>`;

    try {
        const evaluations = await api.getEvaluations();

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">${i18n.t('evaluation.list')}</h1>
                    <div>
                        <button class="btn btn-primary" onclick="router.navigate('/evaluations/new')">
                            ${i18n.t('action.new')}
                        </button>
                    </div>
                </div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>${i18n.t('table.target')}</th>
                                    <th>${i18n.t('table.evaluator')}</th>
                                    <th>${i18n.t('table.period')}</th>
                                    <th>${i18n.t('table.rating')}</th>
                                    <th>${i18n.t('table.status')}</th>
                                    <th>${i18n.t('table.updated')}</th>
                                    <th>${i18n.t('table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${evaluations.length === 0 ? `<tr><td colspan="7" style="text-align: center;">データがありません</td></tr>` : ''}
                                ${evaluations.map(evaluation => `
                                    <tr>
                                        <td>${evaluation.subordinate || ''}</td>
                                        <td>${evaluation.evaluator || ''}</td>
                                        <td>${evaluation.period || ''}</td>
                                        <td>${evaluation.overallRating || 'N/A'}/5 ⭐</td>
                                        <td>${evaluation.status || ''}</td>
                                        <td>${evaluation.updatedAt ? new Date(evaluation.updatedAt.seconds * 1000).toLocaleDateString() : ''}</td>
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
        console.error("Failed to show evaluations:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価一覧の読み込みに失敗しました。</p></div>`;
    }
}

// 他の関数(showNewEvaluationForm, viewEvaluationなど)は後ほど修正します
