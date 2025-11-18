# Subscription Plan Changes

## Updated Pricing (Before Taxes and Fees)

### Previous Plans (3 tiers)
| Plan | Price | Email | SMS | AI |
|------|-------|-------|-----|-----|
| Basic | $29.00/mo | 5,000 | 500 | 100 |
| Pro | $99.00/mo | 50,000 | 5,000 | 1,000 |
| Enterprise | $299.00/mo | 500,000 | 50,000 | 10,000 |

### New Plans (4 tiers) ✨
| Plan | Price | Email | SMS | AI |
|------|-------|-------|-----|-----|
| **Starter** | **$39.99/mo** | 5,000 | 500 | 100 |
| **Elite** | **$69.99/mo** | 25,000 | 2,500 | 500 |
| **Professional** | **$99.99/mo** | 50,000 | 5,000 | 1,000 |
| **Enterprise** | **$299.99/mo** | 500,000 | 50,000 | 10,000 |

## Changes Made

### 1. Plan Names
- ✅ "Basic" → "Starter"
- ✅ Added new "Elite" tier
- ✅ "Pro" → "Professional"
- ✅ "Enterprise" remains the same

### 2. Pricing
- ✅ Starter: $29.00 → $39.99
- ✅ Elite: New tier at $69.99
- ✅ Professional: $99.00 → $99.99
- ✅ Enterprise: $299.00 → $299.99

### 3. Elite Plan Features (New Tier)
- 25,000 emails/month
- 2,500 SMS messages/month
- 500 AI credits/month
- Advanced analytics
- Priority support
- Custom templates
- **Popular** badge

### 4. Professional Plan Updates
- Added "API access" feature
- Maintains all previous Pro plan features

## Files Updated

### Code Files
1. `prisma/schema.prisma` - Updated SubscriptionPlan enum
2. `src/components/billing/BillingTab.tsx` - Updated pricing display
3. `src/services/payment.service.ts` - Updated credit allocation logic
4. `.env.example` - Updated environment variable names

### Documentation Files
5. `docs/STRIPE_INTEGRATION.md` - Updated setup guide
6. `PR_SUMMARY.md` - Updated pricing table
7. `ARCHITECTURE_DIAGRAM.md` - Updated credit allocation

## Environment Variables

### Before
```env
STRIPE_PRICE_ID_BASIC=price_basic_monthly
STRIPE_PRICE_ID_PRO=price_pro_monthly
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_monthly
```

### After
```env
STRIPE_PRICE_ID_STARTER=price_starter_monthly
STRIPE_PRICE_ID_ELITE=price_elite_monthly
STRIPE_PRICE_ID_PROFESSIONAL=price_professional_monthly
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_monthly
```

## Deployment Notes

When deploying these changes:

1. **Create new products in Stripe Dashboard**:
   - Starter at $39.99/month
   - Elite at $69.99/month
   - Professional at $99.99/month
   - Enterprise at $299.99/month

2. **Update environment variables** with new price IDs

3. **Run database migration**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Test checkout flow** for all four tiers

---

**Note**: All prices are before taxes and fees as requested.
