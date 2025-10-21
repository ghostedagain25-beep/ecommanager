import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import * as api from '../../../services/api';
import { CancelIcon, SaveIcon, SpinnerIcon, UserIcon, KeyIcon } from '../../ui/icons';
import type { User, UserRole } from '../../../types/index';

interface NewUserFormProps {
  onSave: () => void;
  onCancel: () => void;
}

const NewUserForm: React.FC<NewUserFormProps> = ({ onSave, onCancel }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    syncsRemaining: 10,
    role: 'user' as UserRole,
    maxWebsites: 1,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Clear errors when user types
    if (name === 'username') {
      setUsernameError('');
    }
    if (name === 'password' || name === 'confirmPassword') {
      setPasswordError('');
    }
    setError('');

    const finalValue =
      name === 'syncsRemaining' || name === 'maxWebsites' ? parseInt(value, 10) : value;
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const validateUsername = async (username: string): Promise<boolean> => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      return false;
    }

    try {
      const exists = await api.checkUsernameExists(username.trim());
      if (exists) {
        setUsernameError(`Username "${username}" is already taken`);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Username check error:', err);
      // Don't block submission on network errors
      return true;
    }
  };

  const validatePassword = (): boolean => {
    if (!formData.password) {
      setPasswordError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate all fields
      const isUsernameValid = await validateUsername(formData.username);
      const isPasswordValid = validatePassword();

      if (!isUsernameValid || !isPasswordValid) {
        setIsLoading(false);
        return;
      }

      // Create user
      const userData: User = {
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role,
        syncsRemaining: formData.syncsRemaining,
        maxWebsites: formData.maxWebsites,
      };

      await api.addUser(userData);
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900/50 rounded-lg space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-white">Add New User</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 text-white bg-gray-700 border rounded-md focus:ring-sky-500 focus:border-sky-500 ${
                  usernameError ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter username"
              />
            </div>
            {usernameError && <p className="mt-1 text-sm text-red-400">{usernameError}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 text-white bg-gray-700 border rounded-md focus:ring-sky-500 focus:border-sky-500 ${
                  passwordError ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Enter password"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`w-full pl-10 pr-4 py-2 text-white bg-gray-700 border rounded-md focus:ring-sky-500 focus:border-sky-500 ${
                  passwordError ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Confirm password"
              />
            </div>
            {passwordError && <p className="mt-1 text-sm text-red-400">{passwordError}</p>}
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
          <div>
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
            Create User
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewUserForm;
