# Frontend Directory Structure & File Reference

```
frontend/
│
├── 📄 Configuration Files
│   ├── package.json                    # Dependencies & npm scripts
│   ├── vite.config.js                  # Vite build & dev server config
│   ├── tailwind.config.js              # TailwindCSS theme
│   ├── postcss.config.js               # PostCSS config (Tailwind)
│   ├── jsconfig.json                   # JavaScript config
│   ├── .env                            # Environment variables
│   ├── .env.example                    # Environment template
│   ├── .gitignore                      # Git ignore rules
│   └── .npmrc                          # npm config (optional)
│
├── 📄 Documentation Files
│   ├── README.md                       # Complete documentation
│   ├── IMPLEMENTATION_GUIDE.md         # Developer guide
│   ├── COMPLETE_FILES_SUMMARY.md       # File reference
│   ├── QUICKSTART.md                   # 5-minute setup guide
│   └── ARCHITECTURE.md                 # (optional) Architecture details
│
├── 📁 public/
│   └── index.html                      # HTML template
│
├── 📁 src/
│   │
│   ├── 📁 components/
│   │   ├── UI.jsx                      # Component library (8 components)
│   │   ├── Layout.jsx                  # Sidebar + Navbar wrapper
│   │   ├── ProtectedRoute.jsx          # Route protection
│   │   └── README.md                   # Components guide (optional)
│   │
│   ├── 📁 pages/
│   │   ├── LoginPage.jsx               # Login page (public)
│   │   ├── NotFound.jsx                # 404 error page
│   │   ├── Unauthorized.jsx            # 403 error page
│   │   │
│   │   ├── 📁 admin/
│   │   │   ├── Dashboard.jsx           # Admin dashboard
│   │   │   ├── Users.jsx               # User CRUD management
│   │   │   ├── Courses.jsx             # Course CRUD management
│   │   │   └── Notices.jsx             # Notice CRUD management
│   │   │
│   │   ├── 📁 faculty/
│   │   │   ├── Dashboard.jsx           # Faculty dashboard
│   │   │   ├── Attendance.jsx          # Mark attendance
│   │   │   └── Notices.jsx             # Create notices
│   │   │
│   │   └── 📁 student/
│   │       ├── Dashboard.jsx           # Student dashboard
│   │       ├── Attendance.jsx          # View attendance
│   │       └── Notices.jsx             # View notices
│   │
│   ├── 📁 services/
│   │   ├── api.js                      # Axios HTTP client
│   │   └── index.js                    # API endpoint functions
│   │
│   ├── 📁 store/
│   │   └── authStore.js                # Zustand auth store
│   │
│   ├── 📁 hooks/
│   │   ├── useAuth.js                  # Auth state hook
│   │   └── useRequireAuth.js           # Route protection hook
│   │
│   ├── 📁 utils/
│   │   └── toast.js                    # Toast & error utilities
│   │
│   ├── App.jsx                         # Main router
│   ├── main.jsx                        # React entry point
│   └── index.css                       # Global styles
│
└── 📁 node_modules/                    # Dependencies (after npm install)

```

## File Summary by Category

### 🔧 Configuration (8 files)
| File | Purpose | Key Content |
|------|---------|-------------|
| `package.json` | Dependency management | Scripts: dev, build, preview |
| `vite.config.js` | Build configuration | React plugin, port 3000, /api proxy |
| `tailwind.config.js` | Styling configuration | Colors, theme, utilities |
| `postcss.config.js` | CSS processing | tailwindcss, autoprefixer |
| `jsconfig.json` | JS compiler options | Path aliases, strict mode |
| `.env` | Environment variables | VITE_API_URL |
| `.env.example` | Template | Reference for .env |
| `.gitignore` | Git ignore | node_modules, dist, .env.local |

### 📚 Documentation (4 files)
| File | Purpose | Length |
|------|---------|--------|
| `README.md` | User documentation | Features, setup, api endpoints |
| `IMPLEMENTATION_GUIDE.md` | Developer guide | Architecture, workflow, patterns |
| `COMPLETE_FILES_SUMMARY.md` | File reference | All files and their purposes |
| `QUICKSTART.md` | Quick setup | 5-minute setup guide |

### 🎨 Components (3 files)
| File | Components | Count |
|------|-----------|-------|
| `UI.jsx` | Button, Input, Card, Badge, Modal, Table, StatCard, Loading | 8 |
| `Layout.jsx` | Sidebar, Navbar, Main wrapper | 3 |
| `ProtectedRoute.jsx` | Route protection logic | 1 |

### 📄 Pages (14 files)
| Directory | Pages | Count |
|-----------|-------|-------|
| `pages/` | LoginPage, NotFound, Unauthorized | 3 |
| `pages/admin/` | Dashboard, Users, Courses, Notices | 4 |
| `pages/faculty/` | Dashboard, Attendance, Notices | 3 |
| `pages/student/` | Dashboard, Attendance, Notices | 3 |
| **Total Pages** | | **13** |

