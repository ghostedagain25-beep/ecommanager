# Version 1.8.0 - Environment Variable Separation

**Release Date:** January 20, 2025

## Summary

This release introduces a major organizational improvement by separating frontend and backend environment variables into dedicated files, improving security, maintainability, and developer experience.

## 🔄 Changes Made

### Environment Configuration

#### 1. Separated Environment Files
- **Frontend** (`.env`): Located in project root
  - Contains Vite-specific variables with `VITE_` prefix
  - Includes: `VITE_API_URL`, `GEMINI_API_KEY`
  
- **Backend** (`server/.env`): Located in server directory
  - Contains server, database, and API configurations
  - Includes: `MONGO_URI`, `JWT_SECRET`, `PORT`, Shopify credentials, etc.

#### 2. Created Template Files
- `ecommanager/.env.example` - Frontend environment template
- `ecommanager/server/.env.example` - Backend environment template

#### 3. Updated Code Files
- ✅ `services/apiClient.ts` - Changed from `process.env.REACT_APP_API_URL` to `import.meta.env.VITE_API_URL`
- ✅ `server/src/index.ts` - Corrected dotenv path to load from `server/.env`

### Documentation Updates

#### 4. New Documentation
- ✅ `ENV_SETUP.md` - Comprehensive environment setup guide
- ✅ `SETUP_INSTRUCTIONS.txt` - Quick start guide
- ✅ `CHANGELOG_v1.8.0.md` - This file

#### 5. Updated Existing Documentation
- ✅ `README.md` - Updated project structure, environment variables section, and quick start
- ✅ `DEPLOYMENT.md` - Added environment overview, updated Render configuration
- ✅ `changelogs.md` - Added v1.8.0 entry
- ✅ `render.yaml` - Updated service names and environment variables with proper naming

## 📋 Migration Guide

### For Existing Developers

If you have an existing `.env` file in the root, follow these steps:

1. **Backup your current `.env`:**
   ```bash
   cp .env .env.backup
   ```

2. **Split variables into two files:**

   **Frontend** (`ecommanager/.env`):
   ```env
   VITE_API_URL=https://ecommanager-backend.onrender.com/api
   GEMINI_API_KEY=your_existing_key
   ```

   **Backend** (`ecommanager/server/.env`):
   ```env
   MONGO_URI=your_existing_mongo_uri
   PORT=3002
   NODE_ENV=development
   JWT_SECRET=your_existing_jwt_secret
   SHOPIFY_API_KEY=your_existing_shopify_key
   SHOPIFY_API_SECRET=your_existing_shopify_secret
   APP_URL=http://localhost:3002
   DEFAULT_ADMIN_PASSWORD=your_password
   DEFAULT_USER_PASSWORD=your_password
   ```

3. **Restart both servers:**
   ```bash
   # Terminal 1
   cd server && npm run dev
   
   # Terminal 2
   npm run dev
   ```

### For New Developers

1. Copy template files:
   ```bash
   cp .env.example .env
   cp server/.env.example server/.env
   ```

2. Edit both files with your credentials

3. Start development servers

## 🐛 Bugs Fixed

- **Failed to fetch data**: Fixed inconsistent environment variable naming between `api.ts` and `apiClient.ts`
- **Environment variable loading**: Corrected backend path to properly load from `server/.env`
- **Vite compatibility**: Changed from React's `REACT_APP_` prefix to Vite's `VITE_` prefix

## 📦 File Structure Changes

```diff
ecommanager/
+ ├── .env                      # Frontend env (gitignored)
+ ├── .env.example             # Frontend template
+ ├── ENV_SETUP.md             # Setup guide
+ ├── SETUP_INSTRUCTIONS.txt   # Quick reference
+ ├── CHANGELOG_v1.8.0.md      # This file
  └── server/
+     ├── .env                 # Backend env (gitignored)
+     └── .env.example         # Backend template
```

## ⚙️ Configuration Files Updated

1. **render.yaml**
   - Service name: `ecommanager-api` → `ecommanager-backend`
   - Updated environment variables with correct names
   - Added comments for clarity
   - Changed `MONGODB_URI` → `MONGO_URI`
   - Changed `SHOPIFY_CLIENT_*` → `SHOPIFY_API_*`

2. **vite.config.ts**
   - Already compatible (uses `loadEnv` for Vite variables)
   - No changes needed

3. **.gitignore**
   - Already properly configured to ignore both `.env` files

## 🔐 Security Improvements

- ✅ Clearer separation between frontend and backend secrets
- ✅ Reduced risk of accidentally exposing backend credentials in frontend builds
- ✅ Better organization of sensitive data
- ✅ Separate `.env.example` templates prevent credential leakage

## 📝 Important Notes

### Frontend Variables
- **Must use `VITE_` prefix** - This is a Vite requirement
- Exposed to client-side code
- Bundled into the frontend build
- Only include non-sensitive, client-safe values

### Backend Variables
- **No prefix required** - Standard Node.js environment variables
- Never exposed to client
- Include sensitive credentials (database, JWT secrets, etc.)
- Loaded via `dotenv` package

### Restart Required
- Frontend: Restart Vite dev server after changing `.env`
- Backend: Restart Node server after changing `server/.env`
- Environment variables are loaded at startup only

## 🚀 Deployment Impact

### Render Deployment
- Update service names in Render dashboard if needed
- Verify environment variables match new naming scheme
- Backend service will automatically use `server/.env` locally
- Frontend build will use `VITE_API_URL` from root `.env`

### Local Development
- No breaking changes if you follow migration guide
- Better organization and clarity
- Easier onboarding for new developers

## 📚 References

- See `ENV_SETUP.md` for detailed setup instructions
- See `DEPLOYMENT.md` for deployment configurations
- See `README.md` for quick start guide

## ✅ Testing Checklist

After migration, verify:
- [ ] Frontend can connect to backend API
- [ ] Backend can connect to MongoDB
- [ ] Authentication works (JWT)
- [ ] Shopify integration (if configured)
- [ ] All environment variables load correctly
- [ ] Both dev servers start without errors

## 🤝 Contributors

This update improves the developer experience and follows industry best practices for environment variable management in full-stack applications.

---

**Questions or Issues?**
- Check `ENV_SETUP.md` for troubleshooting
- Review `SETUP_INSTRUCTIONS.txt` for quick reference
- See `DEPLOYMENT.md` for production setup
