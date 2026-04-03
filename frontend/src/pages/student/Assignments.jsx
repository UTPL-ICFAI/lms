import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button, Input, Modal } from '../../components/UI'
import { assignmentService, submissionService, courseService } from '../../services'
import { toast, handleApiError } from '../../utils/toast'
import { Eye, FileEdit, Trash2, Upload, Clock, AlertTriangle } from 'lucide-react'

export const StudentAssignmentsPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [submitFor, setSubmitFor] = useState(null)
  const [historyFor, setHistoryFor] = useState(null)
  const [deleteFor, setDeleteFor] = useState(null)
  const [fileUrl, setFileUrl] = useState('')
  const [textContent, setTextContent] = useState('')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submissionMap, setSubmissionMap] = useState({})

  const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'txt', 'zip', 'ppt', 'pptx']
  const MAX_FILE_SIZE = 50 * 1024 * 1024

  const fetchAssignments = async (courseId) => {
    if (!courseId) return
    const res = await assignmentService.getByCourse(courseId)
    const list = res.data || []
    setAssignments(list)
    await fetchMySubmissions(list)
  }

  const fetchMySubmissions = async (list) => {
    if (!list.length) {
      setSubmissionMap({})
      return
    }
    const pairs = await Promise.all(
      list.map(async (a) => {
        try {
          const res = await submissionService.getMine(a._id)
          return [a._id, res.data]
        } catch {
          return [a._id, { submission: null, grade: null, rules: {} }]
        }
      })
    )
    setSubmissionMap(Object.fromEntries(pairs))
  }

  const getDeadlineMeta = (assignment) => {
    if (!assignment?.dueDate) return { text: 'No deadline', near: false, passed: false }
    const now = Date.now()
    const due = new Date(assignment.dueDate).getTime()
    const diff = due - now
    const passed = diff <= 0
    const near = !passed && diff <= 24 * 60 * 60 * 1000
    if (passed) return { text: 'Deadline passed', near: false, passed: true }
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return { text: `${hours}h ${minutes}m left`, near, passed: false }
  }

  const getStatusMeta = (assignmentId) => {
    const payload = submissionMap[assignmentId]
    const submission = payload?.submission
    const grade = payload?.grade
    if (!submission) return { label: 'Not Submitted', cls: 'bg-gray-100 text-gray-700' }
    if (grade) return { label: 'Graded', cls: 'bg-emerald-100 text-emerald-700' }
    if (submission?.status === 'late_submission' || submission?.isLate) {
      return { label: 'Late Submission', cls: 'bg-orange-100 text-orange-700' }
    }
    if ((submission?.versionCount || 1) > 1 || submission?.status === 'resubmitted') {
      return { label: 'Resubmitted', cls: 'bg-purple-100 text-purple-700' }
    }
    return { label: 'Submitted', cls: 'bg-blue-100 text-blue-700' }
  }

  const readFileForPreview = (chosen) => {
    if (!chosen) {
      setPreviewUrl('')
      return
    }
    const ext = (chosen.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('Unsupported file type selected')
      return
    }
    if (chosen.size > MAX_FILE_SIZE) {
      toast.error('File too large. Max 50MB')
      return
    }
    setPreviewUrl(URL.createObjectURL(chosen))
  }

  const openSubmitModal = (assignment) => {
    const payload = submissionMap[assignment._id]
    const submission = payload?.submission
    setSubmitFor(assignment)
    setFile(null)
    setPreviewUrl('')
    setFileUrl(submission?.fileUrl || '')
    setTextContent(submission?.textContent || '')
    setShowModal(true)
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
      setSubmitting(true)
      const fd = new FormData()
      fd.append('assignmentId', submitFor._id)
      if (file) {
        fd.append('file', file)
      } else if (fileUrl) {
        fd.append('fileUrl', fileUrl)
      }
      if (textContent) fd.append('textContent', textContent)
      await submissionService.submit(fd)
      toast.success('Submission saved successfully')
      setShowModal(false)
      setSubmitFor(null)
      setFileUrl('')
      setTextContent('')
      setFile(null)
      setPreviewUrl('')
      await fetchAssignments(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await submissionService.deleteMine(deleteFor._id)
      toast.success('Submission deleted')
      setShowDeleteModal(false)
      setDeleteFor(null)
      await fetchAssignments(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    }
  }

  const previewNode = useMemo(() => {
    if (file && previewUrl) {
      const name = file.name.toLowerCase()
      if (/\.(png|jpg|jpeg|webp)$/.test(name)) {
        return <img src={previewUrl} alt="preview" className="max-h-56 rounded border" />
      }
      if (/\.pdf$/.test(name)) {
        return (
          <iframe title="pdf-preview" src={previewUrl} className="w-full h-56 border rounded" />
        )
      }
      return <p className="text-sm text-gray-600">Preview is not available for this file type. You can still submit.</p>
    }
    if (textContent) {
      return <pre className="bg-gray-50 border rounded p-3 text-xs whitespace-pre-wrap">{textContent}</pre>
    }
    if (fileUrl) {
      return <a className="text-blue-600 hover:underline text-sm" href={fileUrl} target="_blank" rel="noreferrer">Open current URL</a>
    }
    return <p className="text-sm text-gray-500">No content to preview yet.</p>
  }, [file, previewUrl, textContent, fileUrl])

  const formatSize = (size = 0) => {
    if (!size) return '—'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
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
                <Card key={a._id} className="hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold">{a.title}</h3>
                    {(() => {
                      const status = getStatusMeta(a._id)
                      return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.cls}`}>{status.label}</span>
                    })()}
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{a.description || '—'}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Due: {a.dueDate ? new Date(a.dueDate).toLocaleString() : '—'}</p>
                    <p className={`mt-1 inline-flex items-center gap-1 ${getDeadlineMeta(a).near ? 'text-amber-600' : ''}`}>
                      <Clock size={12} />
                      {getDeadlineMeta(a).text}
                    </p>
                    {getDeadlineMeta(a).near && (
                      <p className="mt-1 inline-flex items-center gap-1 text-amber-600">
                        <AlertTriangle size={12} />
                        Deadline is near
                      </p>
                    )}
                  </div>
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
                  {submissionMap[a._id]?.grade && (
                    <div className="mt-3 p-3 rounded border bg-green-50 text-sm">
                      <p className="font-semibold text-green-800">Grade: {submissionMap[a._id].grade.score}</p>
                      <p className="text-green-700 mt-1">{submissionMap[a._id].grade.feedback || 'No feedback'}</p>
                      {submissionMap[a._id].grade.evaluatedFileUrl ? (
                        <a
                          href={submissionMap[a._id].grade.evaluatedFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-800 underline mt-2 inline-block"
                        >
                          Download evaluated file
                        </a>
                      ) : null}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setHistoryFor(a)
                        setShowHistoryModal(true)
                      }}
                    >
                      <span className="inline-flex items-center gap-1"><Eye size={14} /> View</span>
                    </Button>
                    <Button
                      disabled={getDeadlineMeta(a).passed && !a.allowLateSubmission}
                      onClick={() => openSubmitModal(a)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {(submissionMap[a._id]?.submission ? <FileEdit size={14} /> : <Upload size={14} />)}
                        {submissionMap[a._id]?.submission ? 'Edit / Resubmit' : 'Submit'}
                      </span>
                    </Button>
                    <Button
                      variant="danger"
                      disabled={!submissionMap[a._id]?.rules?.canDelete}
                      onClick={() => {
                        setDeleteFor(a)
                        setShowDeleteModal(true)
                      }}
                    >
                      <span className="inline-flex items-center gap-1"><Trash2 size={14} /> Delete</span>
                    </Button>
                  </div>
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
                <label className="block text-sm font-semibold mb-2">Text Answer (optional)</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="input min-h-24"
                  placeholder="Write your answer text..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Or upload file</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const chosen = e.target.files?.[0] || null
                    setFile(chosen)
                    readFileForPreview(chosen)
                  }}
                  className="input"
                />
                {file && (
                  <p className="text-xs text-gray-500 mt-1">
                    {file.name} ({formatSize(file.size)}) selected at {new Date().toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Preview</label>
                {previewNode}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Saving...' : 'Final Submit'}
              </Button>
            </form>
          </Modal>

          <Modal
            isOpen={showHistoryModal}
            onClose={() => {
              setShowHistoryModal(false)
              setHistoryFor(null)
            }}
            title="Submission History"
          >
            {historyFor && (
              <div className="space-y-3">
                {submissionMap[historyFor._id]?.submission?.versions?.length ? (
                  submissionMap[historyFor._id].submission.versions
                    .slice()
                    .reverse()
                    .map((v, idx) => (
                      <div key={`${v.submittedAt}-${idx}`} className="border rounded p-3">
                        <p className="text-xs text-gray-500">Version {submissionMap[historyFor._id].submission.versions.length - idx}</p>
                        <p className="text-xs text-gray-500">Submitted: {new Date(v.submittedAt).toLocaleString()}</p>
                        {v.fileUrl ? (
                          <a href={v.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">Open file</a>
                        ) : null}
                        {v.fileName ? <p className="text-xs text-gray-600 mt-1">{v.fileName} ({formatSize(v.fileSize)})</p> : null}
                        {v.textContent ? (
                          <pre className="bg-gray-50 border rounded p-2 text-xs whitespace-pre-wrap mt-2">{v.textContent}</pre>
                        ) : null}
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-600">No submissions yet.</p>
                )}
              </div>
            )}
          </Modal>

          <Modal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false)
              setDeleteFor(null)
            }}
            title="Delete Submission"
          >
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete your submission? This is allowed only before deadline and before grading.
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" onClick={confirmDelete}>Delete</Button>
            </div>
          </Modal>
        </>
      )}
    </DashboardLayout>
  )
}

