// Admin API Endpoints
// Location: src/api/adminAPI.js

import client from './client';

export const adminAPI = {
  // Admin: Create new user
  createUser: (data) => {
    return client.post('/admin/create-user', {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role, // 'faculty' | 'student' | 'parent'
    });
  },

  // Admin: Assign student to course
  assignStudentToCourse: (studentId, courseId) => {
    return client.post('/admin/assign-course', {
      studentId: studentId,
      courseId: courseId,
    });
  },

  // Admin: Update user
  updateUser: (userId, data) => {
    return client.put(`/users/${userId}`, {
      name: data.name,
      role: data.role,
    });
  },

  // Admin: Delete user (soft)
  deleteUser: (userId) => {
    return client.delete(`/users/${userId}`);
  },

  // Admin: Restore user
  restoreUser: (userId) => {
    return client.put(`/users/restore/${userId}`);
  },

  // Admin: Change user password
  changePassword: (userId, newPassword) => {
    return client.put(`/users/password/${userId}`, {
      newPassword: newPassword,
    });
  },
};
