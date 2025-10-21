# EcomManager Deployment Script for Windows PowerShell
# This script helps prepare your application for deployment

Write-Host "🚀 EcomManager Deployment Preparation" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "client\package.json")) {
    Write-Host "❌ Error: client/package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Pre-deployment checklist:" -ForegroundColor Yellow
Write-Host ""

# Check for required files
Write-Host "✅ Checking required files..." -ForegroundColor Green
$requiredFiles = @("render.yaml", "Dockerfile", ".dockerignore", "DEPLOYMENT.md")
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
    }
}

# Check environment files
Write-Host ""
Write-Host "🔧 Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path "client\.env.example") {
    Write-Host "   ✅ client\.env.example exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ client\.env.example missing" -ForegroundColor Red
}

if (Test-Path "server\.env.example") {
    Write-Host "   ✅ server\.env.example exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ server\.env.example missing" -ForegroundColor Red
}

# Check if dependencies are installed
Write-Host ""
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "client\node_modules") {
    Write-Host "   ✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Frontend dependencies not installed. Run: cd client && npm install" -ForegroundColor Yellow
}

if (Test-Path "server\node_modules") {
    Write-Host "   ✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Backend dependencies not installed. Run: cd server && npm install" -ForegroundColor Yellow
}

# Check build capability
Write-Host ""
Write-Host "🔨 Testing build process..." -ForegroundColor Yellow
Write-Host "   Testing frontend build..." -ForegroundColor Cyan

try {
    Push-Location client
    $null = npm run build 2>$null
    Write-Host "   ✅ Frontend builds successfully" -ForegroundColor Green
    Pop-Location
} catch {
    Write-Host "   ❌ Frontend build failed" -ForegroundColor Red
    Pop-Location
}

Write-Host "   Testing backend build..." -ForegroundColor Cyan
try {
    Push-Location server
    $null = npm run build 2>$null
    Write-Host "   ✅ Backend builds successfully" -ForegroundColor Green
    Pop-Location
} catch {
    Write-Host "   ❌ Backend build failed" -ForegroundColor Red
    Pop-Location
}

# Git status
Write-Host ""
Write-Host "📝 Git status:" -ForegroundColor Yellow
try {
    $gitStatus = git status --porcelain 2>$null
    if ($gitStatus.Count -eq 0) {
        Write-Host "   ✅ All changes committed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $($gitStatus.Count) uncommitted changes" -ForegroundColor Yellow
        Write-Host "   Run: git add . && git commit -m 'Prepare for deployment'" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Not a git repository. Initialize with: git init" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Deployment Options:" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green
Write-Host ""
Write-Host "1. 🎯 Render (Recommended - Free Tier)" -ForegroundColor Cyan
Write-Host "   • Push to GitHub/GitLab"
Write-Host "   • Connect repository to Render"
Write-Host "   • Auto-deploys with render.yaml"
Write-Host ""
Write-Host "2. 🚂 Railway (`$5/month credit)" -ForegroundColor Cyan
Write-Host "   • Install: npm install -g @railway/cli"
Write-Host "   • Deploy: railway login && railway init && railway up"
Write-Host ""
Write-Host "3. ▲ Vercel (Frontend) + Railway (Backend)" -ForegroundColor Cyan
Write-Host "   • Connect frontend repo to Vercel"
Write-Host "   • Deploy backend to Railway"
Write-Host ""
Write-Host "4. 🐳 Docker (Self-hosted)" -ForegroundColor Cyan
Write-Host "   • Build: docker build -t ecommanager ."
Write-Host "   • Run: docker run -p 10000:10000 ecommanager"
Write-Host ""

Write-Host "📚 Next Steps:" -ForegroundColor Green
Write-Host "==============" -ForegroundColor Green
Write-Host "1. Set up MongoDB Atlas (free tier)"
Write-Host "2. Create Shopify Partner account and app"
Write-Host "3. Choose deployment platform and follow DEPLOYMENT.md"
Write-Host "4. Configure environment variables in hosting platform"
Write-Host "5. Update Shopify app URLs with production domains"
Write-Host ""
Write-Host "📖 For detailed instructions, see: DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Your application is ready for deployment!" -ForegroundColor Green
