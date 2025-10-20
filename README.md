<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# EcomManager

A comprehensive multi-user e-commerce management platform with Shopify integration, built with React and Node.js.

## 🚀 Features

- **Multi-User Support**: Independent Shopify store connections per user
- **Role-Based Access**: Admin and user roles with proper authorization
- **Shopify Integration**: Complete OAuth flow, order management, product sync
- **Real-Time Data**: Live synchronization with Shopify stores
- **Admin Dashboard**: User management, push history, system monitoring
- **Secure Authentication**: JWT-based auth with bcrypt password hashing
- **Scalable Architecture**: MongoDB with optimized schemas and indexes

## 🛠 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Modern UI Components** with responsive design

### Backend
- **Node.js** with Express and TypeScript
- **MongoDB** with Mongoose ODM
- **JWT Authentication** with secure token handling
- **Rate Limiting** and CORS protection

### External Integrations
- **Shopify REST API** with OAuth 2.0
- **MongoDB Atlas** for cloud database
- **Webhook Support** for real-time updates

## 📁 Project Structure

```
ecommanager/
├── components/              # React components
│   ├── admin/              # Admin-specific components
│   ├── auth/               # Authentication components
│   ├── shopify/            # Shopify integration components
│   └── common/             # Shared components
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   └── services/       # Business logic
│   └── dist/               # Compiled JavaScript
├── services/               # Frontend API services
├── types/                  # TypeScript type definitions
├── render.yaml            # Render deployment config
└── DEPLOYMENT.md          # Deployment instructions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (free tier available)
- Shopify Partner account for app development

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ecommanager
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd server
   npm install
   cd ..
   ```

3. **Set up environment variables**
   ```bash
   # Copy example files
   cp .env.example .env
   cp server/.env.example server/.env
   
   # Edit with your actual values
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Start backend
   cd server
   npm run dev
   
   # Terminal 2: Start frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 🌐 Deployment

### Render (Recommended - Free Tier)

1. **Push to Git repository**
2. **Connect to Render** - Auto-detects `render.yaml`
3. **Set environment variables** in Render dashboard
4. **Deploy automatically** on git push

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions and alternatives.

### Alternative Hosting Options
- **Railway**: $5/month credit, no sleep mode
- **Vercel + Railway**: Frontend on Vercel, backend on Railway
- **Netlify + Render**: Frontend on Netlify, backend on Render
- **Docker**: Self-hosted with provided Dockerfile

## 🔧 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_SHOPIFY_CLIENT_ID=your_shopify_client_id
```

### Backend (server/.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/ecommanager
JWT_SECRET=your_super_secure_jwt_secret
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:5173
```

## 🔐 Security Features

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **CORS Protection** with configurable origins
- **Rate Limiting** to prevent API abuse
- **Input Validation** on all endpoints
- **Environment-based Configuration** for different deployments
- **Webhook Verification** for Shopify integrations

## 📊 Database Schema

### Users
- Multi-user support with role-based access
- Secure password storage
- User-specific website associations

### Websites
- Shopify store connections per user
- OAuth token management (encrypted)
- Website ownership validation

### Push Jobs & Details
- Comprehensive push history tracking
- User-specific push events
- Detailed operation logging

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/websites` - Get user's websites

### Shopify
- `POST /api/shopify-auth/connect` - Connect Shopify store
- `GET /api/shopify/orders` - Fetch orders
- `POST /api/shopify/sync` - Sync products

### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/websites` - List all websites
- `GET /api/pushes` - Push history

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
cd server
npm test

# Run integration tests
npm run test:integration
```

## 📈 Performance

- **Database Indexing** for optimized queries
- **Rate Limiting** (500ms intervals)
- **Connection Pooling** for MongoDB
- **Efficient API Design** with proper HTTP methods
- **Frontend Code Splitting** with Vite

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review API documentation in code comments
- Check service logs in hosting platform dashboards
- Verify environment variables and database connectivity

## 🔄 Changelog

See [changelogs.md](./changelogs.md) for version history and updates.
