/**
 * utils/helpers.js - ヘルパー関数 (Firestore連携・デバッグ版)
 */
function getCategoryName(index) {
    const categoryKeys = ['category.safety', 'category.quality', 'category.efficiency', 'category.teamwork', 'category.communication'];
    return i18n.t(categoryKeys[index]);
}

function updateBreadcrumbs(items) {
    const breadcrumbs = document.getElementById('breadcrumbs');
    if (!breadcrumbs || !items.length) return;
    breadcrumbs.innerHTML = items.map((item, index) => 
        index === items.length - 1 ? `<span class="current">${item.label}</span>` : `<a href="#" onclick="router.navigate('${item.path || ''}')">${item.label}</a>`
    ).join(' <span class="separator">></span> ');
}

function updateRadarChart() {
    if (!window.pentagonChart) return;
    const categories = window.pentagonChart.categories || [];
    const newData = categories.map(category => {
        const input = document.getElementById(`rating-${category.id}`);
        const value = parseFloat(input?.value);
        return isNaN(value) ? 0 : Math.max(0, Math.min(5, value));
    });
    window.pentagonChart.updateData(newData);
}

function initializeRadarChart(categories = []) {
    setTimeout(() => {
        try {
            window.pentagonChart = new PentagonChart('evaluation-radar-chart', categories);
        } catch (error) {
            console.error('Error creating pentagon chart:', error);
        }
    }, 100);
}

async function handleSaveEvaluation(e) {
    e.preventDefault();
    const period = document.getElementById('evaluation-period').value;
    const subordinate = document.getElementById('subordinate-select').value;
    if (!period || !subordinate) {
        showNotification('評価期間と対象者を選択してください', 'error');
        return;
    }
    const ratings = {};
    let hasRatings = false;
    const categories = window.pentagonChart.categories || [];
    categories.forEach(category => {
        const input = document.getElementById(`rating-${category.id}`);
        const value = parseFloat(input.value);
        if (!isNaN(value) && value >= 1 && value <= 5) {
            ratings[category.id] = value;
            hasRatings = true;
        }
    });
    if (!hasRatings) {
        showNotification('少なくとも1つの評価項目を入力してください', 'error');
        return;
    }
    const ratingValues = Object.values(ratings);
    const avgRating = ratingValues.reduce((sum, r) => sum + r, 0) / ratingValues.length || 0;
    
    const newEvaluationData = {
        subordinate: subordinate,
        evaluator: app.currentUser.name,
        evaluatorId: app.currentUser.uid,
        status: 'completed',
        overallRating: parseFloat(avgRating.toFixed(1)),
        ratings: ratings,
        overallComment: document.getElementById('overall-comment').value,
        period: period,
    };
    
    try {
        await api.createEvaluation(newEvaluationData);
        showNotification('評価を保存しました！', 'success');
        setTimeout(() => router.navigate('/evaluations'), 1500);
    } catch (error) {
        showNotification('評価の保存に失敗しました', 'error');
        console.error("Failed to save evaluation:", error);
    }
}
