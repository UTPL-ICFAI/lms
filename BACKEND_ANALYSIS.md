# LMS Backend Analysis & Frontend Architecture Guide

---

## 1. TECH STACK ANALYSIS

### Runtime & Framework
- **Runtime**: Node.js
- **Framework**: Express.js v5.2.1
- **Package Manager**: npm

### Database
- **Database**: MongoDB
- **Connection**: MongoDB Atlas (Cloud)
- **Connection String Format**: `mongodb+srv://username:password@cluster.mongodb.net/?appName=AppName`

### ODM (Object Document Mapper)
- **ODM**: Mongoose v9.2.3
- **Purpose**: Schema validation and database operations

### Authentication
- **Method**: JWT (JSON Web Tokens)
- **Library**: jsonwebtoken v9.0.3
- **Token Expiry**: 7 days
- **Validation**: Bearer token in Authorization header

### Encryption
- **Password Hashing**: bcryptjs v3.0.3
- **Salt Rounds**: 10
- **Algorithm**: bcrypt (industry standard)

### CORS
- **Library**: cors v2.8.6
- **Configuration**: Enabled for all origins (default)

### Environment Management
- **Library**: dotenv v17.3.1
- **File**: `.env` (root directory)

---

## 2. ENVIRONMENT VARIABLES

### Required Variables in `.env`

| Variable | Example Value | Purpose |
|----------|---------------|---------|
| `PORT` | `8000` | Server listening port |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.../` | MongoDB connection string with credentials |
| `JWT_SECRET` | `supersecretkey123` | Secret key for signing/verifying JWT tokens |
| `NODE_ENV` | `development` or `production` | Environment mode (optional, add for frontend detection) |
| `CLIENT_URL` | `http://localhost:3000` | Frontend URL (optional, for CORS if needed) |

### Variable Descriptions

- **PORT**: Server runs on this port (default: 5000, currently: 8000)
- **MONGO_URI**: Complete MongoDB connection string with username and password
  - Format: `mongodb+srv://username:password@cluster.a2dvroz.mongodb.net/?appName=Cluster0`
  - Credentials are embedded in the URI
  - Contains cluster location, region, and connection parameters
- **JWT_SECRET**: Used to sign and verify JWT tokens
  - Should be strong and random (update from "supersecretkey123" in production)
  - Must be same on backend for token verification
- **NODE_ENV**: Helps frontend detect environment
  - `development`: For local testing
  - `production`: For live deployment
- **CLIENT_URL**: Frontend origin for CORS headers (if needed)

---

## 3. API ENDPOINTS DOCUMENTATION

### Full API Reference Table

