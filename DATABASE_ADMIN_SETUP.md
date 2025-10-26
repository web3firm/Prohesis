# Database-Based Admin Authentication System

## ✅ **SOLVED: Admin login now works via DATABASE!**

Your admin system has been upgraded to support **database-stored admin accounts** with individual hashed passwords, eliminating the need to rely solely on environment variables.

---

## 🎯 **Why This is Better**

### **Before (Environment Variables Only)**
- ❌ Only ONE admin account possible
- ❌ Password shared across all admins
- ❌ Changing password requires redeployment
- ❌ No way to add/remove admins without code changes

### **After (Database-Based)**
- ✅ Unlimited admin accounts
- ✅ Individual passwords per admin (bcrypt hashed)
- ✅ Add/remove admins without redeployment
- ✅ Role-based access control (admin, super_admin, moderator)
- ✅ Activate/deactivate admins without deletion
- ✅ Secure password hashing with bcrypt
- ✅ Still supports env variable fallback for initial setup

---

## 🚀 **How It Works**

### **1. Admin Table Structure**
```prisma
model Admin {
  id           Int      @id @default(autoincrement())
  email        String?  @unique
  wallet       String?  @unique
  passwordHash String?  // bcrypt hashed password
  name         String?  // Display name
  role         String   @default("admin") // admin, super_admin, moderator
  isActive     Boolean  @default(true) // Can disable without deleting
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### **2. Authentication Flow**
1. User enters email/username + password
2. System checks database `Admin` table first
3. If admin found with `passwordHash`, verify with bcrypt
4. If admin found without `passwordHash`, check env variable (migration support)
5. If no admin in database, fallback to `ADMIN_USER` + `ADMIN_PASS` env variables
6. Create JWT session with `isAdmin: true` flag

### **3. Security Features**
- ✅ **bcrypt password hashing** (12 salt rounds)
- ✅ **Unique email/wallet constraints**
- ✅ **Soft delete** (isActive flag instead of deletion)
- ✅ **Role-based permissions** (future-ready)
- ✅ **Case-insensitive email matching**

---

## 📝 **Managing Admins**

### **Add a New Admin**
```bash
npm run admin:add <email> <password> [name]
```

**Example:**
```bash
npm run admin:add john@prohesis.com MySecurePass123! "John Doe"
```

**Output:**
```
✅ Admin created successfully!
   Email: john@prohesis.com
   Name: John Doe
   ID: 3

🔐 Login credentials:
   Email: john@prohesis.com
   Password: MySecurePass123!

⚠️  Please save these credentials securely!
```

### **List All Admins**
```bash
npm run admin:list
```

**Output:**
```
📋 Total Admins: 2

ID     Email                   Name          Role     Status      Created
2      admin@prohesis.com      Super Admin   admin    ✅ Active   2025-10-26
1      john@prohesis.com       John Doe      admin    ✅ Active   2025-10-26
```

### **Update Admin Password**
```bash
npm run admin:update-password <email> <new-password>
```

**Example:**
```bash
npm run admin:update-password john@prohesis.com NewSecurePass456!
```

### **Deactivate Admin (Soft Delete)**
```bash
npm run admin:deactivate <email>
```

**Example:**
```bash
npm run admin:deactivate john@prohesis.com
```
*Admin can still be reactivated later*

### **Reactivate Admin**
```bash
npm run admin:activate <email>
```

### **Remove Admin Permanently**
```bash
npm run admin:remove <email>
```

---

## 🔧 **Vercel Deployment**

### **Option 1: Use Database Admin (Recommended)**

1. **Create admin via script locally:**
   ```bash
   npm run admin:add admin@yourcompany.com YourSecurePass123!
   ```

2. **Push migration to Vercel:**
   ```bash
   git add -A
   git commit -m "Add database-based admin authentication"
   git push origin main
   ```

3. **Ensure DATABASE_URL and NEXTAUTH_SECRET are set in Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Verify `DATABASE_URL` is set (should already be there)
   - Verify `NEXTAUTH_SECRET` is set
   
4. **Login on Vercel:**
   - Visit: `https://your-domain.vercel.app/admin/auth/login`
   - Email: `admin@yourcompany.com`
   - Password: `YourSecurePass123!`

### **Option 2: Use Environment Variables (Fallback)**

If you prefer the old method:

1. Set in Vercel Environment Variables:
   - `NEXTAUTH_SECRET` = `bc377455565fcdd797eb75642da563707521b02399b4310781794cc4db965f0c`
   - `ADMIN_USER` = `admin_a6b303`
   - `ADMIN_PASS` = `xRhd6WKUPT_lXfMJ`

