import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { Users, Calendar, Clock, CheckCircle, Stethoscope, Video, Star, ArrowRight, Trash2, X, MessageSquare, Bell, CheckCheck } from "lucide-react";
import { getUser } from "../../api/authApi";
import { getDoctorAppointments } from "../../api/doctorApi";
import { useDoctorNotifications } from "../../components/DoctorLayout";

function formatShortDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatTimeDifference(dateString) {
  const now = new Date();
  const appointmentTime = new Date(dateString);
  const diffMs = appointmentTime - now;

  if (diffMs <= 0) return "Call ended";

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = diffHours / 24;

  if (diffDays >= 1) {
    return `${diffDays.toFixed(1)} days`;
  } else if (diffHours >= 1) {
    return `${diffHours} hr`;
  } else {
    return `${diffMinutes} min`;
  }
}

function StatCard({ label, value, icon: Icon, highlight, color, bg }) {
  if (highlight) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-primary to-brand-hover p-6 text-white shadow-lg shadow-brand-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl flex-1 min-w-[240px]">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Icon size={120} />
        </div>
        <p className="text-sm font-medium text-white/90 flex items-center gap-2">
          <Icon size={18} />
          {label}
        </p>
        <p className="mt-4 text-3xl font-extrabold tracking-tight">{value}</p>
        <p className="mt-2 text-xs font-medium text-white/80 flex items-center gap-1">
          Live statistics
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex-1 min-w-[240px]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
      <p className="mt-2 text-xs font-medium text-gray-400 flex items-center gap-1">
        Live statistics
      </p>
    </div>
  );
}

