import api from './api'

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
}

export const userService = {
  getAllUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/admin/create-user', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  restoreUser: (id) => api.put(`/users/restore/${id}`),
  changePassword: (id, data) => api.put(`/users/password/${id}`, data),
}

export const courseService = {
  getAllCourses: () => api.get('/courses'),
  getActiveCourses: () => api.get('/courses/active'),
  getFacultyCourses: () => api.get('/courses/faculty'),
  getStudentCourses: () => api.get('/courses/student'),
  getCourse: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post('/courses', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  restoreCourse: (id) => api.put(`/courses/restore/${id}`),
  enrollStudent: (courseId, studentId) => api.post(`/courses/${courseId}/enroll`, { studentId }),
  selfEnroll: (courseId) => api.post(`/courses/${courseId}/enroll-self`),
  removeStudent: (courseId, studentId) => api.delete(`/courses/${courseId}/student/${studentId}`),
  getDeletedCourses: () => api.get('/courses/deleted/all'),
}

export const attendanceService = {
  markAttendance: (courseId, data) => api.post(`/attendance/${courseId}`, data),
  getStudentAttendance: () => api.get('/attendance/student'),
  getCourseAttendance: (courseId) => api.get(`/attendance/course/${courseId}`),
}

export const noticeService = {
  getAllNotices: (params) => api.get('/notices', { params }),
  getNotice: (id) => api.get(`/notices/${id}`),
  createNotice: (data) => api.post('/notices', data),
  updateNotice: (id, data) => api.put(`/notices/${id}`, data),
  deleteNotice: (id) => api.delete(`/notices/${id}`),
  restoreNotice: (id) => api.put(`/notices/restore/${id}`),
}

export const dashboardService = {
  getAdminDashboard: () => api.get('/dashboard-stats/admin'),
  getStudentDashboard: () => api.get('/dashboard-stats/student'),
  getFacultyDashboard: () => api.get('/dashboard-stats/faculty'),
}

export const materialService = {
  upload: (data) => api.post('/materials/upload', data),
  getByCourse: (courseId) => api.get(`/materials/course/${courseId}`),
  remove: (id) => api.delete(`/materials/${id}`),
}

export const lectureService = {
  create: (data) => api.post('/lectures', data),
  getByCourse: (courseId) => api.get(`/lectures/course/${courseId}`),
  remove: (id) => api.delete(`/lectures/${id}`),
}

export const assignmentService = {
  create: (data) => api.post('/assignments', data),
  getByCourse: (courseId) => api.get(`/assignments/course/${courseId}`),
}

export const submissionService = {
  submit: (data) => api.post('/submissions', data),
  getByAssignment: (assignmentId) => api.get(`/submissions/assignment/${assignmentId}`),
  getMine: (assignmentId) => api.get(`/submissions/my/${assignmentId}`),
  deleteMine: (assignmentId) => api.delete(`/submissions/my/${assignmentId}`),
}

export const gradeService = {
  create: (data) => api.post('/grades', data),
  getForStudent: (studentId) => api.get(`/grades/student/${studentId}`),
}

export const forumService = {
  createThread: (data) => api.post('/forum/thread', data),
  getThreadsByCourse: (courseId) => api.get(`/forum/course/${courseId}`),
  reply: (data) => api.post('/forum/reply', data),
  getRepliesByThread: (threadId) => api.get(`/forum/thread/${threadId}/replies`),
}

export const notificationService = {
  getMyNotifications: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/read/${id}`),
}

export const certificateService = {
  generate: (data) => api.post('/certificates/generate', data),
  getForStudent: (studentId) => api.get(`/certificates/student/${studentId}`),
}

export const aiService = {
  chat: (data) => api.post('/ai/chat', data),
  chatRag: (data) => api.post('/ai/chat-rag', data),
  ingest: (formData) => api.post('/ai/ingest', formData),
  webSearch: (data) => api.post('/ai/web-search', data),
}

export const plagiarismService = {
  check: (submissionId) => api.post('/plagiarism/check', { submissionId }),
}

export const paymentService = {
  // Starts Stripe Checkout for a paid course.
  checkoutSession: (courseId) => api.post('/payments/checkout-session', { courseId }),
}

export const liveClassService = {
  create: (data) => api.post('/live-classes', data),
  getByCourse: (courseId) => api.get(`/live-classes/course/${courseId}`),
}

export const calendarService = {
  create: (data) => api.post('/calendar', data),
  getForUser: (userId) => api.get(`/calendar/user/${userId}`),
}

export const doubtService = {
  create: (data) => api.post('/doubts', data),
  getByStudent: (studentId) => api.get(`/doubts/student/${studentId}`),
  getByCourse: (courseId) => api.get(`/doubts/course/${courseId}`),
  respond: (doubtId, response) => api.put(`/doubts/${doubtId}/respond`, { response }),
  updateStatus: (doubtId, status) => api.put(`/doubts/${doubtId}/status`, { status }),
  remove: (doubtId) => api.delete(`/doubts/${doubtId}`),
}
