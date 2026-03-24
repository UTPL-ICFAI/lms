import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '../../components/Layout'
import { Card } from '../../components/UI'
import { lectureService, courseService } from '../../services'
import { handleApiError } from '../../utils/toast'

function toYouTubeEmbed(url) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
    if (u.hostname === 'youtu.be') {
      const v = u.pathname.replace('/', '')
      if (v) return `https://www.youtube.com/embed/${v}`
    }
  } catch {
    // ignore
  }
  return null
}

export const StudentLecturesPage = () => {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [lectures, setLectures] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLectures = async (courseId) => {
    if (!courseId) return
    const res = await lectureService.getByCourse(courseId)
    setLectures(res.data || [])
  }

  useEffect(() => {
    const init = async () => {
      try {
        const c = await courseService.getStudentCourses()
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

  const firstLecture = lectures[0]
  const embed = useMemo(() => (firstLecture ? toYouTubeEmbed(firstLecture.videoUrl) : null), [firstLecture])

  return (
    <DashboardLayout title="Video Lectures">
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <p className="text-gray-600">Enroll in a course to view lectures.</p>
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

          {lectures.length === 0 ? (
            <p className="text-gray-600">No lectures yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card title={firstLecture.title}>
                  {embed ? (
                    <div className="aspect-video">
                      <iframe
                        className="w-full h-full rounded"
                        src={embed}
                        title={firstLecture.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <a
                      href={firstLecture.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Open video
                    </a>
                  )}
                  <p className="text-gray-600 text-sm mt-3">{firstLecture.description || '—'}</p>
                </Card>
              </div>
              <div className="lg:col-span-1 space-y-4">
                {lectures.map((l) => (
                  <Card key={l._id}>
                    <h3 className="font-semibold">{l.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{new Date(l.createdAt).toLocaleDateString()}</p>
                    <a
                      href={l.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                    >
                      Open
                    </a>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

