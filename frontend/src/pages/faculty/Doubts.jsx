import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input, Modal } from '../../components/UI'
import { courseService, doubtService } from '../../services'
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

export const FacultyDoubtsPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [doubts, setDoubts] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')

  const [showModal, setShowModal] = useState(false)
  const [activeDoubt, setActiveDoubt] = useState(null)
  const [response, setResponse] = useState('')
  const [updating, setUpdating] = useState(false)
  const socketRef = useRef(null)
  const joinedCourseRef = useRef(null)

  const fetchDoubts = async (courseId) => {
    if (!courseId) return
    const res = await doubtService.getByCourse(courseId)
    setDoubts(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getFacultyCourses()
        const list = c.data || []
        setCourses(list)
        if (list[0]?._id) {
          setSelectedCourseId(list[0]._id)
          await fetchDoubts(list[0]._id)
        }
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const s = createSocket()
    socketRef.current = s

    const refresh = () => {
      if (selectedCourseId) fetchDoubts(selectedCourseId).catch(() => {})
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId])

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

  const visible = useMemo(() => {
    if (statusFilter === 'All') return doubts
    return doubts.filter((d) => d.status === statusFilter)
  }, [doubts, statusFilter])

  const openReply = (d) => {
    setActiveDoubt(d)
    setResponse(d.response || '')
    setShowModal(true)
  }

  const saveReply = async (markResolved) => {
    try {
      setUpdating(true)
      await doubtService.respond(activeDoubt._id, response)
      if (markResolved) {
        await doubtService.updateStatus(activeDoubt._id, 'Resolved')
      } else if (activeDoubt.status !== 'Pending') {
        await doubtService.updateStatus(activeDoubt._id, 'Pending')
      }
      toast.success('Updated')
      setShowModal(false)
      setActiveDoubt(null)
      setResponse('')
      await fetchDoubts(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    } finally {
      setUpdating(false)
    }
  }

  const setStatusOnly = async (doubtId, status) => {
    try {
      await doubtService.updateStatus(doubtId, status)
      toast.success(`Marked ${status}`)
      await fetchDoubts(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <DashboardLayout title="Student Doubts">
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-600">No assigned courses found.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-end justify-between">
            <div className="min-w-[240px]">
              <label className="block text-sm font-semibold mb-2">Course</label>
              <select
                className="input"
                value={selectedCourseId}
                onChange={async (e) => {
                  const id = e.target.value
                  setSelectedCourseId(id)
                  await fetchDoubts(id)
                }}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[200px]">
              <label className="block text-sm font-semibold mb-2">Filter</label>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          <Card title="Doubts">
            {visible.length === 0 ? (
              <p className="text-gray-600">No doubts found.</p>
            ) : (
              <div className="space-y-3">
                {visible.map((d) => (
                  <div key={d._id} className="border rounded-lg p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{d.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Student: {d.studentId?.name || d.studentId?.email || d.studentId?._id || '—'} •{' '}
                          {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
                        </p>
                      </div>
                      <StatusBadge status={d.status || 'Pending'} />
                    </div>

                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{d.description}</p>

                    {d.response ? (
                      <div className="mt-3 p-3 rounded bg-gray-50 border">
                        <p className="text-sm font-semibold">Response</p>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{d.response}</p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => openReply(d)}>
                        Reply
                      </Button>
                      {d.status !== 'Resolved' ? (
                        <Button size="sm" variant="success" onClick={() => setStatusOnly(d._id, 'Resolved')}>
                          Mark Resolved
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setStatusOnly(d._id, 'Pending')}>
                          Keep Pending
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setActiveDoubt(null)
              setResponse('')
            }}
            title="Reply to Doubt"
          >
            {!activeDoubt ? null : (
              <div className="space-y-3">
                <div className="border rounded p-3 bg-gray-50">
                  <p className="font-semibold">{activeDoubt.title}</p>
                  <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{activeDoubt.description}</p>
                </div>

                <Input
                  label="Response"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your reply..."
                />

                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => saveReply(false)} disabled={updating}>
                    {updating ? 'Saving...' : 'Save Reply'}
                  </Button>
                  <Button variant="success" onClick={() => saveReply(true)} disabled={updating}>
                    {updating ? 'Saving...' : 'Save & Resolve'}
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      )}
    </DashboardLayout>
  )
}

