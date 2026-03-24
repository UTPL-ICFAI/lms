import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Users, Bell, BarChart3 } from 'lucide-react'
import { DashboardLayout } from '../../components/Layout'
import { StatCard, Card } from '../../components/UI'
import { dashboardService, courseService } from '../../services'
import { handleApiError } from '../../utils/toast'

export const FacultyDashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalNotices: 0,
    attendancePercentage: 0,
  })
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          dashboardService.getFacultyDashboard(),
          courseService.getFacultyCourses(),
        ])
        setStats({
          totalCourses: statsRes.data.totalCourses ?? 0,
          totalStudents: statsRes.data.totalStudents ?? 0,
          totalNotices: statsRes.data.totalNotices ?? 0,
          attendancePercentage: statsRes.data.attendancePercentage ?? 0,
        })
        setCourses(coursesRes.data || [])
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <DashboardLayout title="Faculty Dashboard">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="My Courses" value={stats.totalCourses} icon={BookOpen} color="blue" />
            <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="green" />
            <StatCard title="Notices" value={stats.totalNotices} icon={Bell} color="yellow" />
            <StatCard
              title="Attendance %"
              value={stats.attendancePercentage}
              icon={BarChart3}
              color="blue"
            />
          </div>

          <Card title="My Courses">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.length === 0 ? (
                <p className="text-gray-600">No courses assigned yet.</p>
              ) : (
                courses.map((course) => (
                  <Link
                    key={course._id}
                    to="/faculty/courses"
                    className="block p-4 border rounded-lg hover:shadow-md transition"
                  >
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-gray-600">{course.description || '—'}</p>
                    <p className="text-sm mt-2 text-blue-600">
                      {course.students?.length || 0} students
                    </p>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  )
}
