import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
// FIX: Update import path for types.
import type { Website } from '../types/index';
import WebsiteForm from './WebsiteForm';
import { SpinnerIcon, WordPressIcon, ExclamationIcon, CheckCircleIcon, KeyIcon, StarIcon } from './icons';

const UserSettings: React.FC = () => {
    const { user, updateCurrentUser, logout } = useAuth();
    const [websites, setWebsites] = useState<Website[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    const fetchWebsites = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getWebsitesForUser(user.username);
            setWebsites(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load websites.');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWebsites();
    }, [fetchWebsites]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 4) {
            setError("Password must be at least 4 characters long.");
            return;
        }
        setIsSaving(true);
        try {
            await updateCurrentUser({ password });
            setSuccess("Password updated successfully. Please log in again.");
            setTimeout(logout, 2000);
        } catch(err) {
            setError(err instanceof Error ? err.message : 'Failed to update password.');
        } finally {
            setIsSaving(false);
            setPassword('');
            setConfirmPassword('');
        }
    };

    const handleSaveWebsite = async (data: Omit<Website, 'id' | 'user_username'>) => {
        if (!user) return;
        setIsSaving(true);
        setError(null);
        try {
            if (selectedWebsite) {
                await api.updateWebsite(selectedWebsite._id || selectedWebsite.id, data);
            } else {
                await api.addWebsite(data, user.username);
            }
            setIsFormVisible(false);
            setSelectedWebsite(null);
            fetchWebsites();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save website.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteWebsite = async (websiteId: string) => {
        if (window.confirm("Are you sure you want to delete this website configuration?")) {
            setIsSaving(true);
            setError(null);
            try {
                await api.deleteWebsite(websiteId);
                fetchWebsites();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to delete website.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleSetPrimary = async (websiteId: string) => {
        if (!user) return;
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await api.setPrimaryWebsite(user.username, websiteId);
            setSuccess('Primary website updated.');
            fetchWebsites();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set primary website.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddNew = () => {
        setSelectedWebsite(null);
        setIsFormVisible(true);
    };

    const handleEdit = (website: Website) => {
        setSelectedWebsite(website);
        setIsFormVisible(true);
    };

    const handleCancelForm = () => {
        setIsFormVisible(false);
        setSelectedWebsite(null);
    };

    return (
        <div className="animate-fade-in">
            <h2 className="text-2xl font-semibold text-white mb-6">User Settings</h2>
            
            <div className="max-w-3xl bg-gray-900/50 p-8 rounded-lg space-y-8">
                {/* Password Change Section */}
                <div>
                    <h3 className="text-lg font-medium text-white">Change Password</h3>
                    <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                         <div className="relative">
                            <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" required className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                         </div>
                         <div className="relative">
                             <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                             <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required className="w-full pl-10 pr-4 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                         </div>
                        <button type="submit" disabled={isSaving} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600">
                           {isSaving ? <SpinnerIcon className="w-5 h-5" /> : 'Update Password'}
                        </button>
                    </form>
                </div>
                
                {/* Website Management Section */}
                <div>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-white">Manage Websites</h3>
                        <button onClick={handleAddNew} className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 rounded-md transition-colors">Add New</button>
                    </div>
                     {isFormVisible && <div className="mt-4"><WebsiteForm website={selectedWebsite} onSave={handleSaveWebsite} onCancel={handleCancelForm} isSaving={isSaving} /></div>}
                    <div className="mt-4 space-y-3">
                        {isLoading ? <SpinnerIcon className="w-6 h-6 text-sky-400" /> : websites.length > 0 ? (
                            websites.map(site => (
                                <div key={site._id || site.id} className="p-4 bg-gray-800 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {!!site.is_primary && <StarIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                                            <p className="font-semibold text-white">{site.name}</p>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">{site.url}</p>
                                    </div>
                                    <div className="space-x-3 flex-shrink-0 self-end sm:self-center">
                                        {!site.is_primary && (
                                            <button onClick={() => handleSetPrimary(site._id || site.id)} disabled={isSaving} className="text-yellow-400 hover:text-yellow-300 disabled:text-gray-600 disabled:cursor-not-allowed">Set Primary</button>
                                        )}
                                        <button onClick={() => handleEdit(site)} disabled={isSaving} className="text-sky-400 hover:text-sky-300 disabled:text-gray-600 disabled:cursor-not-allowed">Edit</button>
                                        <button onClick={() => handleDeleteWebsite(site._id || site.id)} disabled={isSaving} className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed">Delete</button>
                                    </div>
                                </div>
                            ))
                        ) : !isFormVisible && (
                             <div className="text-center py-6 border-2 border-dashed border-gray-700 rounded-lg">
                                <WordPressIcon className="w-8 h-8 mx-auto text-gray-500" />
                                <p className="mt-2 text-sm text-gray-400">No websites configured.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                 {error && <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"><ExclamationIcon className="w-5 h-5 mr-3"/>{error}</div>}
                 {success && <div className="flex items-center p-4 text-sm text-green-300 bg-green-900/50 rounded-lg"><CheckCircleIcon className="w-5 h-5 mr-3"/>{success}</div>}

            </div>
        </div>
    );
};

export default UserSettings;