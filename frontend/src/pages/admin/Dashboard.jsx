import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, BookOpen, Bell } from 'lucide-react'
import { AdminLayout } from '../../components/Layout'
import { StatCard, Card } from '../../components/UI'
import { dashboardService } from '../../services'
import { handleApiError, toast } from '../../utils/toast'

export const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    users: 0,
    students: 0,
    faculty: 0,
    courses: 0,
    notices: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getAdminDashboard()
        setStats({
          users: res.data.users,
          students: res.data.students,
          faculty: res.data.faculty,
          courses: res.data.courses,
          notices: res.data.notices,
        })
      } catch (error) {
        handleApiError(error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <AdminLayout title="Admin Dashboard">
      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              title="Total Users"
              value={stats.users}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Total Students"
              value={stats.students}
              icon={Users}
              color="green"
            />
            <StatCard
              title="Total Faculty"
              value={stats.faculty}
              icon={Users}
              color="yellow"
            />
            <StatCard
              title="Total Courses"
              value={stats.courses}
              icon={BookOpen}
              color="blue"
            />
            <StatCard
              title="Total Notices"
              value={stats.notices}
              icon={Bell}
              color="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Quick Actions">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition"
                >
                  → Create New User
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/courses')}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition"
                >
                  → Manage Courses
                </button>
                <button
                  type="button"
                  onClick={() => toast.info('Reports coming soon')}
                  className="w-full text-left p-3 hover:bg-gray-100 rounded-lg transition"
                >
                  → View Reports
                </button>
              </div>
            </Card>

            <Card title="System Status">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Database Connection</span>
                  <span className="text-green-600 font-semibold">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>API Server</span>
                  <span className="text-green-600 font-semibold">Running</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
