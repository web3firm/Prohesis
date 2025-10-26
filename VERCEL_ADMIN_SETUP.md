# Vercel Admin Login Setup Guide

## Problem
Admin login works locally but fails on Vercel because the required environment variables are not configured in Vercel's dashboard.

## Root Cause
The admin authentication system uses environment variables that exist in your local `.env.local` file but are missing on Vercel:

- `NEXTAUTH_SECRET` - Required for JWT token encryption
- `ADMIN_USER` - Admin username/email
- `ADMIN_PASS` - Admin password

## Solution: Configure Vercel Environment Variables

### Step 1: Access Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Navigate to your **Prohesis** project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Required Environment Variables

Add the following **3 critical variables** (case-sensitive):

#### 1. NEXTAUTH_SECRET
```
Name: NEXTAUTH_SECRET
Value: bc377455565fcdd797eb75642da563707521b02399b4310781794cc4db965f0c
Environment: Production, Preview, Development (select all)
```

#### 2. ADMIN_USER
```
Name: ADMIN_USER
Value: admin_a6b303
Environment: Production, Preview, Development (select all)
```

#### 3. ADMIN_PASS
```
Name: ADMIN_PASS
Value: xRhd6WKUPT_lXfMJ
Environment: Production, Preview, Development (select all)
```

### Step 3: Redeploy

After adding the environment variables:

1. Go to **Deployments** tab
2. Click the **three dots** (•••) on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (optional, faster)
5. Click **Redeploy**

**OR** simply push a new commit to trigger automatic redeployment.

### Step 4: Test Admin Login

Once redeployed, visit:
```
https://your-domain.vercel.app/admin/auth/login
```

Login with:
- **Username**: `admin_a6b303`
- **Password**: `xRhd6WKUPT_lXfMJ`

## Security Recommendations

### 🔒 Important: Change Default Credentials

For production, you should:

1. Generate a new secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

2. Create a strong admin password:
   ```bash
   openssl rand -base64 16
   ```

3. Update the values in Vercel dashboard

### 🔐 Additional Security Steps

1. **Enable 2FA** on your Vercel account
2. **Limit admin access** by IP if possible (Vercel Firewall)
3. **Monitor audit logs** in admin dashboard regularly
4. **Rotate credentials** every 90 days

## Troubleshooting

### Issue: Still can't login after adding variables
**Solution**: 
- Make sure you clicked **Redeploy** after adding variables
- Clear browser cache and cookies
- Try incognito/private browsing mode

### Issue: "Unauthorized" error
**Solution**:
- Verify variable names are EXACTLY: `NEXTAUTH_SECRET`, `ADMIN_USER`, `ADMIN_PASS`
- Check for extra spaces in values
- Ensure values are assigned to all environments (Production, Preview, Development)

### Issue: Redirect loop
**Solution**:
- Ensure `NEXTAUTH_URL` is NOT set (or set to your production domain)
- Check that `NEXTAUTH_SECRET` is at least 32 characters long

## Current Local Credentials

Your current `.env.local` has:
```bash
NEXTAUTH_SECRET=bc377455565fcdd797eb75642da563707521b02399b4310781794cc4db965f0c
ADMIN_USER=admin_a6b303
ADMIN_PASS=xRhd6WKUPT_lXfMJ
```

**Copy these exact values to Vercel to match your local environment.**

## How Admin Login Works

1. User enters username/password on `/admin/auth/login`
2. NextAuth validates against `ADMIN_USER` and `ADMIN_PASS` env variables
3. If valid, creates JWT token using `NEXTAUTH_SECRET`
4. User is redirected to `/admin/post-login` then `/admin/dashboard`
5. Middleware checks JWT token on all `/admin/*` routes
6. If token invalid or missing → redirect to `/admin/forbidden`

## Files Involved

- `/src/app/(public-admin)/admin/auth/login/page.tsx` - Login UI
- `/src/lib/auth/options.ts` - NextAuth configuration
- `/src/lib/auth/index.ts` - Auth exports
- `/src/lib/admin/middleware.ts` - Admin context/authentication
- `/middleware.ts` - Route protection
- `/src/app/api/auth/[...nextauth]/route.ts` - NextAuth API handler

## Need Help?

If you continue experiencing issues:
1. Check Vercel deployment logs for errors
2. Verify all 3 environment variables are present
3. Ensure no typos in variable names or values
4. Try using email format: `admin_a6b303@local` as username
