import React, { useState } from 'react';
import * as api from '../../services/api';
import { ShopifyIcon, ExternalLinkIcon, CheckCircleIcon, ExclamationIcon } from '../ui/icons';

interface ShopifyConnectProps {
    onSuccess?: (accessToken: string, shopData: any) => void;
    onError?: (error: string) => void;
}

const ShopifyConnect: React.FC<ShopifyConnectProps> = ({ onSuccess, onError }) => {
    const [shopDomain, setShopDomain] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleConnect = async () => {
        if (!shopDomain.trim()) {
            setError('Please enter your shop domain');
            return;
        }

        setIsConnecting(true);
        setError(null);
        setSuccess(null);

        try {
            // Get install URL from backend
            const response = await fetch('/api/shopify-auth/install-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ shop: shopDomain })
            });

            if (!response.ok) {
                throw new Error('Failed to generate install URL');
            }

            const { installUrl } = await response.json();

            // Open Shopify OAuth in new window
            const popup = window.open(
                installUrl,
                'shopify-oauth',
                'width=600,height=700,scrollbars=yes,resizable=yes'
            );

            // Monitor popup for completion
            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkClosed);
                    setIsConnecting(false);
                    setSuccess('Please copy the access token from the popup and paste it into your website settings.');
                }
            }, 1000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Connection failed';
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setIsConnecting(false);
        }
    };

    const formatShopDomain = (value: string) => {
        // Remove protocol and .myshopify.com if present
        let domain = value.replace(/^https?:\/\//, '').replace(/\.myshopify\.com.*$/, '');
        return domain;
    };

    const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatShopDomain(e.target.value);
        setShopDomain(formatted);
    };

    return (
        <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
                <ShopifyIcon className="w-8 h-8 text-green-500" />
                <div>
                    <h3 className="text-lg font-semibold text-white">Connect Shopify Store</h3>
                    <p className="text-sm text-gray-400">Securely connect your Shopify store using OAuth</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 flex items-center p-3 text-sm text-red-300 bg-red-900/50 rounded-lg">
                    <ExclamationIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 flex items-center p-3 text-sm text-green-300 bg-green-900/50 rounded-lg">
                    <CheckCircleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
                    {success}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="shop-domain" className="block text-sm font-medium text-gray-300 mb-2">
                        Shop Domain
                    </label>
                    <div className="relative">
                        <input
                            id="shop-domain"
                            type="text"
                            value={shopDomain}
                            onChange={handleDomainChange}
                            placeholder="your-store-name"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-sky-500 focus:border-sky-500"
                            disabled={isConnecting}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-400 text-sm">.myshopify.com</span>
                        </div>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Enter just your store name (e.g., "my-store" for my-store.myshopify.com)
                    </p>
                </div>

                <button
                    onClick={handleConnect}
                    disabled={isConnecting || !shopDomain.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors"
                >
                    {isConnecting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Connecting...
                        </>
                    ) : (
                        <>
                            <ExternalLinkIcon className="w-4 h-4" />
                            Connect to Shopify
                        </>
                    )}
                </button>
            </div>

            <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
                <h4 className="text-sm font-medium text-blue-300 mb-2">How it works:</h4>
                <ol className="text-xs text-blue-200 space-y-1">
                    <li>1. Click "Connect to Shopify" to open the OAuth flow</li>
                    <li>2. Log in to your Shopify admin and approve the app</li>
                    <li>3. Copy the access token from the success page</li>
                    <li>4. Paste it into your website settings</li>
                </ol>
            </div>
        </div>
    );
};

export default ShopifyConnect;
