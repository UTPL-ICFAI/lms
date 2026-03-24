import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message) => sonnerToast.success(message),
  error: (message) => sonnerToast.error(message),
  info: (message) => sonnerToast.info(message),
  loading: (message) => sonnerToast.loading(message),
}

export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  return error?.message || 'An error occurred'
}

export const handleApiError = (error) => {
  const message = getErrorMessage(error)
  toast.error(message)
  return message
}
