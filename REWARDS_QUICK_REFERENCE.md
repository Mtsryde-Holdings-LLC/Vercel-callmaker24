# Loyalty Rewards - Quick Reference

## 🎁 Reward Tiers

| Points | Reward | Details |
|--------|--------|---------|
| **250** | 10% Off Next Purchase | One-time use, 30 days validity |
| **500** | 15% Off One Purchase | One-time use, 30 days validity |
| **1000** | 20% Off + Free $10 Item | One-time use, 30 days validity |

## 📱 Customer Usage

### How to Redeem
1. Visit Loyalty Portal: `/loyalty/portal?org=your-org`
2. Login with email or phone
3. Click "Available Rewards"
4. Select reward and click "Redeem Now"
5. Copy your unique code: `REWARD-XXXXXXXXXXXX`
6. Use code at checkout

### Redemption Rules
- ✅ 1 point = $1 spent
- ✅ Points deducted immediately upon redemption
- ✅ Each code is single-use only
- ✅ Codes expire 30 days after redemption
- ✅ Cannot redeem if insufficient points

## 🔧 Admin Management

### View Rewards
**Dashboard** → **Loyalty** → Scroll to "Redemption Rewards"

### Manage Rewards
- **Activate/Deactivate**: Toggle reward availability
- **Delete**: Remove reward permanently
- **View Stats**: See redemption counts

### Initialize Rewards
```bash
node scripts/init-rewards.js
```

## 🚀 API Endpoints

### List Rewards
```
GET /api/loyalty/rewards
```

### Redeem Reward
```
POST /api/loyalty/redeem
Body: { token: "portal_token", rewardId: "reward_id" }
```

### Redemption History
```
GET /api/loyalty/redeem?token=portal_token
```

## 📊 Database

### Tables
- `redemption_rewards` - Reward definitions
- `reward_redemptions` - Customer redemptions

### Key Fields
```javascript
Customer {
  loyaltyPoints: Int    // Available points
  loyaltyUsed: Int      // Total redeemed points
}

RewardRedemption {
  code: String          // Unique redemption code
  status: String        // ACTIVE, USED, EXPIRED
  expiresAt: DateTime   // When code expires
}
```

## ✨ Quick Actions

### Check Customer Points
```sql
SELECT email, loyaltyPoints, loyaltyUsed 
FROM customers 
WHERE email = 'customer@example.com';
```

### View Recent Redemptions
```sql
SELECT c.email, r.name, rd.code, rd.status
FROM reward_redemptions rd
JOIN customers c ON rd.customerId = c.id
JOIN redemption_rewards r ON rd.rewardId = r.id
ORDER BY rd.createdAt DESC
LIMIT 10;
```

### Manual Point Adjustment
```sql
UPDATE customers 
SET loyaltyPoints = loyaltyPoints + 500
WHERE email = 'customer@example.com';
```

## 🎯 Common Tasks

### Add Test Points to Customer
Via Prisma Studio or API:
```javascript
await prisma.customer.update({
  where: { email: "test@example.com" },
  data: { 
    loyaltyPoints: { increment: 1000 },
    loyaltyMember: true
  }
});
```

### Create Custom Reward
```bash
curl -X POST https://yourdomain.com/api/loyalty/rewards \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "30% Off VIP Reward",
    "description": "Exclusive VIP discount",
    "pointsCost": 2000,
    "type": "PERCENTAGE_DISCOUNT",
    "discountPercent": 30,
    "expiryDays": 60
  }'
```

### Deactivate Expired Redemptions
```sql
UPDATE reward_redemptions 
SET status = 'EXPIRED' 
WHERE status = 'ACTIVE' 
AND expiresAt < NOW();
```

## 🔍 Troubleshooting

### Customer Can't Redeem
- ✓ Check points balance: `loyaltyPoints >= pointsCost`
- ✓ Verify reward is active: `isActive = true`
- ✓ Confirm valid portal token

### Code Not Working at Checkout
- ✓ Check status: `status = 'ACTIVE'`
- ✓ Verify not expired: `expiresAt > NOW()`
- ✓ Ensure not already used: `usedAt IS NULL`

### Dashboard Not Showing Rewards
- ✓ Run init script: `node scripts/init-rewards.js`
- ✓ Check organization ID matches
- ✓ Refresh page after creating rewards

## 📞 Support

**Full Documentation**: See `REWARDS_REDEMPTION_SYSTEM.md`

**Database Schema**: See `prisma/schema.prisma`

**Initialization**: `scripts/init-rewards.js`

---

💡 **Tip**: Use the customer portal at `/loyalty/portal?org=your-org` to test the full redemption flow!
