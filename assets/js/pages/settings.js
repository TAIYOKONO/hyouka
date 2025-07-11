// settings.js の全コード（イベントリスナー修正版）
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
            <div class="category-block" data-cat-index="${catIndex}">
                <div class="category-header">
                    <input type="text" value="${category.categoryName || ''}" class="form-control category-name-input" placeholder="カテゴリ名" data-cat-index="${catIndex}">
                    <button class="btn btn-danger btn-sm btn-delete-category" data-cat-index="${catIndex}">カテゴリ削除</button>
                </div>
                <div class="item-list">
                    ${(category.items || []).map((item, itemIndex) => `
                        <div class="item-row" data-item-index="${itemIndex}">
                            <input type="text" value="${item.itemName || ''}" class="form-control item-name-input" placeholder="評価項目名">
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
                <button id="btn-save-structure" class="btn btn-primary" ${!settingsState.isStructureDirty ? 'disabled' : ''}>変更を保存</button>
            </div>
        </div>
        <div id="categories-container">${categoriesHtml}</div>
    `;
}

// --- 状態管理・更新の関数 ---
function markStructureAsDirty() {
    settingsState.isStructureDirty = true;
    const saveBtn = document.getElementById('btn-save-structure');
    if (saveBtn) saveBtn.disabled = false;
}

// --- イベントハンドラ ---
async function handleAddJobType() {
    const jobTypeName = prompt('新しい対象職種の名称を入力してください:');
    if (!jobTypeName || !jobTypeName.trim()) return;
    try {
        const newOrder = settingsState.jobTypes.length > 0 ? Math.max(...settingsState.jobTypes.map(j => j.order || 0)) + 1 : 1;
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
        // TODO: 関連するevaluationStructuresのドキュメントも削除するAPI呼び出しを追加
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
    if (settingsState.isStructureDirty && !confirm('未保存の変更があります。変更を破棄して別の職種を選択しますか？')) {
        return;
    }
    settingsState.selectedJobTypeId = id;
    settingsState.isStructureDirty = false;
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

function handleAddCategory() {
    if (!settingsState.currentStructure) return;
    const newCategory = { categoryName: '', items: [] };
    settingsState.currentStructure.categories.push(newCategory);
    markStructureAsDirty();
    renderStructureEditor();
}

function handleAddItem(catIndex) {
    if (!settingsState.currentStructure) return;
    const newItem = { itemName: '', itemType: 'quantitative' };
    if (!settingsState.currentStructure.categories[catIndex].items) {
        settingsState.currentStructure.categories[catIndex].items = [];
    }
    settingsState.currentStructure.categories[catIndex].items.push(newItem);
    markStructureAsDirty();
    renderStructureEditor();
}

function handleDeleteCategory(catIndex) {
    if (!settingsState.currentStructure || !confirm('このカテゴリを削除しますか？')) return;
    settingsState.currentStructure.categories.splice(catIndex, 1);
    markStructureAsDirty();
    renderStructureEditor();
}

function handleDeleteItem(catIndex, itemIndex) {
    if (!settingsState.currentStructure) return;
    settingsState.currentStructure.categories[catIndex].items.splice(itemIndex, 1);
    markStructureAsDirty();
    renderStructureEditor();
}

async function handleSaveStructure() {
    if (!settingsState.currentStructure || !settingsState.selectedJobTypeId) return;

    const updatedCategories = [];
    let validationError = false;
    document.querySelectorAll('.category-block').forEach((catEl) => {
        const categoryName = catEl.querySelector('.category-name-input').value.trim();
        if (!categoryName) validationError = true;
        const items = [];
        catEl.querySelectorAll('.item-row').forEach((itemEl) => {
            const itemName = itemEl.querySelector('.item-name-input').value.trim();
            if (!itemName) validationError = true;
            const itemType = itemEl.querySelector('.item-type-select').value;
            items.push({ itemName, itemType });
        });
        updatedCategories.push({ categoryName, items });
    });

    if (validationError) {
        return showNotification('カテゴリ名と項目名は必須です。', 'error');
    }

    settingsState.currentStructure.categories = updatedCategories;

    try {
        await window.api.saveEvaluationStructure(settingsState.currentStructure.id, settingsState.currentStructure);
        settingsState.isStructureDirty = false;
        document.getElementById('btn-save-structure').disabled = true;
        showNotification('評価構造を保存しました', 'success');
    } catch (error) {
        console.error('Failed to save structure:', error);
        showNotification('保存に失敗しました', 'error');
    }
}

// --- イベントリスナーの設定 ---
function setupSettingsPageEventListeners() {
    const mainContent = document.getElementById('main-content');

    // イベントリスナーが重複しないように、一度だけ main-content に設定
    mainContent.removeEventListener('click', handleSettingsPageClicks);
    mainContent.addEventListener('click', handleSettingsPageClicks);

    mainContent.removeEventListener('input', handleSettingsPageInputs);
    mainContent.addEventListener('input', handleSettingsPageInputs);
}

function handleSettingsPageClicks(e) {
    const target = e.target;
    if (target.id === 'btn-add-job-type') handleAddJobType();
    else if (target.closest('.sidebar-list-item') && !target.classList.contains('btn-delete-job-type')) {
        handleSelectJobType(target.closest('.sidebar-list-item').dataset.id);
    } 
    else if (target.classList.contains('btn-delete-job-type')) {
        handleDeleteJobType(target.dataset.id, target.dataset.name);
    } 
    else if (target.id === 'btn-save-structure') handleSaveStructure();
    else if (target.id === 'btn-add-category') handleAddCategory();
    else if (target.classList.contains('btn-add-item')) handleAddItem(parseInt(target.dataset.catIndex));
    else if (target.classList.contains('btn-delete-category')) handleDeleteCategory(parseInt(target.dataset.catIndex));
    else if (target.classList.contains('btn-delete-item')) handleDeleteItem(parseInt(target.dataset.catIndex), parseInt(target.dataset.itemIndex));
}

function handleSettingsPageInputs(e) {
    if (e.target.matches('.category-name-input, .item-name-input, .item-type-select')) {
        markStructureAsDirty();
    }
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
