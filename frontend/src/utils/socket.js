import { io } from 'socket.io-client'

function getSocketBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  // Strip trailing /api to get server base URL.
  return apiUrl.replace(/\/api\/?$/, '')
}

export function createSocket() {
  const token = localStorage.getItem('token')
  const baseUrl = getSocketBaseUrl()

  return io(baseUrl, {
    transports: ['websocket'],
    auth: { token },
  })
}

