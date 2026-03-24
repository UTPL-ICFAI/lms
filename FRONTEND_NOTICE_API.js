// Notice API Endpoints
// Location: src/api/noticeAPI.js

import client from './client';

export const noticeAPI = {
  // Faculty: Create notice
  createNotice: (data) => {
    return client.post('/notices', {
      title: data.title,
      description: data.description,
      courseId: data.courseId || null, // null = global notice
    });
  },

  // All: Get notices (paginated, filterable)
  getNotices: (params = {}) => {
    return client.get('/notices', {
      params: {
        page: params.page || 1,
        courseId: params.courseId || undefined,
        keyword: params.keyword || undefined,
      },
    });
  },

  // Faculty: Update notice
  updateNotice: (noticeId, data) => {
    return client.put(`/notices/${noticeId}`, {
      title: data.title,
      description: data.description,
      attachmentUrl: data.attachmentUrl,
    });
  },

  // Faculty: Delete notice (soft)
  deleteNotice: (noticeId) => {
    return client.delete(`/notices/${noticeId}`);
  },

  // Faculty/Admin: Restore notice
  restoreNotice: (noticeId) => {
    return client.put(`/notices/restore/${noticeId}`);
  },
};
