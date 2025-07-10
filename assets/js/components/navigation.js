/**
 * navigation.js - グローバルナビゲーション管理 (最終版)
 */
class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.menuItems = [];
    }

    render() {
        this.currentUser = authManager.getCurrentUser();
        if (!this.currentUser) {
            // ログインしていない場合はヘッダーを非表示
            const header = document.getElementById('app-header');
            if (header) header.style.display = 'none';
            return;
        }
        
        this.setupMenuItems();
        
        const header = document.getElementById('app-header');
        if (!header) return;

        header.style.display = 'block'; // ログイン済みなら表示
        header.innerHTML = `
            <div class="header-content">
                <div class="logo"><h1 id="header-title">🏗️ 建設業評価システム</h1></div>
                <nav><ul class="nav-menu" id="nav-menu">${this.renderMenuItems()}</ul></nav>
                <div class="user-menu">
                    ${this.renderUserInfo()}
                    <div class="language-selector">
                        <select id="language-select" class="form-control">
                            <option value="ja">🇯🇵 日本語</option>
                            <option value="vi">🇻🇳 Tiếng Việt</option>
                            <option value="en">🇬🇧 English</option>
                        </select>
                    </div>
                    <button id="logout-button" class="btn btn-secondary">ログアウト</button>
                </div>
            </div>`;
        this.attachEventListeners();
    }

    setupMenuItems() {
        this.menuItems = [
            { id: 'dashboard', label: 'ダッシュボード', path: '/dashboard', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'evaluations', label: '評価一覧', path: '/evaluations', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'users', label: 'ユーザー管理', path: '/users', roles: ['admin', 'evaluator'] },
            { id: 'settings', label: '評価項目設定', path: '/settings', roles: ['admin'] },
        ];
    }
    
    renderMenuItems() {
        if (!this.currentUser) return '';
        return this.menuItems
            .filter(item => item.roles.includes(this.currentUser.role))
            .map(item => `<li><a href="#${item.path}" class="nav-link">${item.label}</a></li>`)
            .join('');
    }

    renderUserInfo() {
        const roleDisplayNames = { admin: '管理者', evaluator: '評価者', worker: '作業員' };
        const roleName = roleDisplayNames[this.currentUser.role] || this.currentUser.role;
        return `
            <div class="user-info">
                <div class="user-avatar">${(this.currentUser.name || 'U').charAt(0)}</div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.name}</div>
                    <div class="user-role">${roleName}</div>
                </div>
            </div>`;
    }

    attachEventListeners() {
        document.getElementById('logout-button')?.addEventListener('click', () => {
            authManager.logout();
        });
        // 言語選択のイベントリスナーはi18n.jsで管理
    }
}

window.navigation = new NavigationManager();
