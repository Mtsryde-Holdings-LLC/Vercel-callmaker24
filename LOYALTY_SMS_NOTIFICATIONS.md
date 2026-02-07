# Loyalty SMS Notifications

## 📱 Overview

Customers now receive **automatic SMS notifications** whenever they earn or redeem loyalty points, including their current point balance!

## ✨ Features

### 1. **Points Earned Notifications**
Customers receive an SMS when they:
- **Make a purchase (via Shopify)** - This is the ONLY way to earn points
- Points are awarded: 1 point per $1 spent

**Example SMS:**
```
🎉 Hi Sarah! You just earned 150 points for Order #1234!

🥇 GOLD Member
💰 New Balance: 2,350 points

Thank you for being a loyal customer at MyStore!
```

**Note:** No points are awarded for:
- ❌ Signing up for loyalty program
- ❌ Joining as a new customer
- ❌ Welcome bonuses
- ✅ Only for actual purchases/transactions

### 2. **Points Redeemed Notifications**
Customers receive an SMS when they redeem rewards:

**Example SMS:**
```
🎁 Sarah! You've redeemed 500 points for: 10% Off Coupon

🥇 Balance: 1,850 points remaining

Enjoy your reward from MyStore!
```

### 3. **Tier Upgrade Notifications**
Customers receive congratulatory SMS when they reach a new tier:

**Example SMS:**
```
🎊 Congratulations Sarah! You've been upgraded to 💎 PLATINUM tier!

💰 Current Balance: 3,250 points

Enjoy exclusive benefits at MyStore!
```

## 🔧 How It Works

### Service Architecture

```typescript
// src/services/loyalty-notifications.service.ts
export class LoyaltyNotificationsService {
  static async sendPointsEarnedSms(data: {
    customerId: string;
    pointsEarned: number;
    newBalance: number;
    reason?: string;
    organizationId: string;
  }): Promise<void>
  
  static async sendPointsRedeemedSms(...)
  static async sendTierUpgradeSms(...)
}
```

### Integration Points

1. **Shopify Orders Webhook** (`/api/webhooks/shopify/orders`) - **ONLY WAY TO EARN POINTS**
   - Sends SMS when order is paid/completed
   - Awards points: 1 point per $1 spent
   - Includes order number in reason

2. **Auto-Enroll** (`/api/loyalty/auto-enroll`)
   - Enrolls customers in loyalty program
   - **No points awarded** - starts at 0 points
   - Everyone starts at BRONZE tier

3. **Customer Creation** (`/api/customers`)
   - Creates new loyalty members
   - **No welcome bonus points** - starts at 0 points
   - Points only earned from purchases

4. **Reward Redemption** (`/api/loyalty/redeem`)
   - Sends SMS when points are spent
   - Shows remaining balance

## 📊 SMS Message Format

### Points Earned Message Structure:
```
[Emoji] Hi [FirstName]! You just earned [Points] points[ for [Reason]]!

[TierEmoji] [TIER] Member
💰 New Balance: [Balance] points

Thank you for being a loyal customer at [StoreName]!
```

### Tier Emojis:
- 🥉 BRONZE
- 🥈 SILVER
- 🥇 GOLD
- 💎 PLATINUM
- 👑 DIAMOND

## 🔒 Rate Limiting

SMS notifications respect the existing rate limiting system:
- Checked via `checkSmsRateLimit()`
- Prevents spam to customers
- Configured per organization

## ⚡ Non-Blocking Execution

All SMS notifications are sent **asynchronously** and **won't block** the main flow:

```typescript
LoyaltyNotificationsService.sendPointsEarnedSms({...})
  .catch((err) => console.error("Failed to send SMS:", err));
```

This ensures:
- ✅ Order processing continues even if SMS fails
- ✅ Customer enrollment completes successfully
- ✅ No errors propagate to the user

## 🎯 Requirements

### Environment Variables (Already Configured)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Customer Requirements
- Customer must have a valid phone number
- Customer must be enrolled in loyalty program (for order-based points)
- Phone number must be in valid format (E.164)

## 🧪 Testing

### Test Points Award SMS:
```javascript
// Via Shopify webhook (when order is paid)
POST /api/webhooks/shopify/orders
// With paid order data

// Via auto-enroll
POST /api/loyalty/auto-enroll

// Via new customer creation
POST /api/customers
{
  "email": "test@example.com",
  "phone": "+15551234567",
  "firstName": "Test",
  "totalSpent": 100
}
```

### Test Redemption SMS:
```javascript
// Via customer portal
POST /api/loyalty/redeem
{
  "token": "customer_portal_token",
  "rewardId": "reward_id"
}
```

## 📈 Monitoring

Check logs for SMS delivery status:
```
[Loyalty SMS] Points earned notification sent to +15551234567
[Loyalty SMS] Customer {id} has no phone number, skipping SMS
[Loyalty SMS] Failed to send notification: {error}
```

## 🚀 Benefits

1. **Instant Gratification** - Customers know immediately when they earn points
2. **Balance Transparency** - Always shows current point balance
3. **Engagement** - Reminds customers about rewards program
4. **Trust** - Confirms transactions and builds confidence
5. **Retention** - Encourages repeat purchases

## 🎨 Customization

To customize messages, edit:
```typescript
// src/services/loyalty-notifications.service.ts

private static formatPointsEarnedMessage(params: {...}): string {
  // Modify message template here
}
```

## 🔄 Future Enhancements

- [ ] Opt-in/opt-out for SMS notifications
- [ ] Customizable message templates per organization
- [ ] Weekly/monthly points summary SMS
- [ ] Birthday bonus points notifications
- [ ] Point expiration warnings

## 📝 Notes

- SMS are sent via Twilio (existing integration)
- Respects customer's SMS rate limits
- Only sends to customers with valid phone numbers
- All SMS sends are logged to database via `SmsService`
- Failures are logged but don't break the main flow

## ✅ Status

✅ **FULLY IMPLEMENTED AND DEPLOYED**

- Points earned notifications
- Points redeemed notifications
- Tier upgrade notifications
- Integration with all point-awarding flows
- Non-blocking async execution
- Rate limit compliance
