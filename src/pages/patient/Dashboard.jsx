import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import { Video, Star, Calendar, Package, MessageSquare, ArrowRight, ArrowLeft, Clock, ShieldAlert, User, Mail, Phone, MapPin, Edit, X, Save } from "lucide-react";
import { getUpcomingAppointments } from "../../api/appointmentApi";
import { getExpertDoctors } from "../../api/doctorApi";
import { getUser, updateProfile, getNotifications, deleteNotification } from "../../api/authApi";
import Swal from "sweetalert2";

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [expertDoctors, setExpertDoctors] = useState([]);
  const [notifications, setNotifications] = useState([]);

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
      
      // Delete notification after click
      await handleDeleteNotification(notification.id);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  useEffect(() => {
    fetchUpcomingAppointment();
    fetchExpertDoctors();
    fetchNotifications();

    // Poll notifications every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const fetchExpertDoctors = async () => {
    try {
      const response = await getExpertDoctors();
      if (response.status === 1) {
        setExpertDoctors(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch expert doctors:", err);
    }
  };

  const fetchUpcomingAppointment = async () => {
    try {
      const response = await getUpcomingAppointments();
      if (response.status === 1 && response.data && response.data.length > 0) {
        setUpcomingAppointment(response.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch upcoming appointment:", err);
    }
  };

  const handleUpdatePatient = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await updateProfile(patientData);
      if (response.status === 1) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Profile updated successfully!",
          confirmButtonColor: "#10b981"
        });
        setEditModalOpen(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || "Failed to update profile",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async () => {
    try {
      const response = await getUser();
      if (response.status === 1) {
        const data = response.data;
        setPatientData({
          id: data.id,
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || "",
          gender: data.gender || "",
          dob: data.dob || "",
          houseNumber: data.houseNumber || "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          landmark: data.landmark || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          country: data.country || "",
        });
        setEditModalOpen(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || "Failed to fetch profile",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
        confirmButtonColor: "#10b981"
      });
    }
  };

  return (
    <PatientLayout>
      <>
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

      {/* Hero Section Card */}
      <div className="relative overflow-hidden bg-brand-dark rounded-2xl p-8 text-white shadow-lg mb-6 border border-white/5 animate-scaleUp">
        {/* Soft Background Radial Light */}
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-brand-primary/10 blur-3xl translate-x-12 -translate-y-12" />
        
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest bg-white/10 text-brand-primary border border-brand-primary/20 px-3 py-1 rounded-full mb-4">
          🌿 NEW ERA OF HEALING
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold max-w-xl leading-tight tracking-tight font-sans">
          Your Health Journey, <span className="text-brand-primary font-black">SIMPLIFIED</span> & Personalized.
        </h2>
        <p className="text-white/80 text-xs sm:text-sm mt-3 max-w-xl font-medium leading-relaxed">
          Connect with world-class homeopathy experts through high-definition video consultations. Advanced clinical precision meets traditional botanical wisdom.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all cursor-pointer">
            View Medical Records
          </button>
        </div>
      </div>

      {/* Profile Actions Card */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-extrabold text-gray-900 tracking-tight">Profile Management</h4>
            <p className="text-xs text-gray-400 mt-0.5">Update your personal information</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openEditModal}
              className="flex items-center gap-2 bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border border-brand-primary/20"
            >
              <Edit size={14} /> Edit Profile
            </button>
          </div>
        </div>
      </div>


      {/* Main Workspace Layout (Consultation Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Left Large Panel: Next Consultation Box */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-base font-extrabold text-gray-900 tracking-tight">Next Scheduled Consultation</h4>
            <button 
              onClick={() => navigate("/patient/appointments")}
              className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>
          
          {upcomingAppointment ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100/60">
                <div className="flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                    <img 
                      src={upcomingAppointment.doctorImage || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=150&q=80"} 
                      alt={upcomingAppointment.doctorName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900">{upcomingAppointment.doctorName}</p>
                      <span className="text-[9px] font-extrabold bg-brand-primary text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {upcomingAppointment.status}
                      </span>
                    </div>
                    <p className="text-xs text-brand-primary font-bold mt-0.5">
                      {upcomingAppointment.specialization || "Homeopathy Consultant"}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold mt-1">
                      <span>📅 {new Date(upcomingAppointment.appointmentDateTime).toLocaleDateString()}</span>
                      <span>⏰ {new Date(upcomingAppointment.appointmentDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 font-medium leading-relaxed bg-[#FDFEFC] p-4 rounded-xl border border-gray-100 mt-4">
                {upcomingAppointment.reason || "Please have your symptom tracker ready for today's review."}
              </p>

              {(() => {
                const appointmentTime = new Date(upcomingAppointment.appointmentDateTime);
                const now = new Date();
                const timeDiff = appointmentTime - now;
                const minutesBefore = 10;
                const showCallButton = timeDiff <= minutesBefore * 60 * 1000 && timeDiff > -30 * 60 * 1000;
                
                return (
                  <div className="mt-5 flex gap-3">
                    {showCallButton ? (
                      <button 
                        onClick={() => {
                          console.log("Upcoming appointment object:", upcomingAppointment);
                          console.log("Appointment ID:", upcomingAppointment.appointmentId);
                          if (!upcomingAppointment.appointmentId) {
                            console.error("Appointment ID is missing!");
                            return;
                          }
                          navigate(`/patient/video-call?appointmentId=${upcomingAppointment.appointmentId}`);
                        }}
                        className="flex-1 bg-brand-primary hover:bg-brand-hover text-white py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                      >
                        <Video className="h-4 w-4" /> Start Video Call
                      </button>
                    ) : (
                      <div className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                        <Video className="h-4 w-4" /> Call available {timeDiff > 0 ? `${Math.ceil(timeDiff / (60 * 1000))} min before` : 'ended'}
                      </div>
                    )}
                    {upcomingAppointment.status === 'paid' && (
                      <button 
                        onClick={() => navigate(`/patient/chat?doctor=${upcomingAppointment.doctorId}`)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all border border-blue-200 cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4" /> Chat with Doctor
                      </button>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Calendar className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500 text-sm">No upcoming appointments</p>
              <button
                onClick={() => navigate("/patient/doctors")}
                className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-medium hover:bg-brand-hover transition-all"
              >
                Book Appointment
              </button>
            </div>
          )}
        </div>

        {/* Right Status Panel: Consultation Overview */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 flex flex-col justify-between shadow-xs">
          <h4 className="text-base font-extrabold text-gray-900 tracking-tight mb-5">Consultation Overview</h4>
          
          <div className="space-y-3 flex-grow">
            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Pending Slots
              </span>
              <span className="text-xs font-bold text-gray-700 bg-gray-100/80 border border-gray-200/50 px-3 py-1 rounded-lg">02</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-brand-light/30 border border-brand-primary/10 rounded-xl">
              <span className="text-xs font-bold text-brand-dark flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-primary"></span> Active Treatment
              </span>
              <span className="text-xs font-bold text-brand-primary bg-white border border-brand-primary/20 px-3 py-1 rounded-lg">01</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Completed
              </span>
              <span className="text-xs font-bold text-gray-700 bg-gray-100/80 border border-gray-200/50 px-3 py-1 rounded-lg">14</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
            <span className="flex items-center gap-1"><ShieldAlert size={14} className="text-brand-primary" /> Health Goals Completed</span>
            <span className="text-brand-primary font-extrabold text-sm">78%</span>
          </div>
        </div>
      </div>

      {/* Expert Doctors Section */}
      <div className="space-y-5 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-extrabold text-gray-900 tracking-tight">Expert Homeopathy Doctors</h4>
            <p className="text-sm text-gray-500 mt-1">Top-rated specialists ready to help you</p>
          </div>
          <button
            onClick={() => navigate("/patient/doctors")}
            className="text-sm font-bold text-brand-primary hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {expertDoctors.length > 0 ? (
            expertDoctors.slice(0, 3).map((doc) => {
              const slug = doc.name || doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/patient/doctors/${slug}`)}
                  className="group bg-white border-2 border-gray-100 rounded-3xl p-5 hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-light to-brand-primary/20 overflow-hidden border-2 border-white shadow-md shrink-0">
                      <img
                        src={doc.image ? (doc.image.startsWith("http") ? doc.image : `http://localhost:5000/${doc.image}`) : "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80"}
                        alt={doc.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900 text-base group-hover:text-brand-primary transition-colors truncate">{doc.name}</h5>
                      <p className="text-xs font-bold text-brand-primary uppercase tracking-wide truncate mt-1">
                        {doc.specialization}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-gray-900">{doc.averageRating || "0.0"}</span>
                        <span className="text-xs text-gray-400">({doc.totalReviews || 0})</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-gray-50 to-brand-light/30 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Experience</p>
                      <p className="text-sm font-bold text-gray-900">{doc.experience || "0"} yrs</p>
                    </div>
                    <div className="bg-gradient-to-br from-brand-light to-brand-primary/30 rounded-xl p-3 text-center border border-brand-primary/20">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Fee</p>
                      <p className="text-sm font-bold text-brand-primary">₹{doc.consultationFee || 0}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/patient/doctors/${slug}`);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-hover text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar size={16} />
                    View Profile
                  </button>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-sm">No expert doctors available</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Edit Profile</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your personal information</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdatePatient} className="p-6 space-y-4">
              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Personal Information</h4>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      value={patientData?.name || ""}
                      onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      value={patientData?.email || ""}
                      onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="tel"
                      value={patientData?.mobile || ""}
                      onChange={(e) => setPatientData({ ...patientData, mobile: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Gender</label>
                    <select
                      value={patientData?.gender || ""}
                      onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium cursor-pointer"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Date of Birth</label>
                    <input
                      type="date"
                      value={patientData?.dob || ""}
                      onChange={(e) => setPatientData({ ...patientData, dob: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Address Information</h4>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">House Number</label>
                  <input
                    type="text"
                    value={patientData?.houseNumber || ""}
                    onChange={(e) => setPatientData({ ...patientData, houseNumber: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Address Line 1</label>
                  <input
                    type="text"
                    value={patientData?.addressLine1 || ""}
                    onChange={(e) => setPatientData({ ...patientData, addressLine1: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Address Line 2</label>
                  <input
                    type="text"
                    value={patientData?.addressLine2 || ""}
                    onChange={(e) => setPatientData({ ...patientData, addressLine2: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Landmark</label>
                  <input
                    type="text"
                    value={patientData?.landmark || ""}
                    onChange={(e) => setPatientData({ ...patientData, landmark: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">City</label>
                    <input
                      type="text"
                      value={patientData?.city || ""}
                      onChange={(e) => setPatientData({ ...patientData, city: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">State</label>
                    <input
                      type="text"
                      value={patientData?.state || ""}
                      onChange={(e) => setPatientData({ ...patientData, state: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Pincode</label>
                    <input
                      type="text"
                      value={patientData?.pincode || ""}
                      onChange={(e) => setPatientData({ ...patientData, pincode: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Country</label>
                    <input
                      type="text"
                      value={patientData?.country || ""}
                      onChange={(e) => setPatientData({ ...patientData, country: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={14} />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    </PatientLayout>
  );
}