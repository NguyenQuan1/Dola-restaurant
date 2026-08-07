import { apiClient } from './client';

export const chatApi = {
  // Lấy danh sách hàng chờ (các phiên đang chờ nhân viên tiếp nhận)
  getQueue: async () => {
    const res = await apiClient.get('/chat/sessions/queue');
    return res.data;
  },

  // Lấy các phiên đang được phân công cho nhân viên hiện tại
  getMySessions: async () => {
    const res = await apiClient.get('/chat/sessions/mine');
    return res.data;
  },

  // Lấy lịch sử tin nhắn của 1 phiên
  getMessages: async (sessionId) => {
    const res = await apiClient.get(`/chat/sessions/${sessionId}/messages`);
    return res.data;
  },

  // Nhân viên tiếp nhận phiên chat
  assignSession: async (sessionId) => {
    const res = await apiClient.patch(`/chat/sessions/${sessionId}/assign`);
    return res.data;
  },

  // Nhân viên gửi tin nhắn
  sendMessage: async (sessionId, content) => {
    const res = await apiClient.post(`/chat/sessions/${sessionId}/staff-messages`, { content });
    return res.data;
  },

  // Đóng phiên chat
  closeSession: async (sessionId) => {
    const res = await apiClient.patch(`/chat/sessions/${sessionId}/close`);
    return res.data;
  },
};
