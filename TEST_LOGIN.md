# Test Login - Server Debug

## Current Status
- ✅ App connects to server successfully
- ✅ Server receives login request
- ❌ Server returns 500 error: "Login failed"

## What We Know
- Email being sent: `toannd1998@gmail.com`
- Server URL: `https://api.tinphatmetech.online`
- Issue is on server-side (app is working correctly)

## What to Check on Server

### 1. Check Server Logs
When you try to login, look in the SERVER terminal for:
```
[Auth] Attempting login for: toannd1998@gmail.com
[Auth] User authenticated: ...
[Auth] Login exception: { message, stack, name }
```

**The full error message here will tell us what's wrong!**

### 2. Possible Issues

**Issue A: User doesn't exist in Supabase**
- Check Supabase dashboard
- Go to Authentication > Users
- Is `toannd1998@gmail.com` listed?
- If not, create the user first

**Issue B: Staff record doesn't exist**
- Check database
- Is there a `staff` record with `id_auth` = Supabase user ID?
- If not, create one

**Issue C: Supabase credentials wrong**
- Check `.env` file
- Is `SUPABASE_URL` correct?
- Is `SUPABASE_ANON_KEY` correct?
- Is `JWT_SECRET` correct?

**Issue D: Server dependencies missing**
- Run: `npm install`
- Run: `npx prisma generate`
- Restart server: `npm run dev`

## Next Steps

1. **Look at SERVER console output when you try login**
   - Find the `[Auth]` logs
   - Share the error message

2. **Test with curl** (from your computer):
```bash
curl -X POST https://api.tinphatmetech.online/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"toannd1998@gmail.com","password":"your-password"}'
```

This will show the exact server error.

3. **Share the error message**
   - Either from server logs
   - Or from curl response
   - This will help identify the problem

## Quick Checklist

- [ ] Is `toannd1998@gmail.com` user created in Supabase?
- [ ] Does the user have a staff record with id_auth set?
- [ ] Is server running? (npm run dev)
- [ ] Are .env variables correct?
- [ ] Have you restarted server after any changes?
