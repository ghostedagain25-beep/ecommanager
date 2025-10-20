import React, { useState, useEffect, useRef } from 'react';
// FIX: Update import path for types.
import type { User, UserRole } from '../types/index';
import * as api from '../services/api';

declare global {
    interface Window {
        lucide: any;
    }
}

interface NavItem {
    key: string;
    label: string;
    icon: string;
}

// --- DESKTOP NAV ITEMS ---
const adminNavItems: NavItem[] = [
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

const userNavItems: NavItem[] = [
    { key: 'orders', label: 'View Orders', icon: 'shopping-cart' },
    { key: 'products', label: 'Products', icon: 'package' },
    { key: 'categories', label: 'Categories', icon: 'folder-kanban' },
    { key: 'processing', label: 'Update Products', icon: 'cloud-upload' },
    { key: 'history', label: 'Sync History', icon: 'history' },
    { key: 'settings', label: 'Settings', icon: 'settings-2' },
];

// --- MOBILE NAV ITEMS (SPLIT FOR BOTTOM BAR) ---
const mobileAdminPrimary: NavItem[] = adminNavItems.slice(0, 3); // Orders, Products, Users
const mobileAdminMore: NavItem[] = adminNavItems.slice(3);

const mobileUserPrimary: NavItem[] = [userNavItems[0], userNavItems[1], userNavItems[3]]; // Orders, Products, Update
const mobileUserMore: NavItem[] = [userNavItems[2], userNavItems[4], userNavItems[5]]; // Categories, History, Settings

const moreNavItem: NavItem = { key: 'more', label: 'More', icon: 'more-horizontal' };


interface NavigationProps {
    role: UserRole;
    activeView: string;
    onNavigate: (view: string) => void;
    user: User;
    logout: () => void;
    isExpanded: boolean;
    onToggleExpand: (expanded: boolean) => void;
}

// --- Reusable NavLink for Desktop Sidebar ---
const DesktopNavLink: React.FC<{item: NavItem; isActive: boolean; showFullSidebar: boolean; onClick: () => void;}> = ({ item, isActive, showFullSidebar, onClick }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`relative flex items-center rounded-lg transition-colors group ${isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-gray-300'} ${showFullSidebar ? 'gap-4 p-3' : 'justify-center p-3'}`}
    >
        <i data-lucide={item.icon} className="w-5 h-5 flex-shrink-0"></i>
        <span className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${showFullSidebar ? 'opacity-100 w-auto ml-3' : 'opacity-0 w-0'}`}>{item.label}</span>
    </a>
);

// --- Reusable NavItem for Mobile Bottom Bar ---
const BottomNavItem: React.FC<{
    item: NavItem;
    isActive: boolean;
    onClick: (e: React.MouseEvent) => void;
}> = ({ item, isActive, onClick }) => (
    <a
        href="#"
        onClick={onClick}
        className={`flex flex-col items-center justify-center flex-1 p-2 rounded-lg transition-colors gap-1 ${isActive ? 'text-sky-400' : 'text-gray-400 hover:text-white'}`}
        aria-current={isActive ? 'page' : undefined}
    >
        <i data-lucide={item.icon} className="w-6 h-6"></i>
        <span className="text-xs tracking-tight">{item.label}</span>
    </a>
);


const Navigation: React.FC<NavigationProps> = ({ role, activeView, onNavigate, user, logout, isExpanded, onToggleExpand }) => {
    // Mobile state
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    // Desktop state
    const [isHovered, setIsHovered] = useState(false);
    
    // User menu settings
    const [userMenuSettings, setUserMenuSettings] = useState<Record<string, boolean>>({});
    
    // Fetch user menu settings for regular users
    useEffect(() => {
        const fetchUserMenuSettings = async () => {
            if (role === 'user' && user?.username) {
                try {
                    const settings = await api.getUserMenuSettings(user.username);
                    setUserMenuSettings(settings);
                } catch (error) {
                    console.error('Failed to load user menu settings:', error);
                    setUserMenuSettings({});
                }
            }
        };
        fetchUserMenuSettings();
    }, [role, user?.username]);
    
    // Refresh menu settings when activeView changes (in case admin updated settings)
    useEffect(() => {
        const refreshUserMenuSettings = async () => {
            if (role === 'user' && user?.username) {
                try {
                    const settings = await api.getUserMenuSettings(user.username);
                    setUserMenuSettings(settings);
                } catch (error) {
                    // Silently fail on refresh to avoid console spam
                }
            }
        };
        // Refresh settings when navigating (in case they were changed by admin)
        refreshUserMenuSettings();
    }, [activeView, role, user?.username]);
    
    // Filter navigation items based on user settings
    const filterItemsBySettings = (items: NavItem[]) => {
        if (role === 'admin') return items;
        return items.filter(item => userMenuSettings[item.key] !== false);
    };
    
    // Determine which nav items to use based on role and settings
    const baseDesktopNavItems = role === 'admin' ? adminNavItems : userNavItems;
    const desktopNavItems = filterItemsBySettings(baseDesktopNavItems);
    
    // Dynamic mobile navigation based on filtered items
    const allFilteredMobileItems = filterItemsBySettings(baseDesktopNavItems);
    
    // Adaptive mobile layout: if ≤4 items, show all; if >4 items, show 3 + More
    const mobilePrimaryItems = allFilteredMobileItems.length <= 4 
        ? allFilteredMobileItems 
        : allFilteredMobileItems.slice(0, 3);
    
    const mobileMoreItems = allFilteredMobileItems.length <= 4 
        ? [] 
        : allFilteredMobileItems.slice(3);
    
    // Check if an item within the "More" menu is currently active
    const isMoreSectionActive = mobileMoreItems.some(item => item.key === activeView);
    
    // Determine when to show the full desktop sidebar
    const showFullSidebar = isExpanded || isHovered;

    // Initialize Lucide icons on view changes
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [activeView, isMoreMenuOpen, showFullSidebar]);

    // Handle closing the "More" menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setIsMoreMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Navigation handler for mobile that also closes the "More" menu
    const handleMobileNavigate = (view: string) => {
        onNavigate(view);
        setIsMoreMenuOpen(false);
    };
    
    // "More" menu component for mobile
    const renderMoreMenu = () => (
        <div ref={moreMenuRef} className="absolute bottom-full mb-3 right-0 w-60 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 animate-fade-in-up">
            <div className="p-3 border-b border-slate-700 mb-2">
                <div className="flex items-center gap-3">
                    <i data-lucide="user-round" className="w-10 h-10 flex-shrink-0 text-sky-400"></i>
                    <div>
                        <p className="font-semibold text-white">{user.username}</p>
                        <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                    </div>
                </div>
            </div>
            <ul className="space-y-1">
                {mobileMoreItems.map(item => (
                    <li key={item.key}>
                        <a href="#" onClick={(e) => { e.preventDefault(); handleMobileNavigate(item.key); }} className={`flex items-center gap-3 w-full p-3 rounded-md text-sm transition-colors ${activeView === item.key ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-slate-800'}`}>
                            <i data-lucide={item.icon} className="w-5 h-5"></i>
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
             <div className="border-t border-slate-700 mt-2 pt-2">
                 <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="flex items-center gap-3 w-full p-3 rounded-md text-sm transition-colors text-red-400 hover:bg-red-900/50">
                    <i data-lucide="log-out" className="w-5 h-5"></i>
                    Logout
                </a>
            </div>
        </div>
    );

    return (
        <>
            {/* --- DESKTOP SIDEBAR (hidden on small screens) --- */}
            <aside 
                className={`fixed top-0 left-0 h-full bg-[#0d1b2a] border-r border-slate-800 text-gray-300 transition-all duration-300 max-sm:hidden
                    ${showFullSidebar ? 'w-64' : 'w-16'}
                    ${isHovered && !isExpanded ? 'z-[60] shadow-2xl shadow-black/50' : 'z-50'}
                `}
                onMouseEnter={() => { if (!isExpanded) setIsHovered(true); }}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex flex-col h-full">
                    <div className="p-3 flex items-center border-b border-slate-800 h-[61px] flex-shrink-0">
                        <span className={`font-bold text-xl text-white whitespace-nowrap overflow-hidden transition-all duration-200 ${showFullSidebar ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>StockPro</span>
                        <button onClick={() => onToggleExpand(!isExpanded)} className={`p-1 hover:bg-slate-800 rounded-lg transition-all ${isExpanded ? 'ml-auto' : 'mx-auto'}`}>
                            <i data-lucide={isExpanded ? "chevrons-left" : "chevrons-right"} className="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <nav className="mt-4 flex-1 flex flex-col gap-2 px-3 overflow-y-auto">
                        {desktopNavItems.map(item => (
                            <DesktopNavLink key={item.key} item={item} isActive={activeView === item.key} showFullSidebar={showFullSidebar} onClick={() => onNavigate(item.key)} />
                        ))}
                    </nav>

                    <div className="border-t border-slate-800 p-3 mt-auto flex-shrink-0">
                        <div className={`flex items-center gap-3 ${showFullSidebar ? '' : 'justify-center'}`}>
                            <i data-lucide="user-round" className="w-8 h-8 flex-shrink-0"></i>
                            <div className={`overflow-hidden transition-all duration-200 ${showFullSidebar ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                                <p className="text-sm font-medium text-white whitespace-nowrap">{user.username}</p>
                                <p className="text-xs text-sky-400 capitalize whitespace-nowrap">{user.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className={`w-full mt-3 flex items-center gap-4 p-3 rounded-lg transition-colors group hover:bg-red-900/50 text-red-400 ${showFullSidebar ? '' : 'justify-center'}`}
                        >
                            <i data-lucide="log-out" className="w-5 h-5 flex-shrink-0"></i>
                            <span className={`whitespace-nowrap transition-opacity duration-200 ${showFullSidebar ? 'opacity-100' : 'opacity-0 hidden'}`}>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MOBILE BOTTOM BAR (visible only on small screens) --- */}
            <nav className="sm:hidden fixed bottom-0 left-0 w-full bg-[#0d1b2a] border-t border-slate-800 z-40">
                <div className="flex justify-around items-center h-20 max-w-lg mx-auto">
                    {mobilePrimaryItems.map(item => (
                        <BottomNavItem
                            key={item.key}
                            item={item}
                            isActive={activeView === item.key}
                            onClick={(e) => { e.preventDefault(); handleMobileNavigate(item.key); }}
                        />
                    ))}
                    {mobileMoreItems.length > 0 ? (
                        <div className="relative flex-1 flex justify-center">
                            <BottomNavItem
                                item={moreNavItem}
                                isActive={isMoreMenuOpen || isMoreSectionActive}
                                onClick={(e) => { e.preventDefault(); setIsMoreMenuOpen(o => !o); }}
                            />
                            {isMoreMenuOpen && renderMoreMenu()}
                        </div>
                    ) : (
                        // When no More menu, show user profile with logout
                        <div className="relative flex-1 flex justify-center">
                            <BottomNavItem
                                item={{ key: 'profile', label: 'Profile', icon: 'user-round' }}
                                isActive={isMoreMenuOpen}
                                onClick={(e) => { e.preventDefault(); setIsMoreMenuOpen(o => !o); }}
                            />
                            {isMoreMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[160px] z-50">
                                    <div className="px-4 py-3 border-b border-gray-700">
                                        <p className="text-sm font-medium text-white">{user.username}</p>
                                        <p className="text-xs text-sky-400 capitalize">{user.role}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMoreMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-900/50 text-red-400 rounded-b-lg transition-colors"
                                    >
                                        <i data-lucide="log-out" className="w-5 h-5"></i>
                                        <span className="text-sm">Logout</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navigation;