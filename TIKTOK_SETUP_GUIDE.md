# TikTok Integration Setup Guide

## Error: "client_key - Refer to our Developer Documentation"

This error means your TikTok API credentials are not properly configured.

## Quick Fix for Local Development

### Option 1: Add TikTok Credentials (Recommended)

1. **Create a TikTok Developer Account**

   - Go to: https://developers.tiktok.com/
   - Sign up with your TikTok business account
   - Complete the registration process

2. **Create a New App**

   - Navigate to "My Apps" in the Developer Portal
   - Click "Create App"
   - Choose "Business" category
   - Fill in app details:
     - App Name: `CallMaker24`
     - Description: `Social media marketing platform`
     - Category: `Business Tools`

3. **Configure OAuth Settings**

   - In your app dashboard, go to "Login Kit" settings
   - Add OAuth Redirect URI:
     ```
     http://localhost:3000/api/social/callback/tiktok
     https://callmaker24.vercel.app/api/social/callback/tiktok
     ```
   - Enable required scopes:
     - `user.info.basic` - Get user information
     - `video.publish` - Publish videos
     - `video.upload` - Upload videos

4. **Get Your Credentials**

   - In the app dashboard, you'll see:
     - **Client Key** (similar to Client ID in other platforms)
     - **Client Secret**
   - Copy both values

5. **Add to Environment Variables**

   **Local Development** - Add to `.env.local`:

   ```bash
   TIKTOK_CLIENT_KEY=your_tiktok_client_key_here
   TIKTOK_CLIENT_SECRET=your_tiktok_client_secret_here
   ```

   **Production (Vercel)** - Add to Vercel dashboard:

   - Go to: https://vercel.com/mtsryde-holdings-llc/vercel-callmaker24/settings/environment-variables
   - Add both variables for all environments

6. **Apply for Content Posting API**
   - TikTok requires approval for posting content
   - In your app dashboard, go to "Products"
   - Apply for "Content Posting API" access
   - Fill out the use case form explaining your marketing platform
   - Wait for approval (usually 1-3 business days)

### Option 2: Temporarily Disable TikTok (Quick Fix)

If you don't need TikTok immediately, you can hide it from the UI:

Edit `src/app/dashboard/social/connect/page.tsx`:

```tsx
const platforms = [
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    color: "bg-blue-600",
    url: "/api/social/connect/facebook",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📷",
    color: "bg-pink-600",
    url: "/api/social/connect/instagram",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: "🐦",
    color: "bg-sky-500",
    url: "/api/social/connect/twitter",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "bg-blue-700",
    url: "/api/social/connect/linkedin",
  },
  // TEMPORARILY DISABLED: TikTok requires API approval
  // { id: 'tiktok', name: 'TikTok', icon: '🎵', color: 'bg-black', url: '/api/social/connect/tiktok' }
];
```

## TikTok API Pricing

- **Free Tier**: Basic access for testing
- **Business Plans**: Pricing varies based on API calls and usage
- **Note**: Content Posting API requires business account and approval

## Important Notes

⚠️ **Requirements:**

- TikTok Business Account (not regular TikTok account)
- App approval from TikTok (can take 1-3 days)
- Content Posting API access approval

📝 **Scopes Needed:**

- `user.info.basic` - Get user profile info
- `video.publish` - Publish videos to TikTok
- `video.upload` - Upload video content

🔒 **Security:**

- Never commit `.env.local` to git
- Store credentials securely
- Use different keys for development and production

## Testing the Connection

After adding credentials:

1. Restart your development server:

   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

2. Navigate to: http://localhost:3000/dashboard/social/connect

3. Click "Connect TikTok"

4. You should be redirected to TikTok's OAuth page

5. Authorize the app and you'll be connected!

## Troubleshooting

**Error: "Invalid client_key"**

- Double-check your `TIKTOK_CLIENT_KEY` in `.env.local`
- Make sure there are no extra spaces or quotes
- Verify the key is from the correct app in TikTok Developer Portal

**Error: "Redirect URI mismatch"**

- Ensure you've added the correct callback URL in TikTok app settings
- Check both local and production URLs are configured

**Error: "Insufficient permissions"**

- Your app needs approval for Content Posting API
- Apply for access in the TikTok Developer Portal under "Products"

**Connection successful but can't post**

- Content Posting API requires separate approval
- Check your app's approved features in the Developer Portal

## Support

- TikTok Developers: https://developers.tiktok.com/
- Documentation: https://developers.tiktok.com/doc/content-posting-api-overview/
- Support: https://developers.tiktok.com/support
