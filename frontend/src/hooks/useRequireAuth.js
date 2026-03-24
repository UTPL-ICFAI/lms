import { useNavigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export const useRequireAuth = (requiredRole = null) => {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    navigate('/login')
    return false
  }

  if (requiredRole && user?.role !== requiredRole) {
    navigate('/unauthorized')
    return false
  }

  return true
}
