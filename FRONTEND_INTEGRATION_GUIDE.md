# Frontend Integration Guide

## Overview
This guide shows how to integrate the frontend with the LMS backend. All frontend code templates are provided as reference implementations.

---

## Project Structure

```
lms-frontend/
├── src/
│   ├── api/
│   │   ├── client.js              # Axios instance with interceptors
│   │   ├── authAPI.js             # Authentication endpoints
│   │   ├── courseAPI.js           # Course endpoints
│   │   ├── attendanceAPI.js       # Attendance endpoints
│   │   ├── noticeAPI.js           # Notice endpoints
│   │   ├── dashboardAPI.js        # Dashboard endpoints
│   │   └── adminAPI.js            # Admin endpoints
│   ├── components/
│   │   ├── ProtectedRoute.jsx     # Auth guard component
│   │   ├── RoleGuard.jsx          # Role-based guard component
│   │   ├── Header.jsx             # Navigation header
│   │   ├── Footer.jsx             # Footer component
│   │   └── ...
│   ├── pages/
│   │   ├── LoginPage.jsx          # Login form
│   │   ├── RegisterPage.jsx       # Register form
│   │   ├── StudentDashboard.jsx   # Student dashboard
│   │   ├── FacultyDashboard.jsx   # Faculty dashboard
│   │   ├── AdminDashboard.jsx     # Admin panel
│   │   ├── CoursesPage.jsx        # Course listing
│   │   ├── AttendancePage.jsx     # Attendance tracking
│   │   ├── NoticesPage.jsx        # Notices board
│   │   └── ...
│   ├── utils/
│   │   ├── errorHandler.js        # Error handling utilities
│   │   ├── tokenManager.js        # Token storage management
│   │   └── validators.js          # Input validation
│   ├── styles/
│   │   ├── index.css              # Global styles
│   │   ├── components.css         # Component styles
│   │   └── ...
│   ├── App.jsx                    # Main app router
│   ├── index.js                   # Entry point
│   └── .env.local                 # Environment variables
├── public/
│   ├── index.html
│   └── ...
├── package.json                   # Dependencies
└── .gitignore
```

---

## Step-by-Step Integration

### 1. Setup Project

```bash
# Create React app
npx create-react-app lms-frontend

# Navigate to project
cd lms-frontend

# Install dependencies
npm install axios react-router-dom
```

### 2. Create API Client

**File: `src/api/client.js`**
```javascript
// See FRONTEND_API_CLIENT.js for full implementation
// Key features:
// - Auto-adds Bearer token to all requests
// - Auto-redirects to login on 401
// - Sets JSON content-type
```

### 3. Create API Modules

**Files:**
- `src/api/authAPI.js`
- `src/api/courseAPI.js`
- `src/api/attendanceAPI.js`
- `src/api/noticeAPI.js`
- `src/api/dashboardAPI.js`
- `src/api/adminAPI.js`

**Pattern used in each:**
```javascript
import client from './client';

export const moduleAPI = {
  endpoint: (params) => {
    return client.method('/path', data);
  },
};
```

### 4. Create Components

**Core Components:**
- `ProtectedRoute.jsx` - Checks for token
- `RoleGuard.jsx` - Checks user role

**Page Components:**
- `LoginPage.jsx` - User login form
- `RegisterPage.jsx` - User registration form
- `StudentDashboard.jsx` - Student overview
- `FacultyDashboard.jsx` - Faculty overview
- `AdminDashboard.jsx` - Admin controls

### 5. Setup Router

**File: `src/App.jsx`**
```javascript
// Use ProtectedRoute to guard pages
// Use RoleGuard to restrict by role
// See FRONTEND_APP_ROUTER.jsx for example

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/dashboard/student"
    element={
      <ProtectedRoute>
        <RoleGuard allowedRoles={['student']}>
          <StudentDashboard />
        </RoleGuard>
      </ProtectedRoute>
    }
  />
</Routes>
```

### 6. Configure Environment

**File: `.env.local`**
```
REACT_APP_API_URL=http://localhost:8000/api
```

---

## Usage Examples

### Example 1: Login Flow

