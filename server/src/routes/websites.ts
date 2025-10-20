import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { Website } from '../models/Website';
import { User } from '../models/User';
import { protect, isAdmin } from '../middleware/auth';

const router = express.Router();

// GET websites for a specific user
router.get('/user/:username', protect, async (req, res) => {
    // Authorization: Admin or the user themselves
    if (req.user?.role !== 'admin' && req.user?.username !== req.params.username) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    try {
        console.log(`\n=== FETCHING WEBSITES FOR USER: ${req.params.username} ===`);
        
        // Include credentials for editing (they're hidden by default with select: false)
        const websites = await Website.find({ user_username: req.params.username })
            .select('+consumerKey +consumerSecret +shopify_access_token');
        
        console.log(`Found ${websites.length} websites for user ${req.params.username}:`);
        
        // Debug: Log all websites
        websites.forEach((site, index) => {
            console.log(`  ${index + 1}. ${site.name} (${site.platform}):`, {
                id: site._id,
                url: site.url,
                is_primary: site.is_primary,
                has_wp_credentials: !!(site.consumerKey && site.consumerSecret),
                has_shopify_token: !!site.shopify_access_token,
                token_length: site.shopify_access_token?.length || 0
            });
        });
        
        console.log(`Sending ${websites.length} websites to frontend\n`);
        res.json(websites);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST a new website for a user
router.post('/user/:username', protect, async (req, res) => {
    if (req.user?.role !== 'admin' && req.user?.username !== req.params.username) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const websites = await Website.find({ user_username: req.params.username });
        if (websites.length >= user.maxWebsites) {
            return res.status(403).json({ message: 'User has reached their maximum website limit' });
        }

        const isFirstWebsite = websites.length === 0;
        
        // Debug: Log request body for Shopify websites
        if (req.body.platform === 'shopify') {
            console.log('Creating Shopify website with data:', {
                name: req.body.name,
                url: req.body.url,
                platform: req.body.platform,
                has_shopify_token: !!req.body.shopify_access_token,
                token_length: req.body.shopify_access_token?.length || 0
            });
        }

        const newWebsite = new Website({
            ...req.body,
            user_username: req.params.username,
            is_primary: isFirstWebsite,
        });

        const savedWebsite = await newWebsite.save();
        res.status(201).json(savedWebsite);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT update a website
router.put('/:id', protect, async (req, res) => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid website ID format' });
        }
        
        // Include credentials for editing
        const website = await Website.findById(req.params.id)
            .select('+consumerKey +consumerSecret +shopify_access_token');
        if (!website) return res.status(404).json({ message: 'Website not found' });

        if (req.user?.role !== 'admin' && req.user?.username !== website.user_username) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Debug: Log request body for Shopify websites
        if (req.body.platform === 'shopify' || website.platform === 'shopify') {
            console.log('Updating Shopify website with data:', {
                name: req.body.name,
                url: req.body.url,
                platform: req.body.platform,
                has_shopify_token: !!req.body.shopify_access_token,
                token_length: req.body.shopify_access_token?.length || 0,
                existing_has_token: !!website.shopify_access_token
            });
        }

        Object.assign(website, req.body);
        const updatedWebsite = await website.save();
        res.json(updatedWebsite);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE a website
router.delete('/:id', protect, async (req, res) => {
    try {
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid website ID format' });
        }
        
        const website = await Website.findById(req.params.id);
        if (!website) return res.status(404).json({ message: 'Website not found' });

        if (req.user?.role !== 'admin' && req.user?.username !== website.user_username) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        await Website.deleteOne({ _id: req.params.id });

        if (website.is_primary) {
            const remaining = await Website.findOne({ user_username: website.user_username });
            if (remaining) {
                remaining.is_primary = true;
                await remaining.save();
            }
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting website:', error);
        res.status(500).json({ message: 'Server Error', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

// POST set primary website
router.post('/user/:username/primary/:websiteId', protect, async (req, res) => {
     if (req.user?.role !== 'admin' && req.user?.username !== req.params.username) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    try {
        await Website.updateMany({ user_username: req.params.username }, { is_primary: false });
        await Website.updateOne({ _id: req.params.websiteId, user_username: req.params.username }, { is_primary: true });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- Shopify API Proxy Routes (CORS Solution) ---

// Shopify API proxy to handle CORS issues
router.all('/shopify-proxy/:websiteId/*', protect, async (req, res) => {
    try {
        console.log(`\n=== SHOPIFY PROXY REQUEST ===`);
        console.log(`User: ${req.user?.username} (${req.user?.role})`);
        console.log(`Website ID: ${req.params.websiteId}`);
        console.log(`API Path: ${req.params[0]}`);
        
        // Get website configuration
        const website = await Website.findById(req.params.websiteId)
            .select('+shopify_access_token');
        
        if (!website) {
            return res.status(404).json({ message: 'Website not found' });
        }
        
        console.log(`Website found:`, {
            name: website.name,
            url: website.url,
            platform: website.platform,
            has_access_token: !!website.shopify_access_token,
            token_length: website.shopify_access_token?.length || 0,
            token_prefix: website.shopify_access_token?.substring(0, 10) + '...',
            user_username: website.user_username
        });
        
        if (website.platform !== 'shopify') {
            return res.status(400).json({ message: 'Website is not a Shopify store' });
        }
        
        if (!website.shopify_access_token) {
            return res.status(400).json({ message: 'Shopify access token not configured' });
        }
        
        // Check authorization - user must own the website or be admin
        if (req.user?.role !== 'admin' && req.user?.username !== website.user_username) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        // Extract the API path from the URL
        const apiPath = req.params[0]; // Everything after /shopify-proxy/:websiteId/
        const API_VERSION = '2023-10';
        
        // Strip query string from apiPath to avoid duplicates (axios will add params)
        const cleanPath = apiPath.split('?')[0];
        
        // Build Shopify API URL (without query string)
        // Handle cases where website.url might already include .myshopify.com
        const baseUrl = website.url.includes('.myshopify.com') 
            ? website.url 
            : `${website.url}.myshopify.com`;
        const shopifyUrl = `https://${baseUrl}/admin/api/${API_VERSION}/${cleanPath}`;
        
        // Prepare headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': website.shopify_access_token
        };
        
        console.log(`Shopify API Proxy: ${req.method} ${shopifyUrl}`);
        console.log(`Query params:`, req.query);
        console.log(`Headers being sent:`, headers);
        
        // Forward the request to Shopify
        const response = await axios({
            method: req.method as any,
            url: shopifyUrl,
            headers,
            data: req.body,
            params: req.query, // Query params will be added by axios
            validateStatus: () => true // Don't throw on HTTP error status
        });
        
        console.log(`Shopify API Response Status: ${response.status}`);
        console.log(`Shopify API Response Data:`, JSON.stringify(response.data, null, 2));
        
        if (response.status >= 400) {
            console.error(`Shopify API Error Details:`, {
                status: response.status,
                statusText: response.statusText,
                data: response.data,
                headers: response.headers,
                url: shopifyUrl,
                store_url: website.url,
                constructed_url: baseUrl
            });
            
            // Provide specific error messages based on status code
            let errorMessage = 'Shopify API Error';
            if (response.status === 401) {
                errorMessage = 'Invalid Shopify access token or token expired';
            } else if (response.status === 403) {
                errorMessage = 'Shopify access token does not have required permissions';
            } else if (response.status === 404) {
                errorMessage = 'Shopify store not found - check store URL';
            } else if (response.status === 400) {
                errorMessage = 'Bad request to Shopify API - check store URL and token';
            }
            
            console.error(`Specific Error: ${errorMessage}`);
        }
        
        // Forward response headers that might be important
        if (response.headers['link']) {
            res.set('Link', response.headers['link']);
        }
        if (response.headers['x-shopify-shop-api-call-limit']) {
            res.set('X-Shopify-Shop-Api-Call-Limit', response.headers['x-shopify-shop-api-call-limit']);
        }
        
        // Return the response
        res.status(response.status).json(response.data);
        
    } catch (error) {
        console.error('Shopify API proxy error:', error);
        
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const message = error.response?.data?.message || error.message;
            res.status(status).json({ message: `Shopify API Error: ${message}` });
        } else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

// Get Shopify store info
router.get('/shopify-store/:websiteId', protect, async (req, res) => {
    try {
        const website = await Website.findById(req.params.websiteId)
            .select('+shopify_access_token');
        
        if (!website || website.platform !== 'shopify') {
            return res.status(404).json({ message: 'Shopify store not found' });
        }
        
        if (req.user?.role !== 'admin' && req.user?.username !== website.user_username) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        const baseUrl = website.url.includes('.myshopify.com') 
            ? website.url 
            : `${website.url}.myshopify.com`;
        const shopifyUrl = `https://${baseUrl}/admin/api/2023-10/shop.json`;
        
        const response = await axios.get(shopifyUrl, {
            headers: {
                'X-Shopify-Access-Token': website.shopify_access_token
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching Shopify store info:', error);
        res.status(500).json({ message: 'Failed to fetch store info' });
    }
});

// Debug endpoint to test Shopify connection (temporarily without auth for testing)
router.get('/debug-shopify/:websiteId', async (req, res) => {
    try {
        const website = await Website.findById(req.params.websiteId)
            .select('+shopify_access_token');
        
        if (!website) {
            return res.status(404).json({ message: 'Website not found' });
        }
        
        // Temporarily skip auth check for debugging
        // if (req.user?.role !== 'admin' && req.user?.username !== website.user_username) {
        //     return res.status(403).json({ message: 'Not authorized' });
        // }
        
        const baseUrl = website.url.includes('.myshopify.com') 
            ? website.url 
            : `${website.url}.myshopify.com`;
        
        const debugInfo = {
            website_id: website._id,
            website_name: website.name,
            original_url: website.url,
            constructed_base_url: baseUrl,
            full_shop_url: `https://${baseUrl}/admin/api/2023-10/shop.json`,
            has_access_token: !!website.shopify_access_token,
            token_length: website.shopify_access_token?.length || 0,
            token_prefix: website.shopify_access_token?.substring(0, 15) + '...',
            platform: website.platform
        };
        
        console.log('Shopify Debug Info:', debugInfo);
        res.json(debugInfo);
        
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ message: 'Debug failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
});

export default router;
