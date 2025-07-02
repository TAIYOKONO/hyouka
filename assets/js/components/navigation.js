/**
 * ナビゲーションシステム (最終版)
 */
class NavigationManager {
    constructor() {
        this.currentUser = null;
        this.menuItems = [];
    }

    async render() {
        this.currentUser = authManager.getCurrentUser();
        if (!this.currentUser) return;
        
        const notifications = await api.getNotificationsForUser(this.currentUser.uid);
        const notificationCount = notifications.length;

        this.setupMenuItems(notificationCount);
        
        const header = document.getElementById('app-header');
        if (!header) return;

        header.innerHTML = `
            <div class="header-content">
                <div class="logo"><h1 id="header-title">🏗️ 建設業評価システム</h1></div>
                <nav><ul class="nav-menu" id="nav-menu">${this.renderMenuItems()}</ul></nav>
                <div class="user-menu">${this.renderUserInfo()}</div>
            </div>`;
        this.attachEventListeners();
    }

    setupMenuItems(notificationCount = 0) {
        const userManagementLabel = `ユーザー管理 ${notificationCount > 0 ? `<span class="notification-badge">${notificationCount}</span>` : ''}`;
        this.menuItems = [
            { id: 'dashboard', label: 'ダッシュボード', path: '/dashboard', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'evaluations', label: '評価一覧', path: '/evaluations', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'users', label: userManagementLabel, path: '/users', roles: ['admin', 'evaluator'] },
            { id: 'settings', label: '評価項目設定', path: '/settings', roles: ['admin'] },
        ];
    }
    
    renderMenuItems() {
        if (!this.currentUser) return '';
        return this.menuItems
            .filter(item => item.roles.includes(this.currentUser.role))
            .map(item => `<li><a href="#" class="nav-link" data-path="${item.path}">${item.label}</a></li>`)
            .join('');
    }

    renderUserInfo() {
        const roleDisplayNames = { admin: '管理者', evaluator: '評価者', worker: '作業員' };
        const roleName = roleDisplayNames[this.currentUser.role] || this.currentUser.role;
        return `<div class="user-info" id="user-info"><div class="user-avatar">${(this.currentUser.name || 'U').charAt(0)}</div><div class="user-details"><div class="user-name">${this.currentUser.name}</div><div class="user-role">${roleName}</div></div><button onclick="logout()" style="margin-left: 12px; background: none; border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;">ログアウト</button></div>`;
    }

    attachEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = e.currentTarget.dataset.path;
                if (path && window.router) router.navigate(path);
            });
        });
    }
}
window.navigation = new NavigationManager();
