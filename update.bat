@echo off
echo Updating App Hub...
cd /d "%~dp0"
node build.js
git add -A
git commit -m "Update app registry %date%"
git push
echo.
echo Done! Vercel will auto-deploy in ~30 seconds.
echo Visit: https://app-hub-eight.vercel.app
pause
