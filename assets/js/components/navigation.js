/**
 * ナビゲーションシステム (権限管理対応版)
 * ヘッダーメニューとユーザー情報の表示管理
 */
class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.menuItems = [];
        console.log('Navigation manager initialized');
    }

    /**
     * ヘッダー全体を現在のユーザー情報に基づいて再描画する
     */
    render() {
        this.currentUser = authManager.getCurrentUser();
        if (!this.currentUser) return;

        this.setupMenuItems();
        
        const header = document.getElementById('app-header');
        if (!header) return;

        // ヘッダーのHTMLを生成
        header.innerHTML = `
            <div class="header-content">
                <div class="logo">
                    <h1 id="header-title">🏗️ 建設業評価システム</h1>
                </div>
                <nav>
                    <ul class="nav-menu" id="nav-menu">
                        ${this.renderMenuItems()}
                    </ul>
                </nav>
                <div class="user-menu">
                    ${this.renderUserInfo()}
                    <div class="language-selector">
                        <select id="header-language-select">
                            <option value="ja">🇯🇵 日本語</option>
                            <option value="vi">🇻🇳 Tiếng Việt</option>
                            <option value="en">🇺🇸 English</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * 全てのメニュー項目を定義
     * rolesプロパティに、そのメニューを表示できる役割を配列で指定
     */
    setupMenuItems() {
        this.menuItems = [
            { id: 'dashboard', label: 'ダッシュボード', path: '/dashboard', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'evaluations', label: '評価一覧', path: '/evaluations', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'users', label: 'ユーザー管理', path: '/users', roles: ['admin'] },
            // { id: 'settings', label: '設定', path: '/settings', roles: ['admin'] }, // 将来の拡張用
        ];
    }

    /**
     * 現在のユーザーの役割に基づいて表示するメニュー項目のHTMLを生成
     * @returns {string} HTML文字列
     */
    renderMenuItems() {
        if (!this.currentUser) return '';

        return this.menuItems
            .filter(item => item.roles.includes(this.currentUser.role))
            .map(item => `
                <li>
                    <a href="#" class="nav-link" data-path="${item.path}">
                        ${item.label}
                    </a>
                </li>
            `).join('');
    }

    /**
     * ユーザー情報部分のHTMLを生成
     */
    renderUserInfo() {
        const roleDisplayNames = {
            admin: '管理者',
            evaluator: '評価者',
            worker: '作業員'
        };
        const roleName = roleDisplayNames[this.currentUser.role] || this.currentUser.role;

        return `
            <div class="user-info" id="user-info">
                <div class="user-avatar">${(this.currentUser.name || 'U').charAt(0)}</div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.name}</div>
                    <div class="user-role">${roleName}</div>
                </div>
                <button onclick="logout()" style="margin-left: 12px; background: none; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
                    ログアウト
                </button>
            </div>
        `;
    }

    /**
     * ナビゲーションリンクにイベントリスナーを設定
     */
    attachEventListeners() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = e.currentTarget.dataset.path;
                if (path) {
                    router.navigate(path);
                }
            });
        });

        // 現在のページに応じてアクティブなリンクを強調表示
        const currentPath = window.location.pathname;
        navLinks.forEach(link => {
            if (link.dataset.path === currentPath) {
                link.classList.add('active');
            }
        });
    }
}

// グローバルインスタンスを作成
window.navigation = new NavigationManager();
