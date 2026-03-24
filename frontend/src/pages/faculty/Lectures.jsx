import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Button, Input, Card, Modal } from '../../components/UI'
import { lectureService, courseService } from '../../services'
import { toast, handleApiError } from '../../utils/toast'

export const FacultyLecturesPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '' })

  const fetchLectures = async (courseId) => {
    if (!courseId) return
    const res = await lectureService.getByCourse(courseId)
    setLectures(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getFacultyCourses()
        const list = c.data || []
        setCourses(list)
        if (list[0]?._id) {
          setSelectedCourseId(list[0]._id)
          await fetchLectures(list[0]._id)
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
      if (file) {
        fd.append('file', file)
      } else {
        fd.append('videoUrl', form.videoUrl)
      }

      await lectureService.create(fd)
      toast.success('Lecture added')
      setShowModal(false)
      setForm({ title: '', description: '', videoUrl: '' })
      setFile(null)
      await fetchLectures(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <DashboardLayout title="Video Lectures">
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
                  await fetchLectures(id)
                }}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => setShowModal(true)}>+ Add Lecture</Button>
          </div>

          {lectures.length === 0 ? (
            <p className="text-gray-600">No lectures yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lectures.map((l) => (
                <Card key={l._id}>
                  <h3 className="font-bold">{l.title}</h3>
                  <p className="text-gray-600 text-sm mt-2">{l.description || '—'}</p>
                  <a
                    href={l.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mt-3 inline-block"
                  >
                    Open video
                  </a>
                </Card>
              ))}
            </div>
          )}

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Lecture">
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
              <Input
                label="Video URL"
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                required={!file}
              />
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Or upload video</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Choose a video file from your computer. If selected, Video URL is optional.
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

