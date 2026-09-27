import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Calendar,
  CreditCard,
  Truck,
  BarChart3,
  Bell,
  Search,
  LogOut,
  Settings,
  Menu,
  X,
  User,
  FileText,
  PenTool,
  Percent,
  MessageSquare
} from "lucide-react";
import { getNotifications } from "../api/authApi";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
  { icon: Stethoscope, label: "Doctors", path: "/admin/doctors" },
  { icon: Users, label: "Patients", path: "/admin/patients" },
  { icon: Calendar, label: "Appointments", path: "/admin/appointments" },
  { icon: MessageSquare, label: "Support Chat", path: "/admin/chat" },
  { icon: PenTool, label: "Blogs", path: "/admin/blogs" },
  { icon: Percent, label: "Coupons", path: "/admin/coupons" },
  { icon: FileText, label: "Legal Documents", path: "/admin/legal-documents" },
  { icon: CreditCard, label: "Payments", path: "/admin/payments" },
  { icon: Truck, label: "Courier Tracking", path: "/admin/courier" },
  { icon: BarChart3, label: "Reports", path: "/admin/reports" },
  { icon: User, label: "Profile", path: "/admin/profile" },
];

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();

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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:self-start ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 text-white decoration-transparent">
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
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 decoration-transparent ${
                  isActive
                    ? "bg-green-600 text-white shadow-md shadow-green-600/20 scale-[1.02]"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className={isActive ? "text-white" : "text-white/70"} />
                <span>{item.label}</span>
              </Link>
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

  useEffect(() => {
    // Only fetch notifications on dashboard page
    const isDashboard = location.pathname === '/admin/dashboard';
    
    if (!isDashboard) {
      // Clear notifications when not on dashboard
      setNotifications([]);
      return;
    }

    fetchNotifications();
  }, [location.pathname]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      if (response.status === 1) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
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
            placeholder="Search patients, doctors..."
            className="w-full h-10 rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-sm outline-hidden focus:border-brand-primary focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right side: notifications + profile */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
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
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.isRead).length} new
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto py-2">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? "bg-green-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notification.isRead && (
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-600 shrink-0" />
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
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center font-bold text-green-700 text-sm border border-green-600/10">
              AD
            </div>
            <span className="text-xs text-gray-400 hidden sm:inline">▾</span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-fadeIn">
              <Link
                to="/admin/profile"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors decoration-transparent"
              >
                <User size={15} className="text-gray-400" />
                Profile
              </Link>
              <button
                onClick={() => {
                  sessionStorage.clear();
                  window.location.href = "/admin/login";
                }}
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
    <footer className="py-5 px-6 border-t border-gray-100 text-center text-xs text-gray-400">
      © {new Date().getFullYear()} Leaf Homeo Care. All rights reserved.
    </footer>
  );
}

export default function AdminLayout({ children }) {
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
