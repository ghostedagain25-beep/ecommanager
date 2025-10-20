import express from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { protect, isAdmin } from '../middleware/auth';
import { Website } from '../models/Website';

const router = express.Router();

// Shopify App Configuration
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES = 'read_products,write_products,read_orders,write_orders,read_inventory,write_inventory';
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

// Generate install URL for Shopify app
router.post('/install-url', protect, async (req, res) => {
    try {
        const { shop, userId } = req.body;
        
        if (!shop) {
            return res.status(400).json({ message: 'Shop domain is required' });
        }
        
        // Validate shop domain format
        const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
        
        // Generate state parameter for security
        const state = crypto.randomBytes(16).toString('hex');
        
        // Store state temporarily (in production, use Redis or database)
        // For now, we'll include it in the callback URL
        
        const installUrl = `https://${shopDomain}/admin/oauth/authorize?` +
            `client_id=${SHOPIFY_API_KEY}&` +
            `scope=${SHOPIFY_SCOPES}&` +
            `redirect_uri=${APP_URL}/api/shopify-auth/callback&` +
            `state=${state}&` +
            `grant_options[]=per-user`;
        
        res.json({ installUrl, state });
    } catch (error) {
        console.error('Error generating install URL:', error);
        res.status(500).json({ message: 'Failed to generate install URL' });
    }
});

// Handle Shopify OAuth callback
router.get('/callback', async (req, res) => {
    try {
        const { code, hmac, shop, state } = req.query;
        
        if (!code || !shop) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }
        
        // Verify HMAC (important for security)
        const queryString = Object.keys(req.query)
            .filter(key => key !== 'hmac')
            .sort()
            .map(key => `${key}=${req.query[key]}`)
            .join('&');
            
        const calculatedHmac = crypto
            .createHmac('sha256', SHOPIFY_API_SECRET!)
            .update(queryString)
            .digest('hex');
            
        if (calculatedHmac !== hmac) {
            return res.status(401).json({ message: 'Invalid HMAC' });
        }
        
        // Exchange code for access token
        const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code
        });
        
        const { access_token } = tokenResponse.data;
        
        // Get shop information
        const shopResponse = await axios.get(`https://${shop}/admin/api/2023-10/shop.json`, {
            headers: {
                'X-Shopify-Access-Token': access_token
            }
        });
        
        const shopData = shopResponse.data.shop;
        
        // Return success page with token (in production, store securely)
        res.send(`
            <html>
                <head><title>Shopify App Installed</title></head>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h1 style="color: #00A651;">✅ Successfully Connected!</h1>
                    <p>Your Shopify store <strong>${shopData.name}</strong> has been connected.</p>
                    <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
                        <h3>Store Details:</h3>
                        <p><strong>Store:</strong> ${shopData.name}</p>
                        <p><strong>Domain:</strong> ${shopData.myshopify_domain}</p>
                        <p><strong>Currency:</strong> ${shopData.currency}</p>
                    </div>
                    <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 8px;">
                        <h4>Access Token (copy this):</h4>
                        <code style="background: white; padding: 10px; display: block; word-break: break-all;">${access_token}</code>
                    </div>
                    <p><em>Copy the access token above and paste it into your website settings in the eCommerce Manager.</em></p>
                    <button onclick="window.close()" style="background: #00A651; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
                </body>
            </html>
        `);
        
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).send(`
            <html>
                <head><title>Connection Failed</title></head>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h1 style="color: #dc3545;">❌ Connection Failed</h1>
                    <p>There was an error connecting your Shopify store.</p>
                    <p><em>${error instanceof Error ? error.message : 'Unknown error'}</em></p>
                    <button onclick="window.close()" style="background: #dc3545; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
                </body>
            </html>
        `);
    }
});

// Verify Shopify webhook (for future use)
router.post('/webhook/verify', (req, res, next) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const body = JSON.stringify(req.body);
    const hash = crypto
        .createHmac('sha256', SHOPIFY_API_SECRET!)
        .update(body, 'utf8')
        .digest('base64');
    
    if (hash !== hmac) {
        return res.status(401).json({ message: 'Unauthorized webhook' });
    }
    
    next();
});

export default router;
