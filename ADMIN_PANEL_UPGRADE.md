# Admin Panel - Comprehensive Upgrade

## 🎯 Overview

The admin panel has been fully upgraded with enterprise-grade features, comprehensive monitoring, and advanced management capabilities. This document outlines all new features, API endpoints, and usage guidelines.

## ✨ New Features

### 1. **Enhanced Authentication & Security**
- **Location**: `src/lib/admin/middleware.ts`
- **Features**:
  - `getAdminContext()` - Returns full admin context with ID, email, wallet
  - `requireAdmin()` - Throws error if not admin (use in API routes)
  - `isAdminRequest()` - Legacy boolean check (backwards compatible)
  - Automatic admin record lookup from database
  - Session-based authentication with NextAuth

### 2. **Comprehensive Dashboard** (`/admin/dashboard`)
- **Real-time metrics** (refreshes every 10 seconds):
  - Total Users, Markets, Bets, Volume
  - Growth rates (weekly comparison)
  - Today's activity (new users, markets, bets, volume)
  
- **Market Status Overview**:
  - Active markets count
  - Pending resolution count
  - Resolved markets count
  - Total markets
  
- **Recent Activity Feed**:
  - Latest 10 markets
  - Latest 10 users
  - Latest 20 audit logs
  - Real-time updates

### 3. **Advanced Users Management** (`/admin/users`)
- **API**: `/api/admin/users/list`
- **Features**:
  - Search by username, email, or wallet
  - Filter by status (active/banned)
  - Pagination (50 users per page)
  - User statistics (bets, volume, followers, markets created)
  - Bulk actions: Ban, Unban, Delete
  - Full audit trail logging

**Example API Call**:
```typescript
// GET /api/admin/users/list?search=alice&status=active&page=1&limit=50
{
  "success": true,
  "users": [
    {
      "id": "user123",
      "username": "alice",
      "email": "alice@example.com",
      "wallet": "0x123...",
      "createdAt": "2025-01-01T00:00:00Z",
      "banned": false,
      "stats": {
        "bets": 45,
        "marketsCreated": 12,
        "followers": 23,
        "following": 15,
        "volume": 12.5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}

// PATCH /api/admin/users/list
{
  "userId": "user123",
  "action": "ban" // or "unban", "delete"
}
```

### 4. **Advanced Markets Management** (`/admin/markets`)
- **API**: `/api/admin/markets/list`
- **Features**:
  - Search markets by title
  - Filter by status (open/resolved/pending)
  - Pagination
  - Market actions: Pause, Resume, Resolve, Update
  - Creator information
  - Bet count per market

**Example API Call**:
```typescript
// GET /api/admin/markets/list?search=ethereum&status=open&page=1
{
  "success": true,
  "markets": [
    {
      "id": 1,
      "title": "Will Ethereum reach $5000?",
      "status": "open",
      "endTime": "2025-12-31T23:59:59Z",
      "yesPool": 10.5,
      "noPool": 8.3,
      "creator": {
        "username": "alice",
        "wallet": "0x123..."
      },
      "_count": {
        "bets": 145
      }
    }
  ],
  "pagination": {...}
}

// PATCH /api/admin/markets/list
{
  "marketId": 1,
  "action": "pause" // or "resume", "resolve", "update"
  "data": {
    "winningOutcome": 0 // for resolve action
  }
}
```

### 5. **Advanced Analytics** (`/admin/analytics`)
- **API**: `/api/admin/analytics/advanced`
- **Features**:
  - Time-series data (7d, 30d, 90d, 1y)
  - Metrics: users, markets, bets, volume
  - Top performers (markets by volume/bets, users by volume/bets)
  - Category breakdown
  - Conversion funnel (visitors → signups → bettors → creators)

