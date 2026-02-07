# Fix: Order Balance, Transactions, and Point Awards Not Working

## 🔍 Issue Description

Some customers were experiencing problems with:

- **Order balance** not showing correctly
- **Transactions** not appearing in loyalty portal
- **Point awards** not being calculated properly

## 🐛 Root Causes

### 1. Missing `organizationId` Filter in Transactions API ✅ FIXED

**File**: `src/app/api/loyalty/portal/transactions/route.ts`

**Problem**: The API was querying orders and discounts without filtering by `organizationId`, which in a multi-tenant system can cause:

- Customers seeing wrong/missing transactions
- Incorrect order balances
- Cross-tenant data leakage (security issue)

**Before**:

```typescript
const orders = await prisma.order.findMany({
  where: {
    customerId: customer.id, // Only filtered by customer
  },
});
```

**After**:

```typescript
const orders = await prisma.order.findMany({
  where: {
    customerId: customer.id,
    organizationId: customer.organizationId, // ✅ Now filtered by org
  },
});
```

### 2. Legacy Data Missing `organizationId` ⚠️ NEEDS MIGRATION

**Tables Affected**:

- `orders` - Some orders may not have `organizationId` set
- `discount_usage` - Some discounts may not have `organizationId` set

**Problem**: When orders/discounts were created before the multi-tenant migration, they might not have `organizationId` populated. This causes them to be invisible to organization-scoped queries.

## ✅ Solutions Applied

### Immediate Fix (Code Changes)

1. ✅ Added `organizationId` filter to orders query in transactions API
2. ✅ Added `organizationId` filter to discounts query in transactions API

**Files Modified**:

- [src/app/api/loyalty/portal/transactions/route.ts](../src/app/api/loyalty/portal/transactions/route.ts)

### Data Migration Required

Run this script to fix legacy data:

```bash
node scripts/fix-missing-organizationid.js
```

**What it does**:

- Finds all orders without `organizationId`
- Looks up the customer's organization
- Updates the order with the correct `organizationId`
- Repeats for discount_usage records
- Reports on any customers missing organization assignments

## 🧪 How to Verify the Fix

### 1. Check Database

```sql
-- Check for orders missing organizationId
SELECT COUNT(*) FROM orders WHERE "organizationId" IS NULL;

-- Check for discounts missing organizationId
SELECT COUNT(*) FROM discount_usage WHERE "organizationId" IS NULL;

-- Check for customers missing organizationId
SELECT COUNT(*) FROM customers WHERE "organizationId" IS NULL;
```

All counts should be 0 after running the migration.

### 2. Test Customer Portal

1. Access customer loyalty portal: `/loyalty/portal?org=your-org`
2. Login with a customer account
3. Navigate to "Transaction History"
4. Verify:
   - ✅ Orders appear correctly
   - ✅ Total spent matches expectations
   - ✅ Discounts are listed
   - ✅ Point balance is accurate

### 3. Test Admin Dashboard

1. Go to Dashboard → Loyalty
2. Check customer list
3. Verify:
   - ✅ `totalSpent` is correct
   - ✅ `loyaltyPoints` matches spending
   - ✅ Order counts are accurate

## 🔒 Security Impact

This fix addresses a **critical multi-tenant isolation issue**:

- **Before**: Customers could potentially see transactions from other organizations
- **After**: Strict organization-scoped queries ensure data isolation

## 📊 Related Issues

This fix is part of the broader multi-tenant architecture improvements. Related areas checked:

✅ Customer API - Already filtering by `organizationId`  
✅ Order API (`/api/customers/[id]/orders`) - Already filtering by `organizationId`  
✅ Shopify webhooks - Already setting `organizationId` on order creation  
⚠️ Legacy data - Requires migration script

## 🚀 Deployment Checklist

- [x] Code changes deployed
- [ ] Run migration script: `node scripts/fix-missing-organizationid.js`
- [ ] Verify zero records missing `organizationId`
- [ ] Test customer portal transactions
- [ ] Test admin dashboard loyalty page
- [ ] Monitor for any errors in logs

## 📝 Notes

- The `Order.organizationId` field in schema is optional (`String?`) - this is intentional for backward compatibility
- All new orders created via Shopify webhook correctly include `organizationId`
- Manual orders created via API correctly include `organizationId`
- Only legacy data (pre-multi-tenant) needs migration

## 🆘 If Issues Persist

1. **Check customer has organizationId**:

   ```sql
   SELECT id, email, "organizationId" FROM customers WHERE email = 'customer@example.com';
   ```

2. **Check orders have organizationId**:

   ```sql
   SELECT id, "orderNumber", "customerId", "organizationId"
   FROM orders
   WHERE "customerId" = 'customer_id_here';
   ```

3. **Verify API is filtering correctly**:
   - Add logging to transactions API
   - Check customer.organizationId is not null
   - Verify query includes organizationId filter

4. **Re-run migration script**:
   ```bash
   node scripts/fix-missing-organizationid.js
   ```

---

**Fixed By**: GitHub Copilot  
**Date**: February 6, 2026  
**Status**: ✅ Code Fixed, ⚠️ Migration Pending
