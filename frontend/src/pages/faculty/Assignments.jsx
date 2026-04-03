import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Button, Input, Card, Modal, Table } from '../../components/UI'
import { assignmentService, submissionService, gradeService, plagiarismService, courseService } from '../../services'
import { toast, handleApiError } from '../../utils/toast'

export const FacultyAssignmentsPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [attachmentFile, setAttachmentFile] = useState(null)
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historySubmission, setHistorySubmission] = useState(null)
  const [gradingFile, setGradingFile] = useState(null)
  const [grading, setGrading] = useState({
    assignmentId: '',
    studentId: '',
    score: '',
    feedback: '',
    evaluatedFileUrl: '',
  })
  const [plagiarismBySubmission, setPlagiarismBySubmission] = useState({})
  const [form, setForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    attachmentUrl: '',
    allowLateSubmission: false,
    allowResubmission: true,
  })

  const fetchAssignments = async (courseId) => {
    if (!courseId) return
    const res = await assignmentService.getByCourse(courseId)
    setAssignments(res.data || [])
  }

  const fetchSubmissions = async (assignmentId) => {
    if (!assignmentId) return
    const res = await submissionService.getByAssignment(assignmentId)
    setSubmissions(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getFacultyCourses()
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

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description || '')
      fd.append('courseId', selectedCourseId)
      fd.append('dueDate', form.dueDate)
      fd.append('allowLateSubmission', String(form.allowLateSubmission))
      fd.append('allowResubmission', String(form.allowResubmission))
      if (attachmentFile) {
        fd.append('file', attachmentFile)
      } else if (form.attachmentUrl) {
        fd.append('attachmentUrl', form.attachmentUrl)
      }

      await assignmentService.create(fd)
      toast.success('Assignment created')
      setShowModal(false)
      setForm({
        title: '',
        description: '',
        dueDate: '',
        attachmentUrl: '',
        allowLateSubmission: false,
        allowResubmission: true,
      })
      setAttachmentFile(null)
      await fetchAssignments(selectedCourseId)
    } catch (err) {
      handleApiError(err)
    }
  }

  const openGrade = (assignmentId, studentId) => {
    setGrading({ assignmentId, studentId, score: '', feedback: '', evaluatedFileUrl: '' })
    setGradingFile(null)
    setShowGradeModal(true)
  }

  const submitGrade = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('assignmentId', grading.assignmentId)
      fd.append('studentId', grading.studentId)
      fd.append('score', Number(grading.score))
      fd.append('feedback', grading.feedback || '')
      if (gradingFile) {
        fd.append('file', gradingFile)
      } else if (grading.evaluatedFileUrl) {
        fd.append('evaluatedFileUrl', grading.evaluatedFileUrl)
      }

      await gradeService.create(fd)
      toast.success('Grade saved')
      setShowGradeModal(false)
      setGradingFile(null)
      if (selectedAssignmentId) await fetchSubmissions(selectedAssignmentId)
    } catch (err) {
      handleApiError(err)
    }
  }

  const submissionColumns = [
    { key: 'student', label: 'Student', render: (s) => `${s?.name || ''} (${s?.email || ''})` },
    { key: 'fileUrl', label: 'File', render: (url) => (url ? <a className="text-blue-600 hover:underline" href={url} target="_blank" rel="noreferrer">Open</a> : '—') },
    { key: 'createdAt', label: 'Submitted', render: (d) => (d ? new Date(d).toLocaleString() : '—') },
    {
      key: 'versions',
      label: 'History',
      render: (_value, row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setHistorySubmission(row)
            setShowHistoryModal(true)
          }}
        >
          {row?.versionCount || row?.versions?.length || 1} Versions
        </Button>
      ),
    },
    {
      key: 'student',
      label: 'Grade',
      render: (student) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => openGrade(selectedAssignmentId, student?._id)}
        >
          Grade
        </Button>
      ),
    },
    {
      key: '_id',
      label: 'Plagiarism',
      render: (id) => {
        const value = plagiarismBySubmission[id]
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-blue-600 hover:underline text-sm"
              onClick={async () => {
                try {
                  const res = await plagiarismService.check(id)
                  setPlagiarismBySubmission((prev) => ({ ...prev, [id]: res.data.similarityScore }))
                  toast.success('Plagiarism checked')
                } catch (err) {
                  handleApiError(err)
                }
              }}
            >
              Check
            </button>
            {typeof value === 'number' && <span className="text-sm">{value}%</span>}
          </div>
        )
      },
    },
  ]

  return (
    <DashboardLayout title="Assignments">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="min-w-[240px]">
              <label className="block text-sm font-semibold mb-2">Course</label>
              <select
                className="input"
                value={selectedCourseId}
                onChange={async (e) => {
                  const id = e.target.value
                  setSelectedCourseId(id)
                  setSelectedAssignmentId('')
                  setSubmissions([])
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
            <Button onClick={() => setShowModal(true)}>+ Create Assignment</Button>
          </div>

          <Card title="Assignments">
            {assignments.length === 0 ? (
              <p className="text-gray-600">No assignments yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <button
                    key={a._id}
                    type="button"
                    className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 ${selectedAssignmentId === a._id ? 'bg-blue-50' : ''}`}
                    onClick={async () => {
                      setSelectedAssignmentId(a._id)
                      await fetchSubmissions(a._id)
                    }}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">{a.title}</span>
                      <span className="text-xs text-gray-500">
                        Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{a.description || '—'}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card title="Submissions">
            {!selectedAssignmentId ? (
              <p className="text-gray-600">Select an assignment to view submissions.</p>
            ) : submissions.length === 0 ? (
              <p className="text-gray-600">No submissions yet.</p>
            ) : (
              <>
                <Table columns={submissionColumns} data={submissions} />
                <p className="text-xs text-gray-500 mt-2">Use the “Grade” button in each row.</p>
              </>
            )}
          </Card>

          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Assignment">
            <form onSubmit={handleCreate}>
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
              <Input label="Attachment URL" value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} required={false} />
              <div className="mb-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.allowLateSubmission}
                    onChange={(e) => setForm({ ...form, allowLateSubmission: e.target.checked })}
                  />
                  Allow late submission
                </label>
              </div>
              <div className="mb-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.allowResubmission}
                    onChange={(e) => setForm({ ...form, allowResubmission: e.target.checked })}
                  />
                  Allow resubmission
                </label>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Or upload attachment</label>
                <input
                  type="file"
                  onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                  className="input"
                />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </Modal>

          <Modal isOpen={showGradeModal} onClose={() => setShowGradeModal(false)} title="Grade Submission">
            <form onSubmit={submitGrade}>
              <Input label="Score" type="number" value={grading.score} onChange={(e) => setGrading({ ...grading, score: e.target.value })} required />
              <Input label="Feedback" value={grading.feedback} onChange={(e) => setGrading({ ...grading, feedback: e.target.value })} />
              <Input
                label="Evaluated File URL (optional)"
                value={grading.evaluatedFileUrl}
                onChange={(e) => setGrading({ ...grading, evaluatedFileUrl: e.target.value })}
              />
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Or upload evaluated file</label>
                <input
                  type="file"
                  onChange={(e) => setGradingFile(e.target.files?.[0] || null)}
                  className="input"
                />
              </div>
              <Button type="submit" className="w-full">Save Grade</Button>
            </form>
          </Modal>

          <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Submission Version History">
            {!historySubmission ? (
              <p className="text-sm text-gray-600">No submission selected.</p>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {(historySubmission.versions || []).length === 0 ? (
                  <p className="text-sm text-gray-600">No version history found.</p>
                ) : (
                  historySubmission.versions
                    .slice()
                    .reverse()
                    .map((v, idx) => (
                      <div key={`${v.submittedAt}-${idx}`} className="border rounded p-3">
                        <p className="text-xs text-gray-500">
                          Version {(historySubmission.versions?.length || 0) - idx}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {v.submittedAt ? new Date(v.submittedAt).toLocaleString() : '—'}
                        </p>
                        {v.fileUrl ? (
                          <a
                            className="text-blue-600 hover:underline text-sm"
                            href={v.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open file
                          </a>
                        ) : (
                          <p className="text-sm text-gray-600">Text submission only</p>
                        )}
                        {v.textContent ? (
                          <pre className="bg-gray-50 border rounded p-2 text-xs whitespace-pre-wrap mt-2">{v.textContent}</pre>
                        ) : null}
                      </div>
                    ))
                )}
              </div>
            )}
          </Modal>
        </div>
      )}
    </DashboardLayout>
  )
}

