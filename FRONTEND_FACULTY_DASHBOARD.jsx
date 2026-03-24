// Faculty Dashboard Component
// Location: src/pages/FacultyDashboard.jsx

import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../api/dashboardAPI';
import { courseAPI } from '../api/courseAPI';

const FacultyDashboard = () => {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, coursesResponse] = await Promise.all([
          dashboardAPI.getFacultyDashboard(),
          courseAPI.getFacultyCourses(),
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
      <h1>Faculty Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h3>Total Courses</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalCourses || 0}</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h3>Total Students</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalStudents || 0}</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h3>Total Notices</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.totalNotices || 0}</p>
        </div>

        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '5px' }}>
          <h3>Attendance Rate</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.attendancePercentage}%</p>
        </div>
      </div>

      <h2>Your Courses</h2>
      <div style={{ marginBottom: '20px' }}>
        <a href="/create-course" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
          + Create Course
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {courses.map((course) => (
          <div key={course._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <p><strong>Students enrolled:</strong> {course.students?.length || 0}</p>
            <div style={{ marginTop: '10px' }}>
              <a href={`/mark-attendance/${course._id}`} style={{ color: 'blue', marginRight: '10px' }}>Mark Attendance</a>
              <a href={`/edit-course/${course._id}`} style={{ color: 'blue' }}>Edit</a>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && <p>No courses created yet</p>}
    </div>
  );
};

export default FacultyDashboard;
