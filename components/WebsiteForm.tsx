import React, { useState, useEffect } from 'react';
// FIX: Update import path for types.
import type { Website, Platform } from '../types/index';
import { CancelIcon, SaveIcon, SpinnerIcon } from './icons';
// FIX: Update import path for currencies.
import { currencies } from '../config/currencies';
import SearchableDropdown from './SearchableDropdown';

interface WebsiteFormProps {
    website: Partial<Omit<Website, 'id' | 'user_username'>> | null;
    onSave: (data: Omit<Website, 'id' | 'user_username'>) => void;
    onCancel: () => void;
    isSaving: boolean;
}

const WebsiteForm: React.FC<WebsiteFormProps> = ({ website, onSave, onCancel, isSaving }) => {
    // FIX: Added 'platform' and 'shopify_access_token' to state to support multiple platforms.
    const [formData, setFormData] = useState({
        platform: 'wordpress' as Platform,
        name: '',
        url: '',
        consumerKey: '',
        consumerSecret: '',
        shopify_access_token: '',
        currency_symbol: '₹',
        is_primary: 0,
    });

    const isEditing = !!website;

    useEffect(() => {
        if (website) {
            // FIX: Populate all fields including platform-specific ones when editing.
            setFormData({
                platform: website.platform || 'wordpress',
                name: website.name || '',
                url: website.url || '',
                consumerKey: website.consumerKey || '',
                consumerSecret: website.consumerSecret || '',
                shopify_access_token: website.shopify_access_token || '',
                currency_symbol: website.currency_symbol || '₹',
                is_primary: website.is_primary || 0,
            });
        } else {
             // FIX: Initialize all fields for a new website.
             setFormData({
                platform: 'wordpress',
                name: '',
                url: '',
                consumerKey: '',
                consumerSecret: '',
                shopify_access_token: '',
                currency_symbol: '₹',
                is_primary: 0,
            });
        }
    }, [website]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // FIX: Construct a complete data object matching the expected type for saving.
        const dataToSave: Omit<Website, 'id' | 'user_username'> = {
            ...formData,
            consumerKey: formData.platform === 'wordpress' ? formData.consumerKey : null,
            consumerSecret: formData.platform === 'wordpress' ? formData.consumerSecret : null,
            shopify_access_token: formData.platform === 'shopify' ? formData.shopify_access_token : null,
        };
        onSave(dataToSave);
    };

    const currencyOptions = currencies.map(c => ({
        value: c.symbol,
        label: `${c.name} (${c.symbol})`
    }));

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-900/50 rounded-lg space-y-6 animate-fade-in">
            <h3 className="text-xl font-semibold text-white">{isEditing ? `Editing ${website?.name}` : 'Add New Website'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Platform</label>
                    <select name="platform" value={formData.platform} onChange={handleChange} disabled={isEditing} className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <option value="wordpress">WordPress</option>
                        <option value="shopify">Shopify</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Website Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                </div>
                
                {formData.platform === 'wordpress' && (
                    <>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300">Website URL</label>
                            <input type="url" name="url" value={formData.url} onChange={handleChange} required placeholder="https://example.com" className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Consumer Key</label>
                            <input type="text" name="consumerKey" value={formData.consumerKey} onChange={handleChange} required className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Consumer Secret</label>
                            <input type="password" name="consumerSecret" value={formData.consumerSecret} onChange={handleChange} required className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                    </>
                )}
                
                {formData.platform === 'shopify' && (
                     <>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300">Shopify Store Name</label>
                            <div className="flex items-center">
                                <span className="text-gray-400 bg-gray-800 border border-r-0 border-gray-600 rounded-l-md px-3 py-2">https://</span>
                                <input type="text" name="url" value={formData.url} onChange={handleChange} required placeholder="your-store-name" className="w-full block py-2 px-3 text-white bg-gray-700 border-y border-r border-gray-600 focus:ring-sky-500 focus:border-sky-500" />
                                <span className="text-gray-400 bg-gray-800 border-y border-l-0 border-gray-600 rounded-r-md px-3 py-2">.myshopify.com</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Enter just your store's handle, not the full URL.</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300">Admin API Access Token</label>
                            <input type="password" name="shopify_access_token" value={formData.shopify_access_token} onChange={handleChange} required className="mt-1 w-full block py-2 px-3 text-white bg-gray-700 border border-gray-600 rounded-md focus:ring-sky-500 focus:border-sky-500" />
                        </div>
                     </>
                )}
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300">Currency</label>
                    <SearchableDropdown
                        options={currencyOptions}
                        value={formData.currency_symbol}
                        onChange={(value) => setFormData(prev => ({ ...prev, currency_symbol: value }))}
                    />
                </div>
            </div>
            
            <div className="flex justify-end space-x-4 border-t border-slate-700 pt-6 mt-4">
                 <button type="button" onClick={onCancel} disabled={isSaving} className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors disabled:opacity-50">
                    <CancelIcon className="w-5 h-5 mr-2" />
                    Cancel
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:bg-gray-600">
                    {isSaving ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <SaveIcon className="w-5 h-5 mr-2" />}
                    {isEditing ? 'Save Changes' : 'Add Website'}
                </button>
            </div>
        </form>
    );
};

export default WebsiteForm;