**Example API Call**:
```typescript
// GET /api/admin/analytics/advanced?period=30d&metric=volume
{
  "success": true,
  "timeSeries": [
    {
      "date": "2025-01-01",
      "users": 5,
      "markets": 2,
      "bets": 20,
      "volume": 15.5
    }
  ],
  "topPerformers": {
    "marketsByVolume": [...],
    "marketsByBets": [...],
    "usersByVolume": [...],
    "usersByBets": [...]
  },
  "categories": {
    "crypto": 45,
    "sports": 30,
    "politics": 15,
    "entertainment": 10
  },
  "funnel": {
    "visitors": 1000,
    "signups": 100,
    "bettors": 50,
    "creators": 10
  }
}
```

### 6. **Platform Settings** (`/admin/settings`)
- **API**: `/api/admin/settings/advanced`
- **Features**:
  - Feature flags (maintenance mode, betting, withdrawals, market creation)
  - Financial settings (fees, limits, durations)
  - API keys management (OpenAI, Anthropic, Web3Auth, Alchemy, Infura, SendGrid)
  - Email settings
  - Social integrations (Discord, Telegram, Twitter)
  - Contract addresses
  - Referral settings
  - Automatic sensitive data masking

**Available Settings**:
```typescript
{
  // Feature Flags
  maintenanceMode: boolean,
  allowMarketCreation: boolean,
  allowBetting: boolean,
  allowWithdrawals: boolean,
  
  // Financial
  platformFeePercent: number,
  minBetAmount: number,
  maxBetAmount: number,
  minMarketDuration: number, // hours
  maxMarketDuration: number, // days
  
  // API Keys (masked in response)
  openaiApiKey: string,
  anthropicApiKey: string,
  web3AuthClientId: string,
  alchemyApiKey: string,
  infuraApiKey: string,
  sendgridApiKey: string,
  
  // Social
  discordWebhookUrl: string,
  telegramBotToken: string,
  twitterApiKey: string,
  
  // Contracts
  factoryAddress: string,
  usdcAddress: string,
  
  // Limits
  maxMarketsPerUser: number,
  maxBetsPerMarket: number,
  
  // Referral
  referralEnabled: boolean,
  referralSignupReward: number,
  referralBetReward: number
}

// PUT /api/admin/settings/advanced
{
  "settings": {
    "maintenanceMode": false,
    "platformFeePercent": 1.5,
    "maxBetAmount": 100
  }
}
```

### 7. **Enhanced Audit System** (`/admin/audits`)
- **Automatic logging** for all admin actions:
  - User bans/unbans
  - Market pause/resume/resolve
  - Settings updates
  - Admin additions
- **Features**:
  - Timestamps
  - Actor identification
  - Metadata (what changed)
  - Sensitive data redaction

### 8. **Dashboard API** 
- **API**: `/api/admin/dashboard`
- **Comprehensive overview** in single call:
  - Total stats (users, markets, bets, volume)
  - Market status breakdown
  - Today's activity
  - Growth rates
  - Recent activity (users, markets, bets, audits)

## 📊 Database Schema Updates

### New Fields Added:

**User Model**:
```prisma
banned Boolean @default(false)
```

**Market Model**:
```prisma
resolvedAt DateTime?
```

**Migration**: `20251025145257_add_admin_fields`

## 🔐 Security Features

1. **Authentication Middleware**:
   - Session validation on every request
   - Admin database record verification
   - Role-based access control

2. **API Key Protection**:
   - Automatic masking in responses
   - Redaction in audit logs
   - Secure storage in database

3. **Audit Trail**:
   - All admin actions logged
   - Actor attribution
   - Metadata tracking
   - Cannot be deleted by admins

## 🎨 UI Components

### Enhanced Dashboard:
- **Real-time metrics cards** with trend indicators
- **Today's activity** with color-coded categories
- **Market status grid** with visual indicators
- **Recent activity feed** with timestamps
- **Responsive design** for mobile/desktop

