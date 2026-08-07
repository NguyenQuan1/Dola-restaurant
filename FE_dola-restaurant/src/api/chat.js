import { apiClient } from './client';

export const customerChatApi = {
  // Tạo phiên chat mới
  createSession: async () => {
    const res = await apiClient.post('/chat/sessions');
    return res.data;
  },

  // Khách hàng gửi tin nhắn (qua chat controller)
  sendMessage: async (sessionId, message, history = []) => {
    const res = await apiClient.post(`/chat/sessions/${sessionId}/messages`, {
      message,
      history,
    });
    return res.data;
  },

  // Lấy danh sách tin nhắn của session
  getMessages: async (sessionId) => {
    const res = await apiClient.get(`/chat/sessions/${sessionId}/messages`);
    return res.data;
  },

  // Chuyển sang gặp nhân viên tư vấn
  escalate: async (sessionId, reason = 'Khách hàng yêu cầu gặp nhân viên tư vấn') => {
    const res = await apiClient.post(`/chat/sessions/${sessionId}/escalate`, { reason });
    return res.data;
  },
};
