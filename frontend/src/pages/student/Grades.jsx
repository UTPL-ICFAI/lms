import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Table } from '../../components/UI'
import { gradeService } from '../../services'
import { useAuthStore } from '../../store/authStore'
import { handleApiError } from '../../utils/toast'

export const StudentGradesPage = () => {
  const user = useAuthStore((s) => s.user)
  const studentId = user?.id || user?._id
  const [grades, setGrades] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await gradeService.getForStudent(studentId)
        setGrades(res.data || [])
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    if (studentId) fetch()
  }, [studentId])

  const columns = [
    {
      key: 'assignment',
      label: 'Assignment',
      render: (a) => a?.title || '—',
    },
    {
      key: 'assignment',
      label: 'Course',
      render: (a) => a?.course?.title || '—',
    },
    { key: 'score', label: 'Score' },
    { key: 'feedback', label: 'Feedback', render: (f) => f || '—' },
    { key: 'createdAt', label: 'Graded', render: (d) => (d ? new Date(d).toLocaleDateString() : '—') },
  ]

  return (
    <DashboardLayout title="Grades">
      {loading ? (
        <p>Loading...</p>
      ) : grades.length === 0 ? (
        <p className="text-gray-600">No grades published yet.</p>
      ) : (
        <Card>
          <Table columns={columns} data={grades} />
        </Card>
      )}
    </DashboardLayout>
  )
}

