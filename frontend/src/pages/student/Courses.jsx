import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button } from '../../components/UI'
import { courseService, paymentService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { toast, handleApiError } from '../../utils/toast'

export const StudentCoursesPage = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [availableCourses, setAvailableCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrollingId, setEnrollingId] = useState(null)
  const user = useAuthStore((state) => state.user)
  const userId = user?.id || user?._id
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const paymentStatus = searchParams.get('payment')
  const paymentCourseId = searchParams.get('courseId')

  useEffect(() => {
    const refreshCourses = async () => {
      try {
        const [enrolledRes, activeRes] = await Promise.all([
          courseService.getStudentCourses(),
          courseService.getActiveCourses(),
        ])
        const enrolled = enrolledRes.data || []
        const active = activeRes.data || []
        const enrolledIds = new Set(enrolled.map((c) => c._id))
        setEnrolledCourses(enrolled)
        setAvailableCourses(active.filter((c) => !enrolledIds.has(c._id)))
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }

    refreshCourses()
  }, [userId])

  useEffect(() => {
    if (!paymentStatus) return

    if (paymentStatus === 'cancel') {
      toast.error('Payment cancelled.')
      return
    }

    if (paymentStatus === 'success' && paymentCourseId) {
      // Stripe webhook can take a moment; poll until enrollment appears.
      let attempts = 0
      const maxAttempts = 8

      const interval = setInterval(async () => {
        attempts += 1
        try {
          const [enrolledRes, activeRes] = await Promise.all([
            courseService.getStudentCourses(),
            courseService.getActiveCourses(),
          ])

          const enrolled = enrolledRes.data || []
          const active = activeRes.data || []
          const enrolledIds = new Set(enrolled.map((c) => c._id))

          setEnrolledCourses(enrolled)
          setAvailableCourses(active.filter((c) => !enrolledIds.has(c._id)))

          const isEnrolled = enrolled.some((c) => c._id === paymentCourseId)

          if (isEnrolled) {
            clearInterval(interval)
            toast.success('Payment successful. You are now enrolled!')
            return
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval)
            toast.info('Payment successful. Enrollment may appear shortly.')
          }
        } catch (err) {
          clearInterval(interval)
          handleApiError(err)
        }
      }, 2500)

      return () => clearInterval(interval)
    }
  }, [paymentStatus, paymentCourseId, userId])

  const handleEnroll = async (courseId) => {
    try {
      setEnrollingId(courseId)
      const course = availableCourses.find((c) => c._id === courseId)
      const priceInr = Number(course?.price || 0)

      if (priceInr > 0) {
        const res = await paymentService.checkoutSession(courseId)
        // Backend returns { url } for Stripe Checkout.
        window.location.href = res.data.url
        return
      }

      await courseService.selfEnroll(courseId)
      toast.success('Enrolled successfully')

      setAvailableCourses((prev) => prev.filter((c) => c._id !== courseId))
      const enrolledCourse = availableCourses.find((c) => c._id === courseId)
      if (enrolledCourse) setEnrolledCourses((prev) => [...prev, enrolledCourse])
    } catch (err) {
      handleApiError(err)
    } finally {
      setEnrollingId(null)
    }
  }

  return (
    <DashboardLayout title="My Courses">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4">My Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.length === 0 ? (
                <p className="text-gray-600 col-span-full">
                  You are not enrolled in any course yet.
                </p>
              ) : (
                enrolledCourses.map((course) => (
                  <Card key={course._id}>
                    <h3 className="font-bold text-lg">{course.title}</h3>
                    <p className="text-gray-600 text-sm mt-2">
                      {course.description || '—'}
                    </p>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4">Available Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableCourses.length === 0 ? (
                <p className="text-gray-600 col-span-full">
                  No other courses are currently available.
                </p>
              ) : (
                availableCourses.map((course) => (
                  <Card key={course._id}>
                    <h3 className="font-bold text-lg">{course.title}</h3>
                    <p className="text-gray-600 text-sm mt-2">
                      {course.description || '—'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {Number(course.price || 0) > 0 ? `Price: ₹${course.price}` : 'Free'}
                    </p>
                    {course.faculty && (
                      <p className="text-sm text-gray-500 mt-1">
                        Instructor:{' '}
                        {course.faculty.name || course.faculty.email}
                      </p>
                    )}
                    <Button
                      className="w-full mt-4"
                      disabled={enrollingId === course._id}
                      onClick={() => handleEnroll(course._id)}
                    >
                      {enrollingId === course._id
                        ? 'Processing...'
                        : Number(course.price || 0) > 0
                          ? 'Pay & Enroll'
                          : 'Enroll'}
                    </Button>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
