import { useEffect, useRef, useState } from 'react';
import { Search, Send, CheckCheck, UserCheck, Inbox, CheckCircle, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import { chatApi } from '../api/chat';

function initials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatListTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function Avatar({ name, size = 'md' }) {
  const dims = size === 'lg' ? 'w-11 h-11 text-sm' : 'w-10 h-10 text-xs';
  return (
    <div className="relative shrink-0">
      <div
        className={`${dims} rounded-full bg-teal-light flex items-center justify-center font-semibold text-teal-dark shadow-sm`}
      >
        {initials(name)}
      </div>
    </div>
  );
}

export default function Messages() {
  const [tab, setTab] = useState('mine'); // 'mine' | 'queue'
  const [mineSessions, setMineSessions] = useState([]);
  const [queueSessions, setQueueSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  // Socket setup
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socket = io(`${backendUrl}/chat`, {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Admin WebSocket connected:', socket.id);
      socket.emit('staff:join');
    });

    // Nhận thông báo phiên chat mới chờ xử lý
    socket.on('staff:newSession', () => {
      fetchSessions();
    });

    // Nhận tin nhắn mới gửi trong phiên đang mở
    socket.on('newMessage', (msg) => {
      setMessages((prev) => {
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      fetchSessions();
    });

    socket.on('sessionAssigned', () => {
      fetchSessions();
    });

    socket.on('sessionClosed', () => {
      fetchSessions();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [mine, queue] = await Promise.all([
        chatApi.getMySessions().catch(() => []),
        chatApi.getQueue().catch(() => []),
      ]);
      setMineSessions(mine || []);
      setQueueSessions(queue || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách phiên chat:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Lấy chi tiết tin nhắn khi chọn 1 session
  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const data = await chatApi.getMessages(selectedId);
        setMessages(data || []);

        // Tham gia room websocket của session này
        if (socketRef.current) {
          socketRef.current.emit('staff:joinSession', { sessionId: selectedId });
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách tin nhắn:', err);
      }
    };

    loadMessages();
  }, [selectedId]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, selectedId]);

  const activeList = tab === 'mine' ? mineSessions : queueSessions;
  const selectedSession = [...mineSessions, ...queueSessions].find((s) => s.id === selectedId) || null;

  const filteredSessions = activeList.filter((s) => {
    const name = s.user?.fullName || s.guestName || `Khách hàng #${s.id}`;
    const phone = s.guestPhone || s.user?.phone || '';
    const term = search.toLowerCase();
    return name.toLowerCase().includes(term) || phone.includes(term);
  });

  const handleAssign = async (sessionId) => {
    try {
      await chatApi.assignSession(sessionId);
      setTab('mine');
      setSelectedId(sessionId);
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tiếp nhận phiên chat');
    }
  };

  const handleClose = async (sessionId) => {
    if (!confirm('Bạn có chắc chắn muốn đóng phiên hỗ trợ này?')) return;
    try {
      await chatApi.closeSession(sessionId);
      setSelectedId(null);
      await fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể đóng phiên chat');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedId || sending) return;

    const content = input.trim();
    setInput('');
    setSending(true);

    try {
      const newMsg = await chatApi.sendMessage(selectedId, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      alert('Không thể gửi tin nhắn. Vui lòng thử lại!');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
      {/* Danh sách hội thoại */}
      <div className="w-80 shrink-0 border-r border-border flex flex-col">
        {/* Header & Search */}
        <div className="px-4 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink font-semibold">Tin nhắn</h2>
            <button
              onClick={fetchSessions}
              className="p-1.5 text-muted hover:text-ink rounded-lg transition-colors"
              title="Làm mới danh sách"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-paper p-1 rounded-xl border border-border">
            <button
              onClick={() => setTab('mine')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'mine' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <UserCheck size={14} />
              Đang xử lý ({mineSessions.length})
            </button>

            <button
              onClick={() => setTab('queue')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 relative ${
                tab === 'queue' ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Inbox size={14} />
              Hàng chờ ({queueSessions.length})
              {queueSessions.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
              )}
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên hoặc SĐT..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-border bg-paper outline-none focus:border-teal transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-muted">
              {tab === 'mine'
                ? 'Chưa có phiên chat nào đang tiếp nhận.'
                : 'Không có phiên chat nào đang chờ tiếp nhận.'}
            </div>
          ) : (
            filteredSessions.map((s) => {
              const displayName = s.user?.fullName || s.guestName || `Khách hàng #${s.id}`;
              const phone = s.guestPhone || s.user?.phone || '';
              const isActive = s.id === selectedId;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3 border-b border-border/60 cursor-pointer transition-colors ${
                    isActive ? 'bg-teal-light/40' : 'hover:bg-paper'
                  }`}
                >
                  <Avatar name={displayName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-ink truncate">{displayName}</span>
                      <span className="text-[10px] text-muted shrink-0">
                        {formatListTime(s.lastMessageAt || s.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-muted truncate mt-0.5">
                      {s.escalationReason ? `Lý do: ${s.escalationReason}` : phone || 'Khách vãng lai'}
                    </p>

                    {tab === 'queue' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssign(s.id);
                        }}
                        className="mt-2 w-full py-1 text-xs bg-teal hover:bg-teal-dark text-paper font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <UserCheck size={12} />
                        Tiếp nhận phiên này
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      {selectedSession ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-paper/50">
            <div className="flex items-center gap-3">
              <Avatar
                name={selectedSession.user?.fullName || selectedSession.guestName || `Khách hàng #${selectedSession.id}`}
                size="lg"
              />
              <div>
                <p className="text-sm font-semibold text-ink">
                  {selectedSession.user?.fullName || selectedSession.guestName || `Khách hàng #${selectedSession.id}`}
                </p>
                <p className="text-[11px] text-muted">
                  SĐT: {selectedSession.guestPhone || selectedSession.user?.phone || 'Chưa cung cấp'} • Phiên #{selectedSession.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedSession.status === 'waiting_staff' && (
                <button
                  onClick={() => handleAssign(selectedSession.id)}
                  className="px-3 py-1.5 bg-teal hover:bg-teal-dark text-paper text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <UserCheck size={14} />
                  Tiếp nhận hỗ trợ
                </button>
              )}

              {selectedSession.status === 'staff' && (
                <button
                  onClick={() => handleClose(selectedSession.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 border border-rose-200"
                >
                  <CheckCircle size={14} />
                  Kết thúc hỗ trợ
                </button>
              )}
            </div>
          </div>

          {/* Messages Feed */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-paper/20">
            {messages.length === 0 ? (
              <p className="text-center text-xs text-muted py-8">Chưa có tin nhắn nào trong phiên này.</p>
            ) : (
              messages.map((m) => {
                const isStaff = m.senderType === 'staff';
                const isAi = m.senderType === 'ai';

                return (
                  <div
                    key={m.id || m.createdAt}
                    className={`flex ${isStaff ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isStaff
                          ? 'bg-teal text-paper rounded-2xl rounded-br-sm'
                          : isAi
                          ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl rounded-bl-sm'
                          : 'bg-surface border border-border text-ink rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {isAi && <span className="text-[10px] font-bold text-amber-700 block mb-1">🤖 AI Bot</span>}
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <div
                        className={`flex items-center gap-1 mt-1 text-[10px] ${
                          isStaff ? 'text-paper/70 justify-end' : 'text-muted'
                        }`}
                      >
                        {formatTime(m.createdAt)}
                        {isStaff && <CheckCheck size={12} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Box */}
          {selectedSession.status === 'closed' ? (
            <div className="p-4 border-t border-border bg-paper text-center text-xs text-muted font-medium">
              🔒 Phiên chat này đã kết thúc.
            </div>
          ) : selectedSession.status === 'waiting_staff' ? (
            <div className="p-4 border-t border-border bg-paper text-center text-xs text-teal font-medium flex items-center justify-center gap-2">
              <Inbox size={16} />
              Vui lòng nhấn "Tiếp nhận hỗ trợ" để bắt đầu trả lời tin nhắn của khách hàng.
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex items-end gap-2 px-4 py-3 border-t border-border bg-surface">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Nhập tin nhắn trả lời khách hàng..."
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-border bg-paper outline-none focus:border-teal transition-colors resize-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl bg-saffron hover:bg-saffron-dark disabled:opacity-50 text-paper transition-colors shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted">
          Chọn một phiên chat từ danh sách để bắt đầu trao đổi với khách hàng
        </div>
      )}
    </div>
  );
}