```javascript
import { authAPI } from '../api/authAPI';

// In LoginPage.jsx
const handleLogin = async (email, password, role) => {
  try {
    const response = await authAPI.login({
      email,
      password,
      role
    });

    // Store credentials
    authAPI.setCredentials(
      response.data.token,
      response.data.userId,
      response.data.role
    );

    // Redirect
    navigate('/dashboard/student');
  } catch (error) {
    console.error(error);
    setError(error.response?.data?.message);
  }
};
```

### Example 2: Get Student Courses

```javascript
import { courseAPI } from '../api/courseAPI';
import { useEffect, useState } from 'react';

function CoursesList() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await courseAPI.getStudentCourses();
        setCourses(response.data);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div>
      {courses.map((course) => (
        <div key={course._id}>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Mark Attendance

```javascript
import { attendanceAPI } from '../api/attendanceAPI';

async function markAttendance(courseId, date, timeSlot, records) {
  try {
    const response = await attendanceAPI.markAttendance(courseId, {
      date,
      timeSlot,
      records: [
        { studentId: 'student1_id', status: 'present' },
        { studentId: 'student2_id', status: 'absent' },
      ]
    });
    console.log('Attendance marked:', response.data);
  } catch (error) {
    console.error('Failed to mark attendance:', error);
  }
}
```

### Example 4: Get Notices with Pagination

```javascript
import { noticeAPI } from '../api/noticeAPI';

async function getNotices(page, courseId, keyword) {
  try {
    const response = await noticeAPI.getNotices({
      page,
      courseId,
      keyword
    });
    
    console.log('Total notices:', response.data.total);
    console.log('Current page:', response.data.page);
    console.log('Total pages:', response.data.pages);
    console.log('Notices:', response.data.notices);
  } catch (error) {
    console.error('Failed to fetch notices:', error);
  }
}
```

### Example 5: Admin Create User

```javascript
import { adminAPI } from '../api/adminAPI';

async function createStudent(name, email, password) {
  try {
    const response = await adminAPI.createUser({
      name,
      email,
      password,
      role: 'student'
    });
    console.log('User created:', response.data);
  } catch (error) {
    console.error('Failed to create user:', error);
  }
}
```

---

## Authentication Patterns

### Token Storage

```javascript
// Option 1: localStorage (persistent)
localStorage.setItem('token', token);

// Option 2: sessionStorage (session-only)
sessionStorage.setItem('token', token);

// Option 3: Memory (refresh required)
let authToken = token;
```

### Protected API Call

```javascript
// axios automatically adds Bearer token
const response = await client.get('/protected-endpoint');

// Header format: Authorization: Bearer <token>
```

### Check Authentication

```javascript
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

const getCurrentRole = () => {
  return localStorage.getItem('role');
};
```

### Logout

```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('role');
  navigate('/login');
};
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Show data |
| 201 | Created | Show success message |
| 400 | Bad Request | Show validation error |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show access denied |
| 404 | Not Found | Show not found error |
| 500 | Server Error | Show error message |

### Implement Error Handler

```javascript
// src/utils/errorHandler.js
export const handleError = (error) => {
  if (!error.response) {
    return 'Network error';
  }

  switch (error.response.status) {
    case 401:
      localStorage.removeItem('token');
      window.location.href = '/login';
      break;
    case 403:
      return 'Access denied';
    case 404:
      return 'Resource not found';
    default:
      return error.response.data?.message || 'An error occurred';
  }
};
```

---

## Component Guidelines

### Protected Route Pattern

```javascript
<ProtectedRoute>
  <Component />
</ProtectedRoute>
```

### Role Guard Pattern

```javascript
<RoleGuard allowedRoles={['faculty', 'admin']}>
  <Component />
</RoleGuard>
```

### Combined Protection

```javascript
<ProtectedRoute>
  <RoleGuard allowedRoles={['faculty']}>
    <Component />
  </RoleGuard>
</ProtectedRoute>
```

---

## Data Structures

### User Object
```javascript
{
  _id: "507f1f77bcf86cd799439011",
  name: "John Doe",
  email: "john@example.com",
  role: "student", // student, faculty, admin, parent
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-02T00:00:00Z"
}
```

