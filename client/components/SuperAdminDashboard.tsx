import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from './Navigation';
import AdminManagement from './superadmin/AdminManagement';
import UserAssignment from './superadmin/UserAssignment';
import MenuItemManagement from './superadmin/MenuItemManagement';
import SuperAdminSettings from './superadmin/SuperAdminSettings';
import { 
  UsersIcon, 
  CogIcon, 
  ClipboardListIcon,
  UserIcon
} from './ui/icons';

type SuperAdminView = 'admin_management' | 'user_assignment' | 'menu_management' | 'settings';

const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState<SuperAdminView>('admin_management');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-[#1b2735] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400">You don't have permission to access this area.</p>
        </div>
      </div>
    );
  }

  const superAdminNavItems = [
    { key: 'admin_management', label: 'Admin Management', icon: 'users-round' },
    { key: 'user_assignment', label: 'User Assignment', icon: 'user' },
    { key: 'menu_management', label: 'Menu Management', icon: 'list-checks' },
    { key: 'settings', label: 'Settings', icon: 'settings-2' }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'admin_management':
        return <AdminManagement />;
      case 'user_assignment':
        return <UserAssignment />;
      case 'menu_management':
        return <MenuItemManagement />;
      case 'settings':
        return <SuperAdminSettings />;
      default:
        return <AdminManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1b2735] text-gray-100">
      {/* Custom SuperAdmin Navigation */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#0d1b2a] border-r border-slate-800 text-gray-300 transition-all duration-300 max-sm:hidden z-50 ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-3 flex items-center border-b border-slate-800 h-[61px] flex-shrink-0">
            <span
              className={`font-bold text-xl text-white whitespace-nowrap overflow-hidden transition-all duration-200 ${
                isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
              }`}
            >
              SuperAdmin
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-1 hover:bg-slate-800 rounded-lg transition-all ${
                isExpanded ? 'ml-auto' : 'mx-auto'
              }`}
            >
              <CogIcon className="w-5 h-5" />
            </button>
          </div>

          <nav className="mt-4 flex-1 flex flex-col gap-2 px-3 overflow-y-auto">
            {superAdminNavItems.map((item) => (
              <a
                key={item.key}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveView(item.key as SuperAdminView);
                }}
                className={`relative flex items-center rounded-lg transition-colors group ${
                  activeView === item.key
                    ? 'bg-sky-600 text-white'
                    : 'hover:bg-slate-800 text-gray-300'
                } ${isExpanded ? 'gap-4 p-3' : 'justify-center p-3'}`}
              >
                {item.icon === 'users-round' && <UsersIcon className="w-5 h-5 flex-shrink-0" />}
                {item.icon === 'user' && <UserIcon className="w-5 h-5 flex-shrink-0" />}
                {item.icon === 'list-checks' && <ClipboardListIcon className="w-5 h-5 flex-shrink-0" />}
                {item.icon === 'settings-2' && <CogIcon className="w-5 h-5 flex-shrink-0" />}
                <span
                  className={`transition-all duration-200 whitespace-nowrap overflow-hidden ${
                    isExpanded ? 'opacity-100 w-auto ml-3' : 'opacity-0 w-0'
                  }`}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </nav>

          <div className="border-t border-slate-800 p-3 mt-auto flex-shrink-0">
            <div className={`flex items-center gap-3 ${isExpanded ? '' : 'justify-center'}`}>
              <UserIcon className="w-8 h-8 flex-shrink-0" />
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'
                }`}
              >
                <p className="text-sm font-medium text-white whitespace-nowrap">{user.username}</p>
                <p className="text-xs text-sky-400 capitalize whitespace-nowrap">{user.role}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className={`w-full mt-3 flex items-center gap-4 p-3 rounded-lg transition-colors group hover:bg-red-900/50 text-red-400 ${
                isExpanded ? '' : 'justify-center'
              }`}
            >
              <span className="text-sm">🚪</span>
              <span
                className={`whitespace-nowrap transition-opacity duration-200 ${
                  isExpanded ? 'opacity-100' : 'opacity-0 hidden'
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-16'} max-sm:ml-0`}>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">SuperAdmin Dashboard</h1>
            <p className="text-gray-400">
              Manage administrators, assign users, and configure system permissions.
            </p>
          </div>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
