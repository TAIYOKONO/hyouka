// settings.js の全コード（対象職種管理ロジック実装版）
/**
 * settings.js - 管理者向け設定ページ
 */

// グローバルスコープに関数を定義
let settingsState = {
    jobTypes: [],
    selectedJobTypeId: null,
};

// --- DOM描画関連の関数 ---
function renderJobTypesList() {
    const listEl = document.getElementById('job-types-list');
    if (!listEl) return;

    if (settingsState.jobTypes.length === 0) {
        listEl.innerHTML = `<li class="placeholder-text-sm">対象職種がありません</li>`;
        return;
    }

    listEl.innerHTML = settingsState.jobTypes.map(jobType => `
        <li class="sidebar-list-item ${jobType.id === settingsState.selectedJobTypeId ? 'active' : ''}" data-id="${jobType.id}">
            <span>${jobType.name}</span>
            <button class="btn-delete-job-type" data-id="${jobType.id}">&times;</button>
        </li>
    `).join('');
}

// --- イベントハンドラ ---
async function handleAddJobType() {
    const jobTypeName = prompt('新しい対象職種の名称を入力してください:');
    if (!jobTypeName || !jobTypeName.trim()) {
        return;
    }

    try {
        // 現在の職種数から次の表示順を決定
        const newOrder = settingsState.jobTypes.length + 1;
        const newJobType = await window.api.createTargetJobType({
            name: jobTypeName.trim(),
            order: newOrder,
        });
        settingsState.jobTypes.push(newJobType);
        renderJobTypesList();
        showNotification('対象職種を追加しました', 'success');
    } catch (error) {
        console.error('Failed to add job type:', error);
        showNotification('対象職種の追加に失敗しました', 'error');
    }
}

// --- イベントリスナーの設定 ---
function setupSettingsPageEventListeners() {
    // 古いイベントリスナーを削除（複数回呼び出された場合のため）
    const addBtn = document.getElementById('btn-add-job-type');
    if(addBtn) {
        const newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        newBtn.addEventListener('click', handleAddJobType);
    }
}

// --- メインのページ表示関数 ---
async function showSettingsPage() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '評価項目設定' }]);
    
    const mainContent = document.getElementById('main-content');
    
    // UIの骨格を先に描画
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header">
                <h1 class="page-title">評価項目設定</h1>
            </div>
            <div class="page-content">
                <div class="settings-layout">
                    <div class="settings-sidebar">
                        <div class="sidebar-header">
                            <h3>対象職種</h3>
                            <button id="btn-add-job-type" class="btn btn-secondary btn-sm">新規追加</button>
                        </div>
                        <ul id="job-types-list" class="sidebar-list">
                            <li class="loading-text">読み込み中...</li>
                        </ul>
                    </div>
                    <div class="settings-main">
                        <div id="evaluation-structure-editor">
                            <div class="placeholder-text">
                                <p>左のリストから対象職種を選択するか、新規追加してください。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // イベントリスナーを設定
    setupSettingsPageEventListeners();

    // Firestoreからデータを読み込んで表示
    try {
        settingsState.jobTypes = await window.api.getTargetJobTypes();
        renderJobTypesList();
    } catch (error) {
        console.error("Failed to load job types:", error);
        document.getElementById('job-types-list').innerHTML = `<li class="placeholder-text-sm">読み込みに失敗しました</li>`;
    }
}
