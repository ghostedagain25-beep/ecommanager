import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../../services/api';
// FIX: Update import path for types.
import type { User, Website } from '../../../types/index';
import WebsiteForm from '../../settings/WebsiteForm';
import { SpinnerIcon, WordPressIcon, ShopifyIcon, ExclamationIcon, CheckCircleIcon, StarIcon } from '../../ui/icons';
import { ConfirmationModal } from '../../ui/ConfirmationModal';

interface AdminUserWebsitesProps {
    user: User;
    onBack: () => void;
}

const PlatformIcon: React.FC<{ platform: 'wordpress' | 'shopify', className?: string}> = ({ platform, className }) => {
    if (platform === 'shopify') {
        return <ShopifyIcon className={className} />;
    }
    return <WordPressIcon className={className} />;
};

const AdminUserWebsites: React.FC<AdminUserWebsitesProps> = ({ user, onBack }) => {
    const [websites, setWebsites] = useState<Website[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null);
    const [websiteToDelete, setWebsiteToDelete] = useState<Website | null>(null);

    const fetchWebsites = useCallback(async () => {
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
    }, [user.username]);

    useEffect(() => {
        fetchWebsites();
    }, [fetchWebsites]);
    
    const handleSaveWebsite = async (data: Omit<Website, 'id' | 'user_username'>) => {
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            if (selectedWebsite) {
                await api.updateWebsite(selectedWebsite._id || selectedWebsite.id, data);
                setSuccess('Website updated successfully.');
            } else {
                await api.addWebsite(data, user.username);
                setSuccess('Website added successfully.');
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
    
    const handleDeleteWebsite = async () => {
        if (!websiteToDelete) return;

        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            await api.deleteWebsite(websiteToDelete._id || websiteToDelete.id);
            setSuccess('Website deleted successfully.');
            fetchWebsites();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete website.');
        } finally {
            setIsSaving(false);
            setWebsiteToDelete(null);
        }
    };

    const handleSetPrimary = async (websiteId: string) => {
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
        setError(null);
        setSuccess(null);
    };

    const handleEdit = (website: Website) => {
        setSelectedWebsite(website);
        setIsFormVisible(true);
        setError(null);
        setSuccess(null);
    };

    const handleCancelForm = () => {
        setIsFormVisible(false);
        setSelectedWebsite(null);
    };

    const hasReachedLimit = websites.length >= user.maxWebsites;

    return (
        <div className="animate-fade-in">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white">Manage Websites for <span className="text-sky-400">{user.username}</span></h2>
                </div>
                <button onClick={onBack} className="px-4 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">
                    Back to Users
                </button>
            </header>
            
            <div className="max-w-4xl bg-gray-900/50 p-8 rounded-lg space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">Configured Websites</h3>
                        {!isFormVisible && (
                            <button 
                                onClick={handleAddNew} 
                                disabled={hasReachedLimit}
                                className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                                Add New Website
                            </button>
                        )}
                    </div>

                    {error && <div className="mb-4 flex items-center p-4 text-sm text-red-300 bg-red-900/50 rounded-lg"><ExclamationIcon className="w-5 h-5 mr-3"/>{error}</div>}
                    {success && <div className="mb-4 flex items-center p-4 text-sm text-green-300 bg-green-900/50 rounded-lg"><CheckCircleIcon className="w-5 h-5 mr-3"/>{success}</div>}
                    
                     {hasReachedLimit && !isFormVisible && (
                        <div className="mb-4 flex items-center p-4 text-sm text-yellow-300 bg-yellow-900/50 rounded-lg">
                            <ExclamationIcon className="w-5 h-5 mr-3"/>
                            This user has reached their maximum limit of {user.maxWebsites} website(s).
                        </div>
                    )}

                     {isFormVisible && (
                        <WebsiteForm 
                            website={selectedWebsite} 
                            onSave={handleSaveWebsite} 
                            onCancel={handleCancelForm} 
                            isSaving={isSaving} 
                        />
                     )}

                    <div className="mt-4 space-y-3">
                        {isLoading ? <SpinnerIcon className="w-6 h-6 text-sky-400" /> : websites.length > 0 ? (
                            websites.map(site => (
                                <div key={site._id || site.id} className="p-4 bg-gray-800 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <PlatformIcon platform={site.platform} className="w-8 h-8 text-gray-400 flex-shrink-0" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {!!site.is_primary && <StarIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />}
                                                <p className="font-semibold text-white">{site.name}</p>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">{site.platform === 'shopify' ? `${site.url}.myshopify.com` : site.url}</p>
                                        </div>
                                    </div>
                                    <div className="space-x-3 flex-shrink-0 self-end sm:self-center">
                                        {!site.is_primary && (
                                            <button onClick={() => handleSetPrimary(site._id || site.id)} disabled={isSaving} className="text-yellow-400 hover:text-yellow-300 disabled:text-gray-600 disabled:cursor-not-allowed">Set Primary</button>
                                        )}
                                        <button onClick={() => handleEdit(site)} disabled={isSaving} className="text-sky-400 hover:text-sky-300 disabled:text-gray-600 disabled:cursor-not-allowed">Edit</button>
                                        <button onClick={() => setWebsiteToDelete(site)} disabled={isSaving} className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed">Delete</button>
                                    </div>
                                </div>
                            ))
                        ) : !isFormVisible && (
                             <div className="text-center py-6 border-2 border-dashed border-gray-700 rounded-lg">
                                <WordPressIcon className="w-8 h-8 mx-auto text-gray-500" />
                                <p className="mt-2 text-sm text-gray-400">This user has no websites configured.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmationModal
                isOpen={!!websiteToDelete}
                onClose={() => setWebsiteToDelete(null)}
                onConfirm={handleDeleteWebsite}
                title="Delete Website"
                message={<>Are you sure you want to delete the website <strong>{websiteToDelete?.name}</strong>? This action cannot be undone.</>}
                confirmText="Delete"
                isConfirming={isSaving}
            />
        </div>
    );
};

export default AdminUserWebsites;
