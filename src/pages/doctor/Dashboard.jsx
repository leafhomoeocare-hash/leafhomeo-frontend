import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { Users, Calendar, Clock, CheckCircle, Stethoscope, Video, Star, ArrowRight, Trash2, X, MessageSquare } from "lucide-react";
import { getUser } from "../../api/authApi";
import { getDoctorAppointments } from "../../api/doctorApi";
import { getNotifications, deleteNotification } from "../../api/authApi";

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
        <p className="mt-2 text-xs font-semibold text-white/75 flex items-center gap-1">
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

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
  });
  const [notifications, setNotifications] = useState([]);
  const [canStartCall, setCanStartCall] = useState(false);
  const [timeUntilCall, setTimeUntilCall] = useState(null);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      if (response.status === 1) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      // Check if notification still exists before deleting
      const exists = notifications.find(n => n.id === notificationId);
      if (!exists) return;

      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Navigate based on notification type
      if (notification.type === 'appointment_request') {
        navigate('/doctor/appointment-requests');
      } else if (notification.type === 'payment_required') {
        navigate('/doctor/appointments');
      } else if (notification.type === 'appointment_reminder') {
        navigate('/doctor/appointments');
      } else if (notification.type === 'payment_reminder') {
        navigate('/doctor/appointments');
      } else if (notification.type === 'chat_message') {
        navigate('/doctor/chat');
      } else if (notification.referenceId) {
        // Generic navigation based on reference
        navigate('/doctor/appointments');
      }
      
      // Delete notification after click
      await handleDeleteNotification(notification.id);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

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

        // Fetch notifications
        fetchNotifications();
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
          completedAppointments: 142,
          pendingAppointments: 5,
        });

        setUpcomingAppointment({
          id: 1,
          patientName: "Rahul Sharma",
          patientImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          appointmentDateTime: new Date().toISOString(),
          status: "Confirmed",
          reason: "Follow-up consultation for chronic migraine treatment",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Poll notifications every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Check if call can be started (10 minutes before appointment)
  useEffect(() => {
    if (!upcomingAppointment) {
      setCanStartCall(false);
      setTimeUntilCall(null);
      return;
    }

    const checkCallTime = () => {
      const now = new Date();
      const appointmentTime = new Date(upcomingAppointment.appointmentDateTime);
      const timeDiff = appointmentTime - now;
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds

      if (timeDiff <= tenMinutes && timeDiff > 0) {
        setCanStartCall(true);
        const minutesLeft = Math.floor(timeDiff / (60 * 1000));
        setTimeUntilCall(`${minutesLeft} min`);
      } else if (timeDiff <= 0) {
        setCanStartCall(true);
        setTimeUntilCall("Now");
      } else {
        setCanStartCall(false);
        const minutesLeft = Math.ceil(timeDiff / (60 * 1000));
        setTimeUntilCall(`${minutesLeft} min`);
      }
    };

    checkCallTime();
    const checkInterval = setInterval(checkCallTime, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, [upcomingAppointment]);

  return (
    <DoctorLayout>
      {/* Notification Cards */}
      <div className="space-y-2 mb-6">
        {notifications.slice(0, 3).map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              !notification.isRead
                ? 'bg-brand-light/30 border-brand-primary/20'
                : 'bg-gray-50/50 border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{notification.title}</p>
                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
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

          <p className="text-sm text-gray-200 max-w-xl mb-6 leading-relaxed">
            Manage patient consultations, prescriptions, and appointments with advanced clinical precision. Traditional healing meets modern technology.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/doctor/patients")}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all cursor-pointer shadow-lg shadow-green-600/30"
            >
              View Patient Records
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards - Professional Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Today's Appointments" 
          value={stats.todayAppointments} 
          icon={Calendar} 
          highlight={true}
        />
        <StatCard 
          label="Total Patients" 
          value={stats.totalPatients} 
          icon={Users} 
          color="text-blue-600" 
          bg="bg-blue-50" 
        />
        <StatCard 
          label="Completed" 
          value={stats.completedAppointments} 
          icon={CheckCircle} 
          color="text-emerald-600" 
          bg="bg-emerald-50" 
        />
        <StatCard 
          label="Pending" 
          value={stats.pendingAppointments} 
          icon={Clock} 
          color="text-amber-600" 
          bg="bg-amber-50" 
        />
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left Large Panel: Next Consultation Box */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 flex flex-col justify-between shadow-lg shadow-gray-100/50">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
                <Video size={18} className="text-brand-primary" />
              </div>
              <h4 className="text-base font-extrabold text-gray-900 tracking-tight">Next Scheduled Consultation</h4>
            </div>
            <button 
              onClick={() => navigate("/doctor/appointments")}
              className="text-xs font-bold text-brand-primary hover:underline cursor-pointer flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          
          {upcomingAppointment ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-light/50 to-white p-5 rounded-xl border border-brand-primary/20">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-white overflow-hidden border-2 border-brand-primary/20 shrink-0 shadow-sm">
                    <img 
                      src={upcomingAppointment.patientImage}
                      alt={upcomingAppointment.patientName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">{upcomingAppointment.patientName}</p>
                      <span className="text-[10px] font-extrabold bg-brand-primary text-white px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">
                        {upcomingAppointment.status}
                      </span>
                    </div>
                    <p className="text-xs text-brand-primary font-bold mt-1">
                      Patient Consultation
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-semibold mt-1.5">
                      <span className="flex items-center gap-1">📅 {formatShortDate(upcomingAppointment.appointmentDateTime)}</span>
                      <span className="flex items-center gap-1">⏰ {formatTime(upcomingAppointment.appointmentDateTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-50/80 p-4 rounded-xl border border-gray-100 mt-4">
                {upcomingAppointment.reason}
              </p>

              <div className="mt-5 flex gap-3">
                {canStartCall ? (
                  <button 
                    onClick={() => {
                      console.log("Upcoming appointment object:", upcomingAppointment);
                      console.log("Appointment ID:", upcomingAppointment.id);
                      if (!upcomingAppointment.id) {
                        console.error("Appointment ID is missing!");
                        return;
                      }
                      navigate(`/doctor/video-call?appointmentId=${upcomingAppointment.id}`);
                    }}
                    className="flex-1 bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Video className="h-4 w-4" /> Start Video Call
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                    <Clock className="h-4 w-4" /> Call available in {timeUntilCall}
                  </div>
                )}
                <button 
                  onClick={() => navigate(`/chat?patient=${upcomingAppointment.patientUserId}`)}
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all border border-blue-200 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" /> Chat with Patient
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Calendar className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500 text-sm">No upcoming appointments</p>
            </div>
          )}
        </div>

        {/* Right Status Panel: Practice Overview */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col justify-between shadow-lg shadow-gray-100/50">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center">
              <Users size={18} className="text-brand-primary" />
            </div>
            <h4 className="text-base font-extrabold text-gray-900 tracking-tight">Practice Overview</h4>
          </div>
          
          <div className="space-y-3 flex-grow">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-light/40 to-white border border-brand-primary/20 rounded-xl hover:shadow-md transition-all">
              <span className="text-xs font-bold text-brand-dark flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shadow-sm"></span> Today
              </span>
              <span className="text-xs font-bold text-brand-primary bg-white border border-brand-primary/30 px-3 py-1.5 rounded-lg shadow-sm">{stats.todayAppointments}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-white border border-blue-100 rounded-xl hover:shadow-md transition-all">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-sm"></span> Total Patients
              </span>
              <span className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm">{stats.totalPatients}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/50 to-white border border-emerald-100 rounded-xl hover:shadow-md transition-all">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm"></span> Completed
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-sm">{stats.completedAppointments}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50/50 to-white border border-amber-100 rounded-xl hover:shadow-md transition-all">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></span> Pending
              </span>
              <span className="text-xs font-bold text-amber-600 bg-white border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm">{stats.pendingAppointments}</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
            <span>Updated just now</span>
            <span className="flex items-center gap-1 text-brand-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span> Live
            </span>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
