# Loyalty Rewards Redemption System

## Overview

The rewards redemption system allows customers to exchange their loyalty points for tangible discounts and perks. This system is fully integrated with the loyalty program and provides a seamless way for customers to benefit from their accumulated points.

## Reward Tiers

### 250 Points - 10% Off Your Next Purchase

- **Cost**: 250 points
- **Benefit**: 10% discount on one purchase
- **Type**: Percentage Discount
- **Validity**: 30 days after redemption
- **Usage**: One-time use

### 500 Points - 15% Off One Purchase

- **Cost**: 500 points
- **Benefit**: 15% discount on one purchase
- **Type**: Percentage Discount
- **Validity**: 30 days after redemption
- **Usage**: One-time use

### 1000 Points - 20% Off + Free $10 Item

- **Cost**: 1000 points
- **Benefits**:
  - 20% discount on purchase
  - Plus a free item worth up to $10
- **Type**: Combo Reward
- **Validity**: 30 days after redemption
- **Usage**: One-time use

## How It Works

### For Customers

1. **Earn Points**: Customers earn 1 point for every $1 spent
2. **Browse Rewards**: Access the Loyalty Portal to view available rewards
3. **Redeem**: Click "Redeem Now" on any reward they can afford
4. **Receive Code**: Get a unique redemption code (format: `REWARD-XXXXXXXXXXXX`)
5. **Use Code**: Apply the code at checkout to receive the discount

### For Administrators

1. **View Rewards**: Go to Dashboard → Loyalty to see all configured rewards
2. **Monitor Usage**: See redemption counts for each reward
3. **Manage Status**: Activate/deactivate rewards as needed
4. **Delete Rewards**: Remove rewards that are no longer offered

## Database Schema

### RedemptionReward Table

Stores the reward definitions:

```prisma
model RedemptionReward {
  id              String      @id @default(cuid())
  name            String
  description     String?
  pointsCost      Int
  type            RewardType  // PERCENTAGE_DISCOUNT, FREE_ITEM, COMBO
  discountPercent Int?
  discountAmount  Float?
  freeItemValue   Float?
  isActive        Boolean     @default(true)
  isSingleUse     Boolean     @default(true)
  expiryDays      Int?
  organizationId  String?
  redemptions     RewardRedemption[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

### RewardRedemption Table

Tracks customer redemptions:

```prisma
model RewardRedemption {
  id             String           @id @default(cuid())
  customerId     String
  customer       Customer
  rewardId       String
  reward         RedemptionReward
  pointsSpent    Int
  code           String           @unique
  status         RedemptionStatus // PENDING, ACTIVE, USED, EXPIRED, CANCELLED
  usedAt         DateTime?
  expiresAt      DateTime?
  orderId        String?
  organizationId String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
}
```

## API Endpoints

### GET /api/loyalty/rewards

List all active rewards for the organization.

**Response**:

```json
{
  "rewards": [
    {
      "id": "clx...",
      "name": "10% Off Your Next Purchase",
      "description": "...",
      "pointsCost": 250,
      "type": "PERCENTAGE_DISCOUNT",
      "discountPercent": 10,
      "isActive": true,
      "isSingleUse": true,
      "expiryDays": 30,
      "_count": {
        "redemptions": 42
      }
    }
  ]
}
```

### POST /api/loyalty/rewards

Create a new reward (Admin only).

**Request**:

```json
{
  "name": "25% Off Special",
  "description": "Limited time offer",
  "pointsCost": 750,
  "type": "PERCENTAGE_DISCOUNT",
  "discountPercent": 25,
  "isSingleUse": true,
  "expiryDays": 14
}
```

### PUT /api/loyalty/rewards?id=xxx

Update an existing reward (Admin only).

### DELETE /api/loyalty/rewards?id=xxx

Delete a reward (Admin only).

### POST /api/loyalty/redeem

Redeem a reward (Customer Portal).

**Request**:

```json
{
  "token": "customer_portal_token",
  "rewardId": "clx..."
}
```

**Response**:

```json
{
  "success": true,
  "redemption": {
    "id": "clx...",
    "code": "REWARD-A1B2C3D4E5F6",
    "reward": {
      "name": "10% Off Your Next Purchase",
      "pointsCost": 250,
      "discountPercent": 10
    },
    "expiresAt": "2025-01-23T18:00:00.000Z"
  },
  "message": "Reward redeemed successfully!"
}
```

### GET /api/loyalty/redeem?token=xxx

Get customer's redemption history.

## Setup Instructions

### 1. Database Migration

Already applied! The migration creates:

- `redemption_rewards` table
- `reward_redemptions` table
- Relation between Customer and RewardRedemption

### 2. Initialize Default Rewards

Run the initialization script:

```bash
node scripts/init-rewards.js
```

This creates the three default reward tiers for all organizations.

### 3. Access Customer Portal

Customers can access rewards at:

```
https://yourdomain.com/loyalty/portal?org=your-org-slug
```

### 4. View Dashboard

Admins can manage rewards at:

```
https://yourdomain.com/dashboard/loyalty
```

## Features

### Customer Portal

- ✅ View available rewards catalog
- ✅ Check points balance in real-time
- ✅ Redeem rewards with one click
- ✅ View redemption history with codes
- ✅ See expiry dates for active redemptions
- ✅ Visual indicators for affordability

### Admin Dashboard

- ✅ View all configured rewards
- ✅ See redemption statistics
- ✅ Activate/deactivate rewards
- ✅ Delete rewards
- ✅ Monitor reward usage patterns

### System Features

- ✅ Automatic point deduction on redemption
- ✅ Unique redemption codes generation
- ✅ Expiry date tracking
- ✅ Single-use enforcement
- ✅ Multi-tenant support (per organization)
- ✅ Transaction safety (database transactions)

## Redemption Flow

```
1. Customer views rewards
   ↓
