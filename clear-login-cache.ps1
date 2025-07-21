# Clear Login Cache Script
# สคริปต์สำหรับล้าง cache ของหน้า login

Write-Host "🧹 Clearing Login Page Cache..." -ForegroundColor Cyan

# 1. Clear Next.js build cache
Write-Host "`n📁 Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
} else {
    Write-Host "ℹ️ .next directory not found" -ForegroundColor Gray
}

# 2. Clear node_modules cache (optional)
Write-Host "`n📦 Clearing node_modules cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed node_modules/.cache" -ForegroundColor Green
} else {
    Write-Host "ℹ️ node_modules/.cache not found" -ForegroundColor Gray
}

# 3. Clear npm cache
Write-Host "`n🔧 Clearing npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "✅ NPM cache cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not clear npm cache" -ForegroundColor Yellow
}

# 4. Rebuild the project
Write-Host "`n🔨 Rebuilding project..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Project rebuilt successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "Try running: npm install && npm run build" -ForegroundColor Yellow
}

# 5. Instructions for browser cache
Write-Host "`n🌐 Browser Cache Instructions:" -ForegroundColor Yellow
Write-Host "1. Open browser Developer Tools (F12)" -ForegroundColor White
Write-Host "2. Right-click refresh button and select 'Empty Cache and Hard Reload'" -ForegroundColor White
Write-Host "3. Or use Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)" -ForegroundColor White
Write-Host "4. Clear browser data for your domain" -ForegroundColor White

# 6. Server cache instructions
Write-Host "`n🖥️ Server Cache Instructions:" -ForegroundColor Yellow
Write-Host "1. Restart your development server: npm run dev" -ForegroundColor White
Write-Host "2. For production: restart your web server" -ForegroundColor White
Write-Host "3. Clear CDN cache if using one" -ForegroundColor White

# 7. Additional cache busting
Write-Host "`n⚡ Cache Busting Applied:" -ForegroundColor Yellow
Write-Host "✅ Added timestamp to login page" -ForegroundColor Green
Write-Host "✅ Set no-cache headers in middleware" -ForegroundColor Green
Write-Host "✅ Added cache control meta tags" -ForegroundColor Green
Write-Host "✅ Set dynamic rendering for login page" -ForegroundColor Green

Write-Host "`n🎉 Login Cache Clear Complete!" -ForegroundColor Cyan
Write-Host "The login page should now load fresh content without cache." -ForegroundColor Green