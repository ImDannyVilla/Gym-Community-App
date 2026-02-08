# Gym Community App - Backend

FastAPI backend for the Gym Community social fitness app.

## Tech Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL (Supabase)
- **ORM:** SQLAlchemy (async)
- **Authentication:** JWT with python-jose
- **Password Hashing:** bcrypt (passlib)
- **Deployment:** Railway

## Setup

### Prerequisites
- Python 3.13+
- uv (package manager)
- PostgreSQL database (or Supabase account)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ImDannyVilla/Gym-Community-App.git
cd Gym-Community-App/backend
```

2. Install dependencies:
```bash
uv sync
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

4. Run the server:
```bash
uvicorn app.main:app --reload
```

5. Visit API docs:
```
http://localhost:8000/docs
```

## Environment Variables
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
SECRET_KEY=your-secret-key-here
```

Generate SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Users (Coming Soon)
- `GET /users/me` - Get current user profile
- `PUT /users/me` - Update profile

### Posts (Coming Soon)
- `GET /posts` - List posts
- `POST /posts` - Create post
- `POST /posts/{id}/like` - Like a post

## Project Structure
```
backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── db.py                # Database connection
│   ├── core/                # Core utilities
│   │   ├── security.py      # JWT, password hashing
│   │   └── config.py        # Configuration
│   ├── models/              # SQLAlchemy models
│   │   └── user.py
│   ├── schemas/             # Pydantic schemas
│   │   └── user.py
│   └── routes/              # API endpoints
│       └── auth.py
├── tests/                   # Tests
├── .env                     # Environment variables (not committed)
└── pyproject.toml           # Dependencies
```

## Testing
```bash
pytest
```

## Deployment

Deployed on Railway. Pushes to `main` branch auto-deploy.

## Team

- Backend: Danny, [teammate-2]
- Mobile: [mobile-team]
- Web: [web-dev]
- PM: [pm-name]