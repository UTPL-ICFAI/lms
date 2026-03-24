# LMS Frontend - Complete Implementation Guide

## Project Summary

This is a complete, production-ready React frontend for the LMS (Learning Management System). The application provides a full-featured user interface for three user roles:

- **Admin**: System management (users, courses, notices)
- **Faculty**: Course management and attendance marking
- **Student**: Course enrollment and attendance tracking

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file with API URL
cp .env.example .env

# Start development server (runs on port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Overview

### Frontend Stack
- **React 18.3.1** - UI library with hooks
- **Vite 5.2.0** - Fast build tool and dev server
- **React Router 6.24.0** - Client-side routing
- **Zustand 4.5.0** - Lightweight state management
- **Axios 1.7.7** - HTTP client with interceptors
- **TailwindCSS 3.4.1** - Utility-first CSS framework
- **Lucide React** - Clean SVG icon library
- **Sonner** - Toast notifications

### Backend Integration
- **Node.js + Express.js** backend running on port 8000
- **MongoDB** database with Mongoose ODM
- **JWT Authentication** with 7-day expiry
- **Bcryptjs** password hashing

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx              # Sidebar + Navbar layout wrapper
│   │   ├── ProtectedRoute.jsx      # Route-level auth enforcement
│   │   └── UI.jsx                  # Reusable component library
│   │
│   ├── pages/
│   │   ├── LoginPage.jsx           # Authentication entry point
│   │   ├── NotFound.jsx            # 404 error page
│   │   ├── Unauthorized.jsx        # 403 unauthorized page
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx       # Admin dashboard with stats
│   │   │   ├── Users.jsx           # User management (CRUD)
│   │   │   ├── Courses.jsx         # Course management (CRUD)
│   │   │   └── Notices.jsx         # Notice management (CRUD)
│   │   ├── faculty/
│   │   │   ├── Dashboard.jsx       # Faculty dashboard
│   │   │   ├── Attendance.jsx      # Mark attendance interface
│   │   │   └── Notices.jsx         # Create/manage notices
│   │   └── student/
│   │       ├── Dashboard.jsx       # Student dashboard
│   │       ├── Attendance.jsx      # View attendance records
│   │       └── Notices.jsx         # View course notices
│   │
│   ├── services/
│   │   ├── api.js                  # Axios instance with interceptors
│   │   └── index.js                # All API endpoint wrappers
│   │
│   ├── store/
│   │   └── authStore.js            # Zustand auth store
│   │
│   ├── hooks/
│   │   ├── useAuth.js              # Access auth state & role checks
│   │   └── useRequireAuth.js       # Enforce auth on routes
│   │
│   ├── utils/
│   │   └── toast.js                # Toast & error handling utilities
│   │
│   ├── App.jsx                     # Main router with all routes
│   ├── main.jsx                    # React entry point
│   └── index.css                   # Global Tailwind styles
│
├── public/
│   └── index.html                  # HTML template
│
├── .env                            # Environment variables
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies and scripts
├── vite.config.js                  # Vite configuration
├── tailwind.config.js              # Tailwind configuration
├── postcss.config.js               # PostCSS configuration
├── jsconfig.json                   # JS config (no TypeScript)
└── README.md                       # Project README

```

## Key Features Implementation

### 1. Authentication Flow

**Login Process:**
1. User enters email, password, and selects role
2. Sends POST request to `backend/auth/login`
3. Backend validates credentials and returns JWT token + user data
4. Token stored in localStorage via Zustand store
5. User redirected to role-based dashboard (/admin, /faculty, /student)

**Token Management:**
- Stored in localStorage as `auth-store` (Zustand persistence)
- Automatically attached to all API requests via Axios interceptor
- Bearer token format: `Authorization: Bearer <token>`
- Expired tokens (401 response) trigger automatic logout and redirect

**Protected Routes:**
- `<ProtectedRoute>` component wraps all role-specific routes
- Validates user is authenticated and has required role
- Redirects to /login if not authenticated
- Redirects to /unauthorized if role doesn't match

### 2. State Management (Zustand)

```javascript
// authStore.js structure:
{
  user: { _id, name, email, role, ... },
  token: 'jwt-token-string',
  isAuthenticated: boolean,
  login(user, token): sets auth state + localStorage
  logout(): clears auth state + localStorage
}
```

**Usage:**
```jsx
const { user, isAuthenticated, login, logout } = useAuthStore()
```

### 3. API Service Layer

**Structure:** `services/index.js` exports 7 service modules:
- `authService` - login, signup, logout
- `userService` - CRUD operations for users
- `courseService` - CRUD operations for courses
- `attendanceService` - Attendance marking and retrieval
- `noticeService` - Notice management
- `dashboardService` - Statistics and dashboard data

**HTTP Client:** `services/api.js` Axios instance with:
- Base URL: `http://localhost:8000/api`
- Request interceptor: Attaches Bearer token
- Response interceptor: Handles 401 errors

