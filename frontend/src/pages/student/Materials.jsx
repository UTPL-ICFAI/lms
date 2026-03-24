import { useEffect, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card } from '../../components/UI'
import { materialService, courseService } from '../../services'
import { handleApiError } from '../../utils/toast'

export const StudentMaterialsPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMaterials = async (courseId) => {
    if (!courseId) return
    const res = await materialService.getByCourse(courseId)
    setMaterials(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getStudentCourses()
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

  return (
    <DashboardLayout title="Course Materials">
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-600">Enroll in a course to view materials.</p>
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
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

