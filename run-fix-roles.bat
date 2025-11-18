@echo off
set DATABASE_URL=postgresql://postgres:vdAUTIBpwRRChpHatJXZQEISHmcaMzex@ballast.proxy.rlwy.net:28529/railway
echo Fixing user roles...
node fix-user-roles.js
pause
