async function viewEvaluation(id) {
    app.currentPage = 'evaluation-detail';
    updateBreadcrumbs([
        { label: 'ダッシュボード', path: '/dashboard' },
        { label: '評価一覧', path: '/evaluations' },
        { label: '評価詳細' }
    ]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<div class="page-content"><p>評価詳細を読み込み中...</p></div>`;

    try {
        const evaluation = await api.getEvaluationById(id);
        if (!evaluation) {
            throw new Error("評価データが見つかりません。");
        }

        const evaluationItems = await api.getEvaluationItems();
        
        // ★★★ evaluation.ratingsが存在するかチェックする修正 ★★★
        const chartData = evaluationItems.map(item => 
            (evaluation.ratings && evaluation.ratings[item.id]) ? evaluation.ratings[item.id] : 0
        );

        mainContent.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">👁️ 評価詳細</h1>
                    <button class="btn" onclick="router.navigate('/evaluations')">一覧に戻る</button>
                </div>
                <div class="page-content">
                    <div class="evaluation-summary">
                        <div class="evaluation-details">
                            <h3>基本情報</h3>
                            <div class="detail-row"><span class="label">期間:</span><span>${evaluation.period}</span></div>
                            <div class="detail-row"><span class="label">対象者:</span><span>${evaluation.subordinate}</span></div>
                            <div class="detail-row"><span class="label">評価者:</span><span>${evaluation.evaluator}</span></div>
                            <div class="detail-row"><span class="label">総合評価:</span><span>${evaluation.overallRating}/5 ⭐</span></div>
                            <div class="detail-row"><span class="label">更新日:</span><span>${new Date(evaluation.updatedAt.seconds * 1000).toLocaleDateString()}</span></div>
                        </div>
                        <div class="evaluation-chart">
                            <h4>評価チャート</h4>
                            <div class="chart-container"><div id="detail-radar-chart" class="pentagon-chart"></div></div>
                        </div>
                    </div>
                    <div class="form-section">
                        <h3>総合コメント</h3>
                        <p>${evaluation.overallComment || 'コメントはありません。'}</p>
                    </div>
                </div>
            </div>
        `;

        new PentagonChart('detail-radar-chart', evaluationItems, chartData);

    } catch (error) {
        console.error("Failed to show evaluation detail:", error);
        mainContent.innerHTML = `<div class="page-content"><p>評価詳細の読み込みに失敗しました。</p></div>`;
    }
}
