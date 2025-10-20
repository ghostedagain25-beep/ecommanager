# Environment Variables Setup

This project uses **separate** `.env` files for frontend and backend to maintain clear separation of concerns.

## 📁 File Structure

```
ecommanager/
├── .env                    # Frontend environment variables (DO NOT COMMIT)
├── .env.example           # Frontend environment template
└── server/
    ├── .env               # Backend environment variables (DO NOT COMMIT)
    └── .env.example       # Backend environment template
```

## 🎨 Frontend Setup

**Location:** `ecommanager/.env`

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Update the variables:
   ```env
   # For local development
   VITE_API_URL=http://localhost:3002/api
   
   # For production (using Render backend)
   VITE_API_URL=https://ecommanager-backend.onrender.com/api
   
   # Optional: Gemini API for AI features
   GEMINI_API_KEY=your-actual-api-key
   ```

3. **Important:** 
   - Use `VITE_` prefix for all frontend env variables (Vite requirement)
   - Variables are loaded at build time
   - Restart dev server after changing `.env`

## 🔧 Backend Setup

**Location:** `ecommanager/server/.env`

1. Copy the example file:
   ```bash
   cd server
   cp .env.example .env
   ```

2. Update the variables:
   ```env
   # Database connection
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommanager
   
   # Server configuration
   PORT=3002
   NODE_ENV=development
   
   # Security
   JWT_SECRET=your-super-secret-jwt-key-change-this
   
   # Shopify (if using OAuth)
   SHOPIFY_API_KEY=your-shopify-api-key
   SHOPIFY_API_SECRET=your-shopify-secret
   APP_URL=http://localhost:3002
   ```

3. **Important:**
   - Keep `JWT_SECRET` secure and unique
   - Use strong MongoDB credentials
   - Restart server after changing `.env`

## 🚀 Development Workflow

### Starting Local Development

1. **Backend:**
   ```bash
   cd server
   npm run dev
   # Runs on http://localhost:3002
   ```

2. **Frontend:**
   ```bash
   npm run dev
   # Runs on http://localhost:3000
   ```

### Production Deployment

**Frontend:**
- Set `VITE_API_URL` to your production backend URL
- Build: `npm run build`

**Backend:**
- Ensure all environment variables are set on your hosting platform
- For Render: Add env vars in the dashboard

## ⚠️ Security Notes

- ✅ Both `.env` files are gitignored
- ✅ Never commit actual credentials
- ✅ Only commit `.env.example` files
- ✅ Rotate secrets regularly
- ✅ Use different values for development and production

## 🔍 Troubleshooting

**Frontend can't connect to backend:**
- Verify `VITE_API_URL` is set correctly in frontend `.env`
- Restart Vite dev server after changing env vars
- Check CORS settings on backend

**Backend errors on startup:**
- Verify `MONGO_URI` is correct in server `.env`
- Ensure MongoDB is accessible
- Check `JWT_SECRET` is set

**Environment variables not loading:**
- Frontend: Must use `VITE_` prefix
- Backend: Accessed via `process.env.VARIABLE_NAME`
- Always restart servers after changing `.env` files
