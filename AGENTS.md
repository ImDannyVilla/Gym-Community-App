# Gym Community App - Agent Guidelines & Code Rules

Welcome, autonomous agent, copilot, or developer! This repository contains the full-stack codebase for the Gym Community App. The application consists of a React Native (Expo) frontend and a Python (FastAPI) backend.

Strictly adhere to the following guidelines when operating within this repository. This file serves as your primary context for code style, system commands, and architectural patterns.

---

## 1. Project Architecture & Tech Stack

### 1.1 Frontend (`/Frontend-For-APP`)
- **Framework:** React Native managed by Expo (SDK 54+).
- **Routing:** Expo Router (File-based navigation located in `app/`).
- **Language:** JavaScript with React JSX (`.jsx` and `.js` files). No TypeScript is configured for the frontend.
- **Styling:** React Native `StyleSheet` (Tailwind/NativeWind is NOT used).
- **Icons:** `@expo/vector-icons` (predominantly `Ionicons` and `MaterialIcons`).

### 1.2 Backend (`/backend`)
- **Framework:** FastAPI (Python 3.13+).
- **Package Manager:** `uv` (Fast Python package and project manager).
- **Database ORM:** SQLAlchemy 2.0 (Asyncio) with `asyncpg` for PostgreSQL.
- **Validation & Serialization:** Pydantic (v2).
- **Authentication:** `python-jose` for JWTs, `bcrypt` for password hashing.
- **File Uploads:** `imagekitio` and `python-multipart`.

---

## 2. Build, Lint, and Test Commands

*Note: Ensure you are in the correct directory (`Frontend-For-APP` or `backend`) before running these commands.*

### 2.1 Frontend Commands
- **Install Dependencies:** `npm install`
- **Start Metro Bundler:** `npm start` or `npx expo start`
- **Clear Metro Cache:** `npx expo start -c` (Use if encountering unresolved module errors)

**Frontend Testing (Jest & React Native Testing Library):**
*Note: Ensure Jest is configured before running if `npm test` fails.*
- **Run all tests:** `npm test`
- **Run a single test file (CRITICAL FOR AGENTS):** `npm test -- <filename>.test.js`
- **Watch mode for a single test:** `npm test -- --watch <filename>`
- **Update test snapshots:** `npm test -- -u`

**Frontend Linting & Formatting:**
- **Lint the codebase:** `npx eslint .`
- **Format codebase:** `npx prettier --write .`

### 2.2 Backend Commands
- **Install Dependencies:** `uv sync`
- **Add Dependency:** `uv add <package_name>`
- **Start Dev Server:** `uv run uvicorn app.main:app --reload`

**Backend Testing (Pytest & pytest-asyncio):**
- **Run all tests:** `uv run pytest`
- **Run a single test file (CRITICAL FOR AGENTS):** `uv run pytest tests/test_<filename>.py`
- **Run a specific test function:** `uv run pytest tests/test_<filename>.py::test_<function_name>`
- **Run a single test with print output:** `uv run pytest -s tests/test_<filename>.py`
- **Run async tests:** Ensure `@pytest.mark.asyncio` is used on test functions.

**Backend Linting & Formatting:**
- **Format codebase:** `uv run ruff format .`
- **Lint codebase:** `uv run ruff check .` (Fix: `uv run ruff check . --fix`)

---

## 3. Code Style & Naming Conventions

### 3.1 File & Directory Naming
- **React Components:** Use `PascalCase` (e.g., `LoginScreen.jsx`, `MuscleCard.jsx`).
- **Expo Routes (`app/`):** Use lowercase or kebab-case (e.g., `dashboard.jsx`, `sign-up.jsx`).
- **Ignored Routes/Layouts:** Use an underscore prefix for layouts and directories that should not become navigable routes (e.g., `_layout.jsx`, `_profileCom/`).
- **Python Modules:** Use `snake_case` (e.g., `user_service.py`, `auth_routes.py`).
- **Python Classes:** Use `PascalCase` (e.g., `UserModel`, `UserCreateSchema`).

