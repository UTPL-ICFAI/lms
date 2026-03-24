import { useNavigate } from 'react-router-dom'
import { Button } from '../components/UI'

export const Unauthorized = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">403</h1>
        <p className="text-xl text-gray-600 mt-2">Unauthorized Access</p>
        <p className="text-gray-500 mt-1">You don't have permission to access this page</p>
        <Button onClick={() => navigate('/')} className="mt-6">
          Go to Home
        </Button>
      </div>
    </div>
  )
}
