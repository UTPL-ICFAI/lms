import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input, Modal, Table } from '../../components/UI'
import { calendarService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { toast, handleApiError } from '../../utils/toast'

export const CalendarPage = () => {
  const user = useAuthStore((s) => s.user)
  const userId = user?.id || user?._id
  const role = user?.role
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ courses: [], events: [] })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ courseId: '', title: '', date: '', time: '', type: 'other' })

  const fetchAll = async () => {
    const res = await calendarService.getForUser(userId)
    setData(res.data || { courses: [], events: [] })
    const first = res.data?.courses?.[0]?._id
    if (first && !form.courseId) setForm((p) => ({ ...p, courseId: first }))
  }

  useEffect(() => {
    const run = async () => {
      try {
        await fetchAll()
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    if (userId) run()
  }, [userId])

  const create = async (e) => {
    e.preventDefault()
    try {
      await calendarService.create({
        courseId: form.courseId,
        title: form.title,
        date: form.date,
        time: form.time,
        type: form.type,
      })
      toast.success('Event created')
      setShowModal(false)
      setForm((p) => ({ ...p, title: '', date: '', time: '', type: 'other' }))
      await fetchAll()
    } catch (err) {
      handleApiError(err)
    }
  }

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time', render: (t) => t || '—' },
    { key: 'type', label: 'Type' },
    { key: 'title', label: 'Title' },
  ]

  return (
    <DashboardLayout title="Calendar">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          {(role === 'faculty' || role === 'admin') && (
            <div className="flex justify-end">
              <Button onClick={() => setShowModal(true)}>+ Add Event</Button>
            </div>
          )}

          <Card title="Upcoming">
            {data.events?.length ? (
              <Table columns={columns} data={data.events} />
            ) : (
              <p className="text-gray-600">No events yet.</p>
            )}
          </Card>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Event">
            <form onSubmit={create}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Course</label>
                <select
                  className="input"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  required
                >
                  {data.courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Type</label>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="lecture">Lecture</option>
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="live">Live</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </Modal>
        </div>
      )}
    </DashboardLayout>
  )
}

