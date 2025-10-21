import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import * as api from '../../../services/api';
import { CancelIcon, SaveIcon, SpinnerIcon, UserIcon, KeyIcon } from '../../ui/icons';
import type { User, UserRole } from '../../../types/index';

interface UserEditFormProps {
  user: User;
  onSave: () => void;
  onCancel: () => void;
}

const UserEditForm: React.FC<UserEditFormProps> = ({ user, onSave, onCancel }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: user.username,
    password: '',
    syncsRemaining: user.syncsRemaining,
    role: user.role,
    maxWebsites: user.maxWebsites || 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setError('');
    const finalValue =
      name === 'syncsRemaining' || name === 'maxWebsites' ? parseInt(value, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const updateData: Partial<User> = {
        syncsRemaining: formData.syncsRemaining,
        role: formData.role,
        maxWebsites: formData.maxWebsites,
      };

      // Only include password if it's provided
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await api.updateUser(user.username, updateData);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900/50 rounded-lg space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-white">Editing {user.username}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full pl-10 pr-4 py-2 text-gray-400 bg-gray-600 border border-gray-600 rounded-md cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Username cannot be changed</p>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={user.username === currentUser?.username}
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {user.username === currentUser?.username && (
              <p className="mt-1 text-xs text-gray-500">You cannot change your own role</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          {/* Syncs Remaining */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Syncs Remaining</label>
            <input
              type="number"
              name="syncsRemaining"
              value={formData.syncsRemaining}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Maximum Websites */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Maximum Websites</label>
            <input
              type="number"
              name="maxWebsites"
              value={formData.maxWebsites}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors"
          >
            <CancelIcon className="w-5 h-5 mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600"
          >
            {isLoading ? (
              <SpinnerIcon className="w-5 h-5 mr-2" />
            ) : (
              <SaveIcon className="w-5 h-5 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserEditForm;
