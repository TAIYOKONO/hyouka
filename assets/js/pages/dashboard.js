/**
 * dashboard.js - ダッシュボードページ
 */

function showDashboard() {
    app.currentPage = 'dashboard';
    
    // ログインページを完全に隠す
    const loginPage = document.querySelector('.login-page');
    if (loginPage) {
        loginPage.style.display = 'none';
    }
    
    // ヘッダーとブレッドクラムを表示
    document.getElementById('app-header').style.display = 'block';
    document.getElementById('breadcrumbs').style.display = 'block';
    
    // ボディクラス更新
    document.body.classList.remove('login-mode');
    document.body.classList.add('authenticated');
    
    buildNavigation();
    updateBreadcrumbs([{ label: i18n.t('nav.dashboard') }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">${i18n.t('dashboard.title')}</h1>
                <button class="btn btn-primary" onclick="showEvaluations()">
                    ${i18n.t('nav.evaluations')}
                </button>
            </div>
            <div class="page-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${mockData.evaluations.length}</div>
                        <div class="stat-label">${i18n.t('dashboard.total')}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">1</div>
                        <div class="stat-label">${i18n.t('dashboard.completed')}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">4.5</div>
                        <div class="stat-label">${i18n.t('dashboard.average')}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">5</div>
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
                            ${mockData.evaluations.map(evaluation => `
                                <tr>
                                    <td>${evaluation.subordinate}</td>
                                    <td>${evaluation.evaluator}</td>
                                    <td>${evaluation.period}</td>
                                    <td>完了</td>
                                    <td>${evaluation.updatedAt}</td>
                                    <td>
                                        <button class="btn btn-secondary" onclick="viewEvaluation('${evaluation.id}')">
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
}
