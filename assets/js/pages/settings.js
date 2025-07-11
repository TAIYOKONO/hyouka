// settings.js の全コード（削除ボタン修正版）
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
            <span class="job-type-name">${jobType.name}</span>
            <button class="btn btn-danger btn-sm btn-delete-job-type" data-id="${jobType.id}" data-name="${jobType.name}">削除</button>
        </li>
    `).join('');
}

function renderStructureEditor() {
    const editorEl = document.getElementById('evaluation-structure-editor');
    if (!editorEl) return;

    if (!settingsState.selectedJobTypeId) {
        editorEl.innerHTML = `
            <div class="placeholder-text">
                <p>左のリストから対象職種を選択するか、新規追加してください。</p>
            </div>`;
        return;
    }

    const selectedJobType = settingsState.jobTypes.find(jt => jt.id === settingsState.selectedJobTypeId);
    editorEl.innerHTML = `
        <h3>「${selectedJobType.name}」の評価構造</h3>
        <p>（次のステップで、ここにカテゴリと項目の編集フォームを作成します）</p>
    `;
}


// --- イベントハンドラ ---
async function handleAddJobType() {
    const jobTypeName = prompt('新しい対象職種の名称を入力してください:');
    if (!jobTypeName || !jobTypeName.trim()) return;

    try {
        const newOrder = settingsState.jobTypes.length > 0 ? Math.max(...settingsState.jobTypes.map(j => j.order)) + 1 : 1;
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

async function handleDeleteJobType(id, name) {
    if (!confirm(`「${name}」を削除しますか？\nこの職種に紐づく評価構造もすべて削除されます。`)) {
        return;
    }

    try {
        await window.api.deleteTargetJobType(id);
        settingsState.jobTypes = settingsState.jobTypes.filter(jt => jt.id !== id);
        
        if (settingsState.selectedJobTypeId === id) {
            settingsState.selectedJobTypeId = null;
            renderStructureEditor();
        }
        
        renderJobTypesList();
        showNotification(`「${name}」を削除しました`, 'success');
    } catch (error) {
        console.error('Failed to delete job type:', error);
        showNotification('対象職種の削除に失敗しました', 'error');
    }
}

function handleSelectJobType(id) {
    settingsState.selectedJobTypeId = id;
    renderJobTypesList();
    renderStructureEditor();
}

// --- イベントリスナーの設定 ---
function setupSettingsPageEventListeners() {
    document.getElementById('btn-add-job-type')?.addEventListener('click', handleAddJobType);

    document.getElementById('job-types-list')?.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-delete-job-type')) {
            const id = target.dataset.id;
            const name = target.dataset.name;
            handleDeleteJobType(id, name);
        } else if (target.closest('.sidebar-list-item')) {
            const id = target.closest('.sidebar-list-item').dataset.id;
            handleSelectJobType(id);
        }
    });
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
