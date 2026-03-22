# Gym Community App

Workout tracking and gym community platform for Iron Arms Gym

The website is made for gym owners to access, view, and manage customer information quickly and efficiently.

The app is made for gym customers who wish to access their barcode digitally, with added features that allow for customer interactions. 

## Backend Setup
```bash
cd backend
uv sync
cp .env.example .env   # Then fill in real values
uv run uvicorn app.app:app --reload
```

API Docs: http://localhost:8000/docs

## Frontend Setup

### Package Requirements
Java Development Kit: Version 17  
React: 19.1.0  
React Native: 0.81.5   
Expo: 54.0.33  
Package Manager: npm (Node Package Manager)  
Emulator: Android Studio  

### Running the app

1. Open Android Studio
2. Click the "Device Manager" icon on the right
3. Click the "+" -> "Create Virtual Device"
4. Choose Phone Model
5. Finish

```bash
cd Frontend-For-APP
npm install
npx expo start
```

## Team

- Backend: Danny, Omar
- Frontend: Mariano, Omar, Still Ben
- UI/Design: Mariano
- DevOps: Alberto
- PM: Angel
