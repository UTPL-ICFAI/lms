import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input, Modal } from '../../components/UI'
import { forumService, courseService } from '../../services'
import { handleApiError, toast } from '../../utils/toast'

export const StudentForumPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')

  const fetchThreads = async (courseId) => {
    if (!courseId) return
    const res = await forumService.getThreadsByCourse(courseId)
    setThreads(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getStudentCourses()
        const list = c.data || []
        setCourses(list)
        if (list[0]?._id) {
          setSelectedCourseId(list[0]._id)
          await fetchThreads(list[0]._id)
        }
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const createThread = async (e) => {
    e.preventDefault()
    try {
      await forumService.createThread({ title, courseId: selectedCourseId })
      toast.success('Thread created')
      setShowModal(false)
      setTitle('')
      await fetchThreads(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <DashboardLayout title="Discussion Forum">
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-600">Enroll in a course to participate in the forum.</p>
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
                  await fetchThreads(id)
                }}
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={() => setShowModal(true)}>+ Start Thread</Button>
          </div>

          {threads.length === 0 ? (
            <p className="text-gray-600">No discussions yet.</p>
          ) : (
            <div className="space-y-4">
              {threads.map((t) => (
                <Card key={t._id}>
                  <h3 className="font-bold">{t.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t.createdBy?.name} • {new Date(t.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mt-3">
                    Replies are available via API; UI threading can be extended next.
                  </p>
                </Card>
              ))}
            </div>
          )}

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Start Discussion">
            <form onSubmit={createThread}>
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </Modal>
        </>
      )}
    </DashboardLayout>
  )
}

