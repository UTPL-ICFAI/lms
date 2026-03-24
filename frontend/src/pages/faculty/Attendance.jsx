import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button } from '../../components/UI'
import { courseService, attendanceService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { toast, handleApiError } from '../../utils/toast'

export const FacultyAttendance = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [courseDetail, setCourseDetail] = useState(null)
  const [statusByStudent, setStatusByStudent] = useState({})
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [timeSlot, setTimeSlot] = useState('09:00-10:00')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const user = useAuthStore((state) => state.user)
  const userId = user?.id || user?._id

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await courseService.getFacultyCourses()
        const list = res.data || []
        setCourses(list)
        if (list.length > 0 && !selectedCourseId) setSelectedCourseId(list[0]._id)
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [userId])

  useEffect(() => {
    if (!selectedCourseId) return
    const fetch = async () => {
      try {
        const res = await courseService.getCourse(selectedCourseId)
        setCourseDetail(res.data)
        const students = res.data?.students || []
        const initial = {}
        students.forEach((s) => {
          initial[s._id] = statusByStudent[s._id] ?? 'present'
        })
        setStatusByStudent(initial)
      } catch (err) {
        handleApiError(err)
        setCourseDetail(null)
      }
    }
    fetch()
  }, [selectedCourseId])

  const handleStatusChange = (studentId, status) => {
    setStatusByStudent((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleSubmit = async () => {
    if (!selectedCourseId || !courseDetail?.students?.length) return
    setSubmitting(true)
    try {
      const records = courseDetail.students.map((s) => ({
        studentId: s._id,
        status: statusByStudent[s._id] || 'present',
      }))
      await attendanceService.markAttendance(selectedCourseId, {
        date,
        timeSlot,
        records,
      })
      toast.success('Attendance saved successfully')
    } catch (err) {
      handleApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const students = courseDetail?.students || []

  return (
    <DashboardLayout title="Mark Attendance">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title="Select Course">
              <div className="space-y-2">
                {courses.map((course) => (
                  <button
                    key={course._id}
                    type="button"
                    onClick={() => setSelectedCourseId(course._id)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedCourseId === course._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {course.title}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Mark attendance">
              <div className="mb-4 flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Time slot</label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    placeholder="09:00-10:00"
                    className="input"
                  />
                </div>
              </div>
              {students.length === 0 ? (
                <p className="text-gray-600">No students enrolled in this course.</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {students.map((s) => (
                      <div
                        key={s._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <span>{s.name || s.email}</span>
                        <select
                          value={statusByStudent[s._id] || 'present'}
                          onChange={(e) => handleStatusChange(s._id, e.target.value)}
                          className="input w-auto"
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
