import React, { useState, useEffect } from 'react';
import { Admin, MenuItem } from '../../types/index';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin, getAvailableMenuItems } from '../../services/superadminApi';
import { 
  PlusCircleIcon, 
  SpinnerIcon, 
  CheckCircleIcon, 
  ExclamationIcon,
  Trash2Icon,
  CogIcon,
  UserIcon
} from '../ui/icons';
import { ConfirmationModal } from '../ui/ConfirmationModal';

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    syncsRemaining: 100,
    maxWebsites: 10,
    allowedMenuItems: [] as string[]
  });

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

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      syncsRemaining: 100,
      maxWebsites: 10,
      allowedMenuItems: []
    });
    setEditingAdmin(null);
    setIsCreating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingAdmin) {
        // Update existing admin
        await updateAdmin(editingAdmin._id!, {
          allowedMenuItems: formData.allowedMenuItems,
          syncsRemaining: formData.syncsRemaining,
          maxWebsites: formData.maxWebsites,
          email: formData.email
        });
        setSuccess('Admin updated successfully');
      } else {
        // Create new admin
        await createAdmin(formData);
        setSuccess('Admin created successfully');
      }
      
      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (admin: Admin) => {
    setFormData({
      username: admin.username,
      email: admin.email || '',
      password: '',
      syncsRemaining: admin.syncsRemaining,
      maxWebsites: admin.maxWebsites,
      allowedMenuItems: admin.allowedMenuItems || []
    });
    setEditingAdmin(admin);
    setIsCreating(true);
  };

  const handleDelete = async () => {
    if (!adminToDelete) return;

    try {
      await deleteAdmin(adminToDelete._id!);
      setSuccess('Admin deleted successfully');
      setAdminToDelete(null);
      fetchData();
    } catch (err: any) {
      setError(err.message);
      setAdminToDelete(null);
    }
  };

  const toggleMenuItem = (itemKey: string) => {
    setFormData(prev => ({
      ...prev,
      allowedMenuItems: prev.allowedMenuItems.includes(itemKey)
        ? prev.allowedMenuItems.filter(key => key !== itemKey)
        : [...prev.allowedMenuItems, itemKey]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerIcon className="w-8 h-8 text-sky-400" />
        <span className="ml-2 text-gray-400">Loading admins...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Management</h2>
          <p className="text-gray-400">Create and manage administrator accounts</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
        >
          <PlusCircleIcon className="w-5 h-5" />
          Create Admin
        </button>
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

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">
            {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                  disabled={!!editingAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required={!editingAdmin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Syncs Remaining
                </label>
                <input
                  type="number"
                  value={formData.syncsRemaining}
                  onChange={(e) => setFormData(prev => ({ ...prev, syncsRemaining: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Websites
                </label>
                <input
                  type="number"
                  value={formData.maxWebsites}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxWebsites: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  min="1"
                />
              </div>
            </div>

            {/* Menu Items Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Allowed Menu Items
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {menuItems.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-600 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.allowedMenuItems.includes(item.key)}
                      onChange={() => toggleMenuItem(item.key)}
                      className="w-4 h-4 text-sky-600 bg-slate-600 border-slate-500 rounded focus:ring-sky-500"
                    />
                    <div>
                      <div className="text-white font-medium">{item.label}</div>
                      <div className="text-gray-400 text-sm">{item.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {editingAdmin ? 'Update Admin' : 'Create Admin'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Admins List */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Current Administrators</h3>
        </div>
        
        {admins.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No administrators found. Create your first admin to get started.
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {admins.map((admin) => (
              <div key={admin.username} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <UserIcon className="w-10 h-10 text-sky-400" />
                  <div>
                    <h4 className="font-semibold text-white">{admin.username}</h4>
                    {admin.email && (
                      <p className="text-gray-400 text-sm">{admin.email}</p>
                    )}
                    <p className="text-gray-500 text-sm">
                      {admin.syncsRemaining} syncs • {admin.maxWebsites} max websites
                    </p>
                    <p className="text-gray-500 text-sm">
                      {admin.allowedMenuItems?.length || 0} menu items allowed
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(admin)}
                    className="p-2 text-gray-400 hover:text-sky-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit Admin"
                  >
                    <CogIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setAdminToDelete(admin)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Delete Admin"
                  >
                    <Trash2Icon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!adminToDelete}
        onClose={() => setAdminToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Administrator"
        message={`Are you sure you want to delete the administrator "${adminToDelete?.username}"? This action cannot be undone.`}
        confirmText="Delete Admin"
        isDestructive
      />
    </div>
  );
};

export default AdminManagement;
