import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Clock,
  Utensils,
  Calendar,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { sendChatMessage } from '../api/chatbot';

const QUICK_PROMPTS = [
  { id: 'menu', label: '🍽️ Tư vấn món ăn', text: 'Gợi ý cho mình các món ăn ngon bán chạy tại nhà hàng' },
  { id: 'reserve', label: '📅 Đặt bàn ngay', text: 'Tôi muốn đặt bàn tại nhà hàng, hãy hướng dẫn tôi' },
  { id: 'promotions', label: '🏷️ Khuyến mãi', text: 'Hôm nay nhà hàng đang có những chương trình ưu đãi nào?' },
  { id: 'faq', label: '⏰ Giờ mở cửa & Địa chỉ', text: 'Cho mình hỏi giờ mở cửa và địa chỉ bãi đỗ xe nhà hàng' },
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      text: '👋 **Xin chào! Em là AI Assistant của Dola Restaurant.**\n\nEm có thể giúp Anh/Chị:\n- 🍽️ **Tư vấn thực đơn & gợi ý món ăn**\n- 📅 **Đặt bàn tự động nhanh chóng**\n- 🏷️ **Xem thông tin khuyến mãi mới nhất**\n- ⏰ **Giải đáp giờ mở cửa, địa chỉ, bãi đỗ xe**\n\nAnh/Chị cần hỗ trợ thông tin gì ạ?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const queryText = textToSend || inputMsg;
    if (!queryText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMsg('');
    setIsLoading(true);

    try {
      // Build history payload for Gemini (Lọc bỏ tất cả tin nhắn chào welcome)
      const historyPayload = messages
        .filter((m) => !m.id.startsWith('welcome'))
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

      const res = await sendChatMessage(queryText, historyPayload);

      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.reply || 'Xin lỗi, em chưa thể trả lời lúc này. Anh/Chị thử lại giúp em nhé!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Lỗi kết nối AI Chatbot:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: '❌ **Hệ thống gián đoạn tạm thời.**\nAnh/Chị vui lòng liên hệ Hotline **1900 6750** để được nhân viên hỗ trợ trực tiếp ạ!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'model',
        text: '👋 **Lịch sử trò chuyện đã được làm mới.**\nEm có thể giúp gì thêm cho Anh/Chị ạ?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper đơn giản định dạng văn bản (Markdown cơ bản: bold, line break, list)
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
      // Parse bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={partIdx} className="font-semibold text-amber-900 dark:text-amber-300">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      return (
        <span key={lineIdx} className="block min-h-[1.2em] my-0.5">
          {formattedLine}
        </span>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 group"
          title="Trò chuyện cùng AI Dola Restaurant"
        >
          <Sparkles className="w-7 h-7 animate-pulse group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
          </span>
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col w-[360px] sm:w-[420px] h-[580px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white shadow-md">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-orange-600 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug flex items-center gap-1.5">
                    Dola AI Assistant
                    <span className="text-[10px] bg-amber-400/30 text-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300/40">
                      AI
                    </span>
                  </h3>
                  <p className="text-xs text-amber-100/90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Sẵn sàng tư vấn & đặt bàn
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handleClearHistory}
                  title="Làm mới trò chuyện"
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Đóng cửa sổ"
                  className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Action Chips */}
            <div className="bg-amber-50/60 dark:bg-zinc-800/50 border-b border-amber-100 dark:border-zinc-800 p-2 overflow-x-auto flex space-x-2 scrollbar-none">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handleSend(prompt.text)}
                  disabled={isLoading}
                  className="whitespace-nowrap text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-amber-200/80 dark:border-zinc-700 px-2.5 py-1 rounded-full hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-600 transition-all duration-200 shadow-sm flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${msg.role === 'user'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm'
                      }`}
                  >
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === 'user'
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 rounded-tl-none'
                        }`}
                    >
                      {renderFormattedText(msg.text)}
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 text-zinc-400"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center space-x-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800"
            >
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Nhập câu hỏi hoặc yêu cầu đặt bàn..."
                  disabled={isLoading}
                  className="w-full pl-4 pr-12 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 border border-transparent dark:border-zinc-700 placeholder:text-zinc-400 transition"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-full disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center mt-1.5">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  Powered by Google AI Studio (AI) • Dola Restaurant
                </span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
