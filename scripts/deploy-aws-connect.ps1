# PowerShell script for AWS Connect deployment
# Run with: .\scripts\deploy-aws-connect.ps1

Write-Host "`n🚀 AWS Connect Automated Deployment`n" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check AWS CLI
$awsCli = Get-Command aws -ErrorAction SilentlyContinue
if (-not $awsCli) {
    Write-Host "❌ AWS CLI not installed" -ForegroundColor Red
    Write-Host "Install: https://aws.amazon.com/cli/"
    exit 1
}

Write-Host "✅ AWS CLI found" -ForegroundColor Green

# Check credentials
$callerIdentity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ AWS credentials not configured" -ForegroundColor Red
    Write-Host "Run: aws configure"
    exit 1
}

Write-Host "✅ AWS credentials valid" -ForegroundColor Green

# Get configuration
$instanceAlias = Read-Host "Enter instance alias (e.g., callmaker24)"
$awsRegion = Read-Host "Enter AWS region [us-east-1]"
if ([string]::IsNullOrWhiteSpace($awsRegion)) {
    $awsRegion = "us-east-1"
}

Write-Host "`n📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Instance Alias: $instanceAlias"
Write-Host "   Region: $awsRegion"
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Deployment cancelled"
    exit 0
}

Write-Host "`n⏳ Creating AWS Connect instance..." -ForegroundColor Yellow

# Create instance
$createResult = aws connect create-instance `
    --identity-management-type CONNECT_MANAGED `
    --instance-alias $instanceAlias `
    --inbound-calls-enabled `
    --outbound-calls-enabled `
    --region $awsRegion `
    --output json | ConvertFrom-Json

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create instance" -ForegroundColor Red
    exit 1
}

$instanceId = $createResult.Id
Write-Host "✅ Instance created: $instanceId" -ForegroundColor Green

# Wait for instance to be active
Write-Host "⏳ Waiting for instance to become active..." -ForegroundColor Yellow

for ($i = 1; $i -le 60; $i++) {
    $instance = aws connect describe-instance `
        --instance-id $instanceId `
        --region $awsRegion `
        --output json | ConvertFrom-Json
    
    if ($instance.Instance.InstanceStatus -eq "ACTIVE") {
        Write-Host "`n✅ Instance is active!" -ForegroundColor Green
        break
    }
    
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 3
}

# Get instance details
Write-Host "`n📊 Getting instance details..." -ForegroundColor Cyan

$instance = aws connect describe-instance `
    --instance-id $instanceId `
    --region $awsRegion `
    --output json | ConvertFrom-Json

$instanceArn = $instance.Instance.Arn
Write-Host "   Instance ARN: $instanceArn"

# Search for phone numbers
Write-Host "`n📱 Searching for available phone numbers..." -ForegroundColor Cyan

$phoneSearch = aws connect search-available-phone-numbers `
    --target-arn $instanceArn `
    --phone-number-country-code US `
    --phone-number-type DID `
    --region $awsRegion `
    --output json 2>$null | ConvertFrom-Json

$phoneNumber = $null

if ($phoneSearch.AvailableNumbersList -and $phoneSearch.AvailableNumbersList.Count -gt 0) {
    $phoneNumber = $phoneSearch.AvailableNumbersList[0].PhoneNumber
    Write-Host "   Found: $phoneNumber"
    
    $claimNumber = Read-Host "Claim this number? (y/n)"
    if ($claimNumber -eq "y") {
        aws connect claim-phone-number `
            --target-arn $instanceArn `
            --phone-number $phoneNumber `
            --region $awsRegion
        
        Write-Host "✅ Phone number claimed!" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  No phone numbers available. Claim one manually." -ForegroundColor Yellow
}

# Create contact flow
Write-Host "`n📋 Creating contact flow..." -ForegroundColor Cyan

$flowContent = @{
    Version = "2019-10-30"
    StartAction = "welcome"
    Actions = @(
        @{
            Identifier = "welcome"
            Type = "MessageParticipant"
            Parameters = @{
                Text = "Thank you for calling. Please hold while we connect you."
            }
            Transitions = @{
                NextAction = "end"
            }
        },
        @{
            Identifier = "end"
            Type = "DisconnectParticipant"
            Parameters = @{}
        }
    )
} | ConvertTo-Json -Depth 10 -Compress

$contactFlowId = $null

try {
    $flowResult = aws connect create-contact-flow `
        --instance-id $instanceId `
        --name "CallMaker24-Default" `
        --type CONTACT_FLOW `
        --content $flowContent `
        --region $awsRegion `
        --output json | ConvertFrom-Json
    
    $contactFlowId = $flowResult.ContactFlowId
    Write-Host "✅ Contact flow created: $contactFlowId" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not create contact flow" -ForegroundColor Yellow
}

# Update .env.local
Write-Host "`n💾 Updating .env.local..." -ForegroundColor Cyan

$envFile = ".env.local"

if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    
    $envContent = $envContent -replace "AWS_CONNECT_INSTANCE_ID=.*", "AWS_CONNECT_INSTANCE_ID=$instanceId"
    $envContent = $envContent -replace "AWS_CONNECT_INSTANCE_ARN=.*", "AWS_CONNECT_INSTANCE_ARN=$instanceArn"
    $envContent = $envContent -replace "AWS_CONNECT_INSTANCE_ALIAS=.*", "AWS_CONNECT_INSTANCE_ALIAS=$instanceAlias"
    
    if ($phoneNumber) {
        $envContent = $envContent -replace "AWS_CONNECT_PHONE_NUMBER=.*", "AWS_CONNECT_PHONE_NUMBER=$phoneNumber"
    }
    
    if ($contactFlowId) {
        $envContent = $envContent -replace "AWS_CONNECT_CONTACT_FLOW_ID=.*", "AWS_CONNECT_CONTACT_FLOW_ID=$contactFlowId"
    }
    
    Set-Content -Path $envFile -Value $envContent
    Write-Host "✅ .env.local updated" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.local not found" -ForegroundColor Yellow
}

# Print summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "✅ AWS Connect deployment complete!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

Write-Host "📊 Instance Details:"
Write-Host "   Alias: $instanceAlias"
Write-Host "   ID: $instanceId"
Write-Host "   ARN: $instanceArn"
if ($phoneNumber) { Write-Host "   Phone: $phoneNumber" }
if ($contactFlowId) { Write-Host "   Contact Flow: $contactFlowId" }

Write-Host "`n🌐 CCP URL:"
Write-Host "   https://$instanceAlias.my.connect.aws/ccp-v2/"

Write-Host "`n📋 Next Steps:"
Write-Host "   1. Test: node scripts/test-aws-connect.js"
Write-Host "   2. Add environment variables to Vercel"
Write-Host "   3. Configure additional contact flows in AWS Console`n"
