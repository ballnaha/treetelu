# Fix 404 JavaScript Chunks Error
# สคริปต์สำหรับแก้ไขปัญหา 404 JavaScript chunks

Write-Host "🔧 Fixing 404 JavaScript Chunks Error..." -ForegroundColor Cyan

# 1. Stop any running development server
Write-Host "`n⏹️ Stopping development server..." -ForegroundColor Yellow
try {
    # Kill any Node.js processes running on common ports
    $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($processes) {
        $processes | Stop-Process -Force
        Write-Host "✅ Stopped running Node.js processes" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ No Node.js processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "ℹ️ No processes to stop" -ForegroundColor Gray
}

# 2. Clear all caches
Write-Host "`n🧹 Clearing all caches..." -ForegroundColor Yellow

# Clear .next directory
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
} else {
    Write-Host "ℹ️ .next directory not found" -ForegroundColor Gray
}

# Clear node_modules/.cache
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed node_modules/.cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️ node_modules/.cache not found" -ForegroundColor Gray
}

# Clear npm cache
try {
    npm cache clean --force
    Write-Host "✅ Cleared npm cache" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not clear npm cache" -ForegroundColor Yellow
}

# 3. Reinstall dependencies (if needed)
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules") -or !(Test-Path "package-lock.json")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Dependencies appear to be installed" -ForegroundColor Gray
}

# 4. Fix potential config issues
Write-Host "`n⚙️ Checking configuration..." -ForegroundColor Yellow

# Check if next.config.js is valid
try {
    node -e "require('./next.config.js')"
    Write-Host "✅ next.config.js is valid" -ForegroundColor Green
} catch {
    Write-Host "❌ next.config.js has syntax errors" -ForegroundColor Red
    Write-Host "Please check the configuration file" -ForegroundColor Yellow
}

# 5. Rebuild the project
Write-Host "`n🔨 Rebuilding project..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "Trying development mode instead..." -ForegroundColor Yellow
    
    # If build fails, try development mode
    Write-Host "`n🚀 Starting development server..." -ForegroundColor Yellow
    Write-Host "Running: npm run dev" -ForegroundColor White
    Write-Host "Press Ctrl+C to stop the server when ready" -ForegroundColor Gray
    
    # Start dev server in background
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    
    Write-Host "✅ Development server started" -ForegroundColor Green
    Write-Host "Check http://localhost:3000 in your browser" -ForegroundColor Cyan
    return
}

# 6. Start the server
Write-Host "`n🚀 Starting development server..." -ForegroundColor Yellow
Write-Host "Running: npm run dev" -ForegroundColor White

try {
    npm run dev
    Write-Host "✅ Development server started successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start development server" -ForegroundColor Red
    Write-Host "Try running manually: npm run dev" -ForegroundColor Yellow
}

Write-Host "`n✅ Fix Complete!" -ForegroundColor Cyan
Write-Host "If you still see 404 errors:" -ForegroundColor Yellow
Write-Host "1. Clear browser cache (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "2. Try incognito/private browsing mode" -ForegroundColor White
Write-Host "3. Check browser console for additional errors" -ForegroundColor White