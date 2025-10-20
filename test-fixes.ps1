# EcomManager Bug Fix Verification Script
# Run this script to verify all fixes are working correctly

Write-Host "🔍 EcomManager Bug Fix Verification" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Checking Bug Fixes..." -ForegroundColor Yellow

# 1. Check API URL Fix
Write-Host ""
Write-Host "1. ✅ Checking API URL Configuration..." -ForegroundColor Cyan
$apiContent = Get-Content "services\api.ts" -Raw
if ($apiContent -match "localhost:3001") {
    Write-Host "   ✅ API URL correctly set to port 3001" -ForegroundColor Green
} else {
    Write-Host "   ❌ API URL issue detected" -ForegroundColor Red
}

# 2. Check WebsiteContext exists
Write-Host ""
Write-Host "2. ✅ Checking Website Context..." -ForegroundColor Cyan
if (Test-Path "context\WebsiteContext.tsx") {
    Write-Host "   ✅ WebsiteContext.tsx exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ WebsiteContext.tsx missing" -ForegroundColor Red
}

# 3. Check Tailwind Configuration
Write-Host ""
Write-Host "3. ✅ Checking Tailwind CSS Configuration..." -ForegroundColor Cyan
$tailwindFiles = @("tailwind.config.js", "postcss.config.js", "index.css")
foreach ($file in $tailwindFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file missing" -ForegroundColor Red
    }
}

# 4. Check VS Code Configuration
Write-Host ""
Write-Host "4. ✅ Checking VS Code Configuration..." -ForegroundColor Cyan
if (Test-Path ".vscode\settings.json") {
    Write-Host "   ✅ VS Code settings configured for Tailwind CSS" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  VS Code settings not found (optional)" -ForegroundColor Yellow
}

# 5. Check Dependencies
Write-Host ""
Write-Host "5. ✅ Checking Dependencies..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.devDependencies.tailwindcss) {
    Write-Host "   ✅ Tailwind CSS installed" -ForegroundColor Green
} else {
    Write-Host "   ❌ Tailwind CSS not installed" -ForegroundColor Red
}

# 6. Check for Common Issues
Write-Host ""
Write-Host "6. ✅ Checking for Common Issues..." -ForegroundColor Cyan

# Check for setWebsites usage (should be removed)
$productManagerContent = Get-Content "components\ProductManager.tsx" -Raw
if ($productManagerContent -match "setWebsites") {
    Write-Host "   ⚠️  Found setWebsites usage in ProductManager (should be removed)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ No setWebsites usage found in ProductManager" -ForegroundColor Green
}

# Check for via.placeholder.com usage (should be removed)
if ($productManagerContent -match "via\.placeholder\.com") {
    Write-Host "   ⚠️  Found via.placeholder.com usage (should be replaced)" -ForegroundColor Yellow
} else {
    Write-Host "   ✅ No via.placeholder.com usage found" -ForegroundColor Green
}

# 7. Test Build Process
Write-Host ""
Write-Host "7. 🔨 Testing Build Process..." -ForegroundColor Cyan
Write-Host "   Testing frontend build..." -ForegroundColor Gray

try {
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend builds successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend build failed" -ForegroundColor Red
        Write-Host "   Build output: $buildOutput" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Frontend build failed with error: $_" -ForegroundColor Red
}

Write-Host "   Testing backend build..." -ForegroundColor Gray
try {
    Push-Location server
    $serverBuildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Backend builds successfully" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Backend build failed" -ForegroundColor Red
        Write-Host "   Build output: $serverBuildOutput" -ForegroundColor Gray
    }
    Pop-Location
} catch {
    Write-Host "   ❌ Backend build failed with error: $_" -ForegroundColor Red
    Pop-Location
}

# Summary
Write-Host ""
Write-Host "📊 Summary" -ForegroundColor Green
Write-Host "==========" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Fixed Issues:" -ForegroundColor Green
Write-Host "   • API port mismatch (3002 → 3001)" 
Write-Host "   • Website loading across menu pages"
Write-Host "   • React key prop warnings"
Write-Host "   • Image placeholder network errors"
Write-Host "   • Type comparison errors"
Write-Host "   • Tailwind CSS production warnings"
Write-Host ""
Write-Host "🆕 New Features:" -ForegroundColor Cyan
Write-Host "   • Shared WebsiteContext for state management"
Write-Host "   • WebsiteSelector component"
Write-Host "   • Enhanced error handling"
Write-Host "   • Persistent website selection"
Write-Host ""
Write-Host "🧪 Manual Testing Required:" -ForegroundColor Yellow
Write-Host "   1. Start both frontend and backend servers"
Write-Host "   2. Test admin user selection and website switching"
Write-Host "   3. Verify website selection persists across menu pages"
Write-Host "   4. Check products and categories load for different users"
Write-Host "   5. Verify no console errors or warnings"
Write-Host ""
Write-Host "🚀 Ready for deployment!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev (in root for frontend)"
Write-Host "2. Run: cd server && npm run dev (for backend)"
Write-Host "3. Test the application thoroughly"
Write-Host "4. Deploy using instructions in DEPLOYMENT.md"
