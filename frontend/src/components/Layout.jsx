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
  HelpCircle,
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
    { label: 'Doubts', path: '/faculty/doubts', icon: HelpCircle },
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
    { label: 'Doubts', path: '/student/doubts', icon: HelpCircle },
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
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 h-[100dvh] w-[min(100vw,16rem)] max-w-[85vw] bg-gray-900 text-white shadow-xl transition-transform duration-200 ease-out md:static md:z-auto md:w-64 md:max-w-none md:shadow-none md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6 flex items-center justify-between gap-2 border-b border-gray-800 md:border-0">
          <h1 className="text-xl sm:text-2xl font-bold">LMS</h1>
          <button
            type="button"
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-800"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="space-y-1 px-3 pb-6 overflow-y-auto max-h-[calc(100dvh-5rem)] md:max-h-none">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg min-h-[48px] ${
                  isActive
                    ? 'bg-blue-600'
                    : 'hover:bg-gray-800'
                }`}
                onClick={onClose}
              >
                <Icon size={20} className="shrink-0" />
                <span className="text-sm sm:text-base leading-snug">{item.label}</span>
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
      <nav className="bg-white shadow-md sticky top-0 z-30">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 min-h-[56px]">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <span className="md:hidden font-bold text-gray-800 truncate flex-1 min-w-0 text-sm sm:text-base">
            LMS
          </span>

          <div className="hidden md:block flex-1 min-w-0" />

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                aria-label="Notifications"
                aria-expanded={open}
              >
                <Bell size={20} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] leading-none rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {open && (
                <div className="fixed inset-x-3 top-[56px] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b font-semibold text-sm sm:text-base">Notifications</div>
                  <div className="max-h-[min(70vh,20rem)] overflow-y-auto overscroll-contain">
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
            <div className="text-right hidden xs:block min-w-0 max-w-[140px] sm:max-w-[200px]">
              <p className="font-semibold text-gray-800 text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Log out"
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
    <div className="flex min-h-screen min-w-0 bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden overflow-y-auto w-full max-w-[1600px] mx-auto">
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 break-words">
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
    </div>
  )
}

export const AdminLayout = DashboardLayout
