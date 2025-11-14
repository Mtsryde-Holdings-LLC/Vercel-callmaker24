# GitHub Push Debug Script
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Git Push Diagnostic Tool" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Users\nuel6\Downloads\callmaker24-vercel"

Write-Host "[1] Checking Git Configuration..." -ForegroundColor Yellow
git config user.name
git config user.email
Write-Host ""

Write-Host "[2] Checking Current Branch..." -ForegroundColor Yellow
git branch
Write-Host ""

Write-Host "[3] Checking Remote Configuration..." -ForegroundColor Yellow
git remote -v
Write-Host ""

Write-Host "[4] Checking Repository Status..." -ForegroundColor Yellow
git status
Write-Host ""

Write-Host "[5] Checking Commits..." -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

Write-Host "[6] Attempting Push..." -ForegroundColor Yellow
Write-Host "Running: git push -u origin main --verbose" -ForegroundColor Cyan
git push -u origin main --verbose 2>&1 | Tee-Object -Variable pushOutput
Write-Host ""

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Push completed!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Push failed with exit code $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "1. Sign in to GitHub in your browser" -ForegroundColor White
    Write-Host "2. Run: git config --global credential.helper wincred" -ForegroundColor White
    Write-Host "3. Try: git push https://github.com/Mtsryde-Holdings-LLC/Vercel-callmaker24.git main" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
