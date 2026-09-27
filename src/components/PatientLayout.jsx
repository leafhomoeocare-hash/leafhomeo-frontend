import { useState, useEffect, useRef } from "react";
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
  BookOpen
} from "lucide-react";
import { getNotifications, deleteNotification } from "../api/authApi";
import { useNotification } from "../context/NotificationContext";

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
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
          <Link to="/patient/dashboard" className="flex items-center gap-2.5 text-white decoration-transparent">
            <img
              src="/logo.png"
              alt="Leaf Homeo"
              className="h-14 w-auto object-contain"
            />
            <span className="font-sans text-lg font-bold tracking-tight">
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
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left ${
                  isActive 
                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20 scale-[1.02]" 
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-white/70"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

function TopHeader({ setSidebarOpen }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showCustomToast, addToastWithNotification } = useNotification();
  const seenNotificationIds = useRef(new Set());
  const initialLoadDone = useRef(false);

  const fetchNotifications = async (showToasts = false) => {
    try {
      if (!showToasts) setLoading(true);
      const response = await getNotifications();
      if (response.status === 1) {
        const fetchedNotifications = response.data || [];
        setNotifications(fetchedNotifications);

        if (showToasts) {
          let newToastCount = 0;
          fetchedNotifications.forEach((notification) => {
            if (!notification.isRead && !seenNotificationIds.current.has(notification.id)) {
              seenNotificationIds.current.add(notification.id);
              newToastCount++;
              console.log(" New notification toast:", notification.id, notification.title);
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
          console.log(" New toasts shown this cycle:", newToastCount);
        } else if (!initialLoadDone.current) {
          fetchedNotifications.forEach((notification) => {
            seenNotificationIds.current.add(notification.id);
          });
          initialLoadDone.current = true;
          console.log(" Initial load done - marked all as seen");
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      if (!showToasts) setLoading(false);
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

    // Initial fetch - show toasts for existing unread notifications
    fetchNotifications(true);

    // Setup polling every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleNotificationClick = async (notification) => {
    try {
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
      
      // Delete notification from database
      await deleteNotification(notification.id);
      // Remove from local state
      setNotifications(prev =>
        prev.filter(n => n.id !== notification.id)
      );
    } catch (error) {
      console.error('Error handling notification click:', error);
    }

    setShowNotifications(false);
  };

  const handleLogout = () => {
    sessionStorage.clear();
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
            onClick={() => {
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
                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                <span className="text-xs font-semibold text-brand-primary bg-brand-light px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.isRead).length} new
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto py-2">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? "bg-brand-light/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.isRead && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">Notification</p>
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
            <div className="h-9 w-9 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-sm border border-brand-primary/10 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" 
                alt="User profile" 
                className="w-full h-full object-cover"
              />
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

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] text-gray-800 font-sans antialiased">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 flex-col min-h-screen">
        <TopHeader setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 px-6 py-8 md:px-8 relative">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
