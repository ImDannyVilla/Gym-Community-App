# Gym Community App - Backend API

**Live API:** https://gym-community-app.onrender.com

**API Documentation:** https://gym-community-app.onrender.com/docs

**Health Check:** https://gym-community-app.onrender.com/health

---

## Quick Start

Visit the interactive API documentation to test endpoints directly in your browser:
```
https://gym-community-app.onrender.com/docs
```

---

## API Endpoints

### Authentication
- `POST /auth/register` - Create new account
- `POST /auth/login` - Login and get JWT token

### Workouts
- `GET /workouts` - Get all preset workouts
- `GET /workouts/{id}` - Get workout with exercises
- `GET /workouts/category/{category}` - Filter by category (Push, Pull, Legs)

### Programs
- `GET /programs` - Get all preset programs
- `GET /programs/{id}` - Get program with weekly schedule
- `GET /programs/difficulty/{difficulty}` - Filter by difficulty

---

## Local Development

### Prerequisites
- Python 3.13+
- PostgreSQL (via Supabase)

### Setup
```bash
cd Gym-Community-App/backend

# Create virtual environment
uv venv
source .venv/bin/activate

# Install dependencies
uv sync

# Configure environment
cp .env.example .env
# Edit .env with DATABASE_URL and SECRET_KEY
```

### Run Locally
```bash
uvicorn app.main:gym_app --reload
```

Visit: http://localhost:8000/docs

---

## Database Access

### Team Roles
- PM: Angel
- Backend Lead: Danny
- Backend: Alberto
- Frontend/Backend: Omar

### Access Methods

**For PM (Angel):**
- Supabase Dashboard: https://supabase.com/dashboard
- Use Table Editor or SQL Editor

**For Backend Team:**
- Recommended Tools: DataGrip, TablePlus, DBeaver
- Credentials: Contact Danny

**Connection String Format:**
```
postgresql+asyncpg://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

---

## Database Schema

### users
- id (primary key)
- email (unique)
- username (unique)
- hashed_password
- is_active
- created_at, updated_at

### workouts
- id (primary key)
- name
- description
- category (Push, Pull, Legs)
- difficulty (Beginner, Intermediate, Advanced)
- duration_minutes
- is_preset
- created_at, updated_at

### exercises
- id (primary key)
- workout_id (foreign key)
- exercise_id (ExerciseDB reference)
- name, gif_url
- sets, reps, rest_seconds
- order, notes

### programs
- id (primary key)
- name
- description
- difficulty
- days_per_week, duration_weeks
- is_preset, created_at

### program_days
- id (primary key)
- program_id (foreign key)
- workout_id (foreign key)
- day_of_week (1-7)
- week_number

---

## Testing

### Test Endpoints
```bash
# Register
curl -X POST https://gym-community-app.onrender.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"Test1234!"}'

# Login
curl -X POST https://gym-community-app.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test1234!"}'

# Get workouts
curl https://gym-community-app.onrender.com/workouts
```

### Run Tests
```bash
pytest
```

---

## Deployment

**Platform:** Render.com

**Auto-Deploy:** Pushes to `main` branch trigger automatic deployment

**Environment Variables:**
- DATABASE_URL - Supabase PostgreSQL connection string
- SECRET_KEY - JWT signing key

**Manual Deploy:**
```bash
git push origin main
```

Deployment completes in approximately 2 minutes.

---

## Tech Stack

- Framework: FastAPI
- Database: PostgreSQL (Supabase)
- ORM: SQLAlchemy (async)
- Authentication: JWT with bcrypt
- Validation: Pydantic v2
- Deployment: Render.com

---

## Development Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes
3. Test locally: `uvicorn app.main:gym_app --reload`
4. Commit: `git commit -m "feat: description"`
5. Push: `git push origin feature/name`
6. Create Pull Request to `main`
7. Render auto-deploys after merge

---

## Rules

- Never commit credentials to Git
- Never share passwords in public channels
- No direct database modifications in production
- Use `.env` for local development
- Test locally before pushing
- Use database tools as read-only verification only

---

## Common Issues

### Cold Start Delay
Render free tier: First request after 15 minutes of inactivity takes 30-60 seconds. Subsequent requests are fast.

### Database Connection Error
- Verify `DATABASE_URL` in environment variables
- Check Supabase credentials

### Import Errors
- Run `uv sync` to install dependencies
- Verify Python version: 3.13+

---

## Support

**Technical Issues:** Danny (@ImDannyVilla)

**API Questions:** Check `/docs` endpoint

**Database Access:** Contact Danny for credentials





---

**Last Updated:** February 2025