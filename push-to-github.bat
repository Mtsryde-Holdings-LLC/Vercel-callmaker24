@echo off
cd /d c:\Users\nuel6\Downloads\callmaker24-vercel
echo === Checking Git Status ===
git status
echo.
echo === Current Commits ===
git log --oneline -3
echo.
echo === Remote Configuration ===
git remote -v
echo.
echo === Pushing to GitHub ===
git push -u origin main --force --verbose
pause
