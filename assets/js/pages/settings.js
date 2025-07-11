/* components.css の末尾に追記 */

/* --- 設定ページレイアウト --- */
.settings-layout {
    display: flex;
    gap: var(--spacing-xl);
    align-items: flex-start;
}

.settings-sidebar {
    flex: 0 0 280px;
    background: var(--color-background-secondary);
    border-radius: var(--card-border-radius);
    padding: var(--spacing-md);
    border: 1px solid var(--border-color);
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--spacing-md);
}

.sidebar-header h3 {
    margin: 0;
    font-size: var(--font-size-lg);
}

.sidebar-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.sidebar-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.sidebar-list-item:hover {
    background-color: #e9ecef;
}

.sidebar-list-item.active {
    background-color: var(--color-primary-100);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.settings-main {
    flex: 1;
    min-width: 0;
}

#evaluation-structure-editor .placeholder-text {
    text-align: center;
    padding: 4rem;
    background: var(--color-background-secondary);
    border-radius: var(--card-border-radius);
    color: var(--color-text-secondary);
    border: 2px dashed var(--border-color);
}