### Design System:
- Blue gradient (#1D4ED8) for active states
- Color-coded status badges (green/yellow/gray/red)
- Card-based layout with shadows
- Icon-enhanced metrics
- Hover states and transitions

## 📁 File Structure

```
src/
├── lib/
│   └── admin/
│       └── middleware.ts           # Enhanced auth middleware
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx             # Admin layout with sidebar
│   │   ├── AdminClientLayout.tsx  # Client-side navigation
│   │   └── admin/
│   │       ├── dashboard/page.tsx # Enhanced dashboard
│   │       ├── users/page.tsx     # User management
│   │       ├── markets/page.tsx   # Market management
│   │       ├── analytics/page.tsx # Analytics
│   │       ├── audits/page.tsx    # Audit logs
│   │       └── settings/page.tsx  # Settings
│   └── api/
│       └── admin/
│           ├── dashboard/route.ts          # Dashboard API
│           ├── users/
│           │   ├── route.ts               # Legacy endpoint
│           │   └── list/route.ts          # Enhanced users API
│           ├── markets/
│           │   └── list/route.ts          # Enhanced markets API
│           ├── analytics/
│           │   └── advanced/route.ts      # Advanced analytics
│           └── settings/
│               ├── route.ts               # Legacy endpoint
│               └── advanced/route.ts      # Enhanced settings API
```

## 🚀 Usage Examples

### Admin Middleware in API Route:
```typescript
import { requireAdmin } from "@/lib/admin/middleware";

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin();
    // admin.adminId, admin.email, admin.wallet available
    
    // Your admin logic here
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Automatically returns 401 if not admin
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }
}
```

### Logging Admin Actions:
```typescript
await db.audit.create({
  data: {
    action: 'MARKET_RESOLVED',
    actor: admin.email || admin.wallet || 'admin',
    metadata: {
      marketId,
      winningOutcome,
      adminId: admin.adminId
    }
  }
});
```

### Fetching Dashboard Data:
```typescript
const { data } = useSWR("/api/admin/dashboard", fetcher, {
  refreshInterval: 10000 // 10 seconds
});

const stats = data?.stats || {};
const total = stats.total || {};
const today = stats.today || {};
const markets = stats.markets || {};
```

## 📈 Performance

- **Dashboard**: Refreshes every 10 seconds
- **Pagination**: 50 items per page default
- **Time-series**: Optimized date bucketing
- **Database**: Indexed queries on common fields
- **Caching**: SWR client-side caching

## 🔄 Migration Guide

If upgrading from previous version:

1. **Run migration**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

2. **Update API calls** to use new endpoints:
   - `/api/admin/users` → `/api/admin/users/list`
   - `/api/admin/stats` → `/api/admin/dashboard`
   - Add `/api/admin/analytics/advanced`
   - Add `/api/admin/settings/advanced`
   - Add `/api/admin/markets/list`

3. **Update middleware imports**:
   ```typescript
   // Old
   import { isAdminRequest } from "@/lib/auth/admin";
   
   // New (recommended)
   import { requireAdmin } from "@/lib/admin/middleware";
   ```

## 🎯 Next Steps

Recommended enhancements:

1. **Analytics Charts**: Integrate Chart.js or Recharts for visual time-series
2. **Export Features**: CSV/JSON export for all data tables
3. **Email Templates**: Visual editor for notification emails
4. **Bulk Operations**: Multi-select for user/market actions
5. **Real-time Notifications**: WebSocket for live admin alerts
6. **Role Management**: Multiple admin roles (super admin, moderator, support)
7. **API Rate Limiting**: Per-admin rate limits
8. **Two-Factor Auth**: Enhanced security for admin login

## 📝 Notes

- All API keys are automatically masked in responses
- Audit logs cannot be deleted (immutable)
- Settings are stored as key-value pairs in database
- Admin actions require valid session
- Pagination defaults: page=1, limit=50
- Time-series supports: 7d, 30d, 90d, 1y periods

## 🐛 Troubleshooting

**Issue**: "Unauthorized: Admin access required"
- Solution: Ensure user has admin record in database
- Check session is valid
- Verify admin email/wallet matches database

**Issue**: Dashboard not loading
- Solution: Check `/api/admin/dashboard` endpoint
- Verify database connection
- Check browser console for errors

**Issue**: Settings not saving
- Solution: Verify PUT request body format
- Check audit logs for errors
- Ensure admin permissions

---

**Last Updated**: October 25, 2025
**Version**: 2.0
**Build Status**: ✅ Successful (68 routes)
