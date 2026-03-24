// Student Dashboard Component
// Location: src/pages/StudentDashboard.jsx

import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../api/dashboardAPI';
import { courseAPI } from '../api/courseAPI';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, coursesResponse] = await Promise.all([
          dashboardAPI.getStudentDashboard(),
          courseAPI.getStudentCourses(),
        ]);

        setStats(statsResponse.data);
        setCourses(coursesResponse.data);
      } catch (err) {
        setError('Failed to load dashboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Student Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h3>Enrolled Courses</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.enrolledCourses || 0}</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h3>Attendance</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.attendancePercentage}%</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h3>Total Notices</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalNotices || 0}</p>
        </div>
      </div>

      <h2>Your Courses</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {courses.map((course) => (
          <div key={course._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <a href={`/attendance/${course._id}`} style={{ color: 'blue' }}>View Attendance</a>
          </div>
        ))}
      </div>

      {courses.length === 0 && <p>No courses enrolled yet</p>}

      <h2 style={{ marginTop: '30px' }}>Recent Notices</h2>
      <div>
        {stats?.recentNotices?.map((notice) => (
          <div key={notice._id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
            <h4>{notice.title}</h4>
            <p style={{ fontSize: '12px', color: '#666' }}>
              {new Date(notice.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
