import React, { useState, useEffect } from 'react';
import { InfoIcon } from './icons';

const AdminSettings: React.FC = () => {
  const [autoLogin, setAutoLogin] = useState<boolean>(() => {
    return localStorage.getItem('autoLoginAdmin') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('autoLoginAdmin', String(autoLogin));
  }, [autoLogin]);

  const handleToggle = () => {
    setAutoLogin((prev) => !prev);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-semibold text-white mb-6">Admin Settings</h2>
      <div className="max-w-2xl bg-gray-900/50 p-8 rounded-lg space-y-6">
        <div>
          <h3 className="text-lg font-medium text-white">Developer Options</h3>
          <div className="mt-4 p-4 bg-gray-800 rounded-lg flex items-center justify-between">
            <div>
              <label htmlFor="auto-login-toggle" className="font-medium text-gray-200">
                Auto-login as Admin
              </label>
              <p className="text-sm text-gray-400 mt-1">
                On app load, automatically sign in with the 'admin' user.
              </p>
            </div>
            <label
              htmlFor="auto-login-toggle"
              className="inline-flex relative items-center cursor-pointer"
            >
              <input
                type="checkbox"
                id="auto-login-toggle"
                className="sr-only peer"
                checked={autoLogin}
                onChange={handleToggle}
              />
              <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-sky-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>
        </div>

        <div className="mt-6 flex items-start p-4 text-sm text-yellow-300 bg-yellow-900/50 border border-yellow-700 rounded-lg">
          <InfoIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-yellow-400" />
          <div>
            <span className="font-semibold">Warning:</span> This is a temporary developer feature.
            Disabling this will require you to log in manually with the admin credentials ('admin' /
            'eniac').
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
