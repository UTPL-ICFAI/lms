// Course API Endpoints
// Location: src/api/courseAPI.js

import client from './client';

export const courseAPI = {
  // Faculty: Create a new course
  createCourse: (data) => {
    return client.post('/courses', {
      title: data.title,
      description: data.description,
    });
  },

  // Faculty: Get their courses
  getFacultyCourses: () => {
    return client.get('/courses/faculty');
  },

  // Student: Get enrolled courses
  getStudentCourses: () => {
    return client.get('/courses/student');
  },

  // Faculty: Update course
  updateCourse: (courseId, data) => {
    return client.put(`/courses/${courseId}`, {
      title: data.title,
      description: data.description,
    });
  },

  // Faculty: Enroll student in course
  enrollStudent: (courseId, studentId) => {
    return client.post(`/courses/${courseId}/enroll`, {
      studentId: studentId,
    });
  },

  // Faculty/Admin: Delete course (soft)
  deleteCourse: (courseId) => {
    return client.delete(`/courses/${courseId}`);
  },

  // Faculty/Admin: Restore deleted course
  restoreCourse: (courseId) => {
    return client.put(`/courses/restore/${courseId}`);
  },

  // Faculty/Admin: Remove student from course
  removeStudentFromCourse: (courseId, studentId) => {
    return client.delete(`/courses/${courseId}/student/${studentId}`);
  },

  // Admin: Get deleted courses
  getDeletedCourses: () => {
    return client.get('/courses/deleted/all');
  },
};
