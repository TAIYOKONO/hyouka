/**
 * evaluations.js - 評価関連ページ (Firestore連携版)
 */

async function showEvaluations() {
    app.currentPage = 'evaluations';
    updateBreadcrumbs([
        { label: 'ダッシュボード', path: '/dashboard' },
        { label: '評価一覧', path: '/evaluations' }
    ]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価一覧を読み込み中...</p></div>`;

    try {
        const evaluations = await api.getEvaluations();

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">評価一覧</h1>
                    <div>
                        <button class="btn btn-primary" onclick="router.navigate('/evaluations/new')">
                            新規評価
                        </button>
                    </div>
                </div>
                <div class="page-content">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>評価対象者</th>
                                    <th>評価者</th>
                                    <th>評価期間</th>
                                    <th>総合評価</th>
                                    <th>ステータス</th>
                                    <th>更新日</th>
                                    <th>操作</th>
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
                                                詳細
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

async function showNewEvaluationForm() {
    app.currentPage = 'new-evaluation';
    updateBreadcrumbs([
        { label: 'ダッシュボード', path: '/dashboard' },
        { label: '評価一覧', path: '/evaluations' },
        { label: '新規評価作成', path: '/evaluations/new' }
    ]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>フォームを準備中...</p></div>`;

    try {
        const categories = await api.getEvaluationCategories();

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">新規評価作成</h1>
                    <button class="btn btn-secondary" onclick="router.navigate('/evaluations')">
                        一覧に戻る
                    </button>
                </div>
                <div class="page-content">
                    <form class="evaluation-form" id="new-evaluation-form">
                        <div class="form-section">
                            <h3>基本情報</h3>
                            <div class="form-group">
                                <label for="evaluation-period">評価期間</label>
                                <select id="evaluation-period" required>
                                    <option value="">選択してください</option>
                                    <option value="2025年上期">2025年上期</option>
                                    <option value="2025年下期">2025年下期</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="subordinate-select">評価対象者</label>
                                <select id="subordinate-select" required>
                                     <option value="">選択してください</option>
                                     <option value="作業員A">作業員A</option>
                                     <option value="作業員B">作業員B</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3>項目別評価</h3>
                            <div class="rating-input-group">
                                ${categories.map(category => `
                                    <div class="rating-input-item">
                                        <div class="rating-input-label">
                                            <strong>${category.name}</strong>
                                        </div>
                                        <div class="rating-input-controls">
                                            <input type="number" class="rating-input" id="rating-${category.id}" min="1" max="5" step="0.1" placeholder="1-5" oninput="updateRadarChart()">
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="evaluation-chart" style="margin-top: 24px;">
                                <div class="chart-container">
                                    <div id="evaluation-radar-chart" class="pentagon-chart"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-section">
                            <h3>総合コメント</h3>
                            <div class="form-group">
                                <textarea id="overall-comment" placeholder="総合的な評価コメントを入力してください" rows="4"></textarea>
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-top: 32px;">
                            <button type="button" class="btn btn-secondary" onclick="router.navigate('/evaluations')" style="margin-right: 12px;">
                                キャンセル
                            </button>
                            <button type="submit" class="btn btn-success">
                                評価を保存
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('new-evaluation-form').addEventListener('submit', handleSaveEvaluation);
        initializeRadarChart(categories); // ★ categoriesを渡すように変更
    } catch (error) {
        console.error("Failed to show new evaluation form:", error);
        mainContent.innerHTML = `<div class="page-content"><p>フォームの表示に失敗しました。</p></div>`;
    }
}

// viewEvaluation関数はまだ未実装のため、プレースホルダーとして残します
function viewEvaluation(id) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価詳細（ID: ${id}）の表示機能は現在実装中です。</p><button class="btn" onclick="router.navigate('/evaluations')">一覧に戻る</button></div>`;
}
