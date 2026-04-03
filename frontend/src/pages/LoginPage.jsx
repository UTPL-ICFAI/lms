import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services'
import { useAuthStore } from '../store/authStore'
import { toast, handleApiError } from '../utils/toast'
import { Button, Input } from '../components/UI'

const DEMO_BY_ROLE = {
  admin: { email: 'admin@lms.com', password: 'admin123', hint: 'Admin demo credentials' },
  faculty: { email: '', password: '', hint: 'Use your staff email (created by Admin)' },
  student: { email: '', password: '', hint: 'Use your college email (created by Admin)' },
}

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@lms.com')
  const [password, setPassword] = useState('admin123')
  const [role, setRole] = useState('admin')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const handleRoleChange = (newRole) => {
    setRole(newRole)
    const demo = DEMO_BY_ROLE[newRole]
    if (demo.email) {
      setEmail(demo.email)
      setPassword(demo.password)
    } else {
      setEmail('')
      setPassword('')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authService.login({ email, password, role })
      login(response.data.user, response.data.token)
      toast.success('Login successful')

      if (response.data.user.role === 'admin') {
        navigate('/admin')
      } else if (response.data.user.role === 'faculty') {
        navigate('/faculty')
      } else if (response.data.user.role === 'student') {
        navigate('/student')
      }
    } catch (error) {
      handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  const demo = DEMO_BY_ROLE[role]

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-8 sm:py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">LMS</h1>
        <p className="text-center text-gray-600 text-sm sm:text-base mb-6">
          Learning Management System
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Login as</label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="input"
            >
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={role === 'faculty' ? 'staff@college.edu' : role === 'student' ? 'student@college.edu' : ''}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : 'Login'}
          </Button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          {demo.hint}
        </p>
        {(role === 'faculty' || role === 'student') && (
          <p className="text-center text-gray-500 text-xs mt-1">
            Don&apos;t have an account? Ask your admin to create one.
          </p>
        )}
      </div>
    </div>
  )
}
