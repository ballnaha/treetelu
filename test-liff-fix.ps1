# Test LIFF Double Loading Fix
# Script for testing LIFF double loading fix

Write-Host "Testing LIFF Double Loading Fix..." -ForegroundColor Cyan

# Check modified files
$filesToCheck = @(
    "src/app/layout.tsx",
    "src/components/LiffAutoLogin.tsx", 
    "src/utils/liffUtils.ts",
    "src/context/AuthContext.tsx",
    "src/components/ClientProvider.tsx"
)

Write-Host "`nChecking modified files..." -ForegroundColor Yellow

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Write-Host "Found: $file" -ForegroundColor Green
        
        # Check important content
        $content = Get-Content $file -Raw
        
        switch ($file) {
            "src/app/layout.tsx" {
                if ($content -match "CartProvider.*ClientProvider" -and $content -notmatch "CartProvider.*CartProvider") {
                    Write-Host "   Fixed double CartProvider wrapping" -ForegroundColor Green
                } else {
                    Write-Host "   CartProvider structure may still have issues" -ForegroundColor Red
                }
            }
            "src/components/LiffAutoLogin.tsx" {
                if ($content -match "hasInitialized" -and $content -match "useEffect.*\[\]") {
                    Write-Host "   Added initialization protection" -ForegroundColor Green
                } else {
                    Write-Host "   Missing initialization protection" -ForegroundColor Red
                }
            }
            "src/utils/liffUtils.ts" {
                if ($content -match "isLoggedIn.*undefined") {
                    Write-Host "   Added LIFF initialization check" -ForegroundColor Green
                } else {
                    Write-Host "   Missing LIFF initialization check" -ForegroundColor Red
                }
            }
            "src/context/AuthContext.tsx" {
                if ($content -match "useEffect.*\[\]") {
                    Write-Host "   Fixed AuthContext useEffect" -ForegroundColor Green
                } else {
                    Write-Host "   AuthContext useEffect may still cause re-renders" -ForegroundColor Red
                }
            }
            "src/components/ClientProvider.tsx" {
                if ($content -match "hasInitialized") {
                    Write-Host "   Added ClientProvider initialization protection" -ForegroundColor Green
                } else {
                    Write-Host "   Missing ClientProvider initialization protection" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "Not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nBuild and test recommendations:" -ForegroundColor Yellow
Write-Host "1. Run: npm run build" -ForegroundColor White
Write-Host "2. Test in development: npm run dev" -ForegroundColor White
Write-Host "3. Deploy to production and test in LINE LIFF" -ForegroundColor White
Write-Host "4. Check browser console for LIFF initialization logs" -ForegroundColor White
Write-Host "5. Verify no duplicate LIFF initialized successfully messages" -ForegroundColor White

Write-Host "`nExpected improvements:" -ForegroundColor Yellow
Write-Host "- Reduced page loading time in LIFF" -ForegroundColor Green
Write-Host "- No screen flickering during initialization" -ForegroundColor Green  
Write-Host "- Single LIFF SDK initialization" -ForegroundColor Green
Write-Host "- Improved user experience" -ForegroundColor Green

Write-Host "`nLIFF Double Loading Fix Test Complete!" -ForegroundColor Cyan