| METHOD | ENDPOINT | DESCRIPTION | AUTH REQUIRED | REQUEST BODY | RESPONSE | NOTES |
|--------|----------|-------------|---------------|--------------|-----------------------|-------|
| **POST** | `/api/auth/register` | User registration | No | `{name, email, password, role}` | `{message, token}` | Auto-login after registration |
| **POST** | `/api/auth/login` | User login | No | `{email, password, role}` | `{message, token, userId, role}` | Role required for login |
| **POST** | `/api/courses` | Create course | Faculty | `{title, description}` | `{_id, title, description, faculty, students[], ...}` | Faculty-only |
| **GET** | `/api/courses/faculty` | Get faculty courses | Faculty | - | `[{course objects}]` | Only user's courses |
| **GET** | `/api/courses/student` | Get enrolled courses | Student | - | `[{course objects}]` | Only enrolled courses |
| **POST** | `/api/courses/:courseId/enroll` | Enroll student | Faculty | `{studentId}` | `{message, course}` | Prevents duplicate enrollment |
| **PUT** | `/api/courses/:courseId` | Update course | Faculty/Admin | `{title?, description?}` | `{message, course}` | Soft update |
| **DELETE** | `/api/courses/:courseId` | Delete course (soft) | Faculty/Admin | - | `{message}` | Soft delete, can restore |
| **PUT** | `/api/courses/restore/:courseId` | Restore course | Faculty/Admin | - | `{message}` | Undo soft delete |
| **DELETE** | `/api/courses/:courseId/student/:studentId` | Remove student | Faculty/Admin | - | `{message}` | Unenroll student |
| **GET** | `/api/courses/deleted/all` | List deleted courses | Admin | - | `[{soft-deleted courses}]` | Admin only |
| **POST** | `/api/attendance/:courseId` | Mark attendance | Faculty | `{date, timeSlot, records[{studentId, status}]}` | `{message}` | Bulk upsert |
| **GET** | `/api/attendance/student` | View attendance | Student | - | `[{attendance records}]` | All records for user |
| **GET** | `/api/attendance/course/:courseId` | Attendance for course | Student | - | `{totalClasses, present, absent, percentage, records[]}` | Course-specific stats |
| **POST** | `/api/notices` | Create notice | Faculty | `{title, description, courseId?}` | `{_id, title, description, ...}` | courseId=null → global |
| **GET** | `/api/notices` | Get notices | Auth | `?page=1&courseId=&keyword=` | `{total, page, pages, notices[]}` | Paginated, filterable |
| **PUT** | `/api/notices/:noticeId` | Update notice | Faculty | `{title?, description?, attachmentUrl?}` | `{message, notice}` | Soft update |
| **DELETE** | `/api/notices/:noticeId` | Delete notice (soft) | Faculty | - | `{message}` | Soft delete |
| **PUT** | `/api/notices/restore/:noticeId` | Restore notice | Faculty/Admin | - | `{message}` | Undo delete |
| **GET** | `/api/dashboard/student` | Student dashboard | Student | - | `{enrolledCourses, attendancePercentage, totalNotices, recentNotices[]}` | Stats only |
| **GET** | `/api/dashboard/faculty` | Faculty dashboard | Faculty | - | `{totalCourses, totalStudents, totalNotices, attendancePercentage}` | Stats only |
| **GET** | `/api/dashboard-stats/student` | Student dashboard stats | Student | - | `{enrolledCourses, attendancePercentage, totalNotices, recentNotices[]}` | Duplicate of above |
| **GET** | `/api/dashboard-stats/faculty` | Faculty dashboard stats | Faculty | - | `{totalCourses, totalStudents, totalNotices, attendancePercentage}` | Duplicate of above |
| **POST** | `/api/admin/create-user` | Create user | Admin | `{name, email, password, role}` | `{_id, name, email, role, ...}` | Admin only |
| **POST** | `/api/admin/assign-course` | Assign student to course | Admin | `{studentId, courseId}` | `{message}` | Bulk assign |
| **PUT** | `/api/users/:userId` | Update user | Admin | `{name?, role?}` | `{message, user}` | Admin only |
| **DELETE** | `/api/users/:userId` | Delete user (soft) | Admin | - | `{message}` | Soft delete |
| **PUT** | `/api/users/restore/:userId` | Restore user | Admin | - | `{message}` | Undo delete |
| **PUT** | `/api/users/password/:userId` | Change password | Admin | `{newPassword}` | `{message}` | Admin changes password |

---

## 4. MIDDLEWARE ANALYSIS

### Authentication Middleware (`authMiddleware.js`)

**Purpose**: Verify JWT token and authenticate requests

**Location**: Applied on protected routes

**Implementation**:
```javascript
// Checks Bearer token in Authorization header
// Format: "Bearer <token>"
// Verifies token using JWT_SECRET
// Attaches user object to req.user (without password)
// Throws 401 if token invalid or missing
```

**How It Works**:
1. Extracts token from `req.headers.authorization`
2. Splits by space: `["Bearer", "token"]`
3. Verifies token using `process.env.JWT_SECRET`
4. Decodes token to get `{id, role}`
5. Fetches full user object from database
6. Attaches to `req.user` for downstream use
7. Calls `next()` if successful, returns 401 error otherwise

### Role Authorization Middleware (`roleMiddleware.js`)

**Purpose**: Check if user has required role(s)

**Implementation**:
```javascript
// Usage: authorizeRoles("faculty", "admin")
// Checks if req.user.role matches allowed roles
// Returns 403 if unauthorized
// Calls next() if authorized
```

**Roles**: 
- `student`
- `faculty`
- `parent` (exists but not fully used)
- `admin`

**How It Works**:
1. Takes variable roles as arguments: `authorizeRoles(...roles)`
2. Returns middleware function
3. Checks if `req.user.role` exists in allowed roles array
4. Returns 403 Forbidden if role not allowed
5. Calls `next()` if role matches

---

## 5. DATABASE MODELS

