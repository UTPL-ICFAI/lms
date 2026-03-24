import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, BarChart3, Bell } from 'lucide-react'
import { DashboardLayout } from '../../components/Layout'
import { StatCard, Card } from '../../components/UI'
import { dashboardService, courseService } from '../../services'
import { handleApiError } from '../../utils/toast'

export const StudentDashboard = () => {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    attendancePercentage: 0,
    totalNotices: 0,
  })
  const [courses, setCourses] = useState([])
  const [recentNotices, setRecentNotices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          dashboardService.getStudentDashboard(),
          courseService.getStudentCourses(),
        ])
        setStats({
          enrolledCourses: statsRes.data.enrolledCourses ?? 0,
          attendancePercentage: statsRes.data.attendancePercentage ?? 0,
          totalNotices: statsRes.data.totalNotices ?? 0,
        })
        setCourses(coursesRes.data || [])
        setRecentNotices(statsRes.data.recentNotices || [])
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <DashboardLayout title="Student Dashboard">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Enrolled Courses"
              value={stats.enrolledCourses}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              title="Attendance %"
              value={stats.attendancePercentage}
              icon={BarChart3}
              color="green"
            />
            <StatCard title="Notices" value={stats.totalNotices} icon={Bell} color="yellow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="My Courses">
              <div className="grid grid-cols-1 gap-3">
                {courses.length === 0 ? (
                  <p className="text-gray-600">Not enrolled in any course yet.</p>
                ) : (
                  courses.slice(0, 5).map((course) => (
                    <Link
                      key={course._id}
                      to="/student/courses"
                      className="block p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-gray-600">{course.description || '—'}</p>
                    </Link>
                  ))
                )}
                {courses.length > 5 && (
                  <Link to="/student/courses" className="text-blue-600 text-sm">
                    View all courses →
                  </Link>
                )}
              </div>
            </Card>
            <Card title="Recent Notices">
              {recentNotices.length === 0 ? (
                <p className="text-gray-600">No notices yet.</p>
              ) : (
                <ul className="space-y-2">
                  {recentNotices.map((n) => (
                    <li key={n._id} className="text-sm">
                      <span className="font-medium">{n.title}</span>
                      <span className="text-gray-500 ml-2">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/student/notices" className="text-blue-600 text-sm mt-2 inline-block">
                View all notices →
              </Link>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
