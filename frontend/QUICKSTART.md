# LMS Frontend - Quick Start Guide

Get your React frontend running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Backend server running on port 8000
- MongoDB database running

## Setup Steps

### Step 1: Navigate to Frontend Directory
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```
Takes ~2-3 minutes depending on internet speed.

### Step 3: Verify Backend Connection
```bash
# Check if backend is running
curl http://localhost:8000/api/auth/login
# Should return an error, not a connection refused error
```

### Step 4: Start Development Server
```bash
npm run dev
```

You should see:
```
  VITE v5.2.0  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### Step 5: Open Browser
Navigate to `http://localhost:3000`

You should see the **LMS Login Page**

## Demo Login Credentials

### Admin (Full System Access)
```
Email:    admin@lms.com
Password: admin123
Role:     Admin
```

### Faculty (Course Management)
```
Email:    faculty@lms.com
Password: faculty123
Role:     Faculty
```

### Student (Course Access)
```
Email:    student@lms.com
Password: student123
Role:     Student
```

## What You Can Do

### As Admin
1. ✅ View system dashboard with statistics
2. ✅ Create/Edit/Delete users
3. ✅ Create/Edit/Delete courses
4. ✅ Create/Edit/Delete notices
5. ✅ View all system activity

### As Faculty
1. ✅ View your assigned courses
2. ✅ Mark student attendance
3. ✅ Create and publish notices
4. ✅ View enrolled students

### As Student
1. ✅ View enrolled courses
2. ✅ Check your attendance
3. ✅ Read course notices
4. ✅ View course materials

## Troubleshooting

### "Cannot find module" error
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API connection errors
```bash
# Check backend is running
# Backend should be on http://localhost:8000
# Edit .env if different
cat .env
# Should show: VITE_API_URL=http://localhost:8000/api
```

### Port 3000 already in use
```bash
# Kill process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# On Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

### Login fails
1. Check backend is running
2. Check email/password are correct
3. Open browser DevTools (F12)
4. Go to Network tab
5. Try login again
6. Check the API response for error message

## File Structure Quick Reference

```
frontend/
├── src/
│   ├── components/         # UI components
│   ├── pages/             # Page components (login, dashboard, etc)
│   ├── services/          # API integration
│   ├── store/             # Zustand state management
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utility functions
│   ├── App.jsx            # Main router
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/
│   └── index.html         # HTML template
├── .env                   # Environment variables
├── package.json           # Dependencies
└── vite.config.js         # Build config
```

## Key Files to Know

- **`src/App.jsx`** - Main router with all routes
- **`src/components/Layout.jsx`** - Navigation sidebar and navbar
- **`src/services/index.js`** - All API endpoints
- **`src/store/authStore.js`** - Authentication state
- **`.env`** - Backend API URL configuration

## Commands Reference

```bash
# Development
npm run dev           # Start dev server (port 3000)

# Production
npm run build         # Build for production
npm run preview       # Preview production build

# Debugging
ctrl+shift+I          # Open browser DevTools
ctrl+shift+J          # Open browser console
F12                   # Toggle DevTools
```

## Next Steps

1. **Explore the Admin Dashboard**
   - See system statistics
   - Create a new user
   - Create a new course

2. **Try Faculty Features**
   - Login as faculty
   - Mark attendance for a student
   - Create a notice

3. **Check Student View**
   - Login as student
   - View enrolled courses
   - Check attendance records

4. **Read Documentation**
   - See `README.md` for detailed docs
   - See `IMPLEMENTATION_GUIDE.md` for architecture
   - See `COMPLETE_FILES_SUMMARY.md` for all files

## Getting Help

### Common Issues

**Issue:** "VITE_API_URL is not defined"
- Solution: Create `.env` file with `VITE_API_URL=http://localhost:8000/api`

**Issue:** "Cannot POST localhost:8000/api/auth/login"
- Solution: Ensure backend is running on port 8000

**Issue:** "JWT malformed" or "Token expired"
- Solution: Clear localStorage and login again
- DevTools > Application > localStorage > Clear domain data

**Issue:** Blank page after login
- Solution: Check browser console (F12) for JavaScript errors

### Debug Mode

Open browser DevTools (F12):

1. **Console Tab**: See errors and logs
2. **Network Tab**: See API requests and responses
3. **Application Tab**: 
   - Check localStorage for `auth-store`
   - Verify token is stored

### Check Backend Connection

```bash
# Open browser console and run:
fetch('http://localhost:8000/api/auth/login')
  .then(r => console.log('Backend connected'))
  .catch(e => console.log('Backend error:', e))
```

## Deployment Preparation

When ready to deploy:

1. **Update API URL**
   ```bash
   # Edit .env
   VITE_API_URL=https://your-production-api.com/api
   ```

2. **Build Production**
   ```bash
   npm run build
   # Creates optimized build in dist/ folder
   ```

3. **Deploy**
   - Upload `dist/` folder to hosting service
   - Configure web server to serve `dist/index.html` on all routes

## Popular Hosting Services

- **Vercel** - Optimized for Vite/React
- **Netlify** - Simple Git deployment
- **GitHub Pages** - Free static hosting
- **AWS S3 + CloudFront** - Professional hosting

## Have Questions?

1. Check browser console for error messages
2. Review backend API documentation
3. Check network tab to see API responses
4. Read the implementation guide
5. Check backend server logs

---

**You're all set! Happy coding! 🚀**
