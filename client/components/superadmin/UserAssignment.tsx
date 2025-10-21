import React, { useState, useEffect } from 'react';
import { Admin, User } from '../../types/index';
import { getAllAdmins, getAllUsersForSuperAdmin, assignUsersToAdmin } from '../../services/superadminApi';
import { 
  SpinnerIcon, 
  CheckCircleIcon, 
  ExclamationIcon,
  UserIcon,
  UsersIcon
} from '../ui/icons';

const UserAssignment: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [adminsData, usersData] = await Promise.all([
        getAllAdmins(),
        getAllUsersForSuperAdmin()
      ]);
      setAdmins(adminsData);
      setUsers(usersData.filter(user => user.role === 'user')); // Only regular users
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignUsers = async () => {
    if (!selectedAdmin || selectedUsers.length === 0) return;

    try {
      setIsAssigning(true);
      setError(null);
      await assignUsersToAdmin(selectedAdmin._id!, selectedUsers);
      setSuccess(`Successfully assigned ${selectedUsers.length} users to ${selectedAdmin.username}`);
      setSelectedUsers([]);
      fetchData(); // Refresh data
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getAssignedAdmins = (user: User) => {
    return user.assignedAdmins || [];
  };

  const getUsersByCreator = (creatorUsername: string) => {
    return users.filter(user => user.createdBy === creatorUsername);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerIcon className="w-8 h-8 text-sky-400" />
        <span className="ml-2 text-gray-400">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">User Assignment</h2>
        <p className="text-gray-400">Assign users to administrators for management</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Selection */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Administrator</h3>
          
          {admins.length === 0 ? (
            <p className="text-gray-400">No administrators available</p>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <label
                  key={admin.username}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAdmin?.username === admin.username
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedAdmin"
                    checked={selectedAdmin?.username === admin.username}
                    onChange={() => setSelectedAdmin(admin)}
                    className="sr-only"
                  />
                  <UserIcon className="w-6 h-6" />
                  <div>
                    <div className="font-medium">{admin.username}</div>
                    <div className="text-sm opacity-75">
                      {getUsersByCreator(admin.username).length} users created
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* User Selection */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Users to Assign</h3>
          
          {users.length === 0 ? (
            <p className="text-gray-400">No users available</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map((user) => {
                const assignedAdmins = getAssignedAdmins(user);
                const isAlreadyAssigned = selectedAdmin && assignedAdmins.includes(selectedAdmin.username);
                
                return (
                  <label
                    key={user.username}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(user._id!)
                        ? 'bg-sky-600 text-white'
                        : isAlreadyAssigned
                        ? 'bg-green-900/50 text-green-200'
                        : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                    } ${isAlreadyAssigned ? 'cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id!)}
                      onChange={() => toggleUserSelection(user._id!)}
                      disabled={isAlreadyAssigned}
                      className="w-4 h-4 text-sky-600 bg-slate-600 border-slate-500 rounded focus:ring-sky-500 disabled:opacity-50"
                    />
                    <UserIcon className="w-6 h-6" />
                    <div className="flex-1">
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm opacity-75">
                        Created by: {user.createdBy || 'System'}
                      </div>
                      {assignedAdmins.length > 0 && (
                        <div className="text-sm opacity-75">
                          Assigned to: {assignedAdmins.join(', ')}
                        </div>
                      )}
                    </div>
                    {isAlreadyAssigned && (
                      <span className="text-xs bg-green-700 px-2 py-1 rounded">
                        Already Assigned
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assignment Action */}
      {selectedAdmin && selectedUsers.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-white">Assignment Summary</h4>
              <p className="text-gray-400">
                Assign {selectedUsers.length} user(s) to {selectedAdmin.username}
              </p>
            </div>
            <button
              onClick={handleAssignUsers}
              disabled={isAssigning}
              className="flex items-center gap-2 bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning ? (
                <>
                  <SpinnerIcon className="w-5 h-5" />
                  Assigning...
                </>
              ) : (
                <>
                  <UsersIcon className="w-5 h-5" />
                  Assign Users
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Current Assignments Overview */}
      <div className="bg-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Assignments</h3>
        
        {admins.length === 0 ? (
          <p className="text-gray-400">No administrators to show assignments for</p>
        ) : (
          <div className="space-y-4">
            {admins.map((admin) => {
              const createdUsers = getUsersByCreator(admin.username);
              const assignedUsers = users.filter(user => 
                getAssignedAdmins(user).includes(admin.username)
              );
              
              return (
                <div key={admin.username} className="border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserIcon className="w-6 h-6 text-sky-400" />
                    <h4 className="font-semibold text-white">{admin.username}</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h5 className="font-medium text-gray-300 mb-2">Created Users ({createdUsers.length})</h5>
                      {createdUsers.length === 0 ? (
                        <p className="text-gray-500">No users created</p>
                      ) : (
                        <ul className="space-y-1">
                          {createdUsers.map(user => (
                            <li key={user.username} className="text-gray-400">
                              {user.username}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-300 mb-2">Assigned Users ({assignedUsers.length})</h5>
                      {assignedUsers.length === 0 ? (
                        <p className="text-gray-500">No users assigned</p>
                      ) : (
                        <ul className="space-y-1">
                          {assignedUsers.map(user => (
                            <li key={user.username} className="text-gray-400">
                              {user.username} <span className="text-gray-600">(by {user.createdBy})</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAssignment;
