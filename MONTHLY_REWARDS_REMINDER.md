# Monthly Rewards Reminder System

## Overview

Automated monthly email reminder system that sends customers their loyalty rewards balance, eligible discounts, and tier benefits on the 1st of every month at 9:00 AM UTC.

## Features

### 📧 Comprehensive Monthly Statement
Each customer receives a beautifully designed email containing:

1. **Current Points Balance** - Total loyalty points available
2. **Tier Status** - Bronze, Silver, Gold, Platinum, or Diamond
3. **Eligible Discounts** - Current discount percentage based on tier:
   - Bronze: 0% (baseline)
   - Silver: 5% off
   - Gold: 10% off
   - Platinum: 15% off
   - Diamond: 20% off

4. **Account Statistics**:
   - Total points earned
   - Total points used
   - Total amount spent
   - Number of orders placed

5. **Tier Benefits** - Detailed list of current tier perks
6. **Progress Tracking** - Visual progress bar showing points needed for next tier
7. **Call-to-Action** - Direct link to customer's loyalty portal

## Schedule

**Cron Expression**: `0 9 1 * *`
- **Day**: 1st of every month
- **Time**: 9:00 AM UTC
- **Runs**: Automatically via Vercel Cron Jobs

## Email Highlights

### Discount Display
Customers see their current discount eligibility prominently displayed:
```
🎉 You're Eligible For
10% OFF
Use your GOLD discount on every purchase!
```

### Tier Benefits Breakdown

**Bronze**:
- ✨ Earn 1 point per $1 spent
- 📧 Exclusive email offers

**Silver**:
- ✨ Earn 1.5 points per $1 spent
- 💰 5% discount on all purchases
- 🎉 Early access to sales

**Gold**:
- ✨ Earn 2 points per $1 spent
- 💰 10% discount on all purchases
- 🚚 Free standard shipping
- 🎉 Early access to sales

**Platinum**:
- ✨ Earn 2.5 points per $1 spent
- 💰 15% discount on all purchases
- 🚚 Free express shipping
- 👥 Priority customer support
- 🎉 Exclusive member events

**Diamond**:
- ✨ Earn 3 points per $1 spent
- 💰 20% discount on all purchases
- 🚚 Free express shipping
- 👥 VIP customer support
- 🎉 Exclusive member events
- 🎁 Birthday & anniversary gifts

### Progress Visualization
Visual progress bar shows:
- Current points vs. next tier requirement
- Percentage completion
- Points needed to reach next tier

Example:
```
🎯 Progress to PLATINUM
You're 500 points away from unlocking PLATINUM benefits!
[=========>     ] 75%
1,500 / 2,000 points
```

## Technical Implementation

### API Endpoint
**Path**: `/api/cron/monthly-rewards-reminder`
**Method**: GET
**Authentication**: Bearer token (CRON_SECRET)

### Security
The endpoint requires a secret token to prevent unauthorized execution:
```
Authorization: Bearer ${CRON_SECRET}
```

### Rate Limiting
- 100ms delay between each email send
- Prevents overwhelming email service
- Ensures reliable delivery

### Error Handling
- Tracks successful and failed email sends
- Logs all failures for debugging
- Continues processing even if individual emails fail
- Returns summary of sent/failed emails

## Environment Variables Required

```env
# Cron Security
CRON_SECRET=your-secret-token-here

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM=rewards@yourdomain.com

# Application URL
NEXTAUTH_URL=https://yourdomain.com
```

## Testing

### Manual Test (Recommended Before Production)

