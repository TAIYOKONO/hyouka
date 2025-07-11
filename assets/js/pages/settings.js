// settings.js の全コード（空の項目エラー修正版）
/**
 * settings.js - 管理者向け設定ページ
 */

let settingsState = {
    jobTypes: [],
    selectedJobTypeId: null,
    currentStructure: null,
    isStructureDirty: false,
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
            <span class="job-type-name">${jobType.name}</span>
            <button class="btn btn-danger btn-sm btn-delete-job-type" data-id="${jobType.id}" data-name="${jobType.name}">削除</button>
        </li>
    `).join('');
}

function renderStructureEditor() {
    const editorEl = document.getElementById('evaluation-structure-editor');
    if (!editorEl) return;

    if (!settingsState.selectedJobTypeId) {
        editorEl.innerHTML = `<div class="placeholder-text"><p>左のリストから対象職種を選択するか、新規追加してください。</p></div>`;
        return;
    }

    const structure = settingsState.currentStructure;
    const selectedJobType = settingsState.jobTypes.find(jt => jt.id === settingsState.selectedJobTypeId);

    let categoriesHtml = '<div class="placeholder-text-sm">まだ評価カテゴリがありません。</div>';
    if (structure && structure.categories && structure.categories.length > 0) {
        categoriesHtml = structure.categories.map((category, catIndex) => `
            <div class="category-block">
                <div class="category-header">
                    <input type="text" value="${category.categoryName}" class="form-control category-name-input" placeholder="カテゴリ名">
                    <button class="btn-delete-category" data-cat-index="${catIndex}">カテゴリ削除</button>
                </div>
                <div class="item-list">
                    ${(category.items || []).map((item, itemIndex) => `
                        <div class="item-row">
                            <input type="text" value="${item.itemName}" class="form-control item-name-input" placeholder="評価項目名">
                            <select class="form-control item-type-select">
                                <option value="quantitative" ${item.itemType === 'quantitative' ? 'selected' : ''}>定量的</option>
                                <option value="qualitative" ${item.itemType === 'qualitative' ? 'selected' : ''}>定性的</option>
                            </select>
                            <button class="btn-delete-item" data-cat-index="${catIndex}" data-item-index="${itemIndex}">&times;</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-secondary btn-sm btn-add-item" data-cat-index="${catIndex}">+ 項目を追加</button>
                </div>
            </div>
        `).join('');
    }

    editorEl.innerHTML = `
        <div class="structure-editor-header">
            <h3>「${selectedJobType.name}」の評価構造</h3>
            <div>
                <button id="btn-add-category" class="btn btn-secondary">＋ カテゴリを追加</button>
                <button id="btn-save-structure" class="btn btn-primary">変更を保存</button>
            </div>
        </div>
        <div id="categories-container">${categoriesHtml}</div>
    `;
}


// --- イベントハンドラ ---
async function handleAddJobType() {
    const jobTypeName = prompt('新しい対象職種の名称を入力してください:');
    if (!jobTypeName || !jobTypeName.trim()) return;
    try {
        const newOrder = settingsState.jobTypes.length > 0 ? Math.max(...settingsState.jobTypes.map(j => j.order)) + 1 : 1;
        const newJobType = await window.api.createTargetJobType({ name: jobTypeName.trim(), order: newOrder });
        settingsState.jobTypes.push(newJobType);
        renderJobTypesList();
        showNotification('対象職種を追加しました', 'success');
    } catch (error) {
        console.error('Failed to add job type:', error);
        showNotification('対象職種の追加に失敗しました', 'error');
    }
}

async function handleDeleteJobType(id, name) {
    if (!confirm(`「${name}」を削除しますか？\nこの職種に紐づく評価構造もすべて削除されます。`)) return;
    try {
        await window.api.deleteTargetJobType(id);
        settingsState.jobTypes = settingsState.jobTypes.filter(jt => jt.id !== id);
        if (settingsState.selectedJobTypeId === id) {
            settingsState.selectedJobTypeId = null;
            settingsState.currentStructure = null;
            renderStructureEditor();
        }
        renderJobTypesList();
        showNotification(`「${name}」を削除しました`, 'success');
    } catch (error) {
        console.error('Failed to delete job type:', error);
        showNotification('対象職種の削除に失敗しました', 'error');
    }
}

async function handleSelectJobType(id) {
    settingsState.selectedJobTypeId = id;
    renderJobTypesList();

    const editorEl = document.getElementById('evaluation-structure-editor');
    editorEl.innerHTML = `<div class="placeholder-text"><p>評価構造を読み込み中...</p></div>`;

    try {
        const structure = await window.api.getEvaluationStructure(id);
        settingsState.currentStructure = structure || { jobTypeId: id, categories: [] };
        renderStructureEditor();
    } catch (error) {
        console.error('Failed to load structure:', error);
        editorEl.innerHTML = `<div class="placeholder-text error"><p>評価構造の読み込みに失敗しました。</p></div>`;
    }
}

// --- イベントリスナーの設定 ---
function setupSettingsPageEventListeners() {
    document.getElementById('btn-add-job-type')?.addEventListener('click', handleAddJobType);
    document.getElementById('job-types-list')?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-delete-job-type')) {
            handleDeleteJobType(target.dataset.id, target.dataset.name);
        } else if (target.closest('.sidebar-list-item')) {
            handleSelectJobType(target.closest('.sidebar-list-item').dataset.id);
        }
    });
    // (次のステップで、右側エリアのボタンのイベントリスナーを追加します)
}

// --- メインのページ表示関数 ---
async function showSettingsPage() {
    if (window.navigation) window.navigation.render();
    updateBreadcrumbs([{ label: 'ダッシュボード', path: '#/dashboard' }, { label: '評価項目設定' }]);
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="page">
            <div class="page-header"><h1 class="page-title">評価項目設定</h1></div>
            <div class="page-content">
                <div class="settings-layout">
                    <div class="settings-sidebar">
                        <div class="sidebar-header">
                            <h3>対象職種</h3>
                            <button id="btn-add-job-type" class="btn btn-secondary btn-sm">新規追加</button>
                        </div>
                        <ul id="job-types-list" class="sidebar-list"><li class="loading-text">読み込み中...</li></ul>
                    </div>
                    <div class="settings-main">
                        <div id="evaluation-structure-editor">
                            <div class="placeholder-text"><p>左のリストから対象職種を選択するか、新規追加してください。</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    setupSettingsPageEventListeners();

    try {
        settingsState.jobTypes = await window.api.getTargetJobTypes();
        renderJobTypesList();
    } catch (error) {
        console.error("Failed to load job types:", error);
        document.getElementById('job-types-list').innerHTML = `<li class="placeholder-text-sm">読み込みに失敗しました</li>`;
    }
}
