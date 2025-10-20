# EcomManager Deployment Guide

## Overview
This guide covers deploying the EcomManager full-stack application to various hosting platforms, with primary focus on Render (free tier).

## Project Structure
```
ecommanager/
├── client/                 # React frontend (Vite)
├── server/                 # Node.js backend (Express + TypeScript)
├── render.yaml            # Render deployment config
├── Dockerfile             # Docker configuration
└── DEPLOYMENT.md          # This file
```

## Prerequisites

### 1. Database Setup (MongoDB Atlas - Free Tier)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (M0 Sandbox - Free)
3. Create database user with read/write permissions
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/ecommanager`

### 2. Shopify App Setup
1. Create Shopify Partner account
2. Create new app in Partner Dashboard
3. Note down:
   - Client ID
   - Client Secret
   - Webhook Secret
4. Set redirect URLs for OAuth

## Deployment Options

## Option 1: Render (Recommended - Free Tier)

### Features:
- ✅ Free tier available
- ✅ Automatic deployments from Git
- ✅ Built-in SSL certificates
- ✅ Environment variable management
- ✅ Health checks and monitoring

### Steps:

#### 1. Prepare Repository
```bash
# Ensure your code is in a Git repository
git init
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2. Deploy to Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Connect your GitHub/GitLab repository
3. Render will automatically detect `render.yaml` and create services

#### 3. Configure Environment Variables
Set these in Render Dashboard for **Backend Service**:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommanager
JWT_SECRET=your_super_secure_jwt_secret_here
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret
FRONTEND_URL=https://ecommanager-frontend.onrender.com
```

Set these for **Frontend Service**:
```
VITE_API_URL=https://ecommanager-api.onrender.com
VITE_SHOPIFY_CLIENT_ID=your_shopify_client_id
```

#### 4. Deploy
- Services will auto-deploy on git push
- Backend: `https://ecommanager-api.onrender.com`
- Frontend: `https://ecommanager-frontend.onrender.com`

### Render Limitations (Free Tier):
- Services sleep after 15 minutes of inactivity
- 750 hours/month limit
- Limited bandwidth
- No custom domains

---

## Option 2: Railway (Alternative)

### Features:
- ✅ $5/month credit (free trial)
- ✅ No sleep mode
- ✅ Better performance than Render free tier
- ✅ PostgreSQL/MongoDB support

### Steps:
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Deploy: `railway up`

### Railway Configuration:
Create `railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/api/health"
  }
}
```

---

## Option 3: Vercel (Frontend) + Railway/Render (Backend)

### Frontend on Vercel:
1. Connect GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables

### Backend on Railway/Render:
- Follow respective backend deployment steps above

---

## Option 4: Netlify (Frontend) + Backend elsewhere

### Frontend on Netlify:
1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

---

## Option 5: Docker Deployment (VPS/Cloud)

### Using provided Dockerfile:
```bash
# Build image
docker build -t ecommanager .

# Run container
docker run -p 10000:10000 \
  -e MONGODB_URI="your_connection_string" \
  -e JWT_SECRET="your_jwt_secret" \
  ecommanager
```

### Docker Compose (Local Development):
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "10000:10000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/ecommanager
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## Post-Deployment Checklist

### 1. Test Endpoints
- ✅ Health check: `GET /api/health`
- ✅ Frontend loads correctly
- ✅ API connectivity from frontend

### 2. Configure Shopify
- Update OAuth redirect URLs to production domains
- Update webhook endpoints
- Test Shopify integration

### 3. Security
- ✅ Environment variables set correctly
- ✅ CORS configured for production domains
- ✅ JWT secrets are secure
- ✅ Database access restricted

### 4. Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Set up uptime monitoring

---

## Troubleshooting

### Common Issues:

#### Build Failures:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Environment Variables:
- Ensure all required variables are set
- Check for typos in variable names
- Verify MongoDB connection string format

#### CORS Issues:
- Update FRONTEND_URL in backend environment
- Check ALLOWED_ORIGINS configuration

#### Shopify Integration:
- Verify OAuth redirect URLs match deployment URLs
- Check webhook endpoints are accessible
- Ensure proper HTTPS configuration

---

## Cost Breakdown

### Free Options:
- **Render**: Free tier (with limitations)
- **Netlify**: 100GB bandwidth/month
- **Vercel**: 100GB bandwidth/month
- **MongoDB Atlas**: 512MB storage

### Paid Options:
- **Railway**: $5/month credit
- **Render Pro**: $7/month per service
- **Digital Ocean**: $5/month VPS
- **AWS/GCP**: Pay-as-you-go

---

## Performance Optimization

### Frontend:
- Enable gzip compression
- Implement code splitting
- Optimize images and assets
- Use CDN for static assets

### Backend:
- Implement Redis caching
- Database query optimization
- API response compression
- Rate limiting

### Database:
- Create proper indexes
- Implement connection pooling
- Regular backups
- Monitor query performance

---

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: Always use SSL in production
3. **CORS**: Restrict to specific domains
4. **Rate Limiting**: Implement API rate limits
5. **Input Validation**: Validate all user inputs
6. **JWT**: Use secure, rotating secrets
7. **Database**: Restrict network access
8. **Monitoring**: Log security events

---

## Support

For deployment issues:
1. Check service logs in hosting platform dashboard
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity
5. Review CORS and security settings

Remember to update Shopify app settings with your production URLs after deployment!
