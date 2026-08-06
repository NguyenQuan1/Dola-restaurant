import { apiClient } from './client';

// Chatbot cần timeout cao hơn vì AI model (Groq/LLM) xử lý lâu hơn các API thông thường.
// Timeout mặc định của apiClient là 10s — quá ngắn cho Groq, dẫn đến lỗi "Hệ thống gián đoạn".
const CHATBOT_TIMEOUT_MS = 60000; // 60 giây

export const sendChatMessage = async (message, history = []) => {
  const response = await apiClient.post(
    '/chatbot/message',
    { message, history },
    { timeout: CHATBOT_TIMEOUT_MS },
  );
  return response.data;
};
