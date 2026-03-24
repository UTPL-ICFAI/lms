import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input, Modal } from '../../components/UI'
import { liveClassService, courseService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { toast, handleApiError } from '../../utils/toast'

export const LiveClassesPage = () => {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', meetingLink: '', date: '', time: '' })

  const fetchClasses = async (courseId) => {
    if (!courseId) return
    const res = await liveClassService.getByCourse(courseId)
    setClasses(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const res =
          role === 'faculty'
            ? await courseService.getFacultyCourses()
            : await courseService.getStudentCourses()
        const list = res.data || []
        setCourses(list)
        if (list[0]?._id) {
          setSelectedCourseId(list[0]._id)
          await fetchClasses(list[0]._id)
        }
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [role])

  const create = async (e) => {
    e.preventDefault()
    try {
      await liveClassService.create({
        title: form.title,
        courseId: selectedCourseId,
        meetingLink: form.meetingLink,
        date: form.date,
        time: form.time,
      })
      toast.success('Live class created')
      setShowModal(false)
      setForm({ title: '', meetingLink: '', date: '', time: '' })
      await fetchClasses(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <DashboardLayout title="Live Classes">
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-600">No courses available.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
            <div className="min-w-[240px]">
              <label className="block text-sm font-semibold mb-2">Course</label>
              <select
                className="input"
                value={selectedCourseId}
                onChange={async (e) => {
                  const id = e.target.value
                  setSelectedCourseId(id)
                  await fetchClasses(id)
                }}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            {role === 'faculty' && <Button onClick={() => setShowModal(true)}>+ Schedule</Button>}
          </div>

          <Card title="Upcoming Sessions">
            {classes.length === 0 ? (
              <p className="text-gray-600">No live classes scheduled.</p>
            ) : (
              <div className="space-y-3">
                {classes.map((c) => (
                  <div key={c._id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{c.title}</div>
                      <div className="text-xs text-gray-500">{c.date} {c.time}</div>
                    </div>
                    <a
                      href={c.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Join
                    </a>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule Live Class">
            <form onSubmit={create}>
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Input label="Meeting Link" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} required />
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </Modal>
        </>
      )}
    </DashboardLayout>
  )
}

