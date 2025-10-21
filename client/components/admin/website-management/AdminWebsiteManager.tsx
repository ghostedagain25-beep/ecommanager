import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWebsite } from '../../../context/WebsiteContext';
import * as api from '../../../services/api';
import { WebsiteSelector } from '../../common/WebsiteSelector';
import type { User, Website } from '../../../types/index';
import { SpinnerIcon, ExclamationIcon, UsersIcon, GlobeIcon, PlusIcon } from '../../ui/icons';

const AdminWebsiteManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { selectedUser, setSelectedUser, websites, selectedWebsite, refreshWebsites } =
    useWebsite();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all users for admin selection
  useEffect(() => {
    const loadUsers = async () => {
      if (currentUser?.role !== 'admin') return;

      try {
        setIsLoading(true);
        const allUsers = await api.getUsers();
        setUsers(allUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [currentUser]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setError(null);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 bg-red-900/20 rounded-lg border border-red-500">
        <div className="flex items-center">
          <ExclamationIcon className="w-5 h-5 text-red-400 mr-3" />
          <span className="text-red-400">Access denied. Admin privileges required.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SpinnerIcon className="w-8 h-8 text-sky-400" />
        <span className="ml-3 text-gray-300">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center">
          <GlobeIcon className="w-8 h-8 mr-3 text-sky-400" />
          Website Management
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 rounded-lg border border-red-500">
          <div className="flex items-center">
            <ExclamationIcon className="w-5 h-5 text-red-400 mr-3" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Selection Panel */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <UsersIcon className="w-5 h-5 mr-2 text-sky-400" />
            Select User
          </h2>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.username}
                onClick={() => handleUserSelect(user)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedUser?.username === user.username
                    ? 'bg-sky-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm opacity-75 capitalize">{user.role}</div>
                  </div>
                  <div className="text-xs opacity-75">{user.websiteCount || 0} sites</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Website Selection Panel */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <GlobeIcon className="w-5 h-5 mr-2 text-sky-400" />
            User's Websites
          </h2>

          {!selectedUser ? (
            <div className="text-gray-400 text-center py-8">
              Select a user to view their websites
            </div>
          ) : (
            <div className="space-y-4">
              <WebsiteSelector
                showLabel={false}
                compact={true}
                className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-sky-500 focus:border-sky-500 w-full"
              />

              <div className="space-y-2">
                {websites.map((website) => (
                  <div
                    key={website.id || website._id}
                    className={`p-3 rounded-md border transition-colors ${
                      selectedWebsite?.id === website.id || selectedWebsite?._id === website._id
                        ? 'bg-sky-900/30 border-sky-500'
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{website.name}</div>
                        <div className="text-sm text-gray-400">{website.platform}</div>
                        <div className="text-xs text-gray-500 break-all">{website.url}</div>
                      </div>
                      {website.is_primary && (
                        <span className="text-xs bg-sky-600 text-white px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {websites.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No websites found for this user
                </div>
              )}
            </div>
          )}
        </div>

        {/* Website Details Panel */}
        <div className="bg-gray-900/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <GlobeIcon className="w-5 h-5 mr-2 text-sky-400" />
            Website Details
          </h2>

          {!selectedWebsite ? (
            <div className="text-gray-400 text-center py-8">Select a website to view details</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <div className="p-2 bg-gray-700 rounded text-white">{selectedWebsite.name}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Platform</label>
                <div className="p-2 bg-gray-700 rounded text-white capitalize">
                  {selectedWebsite.platform}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">URL</label>
                <div className="p-2 bg-gray-700 rounded text-white break-all">
                  {selectedWebsite.url}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      selectedWebsite.is_primary
                        ? 'bg-sky-600 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {selectedWebsite.is_primary ? 'Primary' : 'Secondary'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Owner</label>
                <div className="p-2 bg-gray-700 rounded text-white">{selectedUser?.username}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWebsiteManager;
