import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Button } from '../../components/UI'
import { courseService } from '../../services'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import { toast, handleApiError } from '../../utils/toast'

export const StudentCertificatesPage = () => {
  const user = useAuthStore((s) => s.user)
  const studentId = user?.id || user?._id
  const [certs, setCerts] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(null)

  const fetchAll = async () => {
    const [certRes, courseRes] = await Promise.all([
      api.get(`/certificates/student/${studentId}`),
      courseService.getStudentCourses(),
    ])
    setCerts(certRes.data || [])
    setCourses(courseRes.data || [])
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
    if (studentId) run()
  }, [studentId])

  const generate = async (courseId) => {
    try {
      setGenerating(courseId)
      const res = await api.post('/certificates/generate', { courseId })
      toast.success('Certificate generated')
      setCerts((prev) => {
        const next = prev.filter((c) => c.course !== courseId)
        return [res.data, ...next]
      })
    } catch (err) {
      handleApiError(err)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <DashboardLayout title="Certificates">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          <Card title="My Certificates">
            {certs.length === 0 ? (
              <p className="text-gray-600">No certificates generated yet.</p>
            ) : (
              <div className="space-y-3">
                {certs.map((c) => (
                  <div key={c._id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <div className="font-semibold">{c.courseTitle}</div>
                      <div className="text-xs text-gray-500">
                        {c.certificateId} • {new Date(c.completionDate).toLocaleDateString()}
                      </div>
                    </div>
                    {c.pdfUrl && (
                      <a
                        href={c.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Generate for a course">
            {courses.length === 0 ? (
              <p className="text-gray-600">Enroll in courses to become eligible.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <div key={course._id} className="border rounded-lg p-4">
                    <div className="font-semibold">{course.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{course.description || '—'}</div>
                    <Button
                      className="mt-3"
                      disabled={generating === course._id}
                      onClick={() => generate(course._id)}
                    >
                      {generating === course._id ? 'Generating...' : 'Generate Certificate'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Requires all assignments submitted for this course.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}

