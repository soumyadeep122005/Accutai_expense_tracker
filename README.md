# Accutai Corporate Expense Tracker & Finance Dashboard

Accutai is an enterprise full-stack finance dashboard and corporate expense tracking application featuring a **shared ledger architecture**. All authenticated `@accutai.com` team members view and manage the exact same company financial records, spending categories, analytics, and admin-defined monthly budget targets in real time.

---

## Architecture & Design Highlights

- **Shared Ledger Architecture**: All authenticated users see the identical transaction stream, monthly sums, calendar view, category distributions, and shared budget target.
- **Corporate White & Blue Theme**: Modern corporate aesthetic featuring crisp white surfaces, Accutai royal blue (`#1e40af`, `#2563eb`), slate accents, and subtle borders.
- **Branded Assets**: Includes Accutai logos (`accutaiLOGO Small.png` and `alogo1.png`) across the sidebar, header, and login portals.
- **Dual Folder Structure**:
  - `backend/`: FastAPI + SQLAlchemy + Pydantic + JWT + Google OAuth + Supabase Postgres & Storage.
  - `frontend/`: React 19 + Vite + Chart.js + Supabase JS + CSS design system.
- **Cloud Database & Storage**:
  - Supabase PostgreSQL primary database connection.
  - Supabase Storage bucket (`accutai_expense_bills`) for bill/receipt proof attachments.
- **Authentication**:
  - JWT token-based authentication.
  - Domain validation: restricts registration to `@accutai.com` corporate emails.
  - Google OAuth 2.0 single sign-on integration.

---

## Directory Structure

```text
accutai_expense_tracker/
├── assets/
│   ├── accutaiLOGO Small.png
│   └── alogo1.png
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py             # Login, register, Google OAuth, /users/me
│   │   │   ├── budget.py           # Shared company monthly budget target
│   │   │   ├── categories.py       # Shared category list & custom categories
│   │   │   ├── reports.py          # Shared monthly, calendar, historical, & period summaries
│   │   │   └── transactions.py     # Shared ledger transactions & receipt upload
│   │   ├── config.py               # Settings & secrets management
│   │   ├── database.py             # Supabase Postgres engine & sessionmaker
│   │   ├── google_auth.py          # Google OAuth exchange helper
│   │   ├── main.py                 # FastAPI application entrypoint & CORS
│   │   ├── models.py               # SQLAlchemy database models
│   │   ├── schemas.py              # Pydantic schemas
│   │   ├── security.py             # Bcrypt hashing & JWT token verification
│   │   └── storage.py              # Supabase Storage bill uploader
│   ├── tests/
│   │   └── test_api.py             # Automated pytest suite
│   ├── .env                        # Backend credentials & secrets
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   ├── accutaiLOGO Small.png
│   │   └── alogo1.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── AnalyticsView.jsx   # Donut chart, Bar trend charts, Top expenses
│   │   │   ├── BudgetHero.jsx      # Shared budget meter, utilization %, edit modal trigger
│   │   │   ├── BudgetModal.jsx     # Update shared monthly budget target
│   │   │   ├── CalendarView.jsx    # Monthly activity calendar grid
│   │   │   ├── LoginPage.jsx       # Corporate login & register with Google SSO
│   │   │   ├── MetricCards.jsx     # Inflow, Spending, Net Cash, Budget Available
│   │   │   ├── Navbar.jsx          # Topbar with month/year selector & Add Entry button
│   │   │   ├── ReceiptModal.jsx    # Preview attached receipts/invoices
│   │   │   ├── Sidebar.jsx         # Branded navigation & user profile
│   │   │   ├── TransactionModal.jsx# Create/Edit transaction with receipt upload
│   │   │   └── TransactionTable.jsx# Shared ledger table with search, filter, CSV export
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     # Authentication context
│   │   │   └── ToastContext.jsx    # Action toasts (create, edit, delete)
│   │   ├── services/
│   │   │   ├── api.js              # Fetch client connecting to backend
│   │   │   └── supabase.js         # Supabase client helper
│   │   ├── App.jsx                 # Core app state & view switching
│   │   ├── index.css               # White and Blue CSS design system
│   │   └── main.jsx                # Application root
│   ├── .env                        # Frontend environment variables
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Running Locally

### 1. Backend

```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 2. Frontend

```powershell
cd frontend
npm run dev -- --host 0.0.0.0 --port 5174
```
- Open [http://localhost:5174/](http://localhost:5174/) in your browser.

### 3. Running Automated Tests

```powershell
cd backend
python -m pytest tests/test_api.py -v
```