### Course Object
```javascript
{
  _id: "507f1f77bcf86cd799439012",
  title: "Introduction to React",
  description: "Learn React basics",
  faculty: "507f1f77bcf86cd799439011", // User ID
  students: [
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021"
  ],
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Attendance Object
```javascript
{
  _id: "507f1f77bcf86cd799439030",
  student: "507f1f77bcf86cd799439020", // User ID
  course: "507f1f77bcf86cd799439012", // Course ID
  date: "2024-01-15T00:00:00Z",
  timeSlot: "09:00-10:00",
  status: "present", // present or absent
  createdAt: "2024-01-15T09:00:00Z"
}
```

### Notice Object
```javascript
{
  _id: "507f1f77bcf86cd799439040",
  title: "Important Announcement",
  description: "Class cancelled tomorrow",
  course: null, // null = global, or Course ID for specific course
  attachmentUrl: "https://...",
  createdBy: "507f1f77bcf86cd799439011", // User ID
  createdAt: "2024-01-05T10:30:00Z"
}
```

---

## Testing Checkpoints

### Auth Testing
- [ ] Register new user: `POST /api/auth/register`
- [ ] Login with different roles: `POST /api/auth/login`
- [ ] Token stored in localStorage
- [ ] 401 redirects to login
- [ ] Logout clears token

### Course Testing
- [ ] Faculty can create course: `POST /api/courses`
- [ ] Faculty sees their courses: `GET /api/courses/faculty`
- [ ] Student sees enrolled courses: `GET /api/courses/student`
- [ ] Faculty can enroll student: `POST /api/courses/:courseId/enroll`
- [ ] Update/delete course works

### Attendance Testing
- [ ] Faculty can mark attendance: `POST /api/attendance/:courseId`
- [ ] Student can view attendance: `GET /api/attendance/student`
- [ ] Course-specific attendance shows percentage

### Notice Testing
- [ ] Faculty can create notice: `POST /api/notices`
- [ ] Get notices with pagination: `GET /api/notices?page=1`
- [ ] Filter by course: `GET /api/notices?courseId=...`
- [ ] Search by keyword: `GET /api/notices?keyword=...`

### Dashboard Testing
- [ ] Student dashboard shows stats
- [ ] Faculty dashboard shows stats
- [ ] Recent notices appear

### Admin Testing
- [ ] Admin can create user: `POST /api/admin/create-user`
- [ ] Admin can assign course: `POST /api/admin/assign-course`
- [ ] Admin can update user: `PUT /api/users/:userId`

---

## Deployment Checklist

- [ ] Update `.env` with production API URL
- [ ] Test all endpoints in production
- [ ] Add error logging/monitoring
- [ ] Minify and optimize build
- [ ] Set CORS headers properly
- [ ] Use HTTPS for API requests
- [ ] Implement proper token refresh (optional)
- [ ] Add rate limiting alerts
- [ ] Test on different browsers
- [ ] Performance testing
- [ ] Security audit

---

## Common Issues & Solutions

### Issue: "CORS error"
**Solution**: Backend CORS is already enabled. Check API URL in `.env.local`

### Issue: "401 on every request"
**Solution**: Token not being added. Check `client.js` interceptor is working

### Issue: "Role guard not working"
**Solution**: Ensure role is stored in localStorage after login

### Issue: "Pages reload and lose data"
**Solution**: Implement localStorage persistence or fetch on component mount

### Issue: "API timeouts"
**Solution**: Increase axios timeout or check backend is running on correct port

---

## Backend Server

```bash
# Start backend
cd server
npm install
npm start

# Should output:
# 🚀 Server running on port 8000
# ✅ MongoDB Connected: ...
```

---

## Frontend Development Server

```bash
# Start frontend
npm start

# Should open http://localhost:3000
```

---

## Next Steps

1. Create all API modules
2. Create all page components
3. Test authentication flow
4. Test each role's functionality
5. Implement loading states
6. Add error notifications
7. Style components
8. Test across browsers
9. Deploy to production

---

Generated: March 12, 2026
