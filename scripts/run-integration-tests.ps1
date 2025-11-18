# Load environment variables from .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
        Write-Host "Set $name" -ForegroundColor Green
    }
}

# Run the integration tests
Write-Host "`nRunning multi-tenant integration tests..." -ForegroundColor Cyan
npm test -- tests/integration/multi-tenant-isolation.test.ts --verbose
