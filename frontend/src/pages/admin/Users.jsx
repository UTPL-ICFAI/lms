import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/Layout'
import { Button, Input, Table, Modal, Card } from '../../components/UI'
import { userService } from '../../services'
import { toast, handleApiError } from '../../utils/toast'

export const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await userService.getAllUsers()
      setUsers(response.data.filter((u) => !u.isDeleted))
    } catch (error) {
      handleApiError(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await userService.createUser(formData)
      toast.success('User created successfully')
      setShowModal(false)
      setFormData({ name: '', email: '', password: '', role: 'student' })
      fetchUsers()
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await userService.updateUser(editingUser._id, formData)
      toast.success('User updated successfully')
      setShowModal(false)
      setEditingUser(null)
      setFormData({ name: '', email: '', password: '', role: 'student' })
      fetchUsers()
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user?')) {
      try {
        await userService.deleteUser(id)
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        handleApiError(error)
      }
    }
  }

  const handleRestore = async (id) => {
    try {
      await userService.restoreUser(id)
      toast.success('User restored successfully')
      fetchUsers()
    } catch (error) {
      handleApiError(error)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (value ? '✓ Active' : '✗ Inactive'),
    },
  ]

  return (
    <AdminLayout title="Manage Users">
      <div className="mb-6 flex justify-between items-center">
        <Button
          onClick={() => {
            setEditingUser(null)
            setFormData({ name: '', email: '', password: '', role: 'student' })
            setShowModal(true)
          }}
        >
          + Create User
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          <Table
            columns={columns}
            data={users}
            actions
            onEdit={(user) => {
              setEditingUser(user)
              setFormData({
                name: user.name,
                email: user.email,
                password: '',
                role: user.role,
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
          setEditingUser(null)
        }}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={editingUser ? handleUpdate : handleCreate}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          {!editingUser && (
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
              <option value="parent">Parent</option>
            </select>
          </div>
          <Button type="submit" className="w-full">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </form>
      </Modal>
    </AdminLayout>
  )
}
