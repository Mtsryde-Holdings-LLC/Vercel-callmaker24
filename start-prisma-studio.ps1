# Load environment variables from .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $key = $matches[1]
        $value = $matches[2] -replace '^"(.*)"$', '$1'
        [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Write-Host "Loaded: $key" -ForegroundColor Green
    }
}

Write-Host "`nStarting Prisma Studio on http://localhost:5555..." -ForegroundColor Cyan
npx prisma studio --port 5555
