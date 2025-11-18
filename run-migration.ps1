# Load DATABASE_URL from .env.local
$envContent = Get-Content .env.local
foreach ($line in $envContent) {
    if ($line -match '^DATABASE_URL=(.+)$') {
        $env:DATABASE_URL = $matches[1]
        break
    }
}

# Run Prisma migration
npx prisma migrate dev --name add_subscription_tiers