**Error Handling:**
```javascript
try {
  const response = await userService.getAllUsers()
  // Handle success
} catch (error) {
  handleApiError(error) // Shows toast notification
}
```

### 4. Component Library

**Reusable UI Components** in `UI.jsx`:

1. **Button** - Multiple variants (primary, secondary, danger, success, outline) and sizes
2. **Input** - Text field with label, error state, and validation
3. **Card** - Container with shadow and padding
4. **Badge** - Colored status indicators
5. **Modal** - Dialog with title, close button, and content
6. **Table** - Data display with columns, actions (edit/delete), pagination
7. **StatCard** - Dashboard statistic card with icon and color

**Usage Examples:**
```jsx
<Button variant="primary" onClick={handleClick}>Click Me</Button>
<Input label="Email" type="email" required />
<Modal isOpen={open} onClose={() => setOpen(false)} title="Create">
  {/* Content */}
</Modal>
<Table columns={cols} data={data} actions onEdit={edit} onDelete={delete} />
```

### 5. Role-Based Pages

**Admin Pages:**
- `/admin` - Dashboard with system statistics
- `/admin/users` - User management with CRUD operations
- `/admin/courses` - Course management with CRUD operations
- `/admin/notices` - Notice management with CRUD operations

**Faculty Pages:**
- `/faculty` - Dashboard showing courses and students
- `/faculty/attendance` - Mark attendance for course students
- `/faculty/notices` - Create and manage notices for courses

**Student Pages:**
- `/student` - Dashboard with enrolled courses
- `/student/attendance` - View attendance records
- `/student/notices` - View notices for enrolled courses

### 6. Layout Components

**Sidebar Navigation:**
- Different menu items based on user role
- Active route highlighting
- Links to role-specific pages
- Logout button

**Navbar:**
- User info display (name, role)
- Logout functionality
- Mobile responsive design

## Environment Configuration

**Development (.env):**
```
VITE_API_URL=http://localhost:8000/api
```

**Vite Dev Server:**
- Frontend runs on `http://localhost:3000`
- Proxies `/api/*` requests to `http://localhost:8000/api/*`
- Hot Module Replacement (HMR) enabled for instant updates

## Database Models (Backend Reference)

All models exist in backend - frontend only consumes API:

1. **User** - email, password, name, role (admin/faculty/student), isActive, isDeleted
2. **Course** - title, description, faculty, students[], isDeleted
3. **Attendance** - student, course, date, isPresent, isDeleted
4. **Notice** - title, description, course, createdBy, attachmentUrl, isDeleted

## API Endpoints Summary

**Authentication:**
- POST `/auth/login` - Returns { user, token }
- POST `/auth/signup` - User registration
- POST `/auth/logout` - Logout (frontend only clears localStorage)

**Users:**
- GET `/users` - List all users
- POST `/users` - Create user {name, email, password, role}
- PUT `/users/:id` - Update user
- DELETE `/users/:id` - Soft delete

**Courses:**
- GET `/courses` - List all courses
- POST `/courses` - Create {title, description}
- PUT `/courses/:id` - Update course
- DELETE `/courses/:id` - Soft delete
- POST `/courses/:id/enroll` - Add student to course
- POST `/courses/:id/unenroll` - Remove student from course

