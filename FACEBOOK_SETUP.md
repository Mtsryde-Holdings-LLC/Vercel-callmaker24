# Facebook OAuth Setup Guide

## Overview
This guide will help you set up Facebook OAuth integration for connecting Facebook accounts to post on Facebook pages.

## Prerequisites
- A Facebook account
- Access to [Meta for Developers](https://developers.facebook.com/)

## Step 1: Create a Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **"My Apps"** in the top right
3. Click **"Create App"**
4. Select **"Business"** as the app type
5. Fill in the app details:
   - **App Name**: CallMaker24 (or your app name)
   - **App Contact Email**: Your email
   - **Business Account**: Select or create one
6. Click **"Create App"**

## Step 2: Configure Facebook Login

1. In your app dashboard, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Select **"Web"** as the platform
4. Enter your **Site URL**: `https://your-domain.com`
5. Click **"Save"** and **"Continue"**

## Step 3: Configure OAuth Settings

1. Go to **Settings** → **Basic** in the left sidebar
2. Copy your **App ID** and **App Secret**
3. Go to **Facebook Login** → **Settings**
4. Add these URLs to **Valid OAuth Redirect URIs**:
   ```
   https://your-domain.com/api/social/callback/facebook
   http://localhost:3000/api/social/callback/facebook
   ```
5. Enable **"Login with the JavaScript SDK"**
6. Enable **"Web OAuth Login"**
7. Click **"Save Changes"**

## Step 4: Request Page Permissions

1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - `pages_show_list` - To see list of pages
   - `pages_read_engagement` - To read page engagement
   - `pages_manage_posts` - To create and manage posts

Note: For production, you'll need to submit your app for review to get these permissions approved.

## Step 5: Add Environment Variables

Add these variables to your Vercel environment or `.env.local` file:

```bash
# Facebook OAuth Credentials
FACEBOOK_CLIENT_ID=your_app_id_here
FACEBOOK_CLIENT_SECRET=your_app_secret_here

# Or use these variable names (both are supported)
FACEBOOK_APP_ID=your_app_id_here
FACEBOOK_APP_SECRET=your_app_secret_here

# Your app URL
NEXTAUTH_URL=https://your-domain.com
```

### Where to Find These Values:

1. **App ID** (FACEBOOK_CLIENT_ID):
   - Go to your app dashboard
   - Settings → Basic
   - Copy the **App ID**

2. **App Secret** (FACEBOOK_CLIENT_SECRET):
   - Go to your app dashboard
   - Settings → Basic
   - Copy the **App Secret** (click "Show" first)

## Step 6: Deploy and Test

1. Add the environment variables to Vercel:
   ```bash
   vercel env add FACEBOOK_CLIENT_ID
   vercel env add FACEBOOK_CLIENT_SECRET
   ```

2. Redeploy your application:
   ```bash
   git push origin main
   ```

3. Test the connection:
   - Go to `/dashboard/social/connect`
   - Click **"Connect Facebook"**
   - Authorize the app
   - You should be redirected back to `/dashboard/social`

## Troubleshooting

### "Invalid App ID" Error
- Double-check your `FACEBOOK_CLIENT_ID` is correct
- Make sure the environment variable is deployed to Vercel
- Verify the App ID matches the one in Facebook Developer Console

### "Redirect URI Mismatch" Error
- Ensure your redirect URI is added to Facebook Login settings
- Check that `NEXTAUTH_URL` matches your production domain
- Format: `https://your-domain.com/api/social/callback/facebook`

### Permission Denied Errors
- Your app may need to be in Development Mode to test
- Add your Facebook account as a Test User in App Roles
- Request and get approval for page permissions in production

### Can't See Pages
- Make sure you're an admin of the Facebook page
- Check that you have the `pages_show_list` permission
- Try reconnecting your account

## Development vs Production

### Development Mode
- Add yourself as a Test User
- All features work without app review
- Limited to developers and test users

### Production Mode
- Requires app review and approval
- Submit for review with video demonstration
- All users can connect their accounts

## Security Notes

1. **Never commit secrets to Git**
   - Use environment variables
   - Add `.env.local` to `.gitignore`

2. **Use HTTPS in production**
   - Facebook requires HTTPS for OAuth redirects
   - Vercel provides automatic HTTPS

3. **Rotate secrets regularly**
   - Regenerate App Secret periodically
   - Update environment variables after rotation

## Support

For issues:
- [Meta for Developers Community](https://developers.facebook.com/community/)
- [Facebook Platform Status](https://developers.facebook.com/status/)
- Check application logs in Vercel deployment

## Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Pages API Documentation](https://developers.facebook.com/docs/pages-api/)
- [OAuth 2.0 Guide](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
