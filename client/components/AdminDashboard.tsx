import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
// FIX: Update import path for types.
import type { User } from '../types/index';
import Navigation from './Navigation';
import UserTable from './admin/user-management/UserTable';
import NewUserForm from './admin/user-management/NewUserForm';
import UserEditForm from './admin/user-management/UserEditForm';
import UserMenuSettings from './admin/user-management/UserMenuSettings';
import WorkflowDashboard from './WorkflowDashboard';
import DatabaseExplorer from './DatabaseExplorer';
import AdminSettings from './AdminSettings';
import AdminSyncHistory from './AdminSyncHistory';
// FIX: Updated import for OrderViewer to use a named import from its new location.
import { OrderViewer } from './orders/OrderViewer';
import ProductManager from './ProductManager';
import CategoryManager from './CategoryManager';
import AdminWebsiteManager from './admin/website-management/AdminWebsiteManager';
import QuickGuide from './QuickGuide';
import {
  SpinnerIcon,
  ExclamationIcon,
  UsersIcon,
  SearchIcon,
  ClipboardListIcon,
  InfoIcon,
} from './icons';

type UserManagementView = 'list' | 'form' | 'websites' | 'menu_settings';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser, loginAsUser } = useAuth();

  const [view, setView] = useState<UserManagementView>('list');
  const [userForWebsites, setUserForWebsites] = useState<User | null>(null);
  const [userForMenu, setUserForMenu] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const lowercasedFilter = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(lowercasedFilter) ||
        user.role.toLowerCase().includes(lowercasedFilter),
    );
  }, [users, searchTerm]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setView('form');
  };

  const handleDelete = async (username: string) => {
    if (
      window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)
    ) {
      try {
        await api.deleteUser(username);
        fetchUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user.');
      }
    }
  };

  const handleLoginAs = (username: string) => {
    if (
      window.confirm(
        `You are about to log in as "${username}". This will log you out of your admin account. Proceed?`,
      )
    ) {
      try {
        loginAsUser(username);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to log in as user.');
      }
    }
  };

  const handleAddNew = () => {
    setSelectedUser(null);
    setView('form');
  };

  const handleSave = () => {
    setView('list');
    setSelectedUser(null);
    fetchUsers();
  };

  const handleCancel = () => {
    setView('list');
    setSelectedUser(null);
  };

  const handleManageWebsites = (user: User) => {
    setUserForWebsites(user);
    setView('websites');
  };

  const handleBackFromWebsites = () => {
    setUserForWebsites(null);
    setView('list');
  };

  const handleManageMenu = (user: User) => {
    setUserForMenu(user);
    setView('menu_settings');
  };

  const handleBackFromMenu = () => {
    setUserForMenu(null);
    setView('list');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <SpinnerIcon className="w-8 h-8 text-sky-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"
        role="alert"
      >
        <ExclamationIcon className="w-5 h-5 mr-3" />
        {error}
      </div>
    );
  }

  const renderUserManagementContent = () => {
    switch (view) {
      case 'form':
        if (selectedUser) {
          return <UserEditForm user={selectedUser} onSave={handleSave} onCancel={handleCancel} />;
        } else {
          return <NewUserForm onSave={handleSave} onCancel={handleCancel} />;
        }
      case 'websites':
        return <AdminWebsiteManager />;
      case 'menu_settings':
        if (!userForMenu) return null;
        return <UserMenuSettings user={userForMenu} onBack={handleBackFromMenu} />;
      case 'list':
      default:
        if (!currentUser) return null;
        return (
          <>
            <header className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">User Management</h2>
              <button
                onClick={handleAddNew}
                className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors"
              >
                <UsersIcon className="w-5 h-5 mr-2" />
                Add New User
              </button>
            </header>
            <div className="mb-4 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search users by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <UserTable
              users={filteredUsers}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageWebsites={handleManageWebsites}
              onManageMenu={handleManageMenu}
              onLoginAs={handleLoginAs}
              currentUser={currentUser}
            />
          </>
        );
    }
  };

  return <div>{renderUserManagementContent()}</div>;
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('products');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    // After mounting, call `lucide.createIcons()` to render the icons
    const timer = setTimeout(() => {
      if (typeof (window as any).lucide !== 'undefined') {
        (window as any).lucide.createIcons();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeView, isSidebarExpanded]);

  // Minimal inline Push History view
  const PushHistoryInline: React.FC = () => {
    const [summaries, setSummaries] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [details, setDetails] = useState<any[] | null>(null);
    const [isLoadingSummaries, setIsLoadingSummaries] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchSummaries = async () => {
        setIsLoadingSummaries(true);
        setError(null);
        try {
          const data = await api.getAllPushSummaries();
          setSummaries(data || []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load push summaries.');
        } finally {
          setIsLoadingSummaries(false);
        }
      };
      fetchSummaries();
    }, []);

    const handleViewDetails = useCallback(
      async (summary: any) => {
        if (selected?._id === summary._id) {
          setSelected(null);
          setDetails(null);
          return;
        }
        setSelected(summary);
        setIsLoadingDetails(true);
        setError(null);
        setDetails(null);
        try {
          const data = await api.getPushDetailsById(summary._id);
          setDetails(data || []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load push details.');
        } finally {
          setIsLoadingDetails(false);
        }
      },
      [selected],
    );

    if (isLoadingSummaries) {
      return (
        <div className="flex justify-center items-center h-full">
          <SpinnerIcon className="w-8 h-8 text-sky-400" />
          <p className="ml-4 text-sky-300">Loading Push Jobs...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div
          className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"
          role="alert"
        >
          <ExclamationIcon className="w-5 h-5 mr-3" />
          <span className="font-medium">Error:</span> {error}
        </div>
      );
    }
    if (!summaries.length) {
      return (
        <div className="flex flex-col items-center justify-center p-10 bg-gray-900/50 rounded-lg">
          <InfoIcon className="w-8 h-8 text-gray-500" />
          <p className="mt-3 text-gray-400">No push jobs found.</p>
        </div>
      );
    }
    return (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-semibold text-white mb-6">Push History</h2>
        <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/50">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Processed
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Pushed
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {summaries.map((s: any) => (
                <React.Fragment key={s._id}>
                  <tr className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {s.user_username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(s.push_timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{s.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-300 text-center">
                      {s.total_processed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 text-center">
                      {s.total_pushed}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-center ${s.total_errors > 0 ? 'text-red-400' : 'text-gray-400'}`}
                    >
                      {s.total_errors}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(s)}
                        className="text-sky-400 hover:text-sky-300 disabled:text-gray-500 disabled:cursor-wait"
                        disabled={isLoadingDetails && selected?._id === s._id}
                      >
                        <ClipboardListIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                  {selected?._id === s._id && (
                    <tr>
                      <td colSpan={7} className="p-4 bg-gray-900">
                        {isLoadingDetails && (
                          <div className="flex justify-center items-center py-4">
                            <SpinnerIcon className="w-6 h-6 text-sky-400" />
                            <span className="ml-3 text-gray-300">Loading details...</span>
                          </div>
                        )}
                        {details && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                              <thead className="bg-gray-700/50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    SKU
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Product
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Action
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Changes
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-gray-800 divide-y divide-gray-700">
                                {details.map((d: any, idx: number) => (
                                  <tr key={idx}>
                                    <td className="px-4 py-2 text-sm text-white">{d.sku}</td>
                                    <td className="px-4 py-2 text-sm text-gray-300">
                                      {d.product_name || '-'}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-300">{d.action}</td>
                                    <td className="px-4 py-2 text-sm text-gray-300">{d.status}</td>
                                    <td className="px-4 py-2 text-sm text-gray-300 whitespace-pre-wrap break-all">
                                      {d.changes_json || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'users':
        return <UserManagement />;
      case 'websites':
        return <AdminWebsiteManager />;
      case 'orders':
        return <OrderViewer />;
      case 'products':
        return <ProductManager isAdminView={true} />;
      case 'categories':
        return <CategoryManager isAdminView={true} />;
      case 'history':
        return <AdminSyncHistory />;
      case 'pushes':
        return <PushHistoryInline />;
      case 'database':
        return <DatabaseExplorer />;
      case 'settings':
        return <AdminSettings />;
      case 'quick_guide':
        return <QuickGuide />;
      default:
        return <h1>Admin View: {activeView}</h1>;
    }
  };

  if (!user) return null;

  return (
    <div className="relative min-h-screen">
      <Navigation
        role="admin"
        activeView={activeView}
        onNavigate={setActiveView}
        user={user}
        logout={logout}
        isExpanded={isSidebarExpanded}
        onToggleExpand={setIsSidebarExpanded}
      />
      <div
        className={`pb-24 sm:pb-0 transition-all duration-300 ${isSidebarExpanded ? 'sm:ml-64' : 'sm:ml-16'}`}
      >
        <main className="p-4 sm:p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