2. Redeploy

3. Login with username `admin_a6b303`

---

## 🆕 **Current Admin Accounts**

### **Database Admins:**
1. **Email:** `admin@prohesis.com`
   - **Password:** `SecurePassword123!`
   - **Name:** Super Admin
   - **Created:** 2025-10-26
   - **Status:** ✅ Active

2. **Email/Username:** `admin_a6b303`
   - **Password:** Uses env variable `ADMIN_PASS`
   - **Note:** No password hash (legacy)

### **Environment Variable Admin:**
- **Username:** `admin_a6b303`
- **Password:** `xRhd6WKUPT_lXfMJ` (from .env.local)

---

## 🔐 **Security Best Practices**

### **Password Requirements**
```typescript
// Strong password should have:
- At least 12 characters
- Mix of uppercase and lowercase
- Numbers
- Special characters (!@#$%^&*)
```

### **Generate Secure Password**
```bash
# macOS/Linux
openssl rand -base64 16

# Or use online tool: https://passwordsgenerator.net/
```

### **Rotate Credentials Regularly**
```bash
# Every 90 days, update passwords:
npm run admin:update-password admin@prohesis.com NewPass123!
```

### **Monitor Admin Activity**
Check the `Audit` table for admin actions:
```typescript
const adminActions = await db.audit.findMany({
  where: { actor: { contains: 'admin' } },
  orderBy: { createdAt: 'desc' },
  take: 50
});
```

---

## 🛠️ **Files Modified**

1. **`/prisma/schema.prisma`**
   - Added `passwordHash`, `name`, `role`, `isActive` to Admin model

2. **`/src/lib/auth/options.ts`**
   - Added `authenticateAdmin()` function
   - Supports database password verification
   - Maintains env variable fallback

3. **`/scripts/manage-admins.ts`**
   - New CLI tool for admin management
   - Add, list, remove, update operations
   - Bcrypt password hashing

4. **`/package.json`**
   - Added admin management scripts
   - `admin:add`, `admin:list`, `admin:remove`, etc.

---

## 🧪 **Testing**

### **Test Login Flow**

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Visit admin login:**
   ```
   http://localhost:3000/admin/auth/login
   ```

3. **Test with database admin:**
   - Email: `admin@prohesis.com`
   - Password: `SecurePassword123!`

4. **Test with env variable admin:**
   - Username: `admin_a6b303`
   - Password: `xRhd6WKUPT_lXfMJ`

### **Verify Authentication**
```bash
# Check session after login
curl http://localhost:3000/api/auth/session
```

---

## 🚨 **Troubleshooting**

### **Issue: "Invalid credentials"**
**Solutions:**
- Verify admin exists: `npm run admin:list`
- Check password is correct (case-sensitive)
- Ensure admin is active (`isActive: true`)
- Check Prisma client is updated: `npx prisma generate`

### **Issue: "Database error"**
**Solutions:**
- Verify `DATABASE_URL` environment variable
- Run migrations: `npx prisma migrate dev`
- Check database connection: `npx prisma studio`

### **Issue: "Admin not found in database"**
**Solutions:**
- Create admin: `npm run admin:add admin@example.com password123`
- Or use env variables as fallback
- Check migration applied: `npx prisma migrate status`

---

## 📊 **Migration Status**

✅ **Migration Applied:** `20251026052302_add_admin_password_hash`
✅ **Prisma Client:** Regenerated
✅ **Build:** Successful
✅ **Test Admin:** Created

---

## 🎯 **Next Steps**

1. **Create your production admin:**
   ```bash
   npm run admin:add your-email@company.com YourSecurePassword!
   ```

2. **Remove test admin:**
   ```bash
   npm run admin:remove admin@prohesis.com
   ```

3. **Deploy to Vercel:**
   ```bash
   git add -A
   git commit -m "Implement database-based admin authentication"
   git push origin main
   ```

4. **Verify on production:**
   - Visit `https://your-domain.vercel.app/admin/auth/login`
   - Login with your newly created admin credentials

---

## ✨ **Summary**

You now have a **professional, database-driven admin authentication system** that:

- ✅ Stores admins in PostgreSQL database
- ✅ Uses bcrypt for secure password hashing
- ✅ Supports unlimited admin accounts
- ✅ Allows easy admin management via CLI
- ✅ Maintains backward compatibility with env variables
- ✅ Includes role-based access control
- ✅ Enables soft delete (deactivation)

**No more relying on environment variables alone!** 🎉
