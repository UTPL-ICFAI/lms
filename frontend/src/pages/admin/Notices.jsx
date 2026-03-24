import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/Layout'
import { Button, Input, Table, Modal, Card } from '../../components/UI'
import { noticeService } from '../../services'
import { toast, handleApiError } from '../../utils/toast'

export const NoticesPage = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    attachmentUrl: '',
    targetRole: 'both',
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      const response = await noticeService.getAllNotices()
      const list = response.data?.notices || response.data || []
      setNotices(Array.isArray(list) ? list.filter((n) => !n.isDeleted) : [])
    } catch (error) {
      handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await noticeService.createNotice({
        title: formData.title,
        description: formData.description,
        attachmentUrl: formData.attachmentUrl || undefined,
        targetRole: formData.targetRole || 'both',
      })
      toast.success('Notice created successfully')
      setShowModal(false)
      setFormData({ title: '', description: '', attachmentUrl: '', targetRole: 'both' })
      fetchNotices()
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await noticeService.updateNotice(editingNotice._id, formData)
      toast.success('Notice updated successfully')
      setShowModal(false)
      setEditingNotice(null)
      setFormData({ title: '', description: '', attachmentUrl: '', targetRole: 'both' })
      fetchNotices()
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this notice?')) {
      try {
        await noticeService.deleteNotice(id)
        toast.success('Notice deleted successfully')
        fetchNotices()
      } catch (error) {
        handleApiError(error)
      }
    }
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    {
      key: 'targetRole',
      label: 'Visible to',
      render: (role) => (role === 'both' ? 'Everyone' : role === 'student' ? 'Students only' : 'Faculty only'),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ]

  return (
    <AdminLayout title="Manage Notices">
      <div className="mb-6 flex justify-between items-center">
        <Button
          onClick={() => {
            setEditingNotice(null)
            setFormData({ title: '', description: '', attachmentUrl: '', targetRole: 'both' })
            setShowModal(true)
          }}
        >
          + Create Notice
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          <Table
            columns={columns}
            data={notices}
            actions
            onEdit={(notice) => {
              setEditingNotice(notice)
              setFormData({
                title: notice.title,
                description: notice.description,
                attachmentUrl: notice.attachmentUrl || '',
                targetRole: notice.targetRole || 'both',
              })
              setShowModal(true)
            }}
            onDelete={handleDelete}
          />
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingNotice(null)
        }}
        title={editingNotice ? 'Edit Notice' : 'Create Notice'}
      >
        <form onSubmit={editingNotice ? handleUpdate : handleCreate}>
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
            <label className="block text-sm font-semibold mb-2">Visible to</label>
            <select
              value={formData.targetRole}
              onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
              className="input"
            >
              <option value="both">Everyone (students & faculty)</option>
              <option value="student">Students only</option>
              <option value="faculty">Faculty only</option>
            </select>
          </div>
          <Input
            label="Attachment URL"
            value={formData.attachmentUrl}
            onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
          />
          <Button type="submit" className="w-full">
            {editingNotice ? 'Update' : 'Create'}
          </Button>
        </form>
      </Modal>
    </AdminLayout>
  )
}
