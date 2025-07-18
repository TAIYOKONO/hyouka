/**
 * navigation.js - グローバルナビゲーション管理
 */
class NavigationManager {
    constructor() { this.currentUser = null; this.menuItems = []; }
    async render() {
        this.currentUser = authManager.getCurrentUser();
        const header = document.getElementById('app-header');
        if (!header || !this.currentUser) { if(header) header.style.display = 'none'; return; }
        header.style.display = 'block';
        this.setupMenuItems();
        header.innerHTML = this.getHTML();
        this.attachEventListeners();
    }
    setupMenuItems() {
        this.menuItems = [
            { id: 'dashboard', label: 'ダッシュボード', path: '#/dashboard', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'evaluations', label: '評価一覧', path: '#/evaluations', roles: ['admin', 'evaluator', 'worker'] },
            { id: 'goal-setting', label: '個人目標設定', path: '#/goal-setting', roles: ['evaluator', 'worker'] },
            { id: 'goal-approvals', label: '目標承認', path: '#/goal-approvals', roles: ['admin'] },
            { id: 'users', label: 'ユーザー管理', path: '#/users', roles: ['admin', 'evaluator'] },
            { id: 'settings', label: '評価項目設定', path: '#/settings', roles: ['admin'] },
        ];
    }
    getHTML() {
        return `
            <div class="header-content">
                <div class="pc-nav-elements">
                    <div class="logo"><a href="#/dashboard"><h1>評価システム</h1></a></div>
                    <nav class="main-navigation"><ul class="nav-menu">${this.renderMenuItems()}</ul></nav>
                    <div class="user-menu">${this.renderUserInfo()}<button id="logout-button" class="btn btn-secondary btn-sm">ログアウト</button></div>
                </div>
                <button class="mobile-menu-toggle" id="mobile-menu-toggle">☰</button>
            </div>
            <ul class="mobile-nav-menu" id="mobile-nav-menu">${this.renderMenuItems(true)}<li><a href="#" id="mobile-logout-button">ログアウト</a></li></ul>`;
    }
    renderMenuItems(isMobile = false) {
        if (!this.currentUser) return '';
        return this.menuItems.filter(item => item.roles.includes(this.currentUser.role))
            .map(item => `<li><a href="${item.path}" class="nav-link">${item.label}</a></li>`).join('');
    }
    renderUserInfo() {
        const roleNames = { admin: '管理者', evaluator: '評価者', worker: '作業員' };
        const role = roleNames[this.currentUser.role] || this.currentUser.role;
        return `<div class="user-info"><div class="user-avatar">${(this.currentUser.name || 'U').charAt(0)}</div><div class="user-details"><div class="user-name">${this.currentUser.name}</div><div class="user-role">${role}</div></div></div>`;
    }
    attachEventListeners() {
        document.getElementById('logout-button')?.addEventListener('click', () => authManager.logout());
        document.getElementById('mobile-logout-button')?.addEventListener('click', e => { e.preventDefault(); authManager.logout(); });
        const toggle = document.getElementById('mobile-menu-toggle');
        const menu = document.getElementById('mobile-nav-menu');
        if (toggle && menu) {
            toggle.addEventListener('click', e => { e.stopPropagation(); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; });
        }
        document.addEventListener('click', e => { if (menu && menu.style.display === 'block' && !menu.parentElement.contains(e.target)) menu.style.display = 'none'; });
    }
}
window.navigation = new NavigationManager();
