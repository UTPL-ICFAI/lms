import {
  Menu,
  X,
  LogOut,
  Home,
  Users,
  BookOpen,
  Bell,
  BarChart3,
  FileText,
  Video,
  ClipboardList,
  GraduationCap,
  MessageSquare,
  Calendar,
  Bot,
  Award,
  VideoIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'
import { notificationService } from '../services'

const menuItems = {
  admin: [
    { label: 'Dashboard', path: '/admin', icon: Home },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Courses', path: '/admin/courses', icon: BookOpen },
    { label: 'Notices', path: '/admin/notices', icon: Bell },
  ],
  faculty: [
    { label: 'Dashboard', path: '/faculty', icon: Home },
    { label: 'My Courses', path: '/faculty/courses', icon: BookOpen },
    { label: 'Attendance', path: '/faculty/attendance', icon: BarChart3 },
    { label: 'Notices', path: '/faculty/notices', icon: Bell },
    { label: 'Materials', path: '/faculty/materials', icon: FileText },
    { label: 'Lectures', path: '/faculty/lectures', icon: Video },
    { label: 'Assignments', path: '/faculty/assignments', icon: ClipboardList },
    { label: 'Live Classes', path: '/faculty/live', icon: VideoIcon },
    { label: 'Calendar', path: '/faculty/calendar', icon: Calendar },
  ],
  student: [
    { label: 'Dashboard', path: '/student', icon: Home },
    { label: 'My Courses', path: '/student/courses', icon: BookOpen },
    { label: 'Attendance', path: '/student/attendance', icon: BarChart3 },
    { label: 'Notices', path: '/student/notices', icon: Bell },
    { label: 'Materials', path: '/student/materials', icon: FileText },
    { label: 'Lectures', path: '/student/lectures', icon: Video },
    { label: 'Assignments', path: '/student/assignments', icon: ClipboardList },
    { label: 'Grades', path: '/student/grades', icon: GraduationCap },
    { label: 'Forum', path: '/student/forum', icon: MessageSquare },
    { label: 'AI Assistant', path: '/student/assistant', icon: Bot },
    { label: 'Certificates', path: '/student/certificates', icon: Award },
    { label: 'Live Classes', path: '/student/live', icon: VideoIcon },
    { label: 'Calendar', path: '/student/calendar', icon: Calendar },
  ],
}

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const items = menuItems[user?.role] || []
  const location = useLocation()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white transition-transform md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">LMS</h1>
        </div>

        <nav className="space-y-2 px-4">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600'
                    : 'hover:bg-gray-800'
                }`}
                onClick={onClose}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export const Navbar = ({ sidebarOpen, onToggleSidebar }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await notificationService.getMyNotifications()
        setNotifications(res.data || [])
      } catch {
        // ignore navbar fetch errors
      }
    }
    fetch()
    const t = setInterval(fetch, 20000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5">
                    {unreadCount}
                  </span>
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b font-semibold">Notifications</div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="p-3 text-sm text-gray-600">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          type="button"
                          className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
                            n.read ? 'opacity-70' : ''
                          }`}
                          onClick={async () => {
                            setOpen(false)
                            if (!n.read) {
                              try {
                                await notificationService.markRead(n._id)
                                setNotifications((prev) =>
                                  prev.map((x) => (x._id === n._id ? { ...x, read: true } : x))
                                )
                              } catch {
                                // ignore
                              }
                            }
                          }}
                        >
                          <div className="text-sm font-medium">{n.message}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}

// Single layout for Admin, Faculty, and Student (sidebar shows role-based menu)
export const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-6 overflow-auto">
          {title && <h1 className="text-3xl font-bold mb-6">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  )
}

export const AdminLayout = DashboardLayout
