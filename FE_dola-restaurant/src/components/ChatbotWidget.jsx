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
  Headphones,
  CheckCircle2,
} from 'lucide-react';
import { io } from 'socket.io-client';
import { customerChatApi } from '../api/chat';

const QUICK_PROMPTS = [
  { id: 'menu', label: '🍽️ Tư vấn món ăn', text: 'Gợi ý cho mình các món ăn ngon bán chạy tại nhà hàng' },
  { id: 'reserve', label: '📅 Đặt bàn ngay', text: 'Tôi muốn đặt bàn tại nhà hàng, hãy hướng dẫn tôi' },
  { id: 'promotions', label: '🏷️ Khuyến mãi', text: 'Hôm nay nhà hàng đang có những chương trình ưu đãi nào?' },
  { id: 'staff', label: '🎧 Gặp nhân viên', text: 'Gặp nhân viên tư vấn', isEscalate: true },
];

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatMode, setChatMode] = useState('ai'); // 'ai' | 'waiting_staff' | 'staff'
  const [staffName, setStaffName] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'model',
      text: '👋 **Xin chào! Em là AI Assistant của Dola Restaurant.**\n\nEm có thể giúp Anh/Chị:\n- 🍽️ **Tư vấn thực đơn & gợi ý món ăn**\n- 📅 **Đặt bàn tự động nhanh chóng**\n- 🏷️ **Xem thông tin khuyến mãi mới nhất**\n- 🎧 **Kết nối với Nhân viên tư vấn trực tiếp**\n\nAnh/Chị cần hỗ trợ thông tin gì ạ?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Khởi tạo phiên chat & kết nối socket
  useEffect(() => {
    let activeSessionId = localStorage.getItem('dola_chat_session_id');

    const initChat = async () => {
      try {
        if (activeSessionId) {
          try {
            await customerChatApi.getMessages(activeSessionId);
          } catch {
            // Phiên cũ đã không tồn tại hoặc bị lỗi -> xóa token cũ
            localStorage.removeItem('dola_chat_session_id');
            activeSessionId = null;
          }
        }

        if (!activeSessionId) {
          const newSession = await customerChatApi.createSession();
          activeSessionId = newSession.id;
          localStorage.setItem('dola_chat_session_id', activeSessionId);
        }
        setSessionId(activeSessionId);

        // Khởi tạo Socket.io client kết nối backend namespace /chat
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const socket = io(`${backendUrl}/chat`, {
          transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('customer:join', { sessionId: Number(activeSessionId) });
        });

        // Nhận tin nhắn mới gửi từ phía Staff hoặc Server broadcast
        socket.on('newMessage', (msg) => {
          if (msg.senderType === 'staff') {
            setMessages((prev) => {
              if (prev.some((m) => m.id === msg.id)) return prev;
              return [
                ...prev,
                {
                  id: msg.id || Date.now().toString(),
                  role: 'staff',
                  text: msg.content,
                  timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ];
            });
          }
        });

        socket.on('sessionAssigned', (data) => {
          setChatMode('staff');
          setStaffName(data.staffName || 'Nhân viên');
          setMessages((prev) => [
            ...prev,
            {
              id: 'assigned-' + Date.now(),
              role: 'system',
              text: `✅ **${data.staffName || 'Nhân viên tư vấn'}** đã tham gia hỗ trợ bạn!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        });

        socket.on('sessionClosed', () => {
          localStorage.removeItem('dola_chat_session_id');
          setSessionId(null);
          setChatMode('ai');
          setStaffName('');
          setMessages((prev) => [
            ...prev,
            {
              id: 'closed-' + Date.now(),
              role: 'system',
              text: '🔒 **Phiên tư vấn trực tiếp với nhân viên đã kết thúc.** Đã tự động làm mới phiên chat cho cuộc trò chuyện tiếp theo!',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        });
      } catch (err) {
        console.error('Lỗi khởi tạo chat session:', err);
      }
    };

    initChat();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleEscalate = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const newSession = await customerChatApi.createSession();
        targetSessionId = newSession.id;
        setSessionId(targetSessionId);
        localStorage.setItem('dola_chat_session_id', targetSessionId);
      }

      try {
        await customerChatApi.escalate(targetSessionId, 'Khách yêu cầu hỗ trợ qua Chatbot');
      } catch (err) {
        // Nếu phiên cũ đã đóng (400 Bad Request), tự tạo phiên mới và escalate phiên mới
        if (err.response?.status === 400 || err.response?.status === 404) {
          const freshSession = await customerChatApi.createSession();
          targetSessionId = freshSession.id;
          setSessionId(targetSessionId);
          localStorage.setItem('dola_chat_session_id', targetSessionId);

          if (socketRef.current) {
            socketRef.current.emit('customer:join', { sessionId: Number(targetSessionId) });
          }

          await customerChatApi.escalate(targetSessionId, 'Khách yêu cầu hỗ trợ qua Chatbot');
        } else {
          throw err;
        }
      }

      setChatMode('waiting_staff');
      setMessages((prev) => [
        ...prev,
        {
          id: 'escalate-' + Date.now(),
          role: 'system',
          text: '⏳ **Đã gửi yêu cầu gặp nhân viên tư vấn.** Vui lòng chờ nhân viên tiếp nhận trong giây lát...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Lỗi escalate:', err);
      alert('Không thể kết nối với nhân viên lúc này. Vui lòng liên hệ Hotline 1900 6750.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (textToSend) => {
    const queryText = textToSend || inputMsg;
    if (!queryText.trim() || isLoading) return;

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      try {
        const newSession = await customerChatApi.createSession();
        currentSessionId = newSession.id;
        setSessionId(currentSessionId);
        localStorage.setItem('dola_chat_session_id', currentSessionId);
      } catch (err) {
        console.error('Không thể tạo phiên chat mới:', err);
      }
    }

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
      const historyPayload = messages
        .filter((m) => {
          const idStr = String(m.id || '');
          return !idStr.startsWith('welcome') && !idStr.startsWith('escalate') && m.role !== 'system';
        })
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

      const res = await customerChatApi.sendMessage(currentSessionId || sessionId, queryText, historyPayload);

      // Nếu phiên đang chuyển giao sang nhân viên -> không cần bot trả lời lại
      if (res.handedOffToStaff) {
        if (chatMode === 'ai') setChatMode('waiting_staff');
        return;
      }

      if (res.reply) {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn:', err);
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
    localStorage.removeItem('dola_chat_session_id');
    setSessionId(null);
    setChatMode('ai');
    setStaffName('');
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        role: 'model',
        text: '👋 **Lịch sử trò chuyện đã được làm mới.**\nEm có thể giúp gì thêm cho Anh/Chị ạ?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
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
          title="Trò chuyện cùng Dola Restaurant"
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
                    {chatMode === 'staff' ? (
                      <User className="w-6 h-6 text-white" />
                    ) : (
                      <Bot className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-orange-600 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-base leading-snug flex items-center gap-1.5">
                    {chatMode === 'staff'
                      ? staffName || 'Nhân viên tư vấn'
                      : chatMode === 'waiting_staff'
                      ? 'Đang kết nối Nhân viên'
                      : 'Dola AI Assistant'}
                    <span className="text-[10px] bg-amber-400/30 text-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300/40">
                      {chatMode === 'staff' ? 'Staff' : chatMode === 'waiting_staff' ? 'Waiting' : 'AI'}
                    </span>
                  </h3>
                  <p className="text-xs text-amber-100/90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {chatMode === 'staff'
                      ? 'Trò chuyện trực tiếp'
                      : chatMode === 'waiting_staff'
                      ? 'Vui lòng chờ tiếp nhận...'
                      : 'Tư vấn tự động 24/7'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {chatMode === 'ai' && (
                  <button
                    onClick={handleEscalate}
                    title="Gặp nhân viên tư vấn"
                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-xs text-white rounded-lg transition flex items-center gap-1"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    Gặp NV
                  </button>
                )}

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
                  onClick={() => {
                    if (prompt.isEscalate) {
                      handleEscalate();
                    } else {
                      handleSend(prompt.text);
                    }
                  }}
                  disabled={isLoading}
                  className="whitespace-nowrap text-xs font-medium bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-amber-200/80 dark:border-zinc-700 px-2.5 py-1 rounded-full hover:bg-amber-500 hover:text-white hover:border-amber-500 dark:hover:bg-amber-600 transition-all duration-200 shadow-sm flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950">
              {messages.map((msg) => {
                if (msg.role === 'system') {
                  return (
                    <div key={msg.id} className="text-center py-2 px-3 my-1 text-xs bg-amber-100/60 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-200 dark:border-amber-800/50">
                      {renderFormattedText(msg.text)}
                    </div>
                  );
                }

                const isUser = msg.role === 'user';
                const isStaffMsg = msg.role === 'staff';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isUser
                          ? 'bg-amber-600 text-white shadow-sm'
                          : isStaffMsg
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-sm'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : isStaffMsg ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-tr-none'
                            : isStaffMsg
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded-tl-none'
                            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700/80 rounded-tl-none'
                        }`}
                      >
                        {isStaffMsg && <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">🎧 Nhân viên tư vấn</span>}
                        {renderFormattedText(msg.text)}
                      </div>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

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
                  placeholder={
                    chatMode === 'staff'
                      ? 'Nhắn cho nhân viên hỗ trợ...'
                      : chatMode === 'waiting_staff'
                      ? 'Gửi thêm thông tin cho nhân viên...'
                      : 'Nhập câu hỏi hoặc yêu cầu đặt bàn...'
                  }
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
                  {chatMode === 'staff'
                    ? 'Đang trò chuyện trực tiếp với Nhân viên'
                    : 'Powered by Google AI Studio (AI) • Dola Restaurant'}
                </span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
