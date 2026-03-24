import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card, Table } from '../../components/UI'
import { attendanceService } from '../../services'
import { handleApiError } from '../../utils/toast'

export const StudentAttendance = () => {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await attendanceService.getStudentAttendance()
        setAttendance(res.data || [])
      } catch (err) {
        handleApiError(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const columns = [
    {
      key: 'course',
      label: 'Course',
      render: (course) => (typeof course === 'object' && course?.title ? course.title : course?.toString?.() || '—'),
    },
    {
      key: 'date',
      label: 'Date',
      render: (date) => (date ? new Date(date).toLocaleDateString() : '—'),
    },
    {
      key: 'timeSlot',
      label: 'Slot',
      render: (slot) => slot || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (value === 'present' ? '✓ Present' : '✗ Absent'),
    },
  ]

  return (
    <DashboardLayout title="My Attendance">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card title="Attendance Records">
          {attendance.length === 0 ? (
            <p className="text-gray-600">No attendance records yet.</p>
          ) : (
            <Table columns={columns} data={attendance} />
          )}
        </Card>
      )}
    </DashboardLayout>
  )
}
