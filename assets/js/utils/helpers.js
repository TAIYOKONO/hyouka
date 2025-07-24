/**
 * utils/helpers.js - ヘルパー関数 (フェーズ3整理版)
 */

/**
 * ページ上部のパンくずリストを更新する
 * @param {Array<Object>} items - パンくずリストのアイテム配列 e.g. [{label: 'Home', path: '#/home'}]
 */
function updateBreadcrumbs(items) {
    const breadcrumbsContainer = document.getElementById('breadcrumbs'); // 将来的に専用コンテナを想定
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) return;

    // 既存のパンくずリストを削除
    const existingBreadcrumbs = mainContent.querySelector('.breadcrumbs');
    if (existingBreadcrumbs) {
        existingBreadcrumbs.remove();
    }

    if (!items || items.length === 0) return;

    const breadcrumbsHTML = `
        <nav class="breadcrumbs" aria-label="breadcrumb">
            ${items.map((item, index) => {
                if (index === items.length - 1) {
                    // 最後のアイテムはテキストとして表示
                    return `<span class="current" aria-current="page">${item.label}</span>`;
                } else {
                    // 途中のアイテムはリンクとして表示
                    return `<a href="${item.path || '#'}">${item.label}</a>`;
                }
            }).join('<span class="separator">/</span>')}
        </nav>
    `;

    // main-contentの先頭に挿入
    mainContent.insertAdjacentHTML('afterbegin', breadcrumbsHTML);
}
