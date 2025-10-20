import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../../services/api';
import { userNavItems } from '../../../config/navigation';
// FIX: Update import path for types.
import { User } from '../../../types/index';
import { SpinnerIcon, SaveIcon, CheckCircleIcon, ExclamationIcon, InfoIcon } from '../../ui/icons';

interface UserMenuSettingsProps {
    user: User;
    onBack: () => void;
}

const UserMenuSettings: React.FC<UserMenuSettingsProps> = ({ user, onBack }) => {
    const [settings, setSettings] = useState<Record<string, boolean>>({});
    const [initialSettings, setInitialSettings] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getUserMenuSettings(user.username);
            setSettings(data);
            setInitialSettings(JSON.parse(JSON.stringify(data)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load menu settings.');
        } finally {
            setIsLoading(false);
        }
    }, [user.username]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggle = (itemKey: string) => {
        setSettings(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
        setSuccess(null);
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await api.saveUserMenuSettings(user.username, settings);
            setSuccess('Menu settings saved successfully!');
            setInitialSettings(JSON.parse(JSON.stringify(settings)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8 text-sky-400" /></div>;
    }

    if (error && !settings) {
        return <div className="flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"><ExclamationIcon className="w-5 h-5 mr-3"/>{error}</div>;
    }

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-white">Customize UI for <span className="text-sky-400">{user.username}</span></h2>
                    <p className="text-gray-400 mt-1">Toggle which navigation items are visible to this user.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={onBack} className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">
                        Back to Users
                    </button>
                    <button onClick={handleSaveChanges} disabled={!hasChanges || isSaving} className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600">
                        {isSaving ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <SaveIcon className="w-5 h-5 mr-2" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </header>
            
            {error && <div className="mb-4 flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"><ExclamationIcon className="w-5 h-5 mr-3"/>{error}</div>}
            {success && <div className="mb-4 flex items-center p-4 text-sm text-green-300 bg-green-900/50 rounded-lg"><CheckCircleIcon className="w-5 h-5 mr-3"/>{success}</div>}

            <div className="space-y-4">
                {userNavItems.map(item => (
                    <div key={item.key} className="p-4 bg-gray-900/50 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-4">
                             <i data-lucide={item.icon} className="w-6 h-6 text-gray-400"></i>
                             <h4 className="font-semibold text-white">{item.label}</h4>
                        </div>
                        <label htmlFor={`toggle-${item.key}`} className="inline-flex relative items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                id={`toggle-${item.key}`} 
                                className="sr-only peer"
                                checked={settings[item.key] !== false} // Default to true if not set
                                onChange={() => handleToggle(item.key)}
                            />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-sky-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                        </label>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex items-start p-4 text-sm text-sky-300 bg-sky-900/50 rounded-lg">
                <InfoIcon className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5"/>
                <div>
                    If a setting is disabled, the corresponding menu item will be hidden from this user's sidebar and mobile navigation. By default, all items are visible.
                </div>
            </div>
        </div>
    );
};

export default UserMenuSettings;
