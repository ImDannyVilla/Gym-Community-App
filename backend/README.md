# Database Access Guide

## Team Roles
- **PM:** Angel
- **Backend:** Danny, Alberto
- **Frontend/Backend:** Omar

## Connection Details
**Format:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Credentials:**
- Host: `db.[YOUR-REF].supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: [Contact Danny]

---

## Access Methods

### For Angel (PM)
Use Supabase Dashboard:
1. Login: https://supabase.com/dashboard
2. Select "Gym Community App"
3. Use Table Editor (view data) or SQL Editor (run queries)

### For Backend Team (Danny, Alberto, Omar)
Use database client:

**Recommended:** TablePlus or DataGrip(JetBrains) (https://tableplus.com/)

**Setup:**
1. Install client
2. New connection → PostgreSQL
3. Enter credentials above
4. Connect

**Command line:**
```bash
psql "postgresql://postgres:[PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres"
```

## Testing

**Local Development:**
```bash
uvicorn app.main:app --reload
# Visit: http://localhost:8000/docs
```

**Production:**
- Live API: https://gym-community-api.up.railway.app
- API Docs: https://gym-community-api.up.railway.app/docs
---

## Deployment

**Production:** https://gym-community-api.up.railway.app

**API Documentation:** https://gym-community-api.up.railway.app/docs

**Health Check:** https://gym-community-api.up.railway.app/health

---

## Current Schema (so far, lets talk about it)

**Tables:**
- `users` (email, username, hashed_password, created_at)



---

## Rules

- Never commit credentials to Git
- Never share passwords in public channels
- View only - no deletes in production
- Use `.env` for local development

---

## Support

**Connection issues:** Contact Danny (@ImDannyVilla)
