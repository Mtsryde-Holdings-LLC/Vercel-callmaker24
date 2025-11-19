# Install Stripe CLI - Quick Guide

## Option 1: Download Installer (Easiest - 2 minutes)

1. **Download Stripe CLI**:
   - Go to: https://github.com/stripe/stripe-cli/releases/latest
   - Download: `stripe_X.X.X_windows_x86_64.zip`

2. **Install**:
   - Extract the ZIP file
   - Move `stripe.exe` to: `C:\Program Files\Stripe\`
   - Or any folder in your PATH

3. **Add to PATH** (if needed):
   - Search Windows: "Environment Variables"
   - Edit "Path" under User or System variables
   - Add: `C:\Program Files\Stripe\`
   - Click OK

4. **Verify**:
   ```powershell
   stripe --version
   ```

5. **Login**:
   ```powershell
   stripe login
   ```
   - Opens browser to authenticate
   - Click "Allow access"

6. **Run Setup**:
   ```powershell
   node scripts/setup-stripe.js
   ```

---

## Option 2: Install Scoop First (Package Manager)

### Step 1: Install Scoop

Run this in PowerShell (as Administrator):

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### Step 2: Install Stripe CLI via Scoop

```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Step 3: Login to Stripe

```powershell
stripe login
```

### Step 4: Run Automation

```powershell
node scripts/setup-stripe.js
```

---

## Option 3: Manual Setup (No CLI Required)

If you prefer not to install Stripe CLI, you can set up manually:

### Use VS Code Stripe Extension

1. **Login to Stripe Extension**:
   - Press `Ctrl+Shift+P`
   - Type: `Stripe: Login`
   - Authenticate in browser

2. **Get API Keys**:
   - Go to: https://dashboard.stripe.com/test/apikeys
   - Copy your keys

3. **Create Products Manually**:
   - Go to: https://dashboard.stripe.com/test/products
   - Click "Add product" for each plan:

   **Product 1: Starter Plan**
   - Name: Starter Plan
   - Price 1: $49.99 USD monthly → Copy price ID
   - Price 2: $509.89 USD yearly → Copy price ID

   **Product 2: Elite Plan**
   - Name: Elite Plan  
   - Price 1: $79.99 USD monthly → Copy price ID
   - Price 2: $815.89 USD yearly → Copy price ID

   **Product 3: Pro Plan**
   - Name: Pro Plan
   - Price 1: $129.99 USD monthly → Copy price ID
   - Price 2: $1,325.89 USD yearly → Copy price ID

   **Product 4: Enterprise Plan**
   - Name: Enterprise Plan
   - Price 1: $499.99 USD monthly → Copy price ID
   - Price 2: $5,099.89 USD yearly → Copy price ID

4. **Update .env.local**:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_key_here
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   
   STRIPE_PRICE_ID_STARTER_MONTHLY=price_xxxxx
   STRIPE_PRICE_ID_STARTER_ANNUAL=price_xxxxx
   STRIPE_PRICE_ID_ELITE_MONTHLY=price_xxxxx
   STRIPE_PRICE_ID_ELITE_ANNUAL=price_xxxxx
   STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxxx
   STRIPE_PRICE_ID_PRO_ANNUAL=price_xxxxx
   STRIPE_PRICE_ID_ENTERPRISE_MONTHLY=price_xxxxx
   STRIPE_PRICE_ID_ENTERPRISE_ANNUAL=price_xxxxx
   ```

5. **Create Webhook** (for local testing):
   - Use VS Code Extension: `Ctrl+Shift+P` → `Stripe: Start webhook forwarding`
   - Or manually in dashboard: https://dashboard.stripe.com/test/webhooks

---

## Quick Links

- **Stripe Dashboard**: https://dashboard.stripe.com/
- **API Keys**: https://dashboard.stripe.com/test/apikeys
- **Products**: https://dashboard.stripe.com/test/products
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **CLI Download**: https://github.com/stripe/stripe-cli/releases/latest
- **Scoop Website**: https://scoop.sh/

---

## After Installation

Once Stripe CLI is installed and you've logged in:

```powershell
# Run the automation script
node scripts/setup-stripe.js
```

This will create all products, prices, and update your environment automatically!

---

## Need Help?

- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **Installation Issues**: https://stripe.com/docs/stripe-cli#install
- **Authentication**: https://stripe.com/docs/stripe-cli#login

Choose whichever method works best for you! 🚀
