import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import * as api from '../../../services/api';
// FIX: Update import path for types.
import type { User } from '../../../types/index';
import UserTable from './UserTable';
import NewUserForm from './NewUserForm';
import UserEditForm from './UserEditForm';
import AdminWebsiteManager from '../../admin/website-management/AdminWebsiteManager';
import UserMenuSettings from './UserMenuSettings';
import { SpinnerIcon, ExclamationIcon, UsersIcon, SearchIcon } from '../../ui/icons';
import { ConfirmationModal } from '../../ui/ConfirmationModal';

type UserManagementView = 'list' | 'form' | 'websites' | 'menu_settings';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser, loginAsUser } = useAuth();

  const [view, setView] = useState<UserManagementView>('list');
  const [userForWebsites, setUserForWebsites] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
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

  const handleDelete = (user: User) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setError(null);
    try {
      await api.deleteUser(userToDelete.username);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
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

  return (
    <div>
      {renderUserManagementContent()}
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message={
          <>
            Are you sure you want to delete the user <strong>{userToDelete?.username}</strong>? This
            action cannot be undone.
          </>
        }
        confirmText="Delete"
        isConfirming={isDeleting}
      />
    </div>
  );
};

export default UserManagement;
