// Attendance API Endpoints
// Location: src/api/attendanceAPI.js

import client from './client';

export const attendanceAPI = {
  // Faculty: Mark attendance for a course
  markAttendance: (courseId, data) => {
    return client.post(`/attendance/${courseId}`, {
      date: data.date,
      timeSlot: data.timeSlot, // e.g., "09:00-10:00"
      records: data.records, // [{studentId, status: "present"|"absent"}, ...]
    });
  },

  // Student: View all attendance records
  getStudentAttendance: () => {
    return client.get('/attendance/student');
  },

  // Student: View attendance for specific course
  getCourseAttendance: (courseId) => {
    return client.get(`/attendance/course/${courseId}`);
  },
};
