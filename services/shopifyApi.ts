import type { Website } from '../types/index';
import type { ShopifyProduct, ShopifyVariant, ShopifyVariantUpdatePayload, ShopifyOrder } from '../types/shopify';
import { apiFetch } from './apiClient';

// Rate limiting helper
class ShopifyRateLimiter {
    private lastCallTime = 0;
    private minInterval = 500; // 500ms between calls (2 calls per second)
    
    async waitIfNeeded(): Promise<void> {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;
        
        if (timeSinceLastCall < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastCall;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastCallTime = Date.now();
    }
}

const rateLimiter = new ShopifyRateLimiter();

// Enhanced error handling
const handleShopifyError = (error: any, operation: string) => {
    console.error(`Shopify API error during ${operation}:`, error);
    
    if (error.message?.includes('429')) {
        throw new Error('Shopify API rate limit exceeded. Please wait and try again.');
    }
    
    if (error.message?.includes('401')) {
        throw new Error('Shopify authentication failed. Please check your access token.');
    }
    
    if (error.message?.includes('403')) {
        throw new Error('Shopify API access denied. Please check your app permissions.');
    }
    
    throw error;
};

export const fetchShopifyProductsBySku = async (
    website: Website,
    skus: string[]
): Promise<ShopifyVariant[]> => {
    const skuSet = new Set(skus);
    const foundVariants: ShopifyVariant[] = [];
    let nextUrlOrPath: string | null = 'products.json?limit=250&fields=id,title,variants,images';

    try {
        while (nextUrlOrPath && skuSet.size > 0) {
            const response = await apiFetch(website, nextUrlOrPath);
            const { products } = await response.json();

            if (!products || products.length === 0) break;

            for (const product of products) {
                if (product.variants) {
                    for (const variant of product.variants) {
                        if (variant.sku && skuSet.has(variant.sku)) {
                            foundVariants.push({ ...variant, product_title: product.title });
                            skuSet.delete(variant.sku);
                        }
                    }
                }
            }

            const linkHeader = response.headers.get('Link');
            nextUrlOrPath = linkHeader?.split(',').find(s => s.includes('rel="next"'))?.match(/<(.+)>/)?.[1] || null;
        }
        return foundVariants;
    } catch (error) {
        console.error('Failed to fetch Shopify products:', error);
        throw error;
    }
};

export const batchUpdateShopifyVariants = async (
    website: Website,
    payload: ShopifyVariantUpdatePayload[]
): Promise<{ updatedCount: number; errorDetails: { sku: string; message: string }[] }> => {
    if (payload.length === 0) return { updatedCount: 0, errorDetails: [] };

    let updatedCount = 0;
    const errorDetails: { sku: string; message: string }[] = [];

    for (const item of payload) {
        const path = `variants/${item.variant_id}.json`;
        const body = JSON.stringify({ variant: { id: item.variant_id, price: item.price, compare_at_price: item.compare_at_price } });

        try {
            await apiFetch(website, path, { method: 'PUT', body });
            
            // Shopify inventory is managed separately via Inventory Levels
            const inventoryPath = `inventory_levels/set.json`;
            const inventoryBody = JSON.stringify({
                location_id: 66563342497, // NOTE: This is hardcoded and should be dynamic in a real app
                inventory_item_id: item.inventory_item_id,
                available: item.inventory_quantity
            });
             await apiFetch(website, inventoryPath, { method: 'POST', body: inventoryBody });

            updatedCount++;
        } catch (error) {
            console.error(`Failed to update variant ${item.variant_id}:`, error);
            errorDetails.push({ sku: `variant_id: ${item.variant_id}`, message: (error as Error).message });
        }
    }

    return { updatedCount, errorDetails };
};


// Test Shopify connection with a simple API call
export const testShopifyConnection = async (website: Website): Promise<any> => {
    try {
        console.log('Testing Shopify connection with shop.json endpoint');
        const response = await apiFetch(website, 'shop.json');
        const data = await response.json();
        console.log('Shopify connection test successful:', data);
        return data;
    } catch (error) {
        console.error('Shopify connection test failed:', error);
        throw error;
    }
};

export const fetchShopifyOrders = async (
    website: Website,
    fetchUrl: string | null = null
): Promise<{ orders: ShopifyOrder[], nextUrl: string | null }> => {
    const pathOrUrl = fetchUrl || 'orders.json?limit=25&status=any';

    try {
        // First test the connection with a simple endpoint
        console.log('Testing Shopify connection before fetching orders...');
        await testShopifyConnection(website);
        
        console.log('Shopify connection verified, now fetching orders...');
        const response = await apiFetch(website, pathOrUrl);
        const data = await response.json();
        const orders = data.orders;
        
        const linkHeader = response.headers.get('Link');
        const nextUrl = linkHeader?.split(',').find(s => s.includes('rel="next"'))?.match(/<(.+)>/)?.[1] || null;
        
        return { orders, nextUrl };
    } catch (error) {
        console.error('Failed to fetch Shopify orders:', error);
        throw error;
    }
};

export const fetchShopifyOrder = async (
    website: Website,
    orderId: number
): Promise<ShopifyOrder> => {
    try {
        const response = await apiFetch(website, `orders/${orderId}.json`);
        const { order } = await response.json();
        return order;
    } catch (error) {
        console.error(`Failed to fetch Shopify order ${orderId}:`, error);
        throw error;
    }
};

export const cancelShopifyOrder = async (
    website: Website,
    orderId: number
): Promise<ShopifyOrder> => {
    try {
        const response = await apiFetch(website, `orders/${orderId}/cancel.json`, { 
            method: 'POST', 
            body: JSON.stringify({}) 
        });
        const { order } = await response.json();
        return order;
    } catch (error) {
        console.error(`Failed to cancel Shopify order ${orderId}:`, error);
        throw error;
    }
};
