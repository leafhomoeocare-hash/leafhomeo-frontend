import { useState, useEffect, useRef, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Package,
  FileText,
  Bell,
  Search,
  LogOut,
  Settings,
  Menu,
  X,
  User,
  Users,
  HeartPulse,
  BookOpen,
  CheckCheck
} from "lucide-react";
import { getNotifications, deleteNotification, getUser, markNotificationAsRead, markAllNotificationsAsRead } from "../api/authApi";
import { useNotification } from "../context/NotificationContext";
import { getImageUrl, getUserInitials } from "../utils/imageHelper";

const PatientNotificationsContext = createContext(null);

export const usePatientNotifications = () => {
  const context = useContext(PatientNotificationsContext);
  if (!context) {
    throw new Error('usePatientNotifications must be used within PatientLayout');
  }
  return context;
};

// Brand color - kept for compatibility
export const BRAND = "#00B100";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/patient/dashboard" },
  { icon: Calendar, label: "Book Appointment", path: "/patient/book" },
  { icon: FileText, label: "My Appointments", path: "/patient/appointments" },
  { icon: Users, label: "Doctors", path: "/patient/doctors" },
  { icon: BookOpen, label: "Blog", path: "/patient/blog" },
  { icon: User, label: "Profile", path: "/patient/profile" },
];

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    if (item.action === "book") {
    navigate(item.path);
    } else if (item.path === "/patient/doctors") {
      navigate(item.path + "?showList=true");
    } else {
      navigate(item.path);
    }
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-dark text-white transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-white/10">
          <Link to="/patient/dashboard" className="flex items-center gap-2 text-white decoration-transparent">
            <img
              src="/logo.png"
              alt="Leaf Homeo"
              className="h-10 w-auto object-contain"
            />
            <span className="font-sans text-sm font-bold tracking-tight">
              Leaf Homeo
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 hover:bg-white/10 lg:hidden text-white/80"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 w-full text-left ${
                  isActive 
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20 scale-[1.02]" 
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-white/70"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function TopHeader({ setSidebarOpen, notifications, setNotifications, handleNotificationClick, handleMarkAllAsRead, user }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    const currentStorageKey = `seenNotificationIds_${user?.id || 'patient'}`;
    const currentDashboardKey = `dashboardSeenNotificationIds_${user?.id || 'patient'}`;
    sessionStorage.clear();
    sessionStorage.removeItem(currentStorageKey);
    sessionStorage.removeItem(currentDashboardKey);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-6 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="relative hidden sm:block w-72 md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search doctors, appointments..."
            className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-sm outline-hidden focus:border-brand-primary focus:bg-white focus:ring-2 focus:ring-brand-primary/20 transition-all"
          />
        </div>

        {/* Brand indicator for mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <HeartPulse className="text-brand-primary" size={20} />
          <span className="font-bold text-gray-800 text-sm">Patient Portal</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold bg-brand-light text-brand-dark px-3 py-1 rounded-full border border-brand-primary/10">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
          Patient Dashboard
        </div>
      </div>

      {/* Right side: notifications + profile */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            aria-label="Notifications"
            onClick={async () => {
              if (!showNotifications && notifications.filter(n => !n.isRead).length > 0) {
                // Mark all as read when opening notification dropdown
                await handleMarkAllAsRead();
              }
              setShowNotifications(!showNotifications);
            }}
            className="relative rounded-xl p-2.5 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <Bell size={18} />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-fadeIn">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="text-xs font-semibold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full">
                      {notifications.filter(n => !n.isRead).length} new
                    </span>
                  )}
                </div>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck size={12} />
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto py-2">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-all relative ${
                        !notification.isRead
                          ? "bg-gradient-to-r from-brand-light/40 to-white border-l-2 border-l-brand-primary"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.isRead && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0 animate-pulse" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title || 'Notification'}
                          </p>
                          <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 px-3 py-2">
                <button
                  onClick={() => { navigate("/patient/notifications"); setShowNotifications(false); }}
                  className="w-full text-center text-xs font-bold text-brand-primary hover:underline"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-secondary text-sm border border-brand-primary/10 overflow-hidden">
              {user?.image ? (
                <img 
                  src={getImageUrl(user.image)} 
                  alt="User profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getUserInitials(user?.name, 'PT')}</span>
              )}
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">▾</span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-fadeIn">
              <button 
                onClick={() => { navigate("/patient/profile"); setShowProfileMenu(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User size={15} className="text-gray-400" />
                Profile
              </button>
              <button 
                onClick={() => { navigate("/patient/profile/edit"); setShowProfileMenu(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings size={15} className="text-gray-400" />
                Complete Profile
              </button>
              <button 
                onClick={() => { navigate("/patient/profile/change-password"); setShowProfileMenu(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings size={15} className="text-gray-400" />
                Change Password
              </button>
              <button 
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg border-t border-gray-50 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} className="text-red-400" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="py-5 px-6 border-t border-gray-100 text-center">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-gray-400">
        <span>© {new Date().getFullYear()} Leaf Homeo Care. All rights reserved.</span>
        <span className="hidden sm:inline">|</span>
        <div className="flex items-center gap-4">
          <Link to="/patient/privacy-policy" className="hover:text-brand-primary transition-colors">
            Privacy Policy
          </Link>
          <Link to="/patient/terms-conditions" className="hover:text-brand-primary transition-colors">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function PatientLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { addToastWithNotification, toasts, removeToast } = useNotification();
  const storageKey = `seenNotificationIds_${user?.id || 'patient'}`;
  const [seenNotificationIds, setSeenNotificationIds] = useState(() => {
    return new Set(JSON.parse(sessionStorage.getItem(storageKey) || '[]'));
  });
  const dashboardSeenKey = `dashboardSeenNotificationIds_${user?.id || 'patient'}`;
  const [dashboardSeenIds, setDashboardSeenIds] = useState(() => {
    return new Set(JSON.parse(sessionStorage.getItem(dashboardSeenKey) || '[]'));
  });
  const [showDashboardNotifications, setShowDashboardNotifications] = useState(false);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getUser();
        if (response.status === 1) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // Reload seen notifications when user changes
  useEffect(() => {
    const key = `seenNotificationIds_${user?.id || 'patient'}`;
    const saved = JSON.parse(sessionStorage.getItem(key) || '[]');
    setSeenNotificationIds(new Set(saved));

    const dashboardKey = `dashboardSeenNotificationIds_${user?.id || 'patient'}`;
    const dashboardSaved = JSON.parse(sessionStorage.getItem(dashboardKey) || '[]');
    setDashboardSeenIds(new Set(dashboardSaved));
  }, [user?.id]);

  const fetchNotifications = async (showToasts = false) => {
    try {
      const response = await getNotifications();
      if (response.status === 1) {
        const fetchedNotifications = response.data || [];
        setNotifications(fetchedNotifications);

        // Filter notifications for dashboard section - only show new ones
        const newDashboardNotifications = fetchedNotifications.filter(n => !dashboardSeenIds.has(n.id));
        const hasNewNotifications = newDashboardNotifications.length > 0;

        console.log("🆕 [Patient] New dashboard notifications:", newDashboardNotifications.length);
        console.log("� [Patient] Dashboard seen IDs:", [...dashboardSeenIds]);

        if (hasNewNotifications) {
          setShowDashboardNotifications(true);
          // Mark these as seen for dashboard
          const newDashboardSeenIds = new Set(dashboardSeenIds);
          newDashboardNotifications.forEach(n => newDashboardSeenIds.add(n.id));
          setDashboardSeenIds(newDashboardSeenIds);
          sessionStorage.setItem(dashboardSeenKey, JSON.stringify([...newDashboardSeenIds]));

          // Mark all unread notifications as read when shown on dashboard
          const unreadNotifications = newDashboardNotifications.filter(n => !n.isRead);
          if (unreadNotifications.length > 0) {
            console.log("📖 [Patient] Marking notifications as read:", unreadNotifications.length);
            unreadNotifications.forEach(async (notification) => {
              try {
                await markNotificationAsRead(notification.id);
              } catch (error) {
                console.error("Error marking notification as read:", error);
              }
            });
          }
        } else {
          setShowDashboardNotifications(false);
        }

        if (showToasts) {
          let newToastCount = 0;
          const newSeenIds = new Set(seenNotificationIds);
          console.log("📊 [Patient] Total notifications:", fetchedNotifications.length);
          console.log("👀 [Patient] Current seen IDs:", [...seenNotificationIds]);

          fetchedNotifications.forEach((notification) => {
            const isUnread = !notification.isRead;
            const isNotSeen = !newSeenIds.has(notification.id);

            console.log(`🔍 [Patient] Notification ${notification.id}: isRead=${!isUnread}, alreadySeen=${!isNotSeen}, title="${notification.title}"`);

            // Show toast if unread AND not seen before
            if (isUnread && isNotSeen) {
              newSeenIds.add(notification.id);
              newToastCount++;
              console.log("✅ [Patient] SHOWING toast for:", notification.id, notification.title);
              addToastWithNotification(
                {
                  title: notification.title || "Notification",
                  message: notification.message,
                  type: notification.type || "info",
                  position: 'top-end',
                  duration: 0,
                  showCloseButton: true
                },
                notification.id
              );
            }
          });
          setSeenNotificationIds(newSeenIds);
          sessionStorage.setItem(storageKey, JSON.stringify([...newSeenIds]));
          console.log("💾 [Patient] Saved seen IDs:", [...newSeenIds]);
          console.log("🎯 [Patient] Total toasts shown:", newToastCount);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    // Only fetch notifications on dashboard page
    const isDashboard = location.pathname === '/patient/dashboard';

    if (!isDashboard) {
      // Clear notifications when not on dashboard
      setNotifications([]);
      return;
    }

    // Fetch notifications first
    fetchNotifications(true);
  }, [location.pathname]);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read before navigating
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      }

      // Navigate based on notification type
      if (notification.type === 'appointment_request') {
        navigate('/patient/appointments');
      } else if (notification.type === 'payment_required') {
        navigate('/patient/appointments');
      } else if (notification.type === 'appointment_reminder') {
        navigate('/patient/appointments');
      } else if (notification.type === 'payment_reminder') {
        navigate('/patient/appointments');
      } else if (notification.type === 'chat_message') {
        navigate('/patient/chat');
      } else if (notification.referenceId) {
        // Generic navigation based on reference
        navigate('/patient/appointments');
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const contextValue = {
    notifications,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleDeleteNotification,
    showDashboardNotifications
  };

  return (
    <PatientNotificationsContext.Provider value={contextValue}>
      <div className="flex min-h-screen bg-[#F8F9FA] text-gray-800 font-sans antialiased">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex flex-1 flex-col min-h-screen">
          <TopHeader
            setSidebarOpen={setSidebarOpen}
            notifications={notifications}
            setNotifications={setNotifications}
            handleNotificationClick={handleNotificationClick}
            handleMarkAllAsRead={handleMarkAllAsRead}
            user={user}
          />

          <main className="flex-1 px-6 py-8 md:px-8 relative">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>

          <Footer />
        </div>
      </div>
    </PatientNotificationsContext.Provider>
  );
}
