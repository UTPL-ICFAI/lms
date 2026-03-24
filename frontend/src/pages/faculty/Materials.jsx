import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Button, Input, Card, Modal } from '../../components/UI'
import { materialService, courseService } from '../../services'
import { toast, handleApiError } from '../../utils/toast'

export const FacultyMaterialsPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'url',
  })

  const fetchMaterials = async (courseId) => {
    if (!courseId) return
    const res = await materialService.getByCourse(courseId)
    setMaterials(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getFacultyCourses()
        const list = c.data || []
        setCourses(list)
        if (list[0]?._id) {
          setSelectedCourseId(list[0]._id)
          await fetchMaterials(list[0]._id)
        }
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description || '')
      fd.append('courseId', selectedCourseId)
      fd.append('fileType', form.fileType || 'url')
      if (file) {
        fd.append('file', file)
      } else {
        fd.append('fileUrl', form.fileUrl)
      }

      await materialService.upload(fd)
      toast.success('Material uploaded')
      setShowModal(false)
      setForm({ title: '', description: '', fileUrl: '', fileType: 'url' })
      setFile(null)
      await fetchMaterials(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return
    try {
      await materialService.remove(id)
      toast.success('Material deleted')
      await fetchMaterials(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <DashboardLayout title="Course Materials">
      {loading ? (
        <p>Loading...</p>
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
                  await fetchMaterials(id)
                }}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => setShowModal(true)}>+ Add Material</Button>
          </div>

          {materials.length === 0 ? (
            <p className="text-gray-600">No materials yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {materials.map((m) => (
                <Card key={m._id}>
                  <h3 className="font-bold">{m.title}</h3>
                  <p className="text-gray-600 text-sm mt-2">{m.description || '—'}</p>
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-3 inline-block"
                  >
                    Open
                  </a>
                  <div className="mt-4">
                    <Button size="sm" variant="danger" onClick={() => handleDelete(m._id)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Material">
            <form onSubmit={handleCreate}>
              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Input
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Type</label>
                <select
                  className="input"
                  value={form.fileType}
                  onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                >
                  <option value="url">External URL</option>
                  <option value="pdf">PDF</option>
                  <option value="doc">DOC</option>
                  <option value="ppt">PPT</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <Input
                label="File URL"
                value={form.fileUrl}
                onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                required={!file}
              />
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Or upload file</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a file to upload from your computer. If selected, File URL is optional.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Save
              </Button>
            </form>
          </Modal>
        </>
      )}
    </DashboardLayout>
  )
}

