@echo off
set DATABASE_URL=postgresql://postgres:vdAUTIBpwRRChpHatJXZQEISHmcaMzex@ballast.proxy.rlwy.net:28529/railway
echo Starting Prisma Studio on http://localhost:5555...
npx prisma studio --port 5555
