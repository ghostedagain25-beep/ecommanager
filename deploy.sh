#!/bin/bash

# EcomManager Deployment Script
# This script helps prepare your application for deployment

echo "🚀 EcomManager Deployment Preparation"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "client/package.json" ]; then
    echo "❌ Error: client/package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Pre-deployment checklist:"
echo ""

# Check for required files
echo "✅ Checking required files..."
required_files=("render.yaml" "Dockerfile" ".dockerignore" "DEPLOYMENT.md")
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing"
    fi
done

# Check environment files
echo ""
echo "🔧 Checking environment configuration..."
if [ -f "client/.env.example" ]; then
    echo "   ✅ client/.env.example exists"
else
    echo "   ❌ client/.env.example missing"
fi

if [ -f "server/.env.example" ]; then
    echo "   ✅ server/.env.example exists"
else
    echo "   ❌ server/.env.example missing"
fi

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."
if [ -d "client/node_modules" ]; then
    echo "   ✅ Frontend dependencies installed"
else
    echo "   ⚠️  Frontend dependencies not installed. Run: cd client && npm install"
fi

if [ -d "server/node_modules" ]; then
    echo "   ✅ Backend dependencies installed"
else
    echo "   ⚠️  Backend dependencies not installed. Run: cd server && npm install"
fi

# Check build capability
echo ""
echo "🔨 Testing build process..."
echo "   Testing frontend build..."
if cd client && npm run build > /dev/null 2>&1; then
    echo "   ✅ Frontend builds successfully"
    cd ..
else
    echo "   ❌ Frontend build failed"
    cd ..
fi

echo "   Testing backend build..."
if cd server && npm run build > /dev/null 2>&1; then
    echo "   ✅ Backend builds successfully"
    cd ..
else
    echo "   ❌ Backend build failed"
    cd ..
fi

# Git status
echo ""
echo "📝 Git status:"
if git status > /dev/null 2>&1; then
    uncommitted=$(git status --porcelain | wc -l)
    if [ $uncommitted -eq 0 ]; then
        echo "   ✅ All changes committed"
    else
        echo "   ⚠️  $uncommitted uncommitted changes"
        echo "   Run: git add . && git commit -m 'Prepare for deployment'"
    fi
else
    echo "   ⚠️  Not a git repository. Initialize with: git init"
fi

echo ""
echo "🌐 Deployment Options:"
echo "======================"
echo ""
echo "1. 🎯 Render (Recommended - Free Tier)"
echo "   • Push to GitHub/GitLab"
echo "   • Connect repository to Render"
echo "   • Auto-deploys with render.yaml"
echo ""
echo "2. 🚂 Railway ($5/month credit)"
echo "   • Install: npm install -g @railway/cli"
echo "   • Deploy: railway login && railway init && railway up"
echo ""
echo "3. ▲ Vercel (Frontend) + Railway (Backend)"
echo "   • Connect frontend repo to Vercel"
echo "   • Deploy backend to Railway"
echo ""
echo "4. 🐳 Docker (Self-hosted)"
echo "   • Build: docker build -t ecommanager ."
echo "   • Run: docker run -p 10000:10000 ecommanager"
echo ""

echo "📚 Next Steps:"
echo "=============="
echo "1. Set up MongoDB Atlas (free tier)"
echo "2. Create Shopify Partner account and app"
echo "3. Choose deployment platform and follow DEPLOYMENT.md"
echo "4. Configure environment variables in hosting platform"
echo "5. Update Shopify app URLs with production domains"
echo ""
echo "📖 For detailed instructions, see: DEPLOYMENT.md"
echo ""
echo "🎉 Your application is ready for deployment!"
