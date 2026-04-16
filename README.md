# 🛡️ mr7.ai — AI Security Research Platform

Full-stack security scanner: FastAPI + MySQL backend, React + Vite frontend.

---

## 📁 Project Structure

```
mr7/
├── backend/
│   ├── main.py              # FastAPI app — all routes
│   ├── database.py          # MySQL connection (SQLAlchemy)
│   ├── models.py            # DB tables: User, Scan
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # DB operations + report generation
│   ├── auth.py              # JWT + bcrypt
│   ├── scanner.py           # All 9 scan test suites (async streaming)
│   ├── utils.py             # URL validation helpers
│   └── requirements.txt
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx              # Router + AuthContext
        ├── api.js               # Fetch wrapper + SSE stream
        ├── styles/
        │   └── global.css       # Dark theme + persistent rotating earth background
        ├── components/
        │   ├── Background.jsx   # Earth layers (fixed, visible across all pages)
        │   └── Navbar.jsx       # Auth-aware navbar
        └── pages/
            ├── Home.jsx         # Landing — features, pricing, stats, how-to
            ├── Login.jsx        # Sign in
            ├── Signup.jsx       # Register with disclaimer
            ├── Scanner.jsx      # Live terminal scanner with tree output
            ├── Profile.jsx      # Scan history + modal + download
            └── Admin.jsx        # User management + scan monitoring
```

---

## ⚙️ Backend Setup

### 1. Create MySQL database
```sql
CREATE DATABASE mr7ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Set environment variables
```bash
export DB_USER=root
export DB_PASSWORD=yourpassword
export DB_HOST=localhost
export DB_NAME=mr7ai
export SECRET_KEY=your-random-secret-change-this
```

### 3. Install & run
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

> **Note:** The first user to sign up automatically becomes admin.

---

## 🌐 Frontend Setup

```bash
cd frontend
npm install
npm run dev        # dev server on http://localhost:3000
npm run build      # production build → dist/
```

> Place your `background.webp` file inside `frontend/public/` for the rotating earth.

---

## 🔍 Scanner Test Categories

| # | Category          | Tests Included |
|---|-------------------|----------------|
| 1 | HTTP Basics       | Status, response time, redirect count, HTTPS enforcement |
| 2 | SSL/TLS           | Certificate expiry, protocol version (TLS 1.2/1.3) |
| 3 | Security Headers  | HSTS, CSP, X-Frame-Options, X-Content-Type, XSS, Referrer, Permissions, server disclosure |
| 4 | Port Scanning     | 13 ports: FTP, SSH, Telnet, MySQL, Redis, MongoDB, etc. |
| 5 | SQL Injection     | 6 payloads: classic, double-quote, OR bypass, UNION, boolean blind, error-based |
| 6 | XSS Probes        | 5 payloads: script tag, img onerror, JS protocol, attribute escape, SVG onload |
| 7 | API Security      | Auth check, Content-Type, CORS policy, dangerous HTTP methods |
| 8 | Content Analysis  | Broken links, forms, email/IP disclosure, robots.txt |
| 9 | Directory Exposure| 15 sensitive paths: .git, .env, /admin, /phpmyadmin, swagger, etc. |

---

## 💡 Risk Scoring

Each finding contributes to a 0–100 risk score:
- `CRITICAL` finding → +15 points
- `WARNING` finding  → +5 points
- Score capped at 100

| Score  | Label  | Color  |
|--------|--------|--------|
| 0–29   | LOW    | 🟢 Green  |
| 30–59  | MEDIUM | 🟡 Yellow |
| 60–100 | HIGH   | 🔴 Red    |

---

## 🛡️ Admin Features

- View all registered users
- Ban/unban any non-admin user
- View all scans across all users
- Delete any scan
- First registered user is auto-promoted to admin

---

## ⚠️ Legal Disclaimer

This platform is intended **only for authorized security testing** on systems you own or have explicit written permission to test. All scans are logged with user identity and timestamp. Unauthorized use may violate applicable laws.
