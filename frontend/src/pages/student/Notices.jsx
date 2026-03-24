import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card } from '../../components/UI'
import { noticeService, courseService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { handleApiError } from '../../utils/toast'

export const StudentNotices = () => {
  const [notices, setNotices] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((state) => state.user)
  const userId = user?.id || user?._id

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, noticesRes] = await Promise.all([
          courseService.getStudentCourses(),
          noticeService.getAllNotices({ role: 'student' }),
        ])
        const enrolledCourses = coursesRes.data || []
        setCourses(enrolledCourses)

        const list = noticesRes.data?.notices || noticesRes.data || []
        setNotices(list.filter((n) => !n.isDeleted).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  const getCourseName = (courseId) => {
    if (!courseId) return 'General'
    const course = courses.find((c) => c._id === courseId)
    return course?.title || 'Course'
  }

  return (
    <DashboardLayout title="Notices">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {notices.length === 0 ? (
            <p className="text-gray-600">No notices yet</p>
          ) : (
            notices.map((notice) => (
              <Card key={notice._id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{notice.title}</h3>
                    <p className="text-sm text-blue-600 mt-1">
                      {getCourseName(notice.course)}
                    </p>
                    <p className="text-gray-600 mt-2">{notice.description}</p>
                    {notice.attachmentUrl && (
                      <a
                        href={notice.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline mt-2 inline-block"
                      >
                        View Attachment
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
