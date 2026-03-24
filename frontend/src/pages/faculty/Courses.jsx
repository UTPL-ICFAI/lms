import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button } from '../../components/UI'
import { courseService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { handleApiError } from '../../utils/toast'

export const FacultyCoursesPage = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const user = useAuthStore((state) => state.user)
  const userId = user?.id || user?._id

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await courseService.getFacultyCourses()
        setCourses(res.data || [])
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [userId])

  return (
    <DashboardLayout title="My Courses">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.length === 0 ? (
            <p className="text-gray-600 col-span-full">No courses assigned yet.</p>
          ) : (
            courses.map((course) => (
              <Card key={course._id}>
                <h3 className="font-bold text-lg">{course.title}</h3>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{course.description || '—'}</p>
                <p className="text-sm text-blue-600 mt-2">
                  {course.students?.length || 0} students enrolled
                </p>
                <div className="mt-4 flex gap-2">
                  <Link to={`/faculty/attendance?course=${course._id}`}>
                    <Button variant="secondary" size="sm">Mark Attendance</Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