### 3.2 Frontend (React Native) Style
- **Functional Components:** Strictly use functional components. Class components are deprecated.
- **Props Destructuring:** Explicitly destructure your props in the function signature: `const Component = ({ title, onPress }) => { ... }`.
- **Imports Order:**
  1. React core (`import React, { useState } from "react";`)
  2. React Native core (`import { View, Text } from "react-native";`)
  3. Expo / Navigation (`import { router } from "expo-router";`)
  4. Third-party packages
  5. Local Components & Screens
  6. Local Utils & Configurations
- **StyleSheet.create:** Always define `const styles = StyleSheet.create({ ... })` at the bottom of the file.
- **State Management:** Use standard React hooks (`useState`, `useContext`). Avoid complex external state libraries unless absolutely necessary.
- **Avoid Inline Styles:** Do not use inline styles unless the value is strictly dynamic and state-driven.

### 3.3 Backend (FastAPI) Style
- **Async Execution:** Prefer `async def` for route handlers, database queries, and I/O operations.
- **Dependency Injection:** Use FastAPI's `Depends` for providing database sessions, extracting current users, and managing configurations.
- **Separation of Concerns:** Keep routing logic (`app/routes/`) separate from business logic (`app/services/` or `app/crud/`).
- **Pydantic Validation:** Always use Pydantic models in the `app/schemas/` directory to validate requests and responses.
- **Type Hints:** Use strict Python typing for function arguments and return types (e.g., `def get_user(db: AsyncSession, user_id: int) -> UserResponse:`).

---

## 4. Error Handling & State

### 4.1 Frontend Error Handling
- Wrap asynchronous operations (API calls, SecureStore reads) in `try...catch` blocks.
- Surface user-friendly error messages using React Native's `Alert.alert("Error", "Message")`.
- Log critical errors using `console.error` for debugging.
- **Navigation:** Use `router.push('/path')` to stack screens. Use `router.replace('/path')` for one-way flows (e.g., Login to Dashboard) so users cannot swipe back.

### 4.2 Backend Error Handling
- Never return raw database exceptions to the client.
- Catch known exceptions and raise FastAPI's `HTTPException(status_code=..., detail=...)`.
- Use standard HTTP status codes (400 for bad input, 401 unauthorized, 404 not found, 500 server error).
- Implement global exception handlers in `app/main.py` if custom error formatting is required.

---

## 5. AI Agent / Copilot Directives (Absolute Constraints)

*These directives act as rules files (`.cursorrules`, `copilot-instructions.md`). AGENTS MUST FOLLOW THESE PRECISELY.*

1. **No Web HTML:** Do NOT use HTML tags like `<div>`, `<span>`, `<p>`, or `<button>`. You must strictly use React Native primitives (`<View>`, `<Text>`, `<Pressable>`, `<ScrollView>`).
2. **Read-First Modification:** Before modifying a frontend screen or route, always read its parent layout file (`app/_layout.jsx`) to understand how headers and navigation stacks affect the UI.
3. **Secrets & Keys:** Never hardcode sensitive API keys or credentials. Use environment variables. In the backend, utilize `python-dotenv` and FastAPI's `BaseSettings`. In the frontend, use Expo's `process.env.EXPO_PUBLIC_...`.
4. **Image Constraints:** If you use an `Image` component with a remote `uri`, you MUST apply explicit width and height styles. React Native will not render network images without explicit dimensions.
5. **Idiomatic Performance:** If rendering a long list of data in the frontend, prioritize `<FlatList>` over mapping views inside a `<ScrollView>` to ensure memory efficiency.
6. **Backend Context:** Before modifying backend logic, always ensure you have reviewed the corresponding SQLAlchemy model (`app/models/`) and Pydantic schema (`app/schemas/`) to maintain consistency.
7. **Directory Context:** Remember you are operating in a monorepo structure. Run frontend tools in `/Frontend-For-APP` and backend tools in `/backend`.
8. **Testing Focus:** Always verify your work. When asked to fix an issue, proactively run the SINGLE failing test file (e.g., `uv run pytest tests/test_user.py` or `npm test -- user.test.js`) before and after making changes to ensure a precise fix.
