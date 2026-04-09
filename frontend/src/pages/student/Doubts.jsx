import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input } from '../../components/UI'
import { courseService, doubtService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { handleApiError, toast } from '../../utils/toast'
import { createSocket } from '../../utils/socket'

const StatusBadge = ({ status }) => {
  const isResolved = status === 'Resolved'
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${
        isResolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {status}
    </span>
  )
}

export const StudentDoubtsPage = () => {
  const user = useAuthStore((s) => s.user)
  const studentId = user?.id || user?._id

  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [doubts, setDoubts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const socketRef = useRef(null)
  const joinedCourseRef = useRef(null)

  const fetchMyDoubts = async () => {
    if (!studentId) return
    const res = await doubtService.getByStudent(studentId)
    setDoubts(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getStudentCourses()
        const list = c.data || []
        setCourses(list)
        if (list[0]?._id) setSelectedCourseId(list[0]._id)
        await fetchMyDoubts()
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [studentId])

  useEffect(() => {
    // Connect socket for realtime updates
    const s = createSocket()
    socketRef.current = s

    const refresh = () => fetchMyDoubts().catch(() => {})
    s.on('doubt:created', refresh)
    s.on('doubt:responded', refresh)
    s.on('doubt:status', refresh)
    s.on('doubt:deleted', refresh)

    return () => {
      try {
        s.disconnect()
      } catch {
        // ignore
      }
    }
  }, [studentId])

  useEffect(() => {
    const s = socketRef.current
    if (!s) return
    if (joinedCourseRef.current && joinedCourseRef.current !== selectedCourseId) {
      s.emit('leaveCourse', joinedCourseRef.current)
    }
    if (selectedCourseId) {
      s.emit('joinCourse', selectedCourseId)
      joinedCourseRef.current = selectedCourseId
    }
  }, [selectedCourseId])

  const visibleDoubts = useMemo(() => {
    if (!selectedCourseId) return doubts
    return doubts.filter((d) => (d.courseId?._id || d.courseId) === selectedCourseId)
  }, [doubts, selectedCourseId])

  const submit = async (e) => {
    e.preventDefault()
    if (!selectedCourseId) return toast.error('Select a course')

    try {
      setSubmitting(true)
      await doubtService.create({
        title: form.title,
        description: form.description,
        courseId: selectedCourseId,
      })
      toast.success('Doubt posted')
      setForm({ title: '', description: '' })
      await fetchMyDoubts()
    } catch (err) {
      handleApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (doubt) => {
    if (!window.confirm('Delete this doubt?')) return
    try {
      await doubtService.remove(doubt._id)
      toast.success('Deleted')
      await fetchMyDoubts()
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <DashboardLayout title="Doubts">
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-600">Enroll in a course to post doubts.</p>
      ) : (
        <div className="space-y-6">
          <Card title="Raise a doubt">
            <div className="mb-4 max-w-md">
              <label className="block text-sm font-semibold mb-2">Course</label>
              <select
                className="input"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={submit}>
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  className="input min-h-28"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Doubt'}
              </Button>
            </form>
          </Card>

          <Card title="My doubts">
            {visibleDoubts.length === 0 ? (
              <p className="text-gray-600">No doubts yet for this course.</p>
            ) : (
              <div className="space-y-3">
                {visibleDoubts.map((d) => (
                  <div
                    key={d._id}
                    className="border rounded-lg p-4 hover:shadow-sm transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{d.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {d.courseId?.title ? `Course: ${d.courseId.title} • ` : ''}
                          {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
                        </p>
                      </div>
                      <StatusBadge status={d.status || 'Pending'} />
                    </div>
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                      {d.description}
                    </p>

                    <div className="mt-3 p-3 rounded bg-gray-50 border">
                      <p className="text-sm font-semibold">Faculty response</p>
                      {d.response ? (
                        <>
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{d.response}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {d.respondedAt ? `Replied: ${new Date(d.respondedAt).toLocaleString()}` : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600 mt-1">No response yet.</p>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={(d.status || 'Pending') !== 'Pending'}
                        onClick={() => remove(d)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

