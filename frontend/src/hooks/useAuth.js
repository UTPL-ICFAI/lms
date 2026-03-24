import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const isAuthenticated = !!token

  const isAdmin = user?.role === 'admin'
  const isFaculty = user?.role === 'faculty'
  const isStudent = user?.role === 'student'

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isFaculty,
    isStudent,
  }
}