2. Clicks "Redeem Now"
   ↓
3. System checks:
   - Sufficient points?
   - Reward still active?
   ↓
4. Creates redemption record
   ↓
5. Deducts points from customer
   ↓
6. Increments loyaltyUsed counter
   ↓
7. Generates unique code
   ↓
8. Returns code to customer
   ↓
9. Customer uses code at checkout
```

## Points System Integration

- **Earning**: 1 point per $1 spent (configured in loyalty tiers)
- **Balance**: Tracked in `Customer.loyaltyPoints`
- **Used**: Tracked in `Customer.loyaltyUsed`
- **Available**: `loyaltyPoints - pending redemptions`

## Security

- ✅ Portal token authentication for customer actions
- ✅ Admin-only access for reward management
- ✅ Unique, non-guessable redemption codes
- ✅ Expiry enforcement
- ✅ Transaction-safe point deduction

## Customization

### Adding New Reward Types

Edit `prisma/schema.prisma`:

```prisma
enum RewardType {
  PERCENTAGE_DISCOUNT
  FIXED_AMOUNT_DISCOUNT
  FREE_ITEM
  COMBO
  FREE_SHIPPING  // New type
  BONUS_POINTS   // New type
}
```

Then run:

```bash
npx prisma migrate dev --name add_new_reward_types
npx prisma generate
```

### Changing Expiry Days

Update the reward via API:

```javascript
await fetch("/api/loyalty/rewards?id=xxx", {
  method: "PUT",
  body: JSON.stringify({
    expiryDays: 60, // Change from 30 to 60 days
  }),
});
```

## Testing

### Test Redemption Flow

1. Create a test customer with points:

```javascript
await prisma.customer.update({
  where: { id: "customer_id" },
  data: {
    loyaltyPoints: 1500,
    loyaltyMember: true,
  },
});
```

2. Access customer portal with magic link
3. Navigate to "Available Rewards"
4. Redeem a reward
5. Verify:
   - Points deducted correctly
   - Unique code generated
   - Expiry date set correctly
   - Redemption appears in history

## Monitoring

### Track Redemption Metrics

```sql
-- Most popular rewards
SELECT
  r.name,
  COUNT(rd.id) as redemption_count,
  SUM(rd.pointsSpent) as total_points_spent
FROM redemption_rewards r
LEFT JOIN reward_redemptions rd ON r.id = rd.rewardId
GROUP BY r.id
ORDER BY redemption_count DESC;

-- Recent redemptions
SELECT
  c.firstName,
  c.lastName,
  r.name,
  rd.code,
  rd.status,
  rd.createdAt
FROM reward_redemptions rd
JOIN customers c ON rd.customerId = c.id
JOIN redemption_rewards r ON rd.rewardId = r.id
ORDER BY rd.createdAt DESC
LIMIT 50;

-- Expired unused codes
SELECT
  c.email,
  r.name,
  rd.code,
  rd.expiresAt
FROM reward_redemptions rd
JOIN customers c ON rd.customerId = c.id
JOIN redemption_rewards r ON rd.rewardId = r.id
WHERE rd.status = 'EXPIRED'
  AND rd.usedAt IS NULL;
```

## Next Steps

1. **POS Integration**: Connect redemption codes to your POS system
2. **Email Notifications**: Send emails when rewards are redeemed
3. **SMS Alerts**: Notify customers about expiring redemptions
4. **Analytics**: Build dashboards for reward performance
5. **Gamification**: Add streak bonuses or limited-time offers

## Support

For questions or issues with the rewards system:

- Review this documentation
- Check API endpoints for error messages
- Verify customer has sufficient points
- Ensure rewards are active in dashboard

---

**Version**: 1.0  
**Last Updated**: December 24, 2025  
**Status**: ✅ Production Ready