### 🔄 Services (2 files)
| File | Services | Endpoints |
|------|----------|-----------|
| `api.js` | Axios instance | Base URL, interceptors |
| `index.js` | 6 service modules | 28 API endpoints |

### 📦 State & Hooks (3 files)
| File | Exports | Purpose |
|------|---------|---------|
| `authStore.js` | Zustand store | Auth state management |
| `useAuth.js` | Custom hook | Access auth state |
| `useRequireAuth.js` | Custom hook | Route protection |

### 🛠️ Utils (1 file)
| File | Exports | Purpose |
|------|---------|---------|
| `toast.js` | Toast notifications, error handler | User feedback |

### 📍 Entry Points (3 files)
| File | Purpose | Created |
|------|---------|---------|
| `index.html` | HTML template | Browser loads this first |
| `main.jsx` | React entry point | Mounts React app |
| `App.jsx` | Main router | Routes all pages |

---

## How Files Work Together

### 1️⃣ When User Loads App
```
index.html → loads main.jsx → renders App.jsx
```

### 2️⃣ When User Navigates
```
App.jsx (Router) → checks ProtectedRoute → renders Page Component
```

### 3️⃣ When Page Needs Data
```
Page Component → calls services → api.js → Add Bearer Token → API
```

### 4️⃣ When User Logs In
```
LoginPage → authService.login() → authStore.js (Zustand) → Redirect
```

### 5️⃣ When API Returns Error
```
api.js (interceptor) → detects 401 → auto logout → redirect to login
```

---

## File Relationships

```
App.jsx
├─→ ProtectedRoute.jsx
├─→ LoginPage.jsx
├─→ pages/admin/*.jsx → services/index.js → services/api.js
├─→ pages/faculty/*.jsx → services/index.js → services/api.js
├─→ pages/student/*.jsx → services/index.js → services/api.js
└─→ Layout.jsx (all pages)
    ├─→ useAuth.js → authStore.js
    └─→ UI.jsx (all pages use these components)
```

---

## Creation Order (Dependency Order)

1. **Configuration** (vite, tailwind, postcss, .env)
2. **Entry Points** (index.html, main.jsx, index.css)
3. **Services** (api.js, services/index.js)
4. **State** (authStore.js)
5. **Hooks** (useAuth.js, useRequireAuth.js)
6. **Utils** (toast.js)
7. **Components** (UI.jsx, ProtectedRoute.jsx, Layout.jsx)
8. **Pages** (LoginPage, admin/*, faculty/*, student/*)
9. **Router** (App.jsx)
10. **Documentation** (README.md, guides, etc.)

---

## Statistics

| Metric | Count |
|--------|-------|
| **Total Files** | 31 |
| **Configuration Files** | 8 |
| **Documentation Files** | 4 |
| **Component Files** | 3 |
| **Page Files** | 14 |
| **Service Files** | 2 |
| **Hook Files** | 2 |
| **Utility Files** | 1 |
| **Lines of Code** | ~3,500+ |
| **React Components** | 20+ |
| **API Endpoints** | 28 |

---

## Quick Navigation

**Need to find something?** Use this table:

| What You're Looking For | File | Location |
|------------------------|------|----------|
| How to setup? | QUICKSTART.md | root |
| Full documentation | README.md | root |
| Architecture details | IMPLEMENTATION_GUIDE.md | root |
| Error handling | services/api.js | src/services/ |
| Login logic | LoginPage.jsx | src/pages/ |
| Auth state | authStore.js | src/store/ |
| API calls | services/index.js | src/services/ |
| Components | UI.jsx | src/components/ |
| Navigation | Layout.jsx | src/components/ |
| Routing | App.jsx | src/ |
| Admin pages | admin/*.jsx | src/pages/admin/ |
| Faculty pages | faculty/*.jsx | src/pages/faculty/ |
| Student pages | student/*.jsx | src/pages/student/ |

---

## Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `http://localhost:8000/api` | Backend API URL |

---

## Dependencies Breakdown

| Package | Package | Version | Purpose |
|---------|---------|---------|---------|
| react | React | 18.3.1 | UI library |
| react-dom | ReactDOM | 18.3.1 | DOM rendering |
| react-router-dom | React Router | 6.24.0 | Client routing |
| axios | Axios | 1.7.7 | HTTP client |
| zustand | Zustand | 4.5.0 | State management |
| tailwindcss | TailwindCSS | 3.4.1 | Styling |
| lucide-react | Lucide | 0.428 | Icons |
| sonner | Sonner | 1.3.1 | Notifications |

---

## npm Scripts

```json
{
  "dev": "vite",                    // Start dev server
  "build": "vite build",            // Build for production
  "preview": "vite preview"         // Preview production build
}
```

---

## Development Workflow

```
Terminal                          Browser
├─ npm install                     
├─ npm run dev ──────────────────→ http://localhost:3000
├─ Edit file ──────────────────→ HMR updates instantly
├─ console.log() ──────────────→ DevTools shows output
│
└─ npm run build ──────────────→ Creates optimized dist/
```

---

**Last Updated:** 2024  
**Status:** ✅ Complete and Production-Ready
