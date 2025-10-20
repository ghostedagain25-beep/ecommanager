import React, { useState, useEffect } from 'react';
// FIX: Update import path for types.
import type { User, UserRole } from '../../../types/index';
import * as api from '../../../services/api';
import { CancelIcon, SaveIcon, SpinnerIcon } from '../../ui/icons';
import { useAuth } from '../../../context/AuthContext';

interface UserFormProps {
    user: User | null;
    onSave: () => void;
    onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel }) => {
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        syncsRemaining: 10,
        role: 'user' as UserRole,
        maxWebsites: 1,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [usernameError, setUsernameError] = useState('');

    const isEditing = !!user;

    useEffect(() => {
        if (user) {
            setFormData({ ...user, password: '', maxWebsites: user.maxWebsites || 1 });
        } else {
             setFormData({
                username: '',
                password: '',
                syncsRemaining: 10,
                role: 'user',
                maxWebsites: 1,
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'username') {
            setUsernameError(''); // Clear error on new input
        }
        const finalValue = (name === 'syncsRemaining' || name === 'maxWebsites') ? parseInt(value, 10) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleUsernameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (isEditing) return; // Only validate for new users

        const newUsername = e.target.value.trim();
        if (!newUsername) {
            setUsernameError('');
            return;
        }

        try {
            const exists = api.checkUsernameExists(newUsername);
            if (exists) {
                setUsernameError(`Username "${newUsername}" is already taken.`);
            } else {
                setUsernameError('');
            }
        } catch (err) {
            setUsernameError('Could not verify username.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (usernameError) {
            setIsLoading(false);
            return;
        }
        
        const trimmedUsername = formData.username?.trim();

        if (!trimmedUsername) {
            setError('Username is required.');
            setIsLoading(false);
            return;
        }

        if (!isEditing) {
            const exists = api.checkUsernameExists(trimmedUsername);
            if (exists) {
                setUsernameError(`Username "${trimmedUsername}" is already taken.`);
                setIsLoading(false);
                return;
            }
            if (!formData.password) {
                setError('Password is required for new users.');
                setIsLoading(false);
                return;
            }
        }

        try {
            const dataToSave = { ...formData, username: trimmedUsername };
            if (isEditing && user) {
                const updateData = { ...dataToSave };
                if (!updateData.password) {
                    delete updateData.password;
                }
                await api.updateUser(user.username, updateData);
            } else {
                await api.addUser(dataToSave as User);
            }
            onSave();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-900/50 rounded-lg space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold text-white">{isEditing ? `Editing ${user?.username}` : 'Add New User'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Username</label>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        onBlur={handleUsernameBlur}
                        disabled={isEditing} 
                        required 
                        className={`mt-1 w-full block py-2 px-3 text-white bg-gray-700 border rounded-md focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed ${
                            usernameError ? 'border-red-500' : 'border-gray-600'
                        }`}
                     />
                    {usernameError && <p className="mt-1 text-sm text-red-400">{usernameError}</p>}
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? 'Leave blank to keep current' : ''} className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Role</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={isEditing && user?.username === currentUser?.username}
                        className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Syncs Remaining</label>
                    <input type="number" name="syncsRemaining" value={formData.syncsRemaining} onChange={handleChange} min="0" className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                </div>
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Maximum Websites</label>
                    <input type="number" name="maxWebsites" value={formData.maxWebsites} onChange={handleChange} min="0" className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                </div>
            </div>

             {error && <p className="text-sm text-red-400">{error}</p>}
            
            <div className="flex justify-end space-x-4">
                 <button type="button" onClick={onCancel} className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">
                    <CancelIcon className="w-5 h-5 mr-2" />
                    Cancel
                </button>
                <button type="submit" disabled={isLoading || !!usernameError} className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600">
                    {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <SaveIcon className="w-5 h-5 mr-2" />}
                    {isEditing ? 'Save Changes' : 'Create User'}
                </button>
            </div>
        </form>
    );
};

export default UserForm;
