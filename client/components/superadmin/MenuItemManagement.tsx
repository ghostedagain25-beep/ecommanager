import React, { useState, useEffect } from 'react';
import { Admin, MenuItem } from '../../types/index';
import { getAllAdmins, updateAdmin, getAvailableMenuItems } from '../../services/superadminApi';
import { 
  SpinnerIcon, 
  CheckCircleIcon, 
  ExclamationIcon,
  UserIcon,
  CogIcon,
  ClipboardListIcon
} from '../ui/icons';

const MenuItemManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [adminsData, menuItemsData] = await Promise.all([
        getAllAdmins(),
        getAvailableMenuItems()
      ]);
      setAdmins(adminsData);
      setMenuItems(menuItemsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuItemToggle = (itemKey: string) => {
    if (!selectedAdmin) return;

    const currentItems = selectedAdmin.allowedMenuItems || [];
    const updatedItems = currentItems.includes(itemKey)
      ? currentItems.filter(key => key !== itemKey)
      : [...currentItems, itemKey];

    setSelectedAdmin({
      ...selectedAdmin,
      allowedMenuItems: updatedItems
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedAdmin) return;

    try {
      setIsSaving(true);
      setError(null);
      
      await updateAdmin(selectedAdmin._id!, {
        allowedMenuItems: selectedAdmin.allowedMenuItems
      });

      // Update the admin in the local state
      setAdmins(prev => prev.map(admin => 
        admin._id === selectedAdmin._id 
          ? { ...admin, allowedMenuItems: selectedAdmin.allowedMenuItems }
          : admin
      ));

      setSuccess(`Menu permissions updated for ${selectedAdmin.username}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectAllMenuItems = () => {
    if (!selectedAdmin) return;
    setSelectedAdmin({
      ...selectedAdmin,
      allowedMenuItems: menuItems.map(item => item.key)
    });
  };

  const deselectAllMenuItems = () => {
    if (!selectedAdmin) return;
    setSelectedAdmin({
      ...selectedAdmin,
      allowedMenuItems: []
    });
  };

  const getMenuItemsByCategory = () => {
    const categories = {
      'Core Features': ['orders', 'products', 'categories', 'websites'],
      'User Management': ['users'],
      'System': ['workflow', 'history', 'pushes', 'database', 'settings'],
      'Help': ['quick_guide']
    };

    return categories;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerIcon className="w-8 h-8 text-sky-400" />
        <span className="ml-2 text-gray-400">Loading menu items...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Menu Item Management</h2>
        <p className="text-gray-400">Configure which menu items each administrator can access</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Selection */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Administrator</h3>
          
          {admins.length === 0 ? (
            <p className="text-gray-400">No administrators available</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <button
                  key={admin.username}
                  onClick={() => setSelectedAdmin(admin)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    selectedAdmin?.username === admin.username
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                  }`}
                >
                  <UserIcon className="w-6 h-6" />
                  <div>
                    <div className="font-medium">{admin.username}</div>
                    <div className="text-sm opacity-75">
                      {admin.allowedMenuItems?.length || 0} items allowed
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Items Configuration */}
        <div className="lg:col-span-2">
          {selectedAdmin ? (
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Menu Permissions for {selectedAdmin.username}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllMenuItems}
                    className="px-3 py-1 text-sm bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllMenuItems}
                    className="px-3 py-1 text-sm bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(getMenuItemsByCategory()).map(([category, itemKeys]) => (
                  <div key={category}>
                    <h4 className="text-md font-medium text-gray-300 mb-3">{category}</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {menuItems
                        .filter(item => itemKeys.includes(item.key))
                        .map((item) => (
                          <label
                            key={item.key}
                            className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAdmin.allowedMenuItems?.includes(item.key) || false}
                              onChange={() => handleMenuItemToggle(item.key)}
                              className="w-4 h-4 text-sky-600 bg-slate-600 border-slate-500 rounded focus:ring-sky-500"
                            />
                            <ClipboardListIcon className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <div className="text-white font-medium">{item.label}</div>
                              <div className="text-gray-400 text-sm">{item.description}</div>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-700">
                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <SpinnerIcon className="w-5 h-5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg p-6 text-center">
              <ClipboardListIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Select an Administrator</h3>
              <p className="text-gray-400">
                Choose an administrator from the list to configure their menu permissions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Overview */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Permissions Overview</h3>
        
        {admins.length === 0 ? (
          <p className="text-gray-400">No administrators to show permissions for</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-gray-300">Administrator</th>
                  <th className="text-left py-3 px-4 text-gray-300">Allowed Items</th>
                  <th className="text-left py-3 px-4 text-gray-300">Total Access</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.username} className="border-b border-slate-700/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-sky-400" />
                        <span className="text-white font-medium">{admin.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(admin.allowedMenuItems || []).map((itemKey) => {
                          const item = menuItems.find(mi => mi.key === itemKey);
                          return (
                            <span
                              key={itemKey}
                              className="px-2 py-1 bg-sky-600/20 text-sky-300 text-xs rounded"
                            >
                              {item?.label || itemKey}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-400">
                        {admin.allowedMenuItems?.length || 0} / {menuItems.length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemManagement;
