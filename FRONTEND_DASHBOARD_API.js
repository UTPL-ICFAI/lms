// Dashboard API Endpoints
// Location: src/api/dashboardAPI.js

import client from './client';

export const dashboardAPI = {
  // Student: Get dashboard stats
  getStudentDashboard: () => {
    return client.get('/dashboard-stats/student');
  },

  // Faculty: Get dashboard stats
  getFacultyDashboard: () => {
    return client.get('/dashboard-stats/faculty');
  },
};

/* Response Format for Student Dashboard:
{
  enrolledCourses: number,
  attendancePercentage: string (e.g., "78.50"),
  totalNotices: number,
  recentNotices: [
    {
      _id: string,
      title: string,
      createdAt: date
    }
  ]
}
*/

/* Response Format for Faculty Dashboard:
{
  totalCourses: number,
  totalStudents: number,
  totalNotices: number,
  attendancePercentage: string (e.g., "78.50")
}
*/
