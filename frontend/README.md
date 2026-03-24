# LMS Frontend - React + Vite + TailwindCSS

Complete production-ready frontend for the LMS (Learning Management System) backend API. Built with React 18, Vite, TailwindCSS, Axios, and Zustand state management.

## Features

✅ **Role-Based Access Control**
- Admin Dashboard with user, course, and notice management
- Faculty Dashboard with attendance marking and notice creation
- Student Dashboard with course enrollment and attendance tracking

✅ **Complete Authentication**
- JWT-based authentication with token storage
- Axios interceptors for automatic token injection
- Protected routes with role validation
- Automatic logout on 401 errors

✅ **API Integration**
- Full integration with backend API (30+ endpoints)
- Comprehensive service layer with error handling
- Toast notifications for user feedback

✅ **UI Components**
- Reusable component library (Button, Input, Card, Modal, Table, etc.)
- Responsive design with Tailwind CSS
- Icon support with Lucide React

## Tech Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.2.0
- **Styling**: TailwindCSS 3.4.1
- **HTTP Client**: Axios 1.7.7
- **State Management**: Zustand 4.5.0
- **Routing**: React Router 6.24.0
- **Icons**: Lucide React 0.428
- **Notifications**: Sonner 1.3.1

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── UI.jsx           # Base components (Button, Input, Card, etc.)
│   │   ├── Layout.jsx       # Sidebar and Navbar
│   │   └── ProtectedRoute.jsx  # Route protection wrapper
│   ├── pages/               # Page components
│   │   ├── LoginPage.jsx    # Login page
│   │   ├── admin/           # Admin-specific pages
│   │   ├── faculty/         # Faculty-specific pages
│   │   └── student/         # Student-specific pages
│   ├── services/            # API service layer
│   │   ├── api.js           # Axios instance with interceptors
│   │   └── index.js         # All API endpoints
│   ├── store/               # Zustand state management
│   │   └── authStore.js     # Authentication store
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.js       # Auth context hook
│   │   └── useRequireAuth.js  # Route protection hook
│   ├── utils/               # Utility functions
│   │   └── toast.js         # Toast and error handling
│   ├── App.jsx              # Main router
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── public/
│   └── index.html           # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── .env                     # Environment variables
```

## Setup & Installation

### Prerequisites
- Node.js 18+ and npm/yarn installed
- Backend server running on `http://localhost:8000`

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Update .env with your backend API URL if different
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Preview Production Build**
   ```bash
   npm run preview
   ```

## API Endpoints Implemented

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (soft)
- `POST /users/:id/restore` - Restore deleted user

### Courses
- `GET /courses` - Get all courses
- `GET /courses/:id` - Get course by ID
- `POST /courses` - Create course
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course
- `POST /courses/:id/restore` - Restore course
- `POST /courses/:id/enroll` - Enroll student
- `POST /courses/:id/unenroll` - Unenroll student

### Attendance
- `POST /attendance` - Mark attendance
- `GET /attendance/student/:studentId` - Get student attendance
- `GET /attendance/course/:courseId` - Get course attendance
- `PUT /attendance/:id` - Update attendance record

### Notices
- `GET /notices` - Get all notices
- `POST /notices` - Create notice
- `PUT /notices/:id` - Update notice
- `DELETE /notices/:id` - Delete notice
- `POST /notices/:id/restore` - Restore notice

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics

## Demo Credentials

**Admin**
- Email: `admin@lms.com`
- Password: `admin123`
- Role: `admin`

**Faculty**
- Email: `faculty@lms.com`
- Password: `faculty123`
- Role: `faculty`

**Student**
- Email: `student@lms.com`
- Password: `student123`
- Role: `student`

## Usage Guide

### Admin Dashboard
1. Login with admin credentials
2. View dashboard with system statistics
3. Manage Users - Create, Edit, Delete users
4. Manage Courses - Create, Edit, Delete courses
5. Manage Notices - Create, Edit, Delete notices

### Faculty Dashboard
1. Login with faculty credentials
2. View dashboard with course and student stats
3. Mark Attendance - Select course and mark student attendance
4. Create Notices - Create and manage notices for courses

### Student Dashboard
1. Login with student credentials
2. View enrolled courses
3. Check Attendance - View attendance records for enrolled courses
4. View Notices - See notices for enrolled courses

## Authentication Flow

1. User enters credentials on login page
2. Request sent to backend `/auth/login` endpoint
3. Backend returns JWT token and user data
4. Token stored in localStorage via Zustand store
5. Axios intercepts all requests and adds Bearer token to Authorization header
6. Protected routes validate user role and redirect to /login if unauthorized
7. On 401 response, user is automatically logged out and redirected to login page

## Error Handling

- API errors are caught and displayed as toast notifications
- 401 errors trigger automatic logout and redirect to login
- Network errors show user-friendly messages
- Form validation errors are displayed inline

## Component Usage Examples

### Button Component
```jsx
<Button variant="primary" size="md" onClick={handleClick}>
  Click Me
</Button>
```

### Input Component
```jsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error="Invalid email"
/>
```

### Modal Component
```jsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Create New Item"
>
  {/* Modal content */}
</Modal>
```

### Protected Route
```jsx
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

## API Service Usage

```jsx
import { userService, courseService, authService } from '../services'

// Get all users
const users = await userService.getAllUsers()

// Create new user
const user = await userService.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'student'
})

// Get all courses
const courses = await courseService.getAllCourses()

// Create new course
const course = await courseService.createCourse({
  title: 'Advanced Python',
  description: 'Learn advanced Python concepts'
})
```

## State Management with Zustand

```jsx
import { useAuthStore } from '../store/authStore'

function MyComponent() {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div>
      {isAuthenticated && <p>Welcome, {user.name}</p>}
    </div>
  )
}
```

## Development Tips

1. **Hot Module Replacement**: Changes to files are reflected instantly in development
2. **Debugging**: Use browser DevTools to inspect React components and network requests
3. **API Testing**: Use Postman or similar tools to test backend API directly
4. **Error Logging**: Check browser console for detailed error messages

## Troubleshooting

**CORS Errors**
- Ensure backend is running on port 8000
- Check VITE_API_URL in .env file
- Verify backend CORS configuration

**Token Expiration**
- Default JWT expiry is 7 days
- Expired tokens trigger automatic logout
- User is redirected to login page

**Page Not Loading**
- Check browser console for errors
- Verify backend API is running
- Confirm user role matches required role for page

## Future Enhancements

- [ ] Real-time notifications with WebSocket
- [ ] File upload functionality
- [ ] Advanced filtering and search
- [ ] Export to CSV/PDF
- [ ] Dark mode theme
- [ ] Multi-language support
- [ ] Performance optimization
- [ ] Mobile app (React Native)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for error messages
3. Verify backend API is running and accessible
4. Check API response format matches service layer expectations

## License

This project is part of the LMS (Learning Management System) suite.