### User Model
```
{
  _id: ObjectId (auto-generated)
  name: String (required)
  email: String (required, unique)
  password: String (required, bcrypt-hashed)
  role: String (enum: "student", "parent", "faculty", "admin")
  isActive: Boolean (default: true)
  parentOf: [ObjectId] (array of student IDs, parents only)
  isDeleted: Boolean (default: false, soft delete)
  deletedAt: Date (null or deletion timestamp)
  createdAt: Date (auto, timestamp)
  updatedAt: Date (auto, timestamp)
}
```

**Relationships**:
- One User (faculty) → Many Courses (via Course.faculty)
- One User (student) → Many Courses (via Course.students array)
- One User (parent) → Many Students (via parentOf array)

---

### Course Model
```
{
  _id: ObjectId (auto-generated)
  title: String (required)
  description: String (optional)
  faculty: ObjectId (reference to User, required)
  students: [ObjectId] (array of student references)
  isDeleted: Boolean (default: false, soft delete)
  deletedAt: Date (null or deletion timestamp)
  createdAt: Date (auto, timestamp)
  updatedAt: Date (auto, timestamp)
}
```

**Relationships**:
- Belongs to One User (faculty)
- Has Many Students (array reference)
- Referenced by Attendance records
- Referenced by Notices

---

### Attendance Model
```
{
  _id: ObjectId (auto-generated)
  student: ObjectId (reference to User, required)
  course: ObjectId (reference to Course, required)
  date: Date (required, attendance date)
  timeSlot: String (required, e.g., "09:00-10:00")
  status: String (enum: "present", "absent", required)
  createdAt: Date (auto, timestamp)
  updatedAt: Date (auto, timestamp)
}
```

**Constraints**:
- Unique index on `{student, course, date, timeSlot}` (no duplicates per slot)

**Relationships**:
- Belongs to One User (student)
- Belongs to One Course

---

### Notice Model
```
{
  _id: ObjectId (auto-generated)
  title: String (required)
  description: String (required)
  course: ObjectId (reference to Course, nullable)
  attachmentUrl: String (optional, file URL)
  createdBy: ObjectId (reference to User, required)
  isDeleted: Boolean (default: false, soft delete)
  deletedAt: Date (null or deletion timestamp)
  createdAt: Date (auto, timestamp)
  updatedAt: Date (auto, timestamp)
}
```

**Features**:
- `course = null` → Global notice (all users see)
- `course = ObjectId` → Course-specific notice
- Filterable by course and keyword

**Relationships**:
- Created by One User (faculty)
- Associated with One Course (optional)

---

## 6. RESPONSE FORMAT

### Standard Response Patterns

**Pattern 1: Success with Message**
```json
{
  "message": "Operation successful"
}
```

**Pattern 2: Success with Data**
```json
{
  "message": "Operation successful",
  "data": { /* object */ }
}
```

**Pattern 3: Direct Model Response**
```json
{
  "_id": "...",
  "name": "...",
  "email": "...",
  // ... model fields
}
```

**Pattern 4: List Response**
```json
[
  { /* object 1 */ },
  { /* object 2 */ }
]
```

**Pattern 5: Paginated List**
```json
{
  "total": 100,
  "page": 1,
  "pages": 4,
  "notices": [ /* array */ ]
}
```

**Pattern 6: Stats Response**
```json
{
  "totalCourses": 5,
  "totalStudents": 120,
  "totalNotices": 45,
  "attendancePercentage": 78.50
}
```

**Pattern 7: Attendance Details**
```json
{
  "totalClasses": 30,
  "present": 25,
  "absent": 5,
  "percentage": "83.33",
  "records": [ /* array of attendance */ ]
}
```

### Error Response Format
```json
{
  "message": "Error description"
}
```

**HTTP Status Codes Used**:
- `200 OK` - Successful GET
- `201 Created` - Successful POST
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication failed
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 7. AUTHENTICATION FLOW

### 1. Registration Flow

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123",
  "role": "student"
}
```

**Backend Process**:
1. Check if email already exists
2. Hash password with bcryptjs (10 salt rounds)
3. Create user in database
4. Generate JWT token with user._id and role (7-day expiry)
5. Return token (auto-login)

**Response**:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Frontend Action**:
- Store token in localStorage/sessionStorage
- Store token in memory state
- Redirect to dashboard

---

### 2. Login Flow

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "john@example.com",
  "password": "securepass123",
  "role": "student"
}
```

