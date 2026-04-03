import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { NotFound } from './pages/NotFound'
import { Unauthorized } from './pages/Unauthorized'
import { ProtectedRoute } from './components/ProtectedRoute'

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard'
import { UsersPage } from './pages/admin/Users'
import { CoursesPage } from './pages/admin/Courses'
import { NoticesPage } from './pages/admin/Notices'

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/Dashboard'
import { FacultyCoursesPage } from './pages/faculty/Courses'
import { FacultyAttendance } from './pages/faculty/Attendance'
import { FacultyNotices } from './pages/faculty/Notices'
import { FacultyMaterialsPage } from './pages/faculty/Materials'
import { FacultyLecturesPage } from './pages/faculty/Lectures'
import { FacultyAssignmentsPage } from './pages/faculty/Assignments'
import { FacultyDoubtsPage } from './pages/faculty/Doubts'

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard'
import { StudentCoursesPage } from './pages/student/Courses'
import { StudentAttendance } from './pages/student/Attendance'
import { StudentNotices } from './pages/student/Notices'
import { StudentMaterialsPage } from './pages/student/Materials'
import { StudentLecturesPage } from './pages/student/Lectures'
import { StudentAssignmentsPage } from './pages/student/Assignments'
import { StudentGradesPage } from './pages/student/Grades'
import { StudentForumPage } from './pages/student/Forum'
import { StudentCertificatesPage } from './pages/student/Certificates'
import { StudentAIChatPage } from './pages/student/AIChat'
import { StudentDoubtsPage } from './pages/student/Doubts'
import { LiveClassesPage } from './pages/live/LiveClasses'
import { CalendarPage } from './pages/calendar/Calendar'

export const App = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
        />

        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to={
                  user?.role === 'admin'
                    ? '/admin'
                    : user?.role === 'faculty'
                      ? '/faculty'
                      : user?.role === 'student'
                        ? '/student'
                        : '/login'
                }
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/notices" element={<NoticesPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="/faculty/*"
          element={
            <ProtectedRoute requiredRole="faculty">
              <Routes>
                <Route path="/" element={<FacultyDashboard />} />
                <Route path="/courses" element={<FacultyCoursesPage />} />
                <Route path="/attendance" element={<FacultyAttendance />} />
                <Route path="/notices" element={<FacultyNotices />} />
                <Route path="/materials" element={<FacultyMaterialsPage />} />
                <Route path="/lectures" element={<FacultyLecturesPage />} />
                <Route path="/assignments" element={<FacultyAssignmentsPage />} />
                <Route path="/doubts" element={<FacultyDoubtsPage />} />
                <Route path="/live" element={<LiveClassesPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute requiredRole="student">
              <Routes>
                <Route path="/" element={<StudentDashboard />} />
                <Route path="/courses" element={<StudentCoursesPage />} />
                <Route path="/attendance" element={<StudentAttendance />} />
                <Route path="/notices" element={<StudentNotices />} />
                <Route path="/materials" element={<StudentMaterialsPage />} />
                <Route path="/lectures" element={<StudentLecturesPage />} />
                <Route path="/assignments" element={<StudentAssignmentsPage />} />
                <Route path="/doubts" element={<StudentDoubtsPage />} />
                <Route path="/grades" element={<StudentGradesPage />} />
                <Route path="/forum" element={<StudentForumPage />} />
                <Route path="/certificates" element={<StudentCertificatesPage />} />
                <Route path="/assistant" element={<StudentAIChatPage />} />
                <Route path="/live" element={<LiveClassesPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