1. **Create a test endpoint** (temporary):
```typescript
// src/app/api/test/monthly-rewards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call the actual cron endpoint
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/monthly-rewards-reminder`, {
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

2. **Test via Browser**:
   - Navigate to `/api/test/monthly-rewards` while logged in
   - Check your email for the rewards statement
   - Verify all information is correct

3. **Test with cURL**:
```bash
curl -X GET https://yourdomain.com/api/cron/monthly-rewards-reminder \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### What to Verify

✅ **Email Delivery**:
- Email arrives in inbox (not spam)
- All styling renders correctly
- Links work properly

✅ **Data Accuracy**:
- Points balance matches database
- Tier displayed correctly
- Discount percentage matches tier
- Statistics are accurate

✅ **Visual Design**:
- Header gradient displays
- Progress bar renders
- Tier badge shows
- Discount box highlighted
- All emojis display

✅ **Responsiveness**:
- Email looks good on mobile
- Text is readable
- Buttons are tappable
- Layout adapts correctly

## Monitoring

### Vercel Logs
Monitor cron execution in Vercel dashboard:
1. Go to your project
2. Click "Deployments"
3. Select latest deployment
4. Click "Functions" tab
5. Find `/api/cron/monthly-rewards-reminder`
6. View logs and execution history

### Success Metrics
The endpoint returns:
```json
{
  "success": true,
  "emailsSent": 150,
  "emailsFailed": 2,
  "message": "Monthly rewards reminder sent to 150 customers"
}
```

### Common Issues

**Problem**: Emails not sending
- Check RESEND_API_KEY is valid
- Verify EMAIL_FROM domain is verified in Resend
- Check rate limits haven't been exceeded

**Problem**: Wrong data displayed
- Verify customer.loyaltyPoints is up to date
- Check loyaltyTier assignments are correct
- Ensure totalSpent and orderCount are accurate

**Problem**: Cron not running
- Verify CRON_SECRET is set in Vercel
- Check vercel.json syntax is correct
- Ensure endpoint is deployed

## Customization

### Changing Schedule
Edit `vercel.json`:
```json
{
  "path": "/api/cron/monthly-rewards-reminder",
  "schedule": "0 9 1 * *"  // Change this cron expression
}
```

Common schedules:
- `0 9 1 * *` - 9 AM on 1st of month (current)
- `0 9 15 * *` - 9 AM on 15th of month
- `0 9 * * 1` - 9 AM every Monday
- `0 9 1 */3 *` - 9 AM on 1st of every 3 months

### Customizing Email Content
Edit `/api/cron/monthly-rewards-reminder/route.ts`:
- Modify `tierBenefits` object for different benefits
- Update `tierDiscounts` for different discount percentages
- Change HTML template for different design
- Add custom sections or remove existing ones

### Adding SMS Notifications
Extend the `sendMonthlyRewardsEmail` function to also send SMS:
```typescript
// Add Twilio SMS after email send
if (customer.phone && customer.smsOptIn) {
  await sendRewardsSMS(customer.phone, customer.loyaltyPoints, currentDiscount);
}
```

## Best Practices

1. **Always test before production** - Use test endpoint first
2. **Monitor first few runs** - Check logs closely initially
3. **Set up alerts** - Configure Vercel alerts for failures
4. **Keep email short** - Current design balances info and brevity
5. **Update content seasonally** - Refresh messaging quarterly
6. **Track engagement** - Monitor open rates in Resend dashboard

## Future Enhancements

Potential improvements:
- [ ] Personalized product recommendations based on purchase history
- [ ] Special birthday month bonuses
- [ ] Anniversary rewards
- [ ] Referral bonus tracking
- [ ] Tier expiration warnings
- [ ] Exclusive tier-only deals
- [ ] Points expiration notices
- [ ] Gamification elements (badges, streaks)

## Support

If customers report issues:
1. Check if they're opted into emails (`emailOptIn = true`)
2. Verify their email address is correct
3. Check spam folder
4. Resend manually via loyalty dashboard
5. Update preferences if needed

## Summary

This system automatically keeps customers engaged with your loyalty program by:
- ✅ Monthly automated reminders
- ✅ Clear discount eligibility display
- ✅ Beautiful, professional design
- ✅ Motivational tier progress tracking
- ✅ Direct portal access
- ✅ Reliable, scalable delivery

No manual intervention needed - it just works! 🎉
