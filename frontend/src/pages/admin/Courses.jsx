import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/Layout'
import { Button, Input, Table, Modal, Card } from '../../components/UI'
import { courseService, userService } from '../../services'
import { toast, handleApiError } from '../../utils/toast'

export const CoursesPage = () => {
  const [courses, setCourses] = useState([])
  const [facultyUsers, setFacultyUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    faculty: '',
    // INR. 0 means the course is free.
    price: 0,
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await userService.getAllUsers()
        setFacultyUsers((res.data || []).filter((u) => !u.isDeleted && u.role === 'faculty'))
      } catch (err) {
        handleApiError(err)
      }
    }
    fetchFaculty()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses()
      setCourses(response.data.filter((c) => !c.isDeleted))
    } catch (error) {
      handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await courseService.createCourse({
        title: formData.title,
        description: formData.description,
        faculty: formData.faculty || undefined,
        price: formData.price,
      })
      toast.success('Course created successfully')
      setShowModal(false)
      setFormData({ title: '', description: '', faculty: '', price: 0 })
      fetchCourses()
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await courseService.updateCourse(editingCourse._id, {
        title: formData.title,
        description: formData.description,
        price: formData.price,
      })
      toast.success('Course updated successfully')
      setShowModal(false)
      setEditingCourse(null)
      setFormData({ title: '', description: '', faculty: '', price: 0 })
      fetchCourses()
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course?')) {
      try {
        await courseService.deleteCourse(id)
        toast.success('Course deleted successfully')
        fetchCourses()
      } catch (error) {
        handleApiError(error)
      }
    }
  }

  const handleRestore = async (id) => {
    try {
      await courseService.restoreCourse(id)
      toast.success('Course restored successfully')
      fetchCourses()
    } catch (error) {
      handleApiError(error)
    }
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    {
      key: 'price',
      label: 'Price (INR)',
      render: (price) => (Number(price || 0) > 0 ? `₹${price}` : 'Free'),
    },
    {
      key: 'students',
      label: 'Students',
      render: (students) => students?.length || 0,
    },
  ]

  return (
    <AdminLayout title="Manage Courses">
      <div className="mb-6 flex justify-between items-center">
        <Button
          onClick={() => {
            setEditingCourse(null)
            setFormData({ title: '', description: '', faculty: '' })
            setShowModal(true)
          }}
        >
          + Create Course
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          <Table
            columns={columns}
            data={courses}
            actions
            onEdit={(course) => {
              setEditingCourse(course)
              setFormData({
                title: course.title,
                description: course.description,
                faculty: course.faculty?._id || course.faculty || '',
                price: course.price === undefined || course.price === null ? 0 : Number(course.price),
              })
              setShowModal(true)
            }}
            onDelete={handleDelete}
          />
        </Card>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingCourse(null)
        }}
        title={editingCourse ? 'Edit Course' : 'Create Course'}
      >
        <form onSubmit={editingCourse ? handleUpdate : handleCreate}>
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <Input
            label="Price (INR) - 0 for Free"
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: e.target.value === '' ? 0 : Number(e.target.value) })
            }
          />
          {!editingCourse && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Assign Faculty</label>
              <select
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                className="input"
                required
              >
                <option value="">Select faculty</option>
                {facultyUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button type="submit" className="w-full">
            {editingCourse ? 'Update' : 'Create'}
          </Button>
        </form>
      </Modal>
    </AdminLayout>
  )
}
