import React from 'react';
// FIX: Update import path for types.
import type { User } from '../../../types/index';
import { WordPressIcon } from '../../ui/icons';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onManageWebsites: (user: User) => void;
  onManageMenu: (user: User) => void;
  onLoginAs: (username: string) => void;
  currentUser: User;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, onManageWebsites, onManageMenu, onLoginAs, currentUser }) => {
  return (
    <>
      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {users.map(user => (
          <div key={user.username} className="w-full rounded-2xl bg-[#0d1b2a] p-4 shadow-md border border-slate-700 text-gray-200">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <p className="font-bold text-lg text-white">{user.username}</p>
                    <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Syncs Left</p>
                    <p className="font-semibold text-sky-300">{user.syncsRemaining}</p>
                </div>
            </div>

            <div className="space-y-2 text-sm border-t border-b border-slate-700 py-3 my-3">
              <div className="flex justify-between">
                  <span className="font-medium text-gray-400">Websites</span>
                  <span className={`font-mono px-2 py-1 rounded-md text-xs ${ (user.websiteCount ?? 0) >= user.maxWebsites && user.role !== 'admin' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200' }`}>
                      {user.websiteCount ?? 0} / {user.role === 'admin' ? '∞' : user.maxWebsites}
                  </span>
              </div>
              {user.role === 'user' && (
                <div className="flex justify-between items-center">
                   <span className="font-medium text-gray-400">Manage Sites</span>
                   <button onClick={() => onManageWebsites(user)} className="flex items-center text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-1 rounded-md text-xs transition-colors">
                      <WordPressIcon className="w-4 h-4 mr-2" />
                      Manage
                    </button>
                </div>
              )}
            </div>

            <div className="flex justify-end items-center gap-4 text-sm font-medium">
                {user.role === 'user' && (
                    <button onClick={() => onManageMenu(user)} className="text-purple-400 hover:text-purple-300">Customize UI</button>
                )}
               <button
                    onClick={() => onLoginAs(user.username)}
                    disabled={user.role === 'admin'}
                    className="text-green-500 hover:text-green-400 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    Login As
                </button>
                <button onClick={() => onEdit(user)} className="text-sky-400 hover:text-sky-300">Edit</button>
                <button
                  onClick={() => onDelete(user)}
                  disabled={user.role === 'admin' || user.username === currentUser.username}
                  className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-700 bg-gray-900/50">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Syncs Remaining</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Websites</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {users.map(user => (
              <tr key={user.username} className="hover:bg-gray-700/50">
                <td data-label="Username" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.username}</td>
                <td data-label="Role" className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">{user.role}</td>
                <td data-label="Syncs Remaining" className="px-6 py-4 whitespace-nowrap text-sm text-sky-300">{user.syncsRemaining}</td>
                <td data-label="Websites" className="px-6 py-4 whitespace-nowrap text-sm text-center">
                   <span className={`font-mono px-2 py-1 rounded-md text-xs ${ (user.websiteCount ?? 0) >= user.maxWebsites && user.role !== 'admin' ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200' }`}>
                      {user.websiteCount ?? 0} / {user.role === 'admin' ? '∞' : user.maxWebsites}
                   </span>
                </td>
                <td data-label="Actions" className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.role === 'user' && (
                    <>
                        <button onClick={() => onManageWebsites(user)} className="text-gray-300 hover:text-white mr-4">Sites</button>
                        <button onClick={() => onManageMenu(user)} className="text-purple-400 hover:text-purple-300 mr-4">UI</button>
                    </>
                  )}
                  <button
                      onClick={() => onLoginAs(user.username)}
                      disabled={user.role === 'admin'}
                      className="text-green-500 hover:text-green-400 disabled:text-gray-500 disabled:cursor-not-allowed mr-4"
                  >
                      Login As
                  </button>
                  <button onClick={() => onEdit(user)} className="text-sky-400 hover:text-sky-300 mr-4">Edit</button>
                  <button
                    onClick={() => onDelete(user)}
                    disabled={user.role === 'admin' || user.username === currentUser.username}
                    className="text-red-400 hover:text-red-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default UserTable;
