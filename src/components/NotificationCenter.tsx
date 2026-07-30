import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Sparkles, Check, CheckSquare } from 'lucide-react';
import { PushNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  onSelectScholarship: (id: string) => void;
  availableMajors: string[];
}

export default function NotificationCenter({ onSelectScholarship, availableMajors }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('scholarship_notifications_enabled') === 'true';
  });
  const [selectedMajors, setSelectedMajors] = useState<string[]>(() => {
    const stored = localStorage.getItem('scholarship_notifications_majors');
    return stored ? JSON.parse(stored) : [];
  });
  const [notifications, setNotifications] = useState<PushNotification[]>(() => {
    const stored = localStorage.getItem('scholarship_notifications_list');
    if (stored) {
      // Khôi phục lại kiểu ngày tháng
      const list = JSON.parse(stored);
      return list.map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }));
    }
    return [
      {
        id: 'init-1',
        title: '🔔 Đăng ký thành công',
        body: 'Chúc mừng! Bạn đã đăng ký nhận thông báo đẩy cho các học bổng mới nhất.',
        timestamp: new Date(Date.now() - 10 * 60000), // 10 phút trước
        read: false,
      },
      {
        id: 'init-2',
        title: '🎓 Học bổng mới phù hợp',
        body: 'Học bổng Fulbright Thạc sĩ Hoa Kỳ 2026 vừa được mở nộp hồ sơ. Nhấp để xem!',
        timestamp: new Date(Date.now() - 3 * 3600000), // 3 giờ trước
        read: true,
        scholarshipId: 'fulbright-2026',
      }
    ];
  });

  const [activeToast, setActiveToast] = useState<PushNotification | null>(null);

  // Đồng bộ vào localStorage
  useEffect(() => {
    localStorage.setItem('scholarship_notifications_enabled', String(isSubscribed));
    localStorage.setItem('scholarship_notifications_majors', JSON.stringify(selectedMajors));
    localStorage.setItem('scholarship_notifications_list', JSON.stringify(notifications));
  }, [isSubscribed, selectedMajors, notifications]);

  // Mô phỏng thông báo đẩy định kỳ nếu đã đăng ký
  useEffect(() => {
    if (!isSubscribed) return;

    // Mô phỏng một cảnh báo sau 20 giây, rồi lặp lại mỗi 45 giây
    const sendSimulatedNotification = () => {
      const titles = [
        '🌟 Học bổng mới phát hiện',
        '⌛ Hạn chót sắp đến!',
        '🔥 Đang được quan tâm',
        '💎 Học bổng Toàn phần cực Hot'
      ];
      
      const bodies = [
        'Học bổng Đại sứ Vương quốc Anh BUV 2026 vừa được cập nhật thêm chính sách hỗ trợ!',
        'Học bổng Chính phủ Nhật Bản (MEXT) 2026 chỉ còn 28 ngày để nộp hồ sơ.',
        'Học bổng Tài năng VinUniversity đang thu hút hơn 2,500 sinh viên ứng tuyển tuần qua.',
        'Chương trình Erasmus Mundus Joint Masters châu Âu vừa mở đơn vòng tiếp theo.'
      ];

      const linkedIds = [
        'buv-presidents-2026',
        'mext-japan-2026',
        'vinuni-merit-2026',
        'erasmus-mundus-2026'
      ];

      const randomIndex = Math.floor(Math.random() * titles.length);
      const newNotif: PushNotification = {
        id: `sim-${Date.now()}`,
        title: titles[randomIndex],
        body: bodies[randomIndex],
        timestamp: new Date(),
        read: false,
        scholarshipId: linkedIds[randomIndex]
      };

      // Phát âm báo thông báo bằng Web Audio API để chạy được ở nhiều môi trường
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        // Âm báo nhẹ và dễ nghe
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // Nốt C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // Nốt E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // Nốt G5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        // Bỏ qua an toàn nếu âm thanh bị chặn
      }

      setNotifications(prev => [newNotif, ...prev]);
      setActiveToast(newNotif);

      // Tự đóng thông báo sau 6 giây
      setTimeout(() => {
        setActiveToast(curr => curr?.id === newNotif.id ? null : curr);
      }, 6000);
    };

    const initialTimer = setTimeout(sendSimulatedNotification, 25000);
    const intervalTimer = setInterval(sendSimulatedNotification, 55000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isSubscribed]);

  const handleToggleSubscription = () => {
    setIsSubscribed(prev => {
      const next = !prev;
      if (next) {
        // Gửi thông báo chào mừng
        const welcomeNotif: PushNotification = {
          id: `welcome-${Date.now()}`,
          title: '🔔 Đã kích hoạt thông báo đẩy',
          body: 'Bạn sẽ nhận được cảnh báo trực quan khi có học bổng mới cập nhật phù hợp với sở thích.',
          timestamp: new Date(),
          read: false
        };
        setNotifications(curr => [welcomeNotif, ...curr]);
        setActiveToast(welcomeNotif);
        setTimeout(() => {
          setActiveToast(curr => curr?.id === welcomeNotif.id ? null : curr);
        }, 5000);
      }
      return next;
    });
  };

  const handleMajorToggle = (major: string) => {
    setSelectedMajors(prev => {
      if (prev.includes(major)) {
        return prev.filter(m => m !== major);
      } else {
        return [...prev, major];
      }
    });
  };

  const handleSelectAllMajors = () => {
    if (selectedMajors.length === availableMajors.length) {
      setSelectedMajors([]);
    } else {
      setSelectedMajors([...availableMajors]);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: PushNotification) => {
    // Đánh dấu là đã đọc
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setIsOpen(false);
    if (notif.scholarshipId) {
      onSelectScholarship(notif.scholarshipId);
    }
  };

  const triggerTestSimulation = () => {
    if (!isSubscribed) {
      alert('Vui lòng kích hoạt tính năng thông báo trước!');
      return;
    }
    const testNotif: PushNotification = {
      id: `test-${Date.now()}`,
      title: '✨ Phát hiện học bổng Mới tinh!',
      body: 'Học bổng Tài năng VinUniversity 2026 vừa bắt đầu mở cổng nộp hồ sơ trực tuyến!',
      timestamp: new Date(),
      read: false,
      scholarshipId: 'vinuni-merit-2026'
    };
    setNotifications(prev => [testNotif, ...prev]);
    setActiveToast(testNotif);
    setTimeout(() => {
      setActiveToast(curr => curr?.id === testNotif.id ? null : curr);
    }, 6000);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Floating simulated Toast notification in the bottom right */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white rounded-xl shadow-xl border border-[#DCEAF6] overflow-hidden"
            id="toast-notification-popup"
          >
            <div className="p-4 flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F4F8FC] text-[#2C6EAF] flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{activeToast.title}</p>
                <p className="text-xs text-slate-600 mt-1">{activeToast.body}</p>
                {activeToast.scholarshipId && (
                  <button
                    onClick={() => {
                      if (activeToast.scholarshipId) onSelectScholarship(activeToast.scholarshipId);
                      setActiveToast(null);
                    }}
                    className="mt-2.5 text-xs font-semibold text-[#2C6EAF] hover:text-[#1E5084] flex items-center gap-1 cursor-pointer"
                  >
                    Xem ngay hồ sơ &rarr;
                  </button>
                )}
              </div>
              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-slate-600 self-start"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="h-1 bg-[#2C6EAF] animate-[shrink_6s_linear_forwards]" style={{ transformOrigin: 'left' }}></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Notification Bell Widget in top header */}
      <div className="relative" id="notification-center-widget">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer ${
            isOpen 
              ? 'bg-[#F4F8FC] border-[#DCEAF6] text-[#2C6EAF]' 
              : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
          }`}
          title="Thông báo học bổng mới"
          id="btn-bell-toggle"
        >
          <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-sans font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Box */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backing overlay to close */}
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
              
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                id="notification-dropdown-panel"
              >
                {/* Header */}
                <div className="bg-slate-50 px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-[#2C6EAF]" />
                    <span className="font-sans font-bold text-sm text-slate-900">Thông báo học bổng</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {notifications.length > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs font-semibold text-[#2C6EAF] hover:text-[#1E5084]"
                      >
                        Đọc tất cả
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subscription Control Panel inside Bell */}
                <div className="p-4 border-b border-slate-100 bg-[#F4F8FC]/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Nhận thông báo đẩy
                    </span>
                    <button
                      onClick={handleToggleSubscription}
                      className={`relative inline-flex h-5.5 w-10.5 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isSubscribed ? 'bg-[#2C6EAF]' : 'bg-slate-200'
                      }`}
                      id="toggle-push-notifications"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                          isSubscribed ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {isSubscribed ? (
                    <div className="mt-3">
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                        Chọn ngành nghề học thuật bạn muốn ưu tiên nhận tin:
                      </p>
                      
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 max-h-[110px] overflow-y-auto pr-1">
                        {availableMajors.map(major => {
                          const isMajorSubbed = selectedMajors.includes(major);
                          return (
                            <button
                              key={major}
                              onClick={() => handleMajorToggle(major)}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded text-left text-xs font-medium transition-all ${
                                isMajorSubbed 
                                  ? 'bg-[#F4F8FC] text-[#2C6EAF] border border-[#DCEAF6]' 
                                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 border-slate-300">
                                {isMajorSubbed && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                              </div>
                              <span className="truncate select-none">{major}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                        <button
                          onClick={handleSelectAllMajors}
                          className="text-[10px] text-slate-500 hover:text-[#2C6EAF] font-semibold"
                        >
                          {selectedMajors.length === availableMajors.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                        <button
                          onClick={triggerTestSimulation}
                          className="bg-amber-550 hover:bg-amber-600 text-white font-sans font-bold text-[10px] px-2 py-1 rounded transition-all"
                          title="Tạo thử một học bổng mới để xem hệ thống thông báo đẩy bắn ra"
                          id="btn-simulate-push"
                        >
                          Mô phỏng tin mới ⚡
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <BellOff className="w-5 h-5 text-slate-400 shrink-0" />
                      <p className="text-xs text-slate-500 leading-normal">
                        Bật thông báo đẩy để không bỏ lỡ các suất học bổng toàn phần xuất sắc từ các đại sứ quán và tổ chức lớn.
                      </p>
                    </div>
                  )}
                </div>

                {/* Notifications History */}
                <div className="max-h-[250px] overflow-y-auto" id="notification-history-list">
                  {notifications.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Không có thông báo mới nào</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${
                          !notif.read ? 'bg-[#F4F8FC]/30' : ''
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-[#2C6EAF] mt-1.5 shrink-0 opacity-100" style={{ opacity: notif.read ? 0 : 1 }}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{notif.body}</p>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {notif.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {notif.timestamp.toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                    <button
                      onClick={handleClearNotifications}
                      className="text-[11px] font-semibold text-slate-500 hover:text-rose-500 transition-colors py-1 px-3"
                    >
                      Xóa toàn bộ lịch sử
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
