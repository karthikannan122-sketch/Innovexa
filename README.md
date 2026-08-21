# INNOVEXA — AI-Powered Open Innovation Platform

INNOVEXA is a next-generation platform for open specimen exploration, multi-user peer review validation, community consensus analysis, and discovery of technical innovations.

---

## 📁 Repository Structure

```
INNOVEXA/
├── frontend/                     # React 19 + Vite Frontend Application
│   ├── src/
│   │   ├── components/           # UI Components, Modals, 3D Canvas
│   │   ├── context/              # AuthContext & Session State
│   │   ├── pages/                # Explore, PublishedDetail, Reviews, Dashboard, etc.
│   │   ├── services/             # SupabaseService, AIService, Storage
│   │   └── utils/                # Design tokens & color helpers
│   ├── public/                   # Static assets & icons
│   ├── index.html                # Entrypoint HTML
│   ├── package.json              # Frontend dependencies & scripts
│   ├── vite.config.js            # Vite build configuration
│   └── .env                      # Supabase & backend configuration
│
├── backend/                      # Python FastAPI Intelligence Backend
│   ├── app/
│   │   ├── main.py               # API endpoints & intelligence router
│   │   ├── discovery_engine.py   # Autonomous innovation indexing
│   │   ├── models/               # Data structures
│   │   └── schemas/              # Pydantic schemas
│   ├── requirements.txt          # Python dependencies
│   └── tests/                    # Backend test scripts
│
├── supabase_schema.sql           # Database schema & RLS policies
├── package.json                  # Root orchestration scripts
└── README.md
```

---

## 🚀 Getting Started

### 1. Run the Frontend (Vite)
From the root directory:
```bash
npm run dev
```
Or directly inside `frontend/`:
```bash
cd frontend
npm run dev
```

### 2. Build for Production
From root:
```bash
npm run build
```

### 3. Run the Backend API (FastAPI)
From the root directory:
```bash
npm run backend
```
Or directly inside `backend/`:
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
