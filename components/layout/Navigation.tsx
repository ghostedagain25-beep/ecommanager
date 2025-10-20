import React, { useState, useEffect, useRef } from 'react';
// FIX: Update import path for types.
import type { User, UserRole } from '../../types/index';
import { adminNavItems, userNavItems } from '../../config/navigation';

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
const DesktopNavLink: React.FC<{item: NavItem; isActive: boolean; isExpanded: boolean; onClick: () => void;}> = ({ item, isActive, isExpanded, onClick }) => (
    <a
        href="#"
        onClick={(e) => { e.preventDefault(); onClick(); }}
        className={`relative flex items-center gap-4 p-3 rounded-lg transition-colors group ${isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-gray-300'} ${!isExpanded ? 'justify-center' : ''}`}
    >
        <i data-lucide={item.icon} className="w-5 h-5 flex-shrink-0"></i>
        <span className={`transition-opacity duration-200 whitespace-nowrap ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>{item.label}</span>
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
        className={`flex flex-col items-center justify-center flex-1 p-2 rounded-lg transition-colors ${isActive ? 'text-sky-400' : 'text-gray-400 hover:text-white'}`}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
    >
        <i data-lucide={item.icon} className="w-7 h-7"></i>
    </a>
);


const Navigation: React.FC<NavigationProps> = ({ role, activeView, onNavigate, user, logout, isExpanded, onToggleExpand }) => {
    // Mobile state
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const moreMenuRef = useRef<HTMLDivElement>(null);

    // Desktop state
    const [isHovered, setIsHovered] = useState(false);
    
    const getVisibleNavItems = () => {
        if (role === 'admin') {
            return { desktop: adminNavItems, mobilePrimary: adminNavItems.slice(0, 4), mobileMore: adminNavItems.slice(4) };
        }

        const settings = user.menuSettings || {};
        const visibleItems = userNavItems.filter(item => settings[item.key] !== false); // Default to visible

        // Define which items are "primary" for the mobile bottom bar
        const primaryKeys = ['orders', 'products', 'processing', 'history'];
        const mobilePrimary = visibleItems.filter(item => primaryKeys.includes(item.key));
        const mobileMore = visibleItems.filter(item => !primaryKeys.includes(item.key));

        return { desktop: visibleItems, mobilePrimary, mobileMore };
    };

    const { desktop: desktopNavItems, mobilePrimary: mobilePrimaryItems, mobileMore: mobileMoreItems } = getVisibleNavItems();
    
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
                className={`hidden sm:block fixed top-0 left-0 h-full bg-[#0d1b2a] border-r border-slate-800 text-gray-300 z-50 transition-all duration-300
                    ${showFullSidebar ? 'w-64' : 'w-16'}
                    ${isHovered && !isExpanded ? 'shadow-2xl' : ''}
                `}
                onMouseEnter={() => { if (!isExpanded) setIsHovered(true); }}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex flex-col h-full">
                    <div className="p-3 flex items-center border-b border-slate-800 h-[61px] flex-shrink-0">
                        <span className={`font-bold text-xl text-white whitespace-nowrap overflow-hidden transition-all duration-200 ${showFullSidebar ? 'w-auto opacity-100' : 'opacity-0 hidden'}`}>StockPro</span>
                        <button 
                            onClick={() => onToggleExpand(!isExpanded)} 
                            className={`p-1 hover:bg-slate-800 rounded-lg transition-all ${showFullSidebar ? 'ml-auto' : 'mx-auto'}`}
                            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            <i data-lucide={isExpanded ? "chevrons-left" : "chevrons-right"} className="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <nav className="mt-4 flex-1 flex flex-col gap-2 px-3 overflow-y-auto">
                        {desktopNavItems.map(item => (
                            <DesktopNavLink key={item.key} item={item} isActive={activeView === item.key} isExpanded={showFullSidebar} onClick={() => onNavigate(item.key)} />
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
                    {mobileMoreItems.length > 0 && (
                        <div className="relative flex-1 flex justify-center">
                            <BottomNavItem
                                item={moreNavItem}
                                isActive={isMoreMenuOpen || isMoreSectionActive}
                                onClick={(e) => { e.preventDefault(); setIsMoreMenuOpen(o => !o); }}
                            />
                            {isMoreMenuOpen && renderMoreMenu()}
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navigation;