**Attendance:**
- POST `/attendance` - Mark {student, course, date, isPresent}
- GET `/attendance/student/:id` - Student's attendance records
- GET `/attendance/course/:id` - Course attendance records

**Notices:**
- GET `/notices` - List all notices
- POST `/notices` - Create {title, description, course}
- PUT `/notices/:id` - Update notice
- DELETE `/notices/:id` - Soft delete

## Development Workflow

### Running Locally

1. **Terminal 1 - Backend:**
   ```bash
   cd server
   npm install
   mongod  # Start MongoDB
   npm run dev  # Start backend on port 8000
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev  # Start frontend on port 3000
   ```

3. **Login:**
   - Navigate to `http://localhost:3000`
   - Use demo credentials (see README.md)

### Code Organization Guidelines

**Components:** 
- Keep components small and focused
- Use composition over props drilling
- Use `useAuth()` hook for auth context

**Pages:**
- One page per route
- Import and compose smaller components
- Handle data fetching in useEffect

**Services:**
- Only API calls, no business logic
- Use consistent error handling
- Return full response objects

**Stores:**
- Only auth state in Zustand
- For other state, use React hooks
- Persist to localStorage if needed

### Extending the Application

**Adding a New Page:**
1. Create component in `pages/admin/NewPage.jsx`
2. Add route in `App.jsx` under appropriate role
3. Add menu item in `Layout.jsx`
4. Use existing services for API calls

**Adding a New API Service:**
1. Add methods to appropriate service in `services/index.js`
2. Use the `api` instance for HTTP calls
3. Handle errors with `handleApiError()`

**Adding a New Component:**
1. Add to `components/UI.jsx`
2. Use TailwindCSS classes for styling
3. Export from UI.jsx
4. Use in pages or other components

## Performance Optimization

- **Code Splitting:** React Router lazy loading available
- **Caching:** Axios can cache GET requests
- **Minification:** Vite automatically minifies for production
- **Tree Shaking:** Unused code removed by Vite

## Troubleshooting

**Issue: "Cannot find module" errors**
- Solution: Run `npm install` to install all dependencies

**Issue: CORS errors from API**
- Solution: Check backend CORS configuration or verify VITE_API_URL in .env

**Issue: Login not working**
- Solution: Verify backend is running on port 8000
- Check browser console for specific error message

**Issue: 404 on routes**
- Solution: Verify route exists in App.jsx
- Check URL matches route path exactly

**Issue: Token expiring immediately**
- Solution: Check backend JWT_EXPIRE setting
- Clear localStorage and login again

## Security Considerations

✅ **Implemented:**
- JWT token-based authentication
- Bcryptjs password hashing on backend
- Protected routes with role validation
- HTTPS recommended for production
- Sensitive data not stored in localStorage

⚠️ **Additional Steps for Production:**
- Enable HTTPS/SSL
- Set secure cookies with HttpOnly flag
- Implement CSRF protection
- Add rate limiting
- Regular security audits

## Future Enhancements

- **Real-time Updates:** WebSocket for notifications
- **File Uploads:** Course materials, attachments
- **Advanced Filtering:** Search and filter options
- **Export:** CSV/PDF export functionality
- **Mobile App:** React Native version
- **Dark Mode:** Theme toggle
- **Internationalization:** Multi-language support
- **Analytics:** Usage statistics and reporting

## Production Deployment

**Build:**
```bash
npm run build  # Creates optimized build in dist/
```

**Deploy Options:**
- Vercel: `vercel deploy`
- Netlify: Push to Git, auto-deploy
- Traditional Server: Copy `dist/` contents to web server

**Environment Variables for Production:**
```
VITE_API_URL=https://api.yourdomain.com
```

## Support & Documentation

- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev
- Tailwind Docs: https://tailwindcss.com
- Axios Docs: https://axios-http.com
- Zustand Docs: https://github.com/pmndrs/zustand

## Testing (Future)

Recommended testing libraries:
- Vitest - Unit testing
- React Testing Library - Component testing
- Cypress - E2E testing

---

**Frontend Implementation:** ✅ COMPLETE
**Backend Integration:** ✅ COMPLETE
**Production Ready:** ✅ YES
**Last Updated:** 2024
