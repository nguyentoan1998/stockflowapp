# Server 500 Error - Debug Guide

## Error Details
- **Endpoint:** `POST /auth/login`
- **Status:** 500 (Internal Server Error)
- **Server:** https://api.tinphatmetech.online
- **Message:** Request failed with status code 500

## What This Means

The server is receiving your login request but something inside the server is crashing and returning a 500 error.

## Common Causes

### 1. Missing or Invalid Environment Variables
**Check on server:**
- ✅ `SUPABASE_URL` set correctly?
- ✅ `SUPABASE_ANON_KEY` set correctly?
- ✅ `JWT_SECRET` set correctly?
- ✅ `DATABASE_URL` set correctly?

**Fix:**
```bash
# In server directory
cat .env
# Verify all keys are present and valid
```

### 2. Database Connection Issue
**Check:**
```bash
# Test database connection
npm run prisma:db execute --stdin
# Or run
npx prisma db execute --stdin
```

### 3. Supabase Auth Not Working
**Check:**
```bash
# Test Supabase connection
curl -X POST https://api.tinphatmetech.online/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

You should get the actual error message from the server.

### 4. Dependencies Missing
**Check:**
```bash
# In server directory
npm list
# Verify @supabase/supabase-js is installed
```

## Debugging Steps

### Step 1: Check Server Logs
```bash
# If running locally
npm run dev
# Look for detailed error in console

# If on production server
# Check server logs/monitoring system
```

### Step 2: Verify Request Format
The app is sending:
```json
{
  "email": "your@email.com",
  "password": "yourpassword"
}
```

Server expects exactly this format.

### Step 3: Test Directly
```bash
# Test the endpoint manually
curl -X POST https://api.tinphatmetech.online/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

This will show the actual server error.

## Server Checklist

- [ ] Is server running?
- [ ] Is `.env` file present with all variables?
- [ ] Is database accessible?
- [ ] Is Supabase credentials valid?
- [ ] Are all npm packages installed?
- [ ] Did you run `npm install`?
- [ ] Did you run `npx prisma generate`?
- [ ] Is the correct version of packages installed?

## Logs to Check

### In App
The app now logs detailed error information:
```
[Login] Attempting login with: { email }
[Login] Server URL: https://api.tinphatmetech.online
[Login] Error Details: { status, statusText, data, url, method }
```

Check the Expo console for these logs.

### On Server
Check server logs for:
- Auth errors
- Supabase connection errors
- Database errors
- Missing environment variables

## Quick Fixes

### Fix 1: Restart Server
```bash
cd server
npm run dev
```

### Fix 2: Reinstall Dependencies
```bash
cd server
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm run dev
```

### Fix 3: Check Environment Variables
```bash
cd server
# Print env variables (without sensitive data)
echo "SUPABASE_URL: $SUPABASE_URL"
echo "DATABASE_URL: $DATABASE_URL"
echo "JWT_SECRET: $(if [ -z "$JWT_SECRET" ]; then echo 'NOT SET'; else echo 'SET'; fi)"
```

### Fix 4: Verify Database
```bash
cd server
npx prisma db execute --stdin
# Run a test query
```

## If Still Not Working

### Option 1: Use Local Server
Temporarily use local server for testing:
```bash
# Start server locally
cd server
npm run dev

# In app, it will try local at http://192.168.1.139:3001
```

### Option 2: Check Server Logs Directly
If on a cloud provider, check their logs:
- Render: Dashboard → Logs
- Heroku: `heroku logs --tail`
- AWS: CloudWatch logs
- Azure: App Service logs

### Option 3: Test with Postman
```
POST https://api.tinphatmetech.online/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123"
}
```

This will show the exact error message from the server.

## Server Error Response Format

The server is returning 500 with some error. The app now captures:
- `error.response.status` = 500
- `error.response.statusText` = error message
- `error.response.data` = full error object

**Check Expo console for the actual error data!**

## Next Steps

1. **Run app with Expo console open**
2. **Try to login**
3. **Look for `[Login] Error Details:` in console**
4. **Share that error message for diagnosis**

The detailed logs will show exactly what's wrong on the server!

---

## Server-Side Code to Review

Make sure server has:
1. ✅ `/auth/login` endpoint implemented
2. ✅ Supabase Auth integration working
3. ✅ Database connection working
4. ✅ JWT token generation working
5. ✅ User profile lookup working

If any of these are missing, you'll get a 500 error.
