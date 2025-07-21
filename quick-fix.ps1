# Quick Fix for 404 Chunks Error
Write-Host "Fixing 404 JavaScript chunks error..." -ForegroundColor Cyan

# Stop any running processes
Write-Host "Stopping development server..." -ForegroundColor Yellow
$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($processes) {
    $processes | Stop-Process -Force
    Write-Host "Stopped Node.js processes" -ForegroundColor Green
}

# Clear .next directory
Write-Host "Clearing .next directory..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Cleared .next directory" -ForegroundColor Green
}

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Rebuild
Write-Host "Rebuilding project..." -ForegroundColor Yellow
npm run build

Write-Host "Fix complete! Now run: npm run dev" -ForegroundColor Cyan