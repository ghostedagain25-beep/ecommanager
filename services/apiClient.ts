import type { Website } from '../types/index';

// Backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

/**
 * Handles API responses, parsing JSON and throwing a standardized error for non-ok responses.
 */
const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        let errorBody;
        try {
            errorBody = await response.json();
        } catch (e) {
            // Not a JSON response
        }
        const message = errorBody?.message || errorBody?.errors || response.statusText;
        // Detect platform based on URL - check for Shopify proxy or direct Shopify URL
        const platform = (response.url.includes('myshopify.com') || response.url.includes('shopify-proxy')) ? 'Shopify' : 'WooCommerce';
        throw new Error(`${platform} API Error (${response.status}): ${JSON.stringify(message)}`);
    }
    return response; // Return the raw response for further processing (e.g., headers)
};


/**
 * A centralized fetch client to handle API requests for different platforms.
 * It uses a proxy for Shopify to bypass browser CORS limitations.
 * @param website The website configuration object.
 * @param pathOrUrl The API endpoint path (e.g., 'products.json') or a full URL for pagination.
 * @param options Standard Fetch API options.
 * @returns A promise that resolves to the raw Response object.
 */
export const apiFetch = async (website: Website, pathOrUrl: string, options: RequestInit = {}): Promise<Response> => {
    if (website.platform === 'wordpress') {
        if (!website.url || !website.consumerKey || !website.consumerSecret) {
            throw new Error('WooCommerce credentials are not configured for this website.');
        }

        const endpoint = `${website.url}/wp-json/wc/v3/${pathOrUrl}`;
        const url = new URL(endpoint);
        url.searchParams.set('consumer_key', website.consumerKey);
        url.searchParams.set('consumer_secret', website.consumerSecret);
        
        const response = await fetch(url.toString(), options);
        return handleApiResponse(response);

    } else if (website.platform === 'shopify') {
        console.log('Shopify website config:', {
            url: website.url,
            has_access_token: !!website.shopify_access_token,
            platform: website.platform,
            name: website.name
        });
        
        if (!website.url || !website.shopify_access_token) {
            throw new Error(`Shopify credentials are not configured for this website. Missing: ${!website.url ? 'URL' : ''} ${!website.shopify_access_token ? 'Access Token' : ''}`);
        }
        
        // Use backend proxy to avoid CORS issues
        const websiteId = website._id || website.id;
        if (!websiteId) {
            throw new Error('Website ID is required for Shopify API calls.');
        }
        
        let apiPath: string;
        // Check if we're being passed a full URL (from pagination) or just a path
        if (pathOrUrl.startsWith('https://')) {
            // Extract path from full URL for pagination
            const url = new URL(pathOrUrl);
            apiPath = url.pathname.replace(`/admin/api/${API_VERSION}/`, '') + url.search;
        } else {
            // Ensure .json extension
            const [basePath, queryParams] = pathOrUrl.split('?');
            apiPath = basePath.endsWith('.json') ? pathOrUrl : `${basePath}.json${queryParams ? `?${queryParams}` : ''}`;
        }
        
        // Build proxy URL
        const proxyUrl = `${API_BASE_URL}/websites/shopify-proxy/${websiteId}/${apiPath}`;
        
        // Get auth token from localStorage
        const token = localStorage.getItem('authToken');
        const headers = new Headers(options.headers || {});
        headers.set('Content-Type', 'application/json');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        
        const finalOptions = { ...options, headers };
        
        console.log(`Using Shopify proxy: ${proxyUrl}`);
        console.log(`Auth token present: ${!!token}, Token length: ${token?.length || 0}`);
        
        const response = await fetch(proxyUrl, finalOptions);
        return handleApiResponse(response);

    } else {
        throw new Error(`Unsupported platform: ${website.platform}`);
    }
};

const API_VERSION = '2023-10'; // Shared Shopify API version
