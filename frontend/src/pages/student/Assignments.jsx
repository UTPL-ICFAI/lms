import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input, Modal } from '../../components/UI'
import { assignmentService, submissionService, courseService } from '../../services'
import { toast, handleApiError } from '../../utils/toast'

export const StudentAssignmentsPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitFor, setSubmitFor] = useState(null)
  const [fileUrl, setFileUrl] = useState('')
  const [file, setFile] = useState(null)

  const fetchAssignments = async (courseId) => {
    if (!courseId) return
    const res = await assignmentService.getByCourse(courseId)
    setAssignments(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getStudentCourses()
        const list = c.data || []
        setCourses(list)
        if (list[0]?._id) {
          setSelectedCourseId(list[0]._id)
          await fetchAssignments(list[0]._id)
        }
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('assignmentId', submitFor._id)
      if (file) {
        fd.append('file', file)
      } else {
        fd.append('fileUrl', fileUrl)
      }
      await submissionService.submit(fd)
      toast.success('Submitted successfully')
      setShowModal(false)
      setSubmitFor(null)
      setFileUrl('')
      setFile(null)
    } catch (err) {
      handleApiError(err)
    }
  }

  return (
    <DashboardLayout title="Assignments">
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-600">Enroll in a course to view assignments.</p>
      ) : (
        <>
          <div className="mb-6 max-w-sm">
            <label className="block text-sm font-semibold mb-2">Course</label>
            <select
              className="input"
              value={selectedCourseId}
              onChange={async (e) => {
                const id = e.target.value
                setSelectedCourseId(id)
                await fetchAssignments(id)
              }}
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {assignments.length === 0 ? (
            <p className="text-gray-600">No assignments yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((a) => (
                <Card key={a._id}>
                  <h3 className="font-bold">{a.title}</h3>
                  <p className="text-gray-600 text-sm mt-2">{a.description || '—'}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                  </p>
                  {a.attachmentUrl && (
                    <a
                      href={a.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      View attachment
                    </a>
                  )}
                  <Button
                    className="w-full mt-4"
                    onClick={() => {
                      setSubmitFor(a)
                      setShowModal(true)
                    }}
                  >
                    Submit
                  </Button>
                </Card>
              ))}
            </div>
          )}

          <Modal
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setSubmitFor(null)
            }}
            title="Submit Assignment"
          >
            <form onSubmit={submit}>
              <Input
                label="File URL"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                required={!file}
              />
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Or upload file</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="input"
                />
              </div>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </Modal>
        </>
      )}
    </DashboardLayout>
  )
}

