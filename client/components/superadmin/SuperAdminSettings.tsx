import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  CogIcon, 
  CheckCircleIcon, 
  ExclamationIcon,
  KeyIcon,
  UserIcon,
  InfoIcon
} from '../ui/icons';

const SuperAdminSettings: React.FC = () => {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      // TODO: Implement password change API call
      // await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">SuperAdmin Settings</h2>
        <p className="text-gray-400">Manage your SuperAdmin account settings and system configuration</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center gap-3">
          <ExclamationIcon className="w-5 h-5 text-red-400" />
          <span className="text-red-200">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 flex items-center gap-3">
          <CheckCircleIcon className="w-5 h-5 text-green-400" />
          <span className="text-green-200">{success}</span>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          Account Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
              {user?.username}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
            <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                SuperAdmin
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Permissions</label>
            <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
              Full system access - All features and administrative functions
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <KeyIcon className="w-5 h-5" />
          Security Settings
        </h3>

        {!isChangingPassword ? (
          <div>
            <p className="text-gray-400 mb-4">
              Keep your account secure by regularly updating your password.
            </p>
            <button
              onClick={() => setIsChangingPassword(true)}
              className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
            >
              <KeyIcon className="w-4 h-4" />
              Change Password
            </button>
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
                minLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                Update Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setError(null);
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* System Information */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CogIcon className="w-5 h-5" />
          System Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Application Version</label>
            <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
              EcomManager v1.0.0
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Environment</label>
            <div className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">
              {import.meta.env.MODE || 'development'}
            </div>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <InfoIcon className="w-5 h-5 text-blue-400" />
          Important Notes
        </h3>
        
        <div className="space-y-3 text-sm text-blue-200">
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
            <p>
              As a SuperAdmin, you have complete control over the system including the ability to create, 
              modify, and delete administrator accounts.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
            <p>
              You can assign specific menu items to administrators to control their access to different 
              parts of the application.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
            <p>
              Regular users can be assigned to specific administrators for management, creating a 
              hierarchical user structure.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
            <p>
              Always keep your SuperAdmin credentials secure and consider changing the default password 
              if you haven't already done so.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