**Backend Process**:
1. Find user by email
2. Verify role matches
3. Compare plaintext password with hashed password using bcrypt
4. Generate JWT token (same as registration)
5. Return token, userId, and role

**Response**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "507f1f77bcf86cd799439011",
  "role": "student"
}
```

**Frontend Action**:
- Store token and userId
- Store role for conditional rendering
- Set authorization header for future requests

---

### 3. Token Storage & Usage

**Storage Option 1: localStorage** (Persistent across sessions)
```javascript
localStorage.setItem('token', token);
const storedToken = localStorage.getItem('token');
```

**Storage Option 2: sessionStorage** (Session-only)
```javascript
sessionStorage.setItem('token', token);
const storedToken = sessionStorage.getItem('token');
```

**Storage Option 3: Memory + Refresh Token** (More secure)
```javascript
let token = null; // in-memory
// Reload token from refresh endpoint on page reload
```

---

### 4. Protected Routes Implementation

**Token Format in Requests**:
```
Authorization: Bearer <token>
```

**Frontend Implementation**:
```javascript
// Set default header
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Or per-request
fetch('/api/courses/student', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

**Backend Verification**:
1. Extract token from `Authorization` header
2. Verify it starts with "Bearer "
3. Verify token signature with JWT_SECRET
4. Decode token to get user id and role
5. Fetch user from database (exclude password)
6. Attach user to req.user

---

### 5. Role-Based Access Control

**Role Hierarchy**:

| Role | Permissions |
|------|-------------|
| **Admin** | Create users, manage all courses, manage all users, view all notices |
| **Faculty** | Create courses, enroll students, mark attendance, create notices, manage own courses |
| **Student** | View enrolled courses, view attendance, view notices |
| **Parent** | (Not implemented yet) View child's courses and attendance |

**Protected Route Examples**:

```javascript
// Faculty only
POST /api/courses
GET /api/courses/faculty
POST /api/attendance/:courseId

// Admin only
POST /api/admin/create-user
GET /api/courses/deleted/all
PUT /api/users/:userId

// Student only
GET /api/courses/student
GET /api/attendance/student

// Multiple roles
PUT /api/courses/:courseId  // Faculty or Admin
```

---

### 6. Token Expiry & Refresh

**Current Implementation**:
- Token expiry: **7 days**
- No refresh token mechanism
- User must re-login after expiry

**Token Payload**:
```javascript
{
  id: "507f1f77bcf86cd799439011",
  role: "student",
  iat: 1699564800,
  exp: 1700169600  // 7 days later
}
```

**Frontend Handling**:
```javascript
// Check if token expired (optional)
try {
  jwt_decode(token);  // throws if invalid
} catch (err) {
  // Redirect to login
}
```

---

### 7. Logout Flow

**No explicit logout endpoint exists**

**Frontend Implementation**:
```javascript
// Clear token
localStorage.removeItem('token');
sessionStorage.removeItem('token');

// Clear headers
delete axios.defaults.headers.common['Authorization'];

// Redirect to login
navigate('/login');
```

---

### 8. Admin Routes

**User Management**:
- `POST /api/admin/create-user` - Create student/faculty
- `PUT /api/users/:userId` - Update user details
- `DELETE /api/users/:userId` - Soft delete user
- `PUT /api/users/restore/:userId` - Restore user
- `PUT /api/users/password/:userId` - Change user password

**Course Management**:
- `PUT /api/courses/:courseId` - Edit course
- `DELETE /api/courses/:courseId` - Soft delete course
- `PUT /api/courses/restore/:courseId` - Restore course
- `DELETE /api/courses/:courseId/student/:studentId` - Remove student
- `GET /api/courses/deleted/all` - View deleted courses

**Bulk Operations**:
- `POST /api/admin/assign-course` - Assign student to course

---

## 8. SOFT DELETE IMPLEMENTATION

### Soft Delete Pattern
Instead of permanently deleting, records are marked as deleted:

**Fields Used**:
- `isDeleted: Boolean` (default: false)
- `deletedAt: Date` (null or deletion timestamp)

**When DELETE Happens**:
```javascript
isDeleted = true;
deletedAt = new Date();
```

**When GET Happens**:
All queries filter: `isDeleted: false`

**Restoration**:
```javascript
isDeleted = false;
deletedAt = null;
```

**Affected Models**:
- User
- Course
- Notice

**Affected Models NOT included**:
- Attendance (no soft delete, hard delete only)
- Parent-child relationships (no soft delete)

---

## 9. IMPORTANT NOTES FOR FRONTEND DEVELOPMENT

### Critical Implementation Points

1. **Bearer Token Format**
   - Must include "Bearer " prefix
   - Format: `Authorization: Bearer <token>`
   - Single space between Bearer and token

2. **Role in Login**
   - Role is **required** for login (not just email/password)
   - Prevents role-hopping
   - Frontend must prompt user to select role before login

3. **Token Expiry**
   - 7 days from generation
   - No auto-refresh
   - Implement logout/re-login on 401 response

4. **Pagination for Notices**
   - Default: 30 items per page
   - Query parameters: `?page=1&courseId=...&keyword=...`
   - Response includes total count and page info

5. **CORS Configuration**
   - Currently allows all origins
   - Frontend can be on any domain/port

6. **Mongoose Populated References**
   - Some endpoints return populated objects (nested data)
   - Some return only IDs
   - Check individual endpoint documentation

7. **Bulk Operations**
   - Attendance: Multiple records in single request
   - Use `records: [{studentId, status}, ...]` format

8. **Course Enrollment**
   - Only faculty can enroll students
   - Prevents duplicate enrollment validation exists

9. **Parent Reference Field**
   - User model has `parentOf` array for parent role
   - Not fully implemented yet
   - Prepare for parent dashboard feature

10. **Attendance Unique Constraint**
    - Cannot create duplicate attendance for same student, course, date, timeslot
    - Use `findOneAndUpdate` with `upsert: true` for updates

---

## 10. RECOMMENDED FRONTEND TECH STACK

Based on backend analysis, recommended frontend stack:

**Option 1: React (Recommended)**
- React 18+ for UI
- React Router for routing
- Axios for HTTP requests
- Redux/Context for state management
- TypeScript for type safety
- TailwindCSS or Material-UI for styling

**Option 2: Vue.js**
- Vue 3 with Composition API
- Vue Router
- Axios
- Pinia for state management

**Option 3: Next.js (Full-stack)**
- Next.js 14+ (React-based)
- Built-in API routes
- Server-side rendering
- File-based routing

### Frontend Architecture Pattern

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js           // Axios instance with Bearer token
│   │   ├── authAPI.js          // Auth endpoints
│   │   ├── courseAPI.js        // Course endpoints
│   │   ├── attendanceAPI.js    // Attendance endpoints
│   │   ├── noticeAPI.js        // Notice endpoints
│   │   └── dashboardAPI.js     // Dashboard endpoints
│   ├── components/
│   │   ├── ProtectedRoute.jsx  // Token verification
│   │   ├── RoleGuard.jsx       // Role-based access
│   │   └── ...
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── FacultyDashboard.jsx
│   │   ├── Courses.jsx
│   │   ├── Attendance.jsx
│   │   ├── Notices.jsx
│   │   └── AdminPanel.jsx
│   ├── store/
│   │   ├── authSlice.js        // Auth state
│   │   ├── userSlice.js        // User state
│   │   └── ...
│   ├── utils/
│   │   ├── tokenManager.js     // Token storage/retrieval
│   │   ├── roleChecker.js      // Role checks
│   │   └── errorHandler.js     // Error handling
│   └── App.jsx
└── .env.local
```

---

## 11. FRONTEND .ENV VARIABLES

```env
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_JWT_KEY=token
```

---

## 12. QUICK START CHECKLIST FOR FRONTEND

- [ ] Create axios instance with default headers
- [ ] Implement token storage/retrieval logic
- [ ] Create Protected Route component
- [ ] Create Role Guard component
- [ ] Build Login page with role selection
- [ ] Build Register page
- [ ] Create Dashboard based on role
- [ ] Build Course management pages
- [ ] Build Attendance tracking
- [ ] Build Notice board
- [ ] Build Admin panel
- [ ] Implement error handling (401 → redirect to login)
- [ ] Implement loading states
- [ ] Add form validation
- [ ] Test all endpoints

---

Generated: March 12, 2026
Backend Version: 1.0.0
