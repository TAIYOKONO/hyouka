/**
 * evaluations.js - 評価関連ページ
 */

function showEvaluations() {
    app.currentPage = 'evaluations';
    updateBreadcrumbs([
        { label: i18n.t('nav.dashboard'), path: '/dashboard' },
        { label: i18n.t('nav.evaluations'), path: '/evaluations' }
    ]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">${i18n.t('evaluation.list')}</h1>
                <div>
                    <button class="btn btn-secondary" onclick="showDashboard()">
                        ${i18n.t('action.dashboard')}
                    </button>
                    <button class="btn btn-primary" onclick="showNewEvaluationForm()">
                        ${i18n.t('action.new')}
                    </button>
                </div>
            </div>
            <div class="page-content">
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>${i18n.t('table.id')}</th>
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
                            ${mockData.evaluations.map(evaluation => `
                                <tr>
                                    <td>${evaluation.id}</td>
                                    <td>${evaluation.subordinate}</td>
                                    <td>${evaluation.evaluator}</td>
                                    <td>${evaluation.period}</td>
                                    <td>${evaluation.overallRating}/5 ⭐</td>
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

function showNewEvaluationForm() {
    app.currentPage = 'new-evaluation';
    updateBreadcrumbs([
        { label: i18n.t('nav.dashboard'), path: '/dashboard' },
        { label: i18n.t('nav.evaluations'), path: '/evaluations' },
        { label: i18n.t('evaluation.new'), path: '/evaluations/new' }
    ]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">${i18n.t('evaluation.new')}</h1>
                <button class="btn btn-secondary" onclick="showEvaluations()">
                    ${i18n.t('action.back')}
                </button>
            </div>
            <div class="page-content">
                <form class="evaluation-form" id="new-evaluation-form">
                    <div class="form-section">
                        <h3>${i18n.t('evaluation.basic')}</h3>
                        <div class="form-group">
                            <label for="evaluation-period">${i18n.t('form.period')}</label>
                            <select id="evaluation-period" required>
                                <option value="">評価期間を選択</option>
                                <option value="2025-Q1">2025年第1四半期</option>
                                <option value="2025-Q2">2025年第2四半期</option>
                                <option value="2025-Q3">2025年第3四半期</option>
                                <option value="2025-Q4">2025年第4四半期</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="subordinate-select">${i18n.t('form.target')}</label>
                            <select id="subordinate-select" required>
                                <option value="">対象者を選択</option>
                                <option value="山田 太郎">山田 太郎 (作業員)</option>
                                <option value="佐藤 次郎">佐藤 次郎 (作業員)</option>
                                <option value="鈴木 三郎">鈴木 三郎 (作業員)</option>
                                <option value="田中 四郎">田中 四郎 (作業員)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3>${i18n.t('evaluation.ratings')}</h3>
                        <div class="rating-input-group">
                            ${mockData.evaluationCategories.map((category, index) => `
                                <div class="rating-input-item">
                                    <div class="rating-input-label">
                                        <strong>${getCategoryName(index)}</strong>
                                        <small>${getCategoryDesc(index)}</small>
                                    </div>
                                    <div class="rating-input-controls">
                                        <input 
                                            type="number" 
                                            class="rating-input" 
                                            id="rating-${category.id}"
                                            min="1" 
                                            max="5" 
                                            step="0.1"
                                            placeholder="1-5"
                                            onchange="updateRatingDisplay('${category.id}')"
                                            oninput="updateRatingDisplay('${category.id}')"
                                        >
                                        <div class="rating-display" id="display-${category.id}">${i18n.t('form.not_entered')}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <div class="evaluation-chart" style="margin-top: 24px;">
                            <h4 style="text-align: center; margin-bottom: 20px; color: #1976d2;">${i18n.t('evaluation.chart')}</h4>
                            <div class="chart-container">
                                <div id="evaluation-radar-chart" class="pentagon-chart"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h3>📝 総合評価</h3>
                        <div class="form-group">
                            <label for="overall-comment">総合コメント</label>
                            <textarea id="overall-comment" placeholder="総合的な評価コメントを入力してください" rows="4"></textarea>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 32px;">
                        <button type="button" class="btn btn-secondary" onclick="showEvaluations()" style="margin-right: 12px;">
                            ${i18n.t('form.cancel')}
                        </button>
                        <button type="submit" class="btn btn-success">
                            ${i18n.t('form.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('new-evaluation-form').addEventListener('submit', handleSaveEvaluation);
    initializeRadarChart();
}

function viewEvaluation(id) {
    const evaluation = mockData.evaluations.find(e => e.id === id);
    if (!evaluation) {
        showNotification('評価が見つかりません', 'error');
        return;
    }
    
    updateBreadcrumbs([
        { label: i18n.t('nav.dashboard'), path: '/dashboard' },
        { label: i18n.t('nav.evaluations'), path: '/evaluations' },
        { label: '評価詳細', path: `/evaluations/${id}` }
    ]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">👁️ 評価詳細</h1>
                <button class="btn btn-secondary" onclick="showEvaluations()">
                    ${i18n.t('action.back')}
                </button>
            </div>
            <div class="page-content">
                <div class="evaluation-summary">
                    <div class="evaluation-details">
                        <h3 style="color: #1976d2; margin-bottom: 16px;">${i18n.t('evaluation.basic')}</h3>
                        <div class="detail-row">
                            <span class="detail-label">${i18n.t('table.period')}:</span>
                            <span class="detail-value">${evaluation.period}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">${i18n.t('table.target')}:</span>
                            <span class="detail-value">${evaluation.subordinate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">${i18n.t('table.evaluator')}:</span>
                            <span class="detail-value">${evaluation.evaluator}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">${i18n.t('table.rating')}:</span>
                            <span class="detail-value">${evaluation.overallRating}/5 ⭐</span>
                        </div>
                    </div>
                    
                    <div class="evaluation-chart">
                        <h4 style="text-align: center; margin-bottom: 20px; color: #1976d2;">📊 評価チャート</h4>
                        <div class="chart-container">
                            <div id="detail-radar-chart" class="pentagon-chart"></div>
                        </div>
                    </div>
                </div>
                
                ${evaluation.overallComment ? `
                    <div class="form-section">
                        <h3>📝 総合評価</h3>
                        <div class="form-group">
                            <label><strong>総合コメント</strong></label>
                            <div style="padding:12px;background:#f8f9fa;border-radius:4px;">${evaluation.overallComment}</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    setTimeout(() => {
        initializeDetailRadarChart(evaluation);
    }, 200);
}

function initializeDetailRadarChart(evaluation) {
    const data = mockData.evaluationCategories.map(category => evaluation.ratings[category.id] || 0);
    try {
        window.detailPentagonChart = new PentagonChart('detail-radar-chart', mockData.evaluationCategories, data);
    } catch (error) {
        console.error('Error creating detail pentagon chart:', error);
    }
}
