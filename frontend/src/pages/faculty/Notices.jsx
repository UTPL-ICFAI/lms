import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Button, Input, Card, Modal } from '../../components/UI'
import { courseService, noticeService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { toast, handleApiError } from '../../utils/toast'

export const FacultyNotices = () => {
  const [notices, setNotices] = useState([])
  const [courses, setCourses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [_loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    attachmentUrl: '',
  })
  const user = useAuthStore((state) => state.user)
  const userId = user?.id || user?._id

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await courseService.getFacultyCourses()
        const facultyCourses = coursesRes.data || []
        setCourses(facultyCourses)

        const noticesRes = await noticeService.getAllNotices({ role: 'faculty' })
        const list = noticesRes.data?.notices || noticesRes.data || []
        setNotices(list.filter((n) => !n.isDeleted))
      } catch (error) {
        handleApiError(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await noticeService.createNotice({
        title: formData.title,
        description: formData.description,
        courseId: formData.course || null,
        attachmentUrl: formData.attachmentUrl,
      })
      toast.success('Notice created successfully')
      setShowModal(false)
      setFormData({ title: '', description: '', course: '', attachmentUrl: '' })
      // Refresh notices
      const response = await noticeService.getAllNotices()
      setNotices(
        (response.data?.notices || response.data || []).filter(
          (n) => (n.createdBy === userId || n.createdBy?._id === userId) && !n.isDeleted
        )
      )
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this notice?')) {
      try {
        await noticeService.deleteNotice(id)
        toast.success('Notice deleted successfully')
        setNotices(notices.filter((n) => n._id !== id))
      } catch (error) {
        handleApiError(error)
      }
    }
  }

  return (
    <DashboardLayout title="Notices">
      <div className="mb-6">
        <Button onClick={() => setShowModal(true)}>+ Create Notice</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notices.map((notice) => (
          <Card key={notice._id}>
            <h3 className="font-bold">{notice.title}</h3>
            <p className="text-gray-600 text-sm mt-2">{notice.description}</p>
            <div className="mt-4 flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(notice._id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Notice"
      >
        <form onSubmit={handleCreate}>
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Course</label>
            <select
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="input"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Attachment URL"
            value={formData.attachmentUrl}
            onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
          />
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