function DashboardContent() {
  const navigate = useNavigate();
  const { notifications, handleNotificationClick, handleMarkAllAsRead, handleDeleteNotification, showDashboardNotifications } = useDoctorNotifications();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
  });
  const [canStartCall, setCanStartCall] = useState(false);
  const [timeUntilCall, setTimeUntilCall] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch doctor profile
        const userResponse = await getUser();
        if (userResponse.status === 1) {
          setDoctorData(userResponse.data);
        }

        // Fetch appointments for stats
        const appointmentsResponse = await getDoctorAppointments("all");
        if (appointmentsResponse.status === 1) {
          const appointments = appointmentsResponse.data || [];
          const today = new Date().toDateString();

          setStats({
            totalPatients: [...new Set(appointments.map(a => a.patientId))].length,
            todayAppointments: appointments.filter(a =>
              new Date(a.appointmentDateTime).toDateString() === today
            ).length,
            completedAppointments: appointments.filter(a => a.status === "completed").length,
            pendingAppointments: appointments.filter(a => a.status === "pending").length,
          });

          // Get next upcoming appointment
          const upcoming = appointments
            .filter(a => (a.status === "accepted" || a.status === "paid") && new Date(a.appointmentDateTime) > new Date())
            .sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime))[0];

          if (upcoming) {
            setUpcomingAppointment(upcoming);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Use mock data if API fails
        setDoctorData({
          id: 1,
          name: "Dr. Rajesh Kumar",
          email: "dr.rajesh@leafhomeo.com",
          mobile: "+91 98765 43210",
          specialization: "Homeopathy",
          qualification: "BHMS, MD",
          experience: "15 years",
        });
        setStats({
          totalPatients: 156,
          todayAppointments: 8,
          completedAppointments: 342,
          pendingAppointments: 12,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check if call can be started (10 minutes before appointment)
  useEffect(() => {
    if (upcomingAppointment) {
      const appointmentTime = new Date(upcomingAppointment.appointmentDateTime);
      const now = new Date();
      const timeDiff = appointmentTime - now;
      const minutesBefore = 10;

      const canStart = timeDiff <= minutesBefore * 60 * 1000 && timeDiff > -30 * 60 * 1000;
      setCanStartCall(canStart);

      if (timeDiff > 0) {
        setTimeUntilCall(formatTimeDifference(upcomingAppointment.appointmentDateTime));
      } else {
        setTimeUntilCall("Call ended");
      }
    }
  }, [upcomingAppointment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Notification Section */}
      {showDashboardNotifications && notifications.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-primary" />
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-brand-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
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
                Mark all as read
              </button>
            )}
          </div>
          <div className="space-y-2">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                  !notification.isRead
                    ? 'bg-gradient-to-r from-brand-light/40 to-white border-brand-primary/30 shadow-sm shadow-brand-primary/10 hover:shadow-md hover:shadow-brand-primary/20'
                    : 'bg-white border-gray-100 hover:border-gray-200'
                }`}
              >
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary" />
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-bold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{notification.message}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Professional Hero Banner */}
      <div className="relative overflow-hidden bg-brand-dark rounded-2xl p-8 text-white shadow-lg shadow-brand-primary/20 mb-8 border border-white/10">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest bg-white/10 text-green-300 border border-green-300/30 px-3 py-1.5 rounded-full">
              🌿 Expert Homeopathy Care
            </span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold max-w-xl leading-tight tracking-tight font-sans mb-3">
            Your Practice, <span className="text-green-300 font-black">ELEVATED & Streamlined</span>
          </h2>
          <p className="text-white/80 text-xs sm:text-sm mt-3 max-w-xl font-medium leading-relaxed">
            Manage your consultations, appointments, and patient records with our advanced platform designed for modern homeopathy practitioners.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          highlight={true}
          color="text-white"
          bg="bg-white/10"
        />
        <StatCard
          label="Today's Appointments"
          value={stats.todayAppointments}
          icon={Calendar}
          color="text-brand-primary"
          bg="bg-brand-light"
        />
        <StatCard
          label="Completed"
          value={stats.completedAppointments}
          icon={CheckCircle}
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          label="Pending Requests"
          value={stats.pendingAppointments}
          icon={Clock}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Upcoming Appointment Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-base font-extrabold text-gray-900 tracking-tight">Upcoming Consultation</h4>
          <button
            onClick={() => navigate("/doctor/appointments")}
            className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        {upcomingAppointment ? (
          <div className="bg-gradient-to-br from-brand-light/30 to-white p-5 rounded-xl border border-brand-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-brand-light to-brand-primary/20 overflow-hidden border-2 border-white shadow-md shrink-0">
                  <img
                    src={upcomingAppointment.patientImage || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"}
                    alt={upcomingAppointment.patientName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{upcomingAppointment.patientName}</p>
                  <p className="text-xs text-brand-primary font-bold mt-0.5">{upcomingAppointment.reason || "General Consultation"}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold mt-1">
                    <span>📅 {formatShortDate(upcomingAppointment.appointmentDateTime)}</span>
                    <span>⏰ {formatTime(upcomingAppointment.appointmentDateTime)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {canStartCall ? (
                  <button
                    onClick={() => navigate(`/doctor/video-call?appointmentId=${upcomingAppointment.id}`)}
                    className="px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Video className="h-4 w-4" /> Start Call
                  </button>
                ) : (
                  <div className="px-6 py-3 bg-gray-100 text-gray-400 text-sm font-bold rounded-xl flex items-center gap-2 cursor-not-allowed">
                    <Video className="h-4 w-4" /> {timeUntilCall}
                  </div>
                )}
                {upcomingAppointment.status === 'paid' && (
                  <button
                    onClick={() => navigate(`/doctor/chat?patient=${upcomingAppointment.patientId}`)}
                    className="px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold rounded-xl flex items-center gap-2 transition-all border border-blue-200 cursor-pointer"
                  >
                    <MessageSquare className="h-4 w-4" /> Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-gray-500">
            <Calendar className="h-12 w-12" />
            <p className="text-sm">No upcoming appointments</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <button
          onClick={() => navigate("/doctor/appointment-requests")}
          className="group bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-brand-light flex items-center justify-center group-hover:bg-brand-primary transition-colors">
              <Calendar className="h-6 w-6 text-brand-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <h5 className="font-bold text-gray-900">Appointment Requests</h5>
              <p className="text-xs text-gray-500">Review & Accept</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-primary">{stats.pendingAppointments} pending</span>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-brand-primary transition-colors" />
          </div>
        </button>

        <button
          onClick={() => navigate("/doctor/appointments")}
          className="group bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
              <Users className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h5 className="font-bold text-gray-900">My Appointments</h5>
              <p className="text-xs text-gray-500">View Schedule</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600">{stats.todayAppointments} today</span>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </button>

        <button
          onClick={() => navigate("/doctor/profile")}
          className="group bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center group-hover:bg-green-600 transition-colors">
              <Stethoscope className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h5 className="font-bold text-gray-900">My Profile</h5>
              <p className="text-xs text-gray-500">Update Details</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-green-600">Edit Profile</span>
            <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </button>
      </div>

      {/* Live Status Indicator */}
      <div className="mt-8 bg-gradient-to-r from-brand-light/50 to-white rounded-2xl p-4 border border-brand-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-brand-primary animate-pulse"></div>
          <span className="text-sm font-bold text-gray-900">You are online and available for consultations</span>
        </div>
        <span className="text-xs font-bold text-brand-primary bg-white px-3 py-1.5 rounded-full border border-brand-primary/20">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span> Live
        </span>
      </div>
    </>
  );
}

export default function DoctorDashboard() {
  return (
    <DoctorLayout>
      <DashboardContent />
    </DoctorLayout>
  );
}
