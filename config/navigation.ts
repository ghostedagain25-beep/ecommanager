export interface NavItem {
    key: string;
    label: string;
    icon: string;
}

export const adminNavItems: NavItem[] = [
    { key: 'orders', label: 'View Orders', icon: 'shopping-cart' },
    { key: 'products', label: 'Products', icon: 'package' },
    { key: 'categories', label: 'Categories', icon: 'folder-kanban' },
    { key: 'users', label: 'User Management', icon: 'users-round' },
    { key: 'workflow', label: 'Workflow', icon: 'list-checks' },
    { key: 'history', label: 'Sync History', icon: 'history' },
    { key: 'pushes', label: 'Push History', icon: 'upload' },
    { key: 'database', label: 'Database Explorer', icon: 'database' },
    { key: 'settings', label: 'Admin Settings', icon: 'settings-2' },
];

export const userNavItems: NavItem[] = [
    { key: 'orders', label: 'View Orders', icon: 'shopping-cart' },
    { key: 'products', label: 'Products', icon: 'package' },
    { key: 'categories', label: 'Categories', icon: 'folder-kanban' },
    { key: 'processing', label: 'Update Products', icon: 'cloud-upload' },
    { key: 'history', label: 'Sync History', icon: 'history' },
    { key: 'settings', label: 'Settings', icon: 'settings-2' },
];