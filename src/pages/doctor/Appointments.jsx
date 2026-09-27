import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, Video, Check, X, Filter, Loader2, AlertCircle, CheckCircle, XCircle, MessageSquare, FileText } from "lucide-react";
import DoctorLayout from "../../components/DoctorLayout";
import { getDoctorAppointments, acceptAppointment, rejectAppointment } from "../../api/doctorApi";
import Swal from "sweetalert2";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  accepted: "bg-emerald-100 text-emerald-700 border-emerald-200",
  confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paid: "bg-teal-100 text-teal-700 border-teal-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
};

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "accepted":
    case "confirmed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "paid":
      return "bg-teal-100 text-teal-700 border-teal-200";
    case "completed":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "cancelled":
    case "rejected":
      return "bg-rose-100 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusBorderColor = (status) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "border-l-amber-500";
    case "accepted":
    case "confirmed":
      return "border-l-emerald-500";
    case "paid":
      return "border-l-teal-500";
    case "completed":
      return "border-l-blue-500";
    case "cancelled":
    case "rejected":
      return "border-l-rose-500";
    default:
      return "border-l-gray-400";
  }
};

const getStatusIcon = (status) => {
  switch (status.toLowerCase()) {
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "accepted":
    case "confirmed":
    case "paid":
      return <CheckCircle className="h-4 w-4" />;
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
    case "rejected":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata"
  });
};

const getInitials = (name) => {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (name) => {
  if (!name) return "bg-gray-500";
  const colors = [
    "bg-emerald-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500"
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata"
  });
};

const canJoinCall = (appointmentDateTime) => {
  const now = new Date();
  const appointmentTime = new Date(appointmentDateTime);
  
  // Convert both times to UTC for accurate comparison
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );
  
  const appointmentUTC = Date.UTC(
    appointmentTime.getUTCFullYear(),
    appointmentTime.getUTCMonth(),
    appointmentTime.getUTCDate(),
    appointmentTime.getUTCHours(),
    appointmentTime.getUTCMinutes(),
    appointmentTime.getUTCSeconds()
  );
  
  const timeDiff = appointmentUTC - nowUTC;
  const minutesDiff = timeDiff / (1000 * 60);
  
  // Allow joining 10 minutes before appointment until 1 hour after
  return minutesDiff <= 10 && minutesDiff >= -60;
};

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedAppointments, setSelectedAppointments] = useState(new Set());

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        // Convert filter to lowercase for API call
        const statusFilter = filter === "all" ? "all" : filter.toLowerCase();
        const response = await getDoctorAppointments(statusFilter);
        if (response.status === 1) {
          setAppointments(response.data || []);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        // Use mock data if API fails
        setAppointments([
          { 
            id: 1, 
            patientId: 1,
            patientName: "Rahul Sharma", 
            patientImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
            patientPhone: "+91 98765 43210",
            appointmentDateTime: new Date().toISOString(),
            status: "pending",
            reason: "Fever and headache"
          },
          { 
            id: 2, 
            patientId: 2,
            patientName: "Priya Patel", 
            patientImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
            patientPhone: "+91 87654 32109",
            appointmentDateTime: new Date().toISOString(),
            status: "accepted",
            reason: "Joint pain"
          },
          { 
            id: 3, 
            patientId: 3,
            patientName: "Amit Kumar", 
            patientImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
            patientPhone: "+91 76543 21098",
            appointmentDateTime: new Date(Date.now() - 86400000).toISOString(),
            status: "completed",
            reason: "Digestive issues"
          },
          { 
            id: 4, 
            patientId: 4,
            patientName: "Sneha Gupta", 
            patientImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
            patientPhone: "+91 65432 10987",
            appointmentDateTime: new Date(Date.now() - 86400000).toISOString(),
            status: "paid",
            reason: "Skin allergy"
          },
          { 
            id: 5, 
            patientId: 5,
            patientName: "Vikram Singh", 
            patientImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
            patientPhone: "+91 54321 09876",
            appointmentDateTime: new Date(Date.now() - 172800000).toISOString(),
            status: "cancelled",
            reason: "Respiratory problem"
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [filter]);

  const handleAccept = async (id) => {
    try {
      setActionLoadingId(id);
      const response = await acceptAppointment(id);
      if (response.status === 1) {
        setAppointments(appointments.map(apt => 
          apt.id === id ? { ...apt, status: "accepted" } : apt
        ));
        Swal.fire({
          icon: "success",
          title: "Accepted",
          text: "Appointment accepted successfully",
          confirmButtonColor: "#00b100"
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || "Failed to accept appointment",
          confirmButtonColor: "#00b100"
        });
      }
    } catch (error) {
      console.error("Error accepting appointment:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
        confirmButtonColor: "#00b100"
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoadingId(id);
      const response = await rejectAppointment(id);
      if (response.status === 1) {
        setAppointments(appointments.map(apt => 
          apt.id === id ? { ...apt, status: "rejected" } : apt
        ));
        Swal.fire({
          icon: "success",
          title: "Rejected",
          text: "Appointment rejected successfully",
          confirmButtonColor: "#00b100"
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || "Failed to reject appointment",
          confirmButtonColor: "#00b100"
        });
      }
    } catch (error) {
      console.error("Error rejecting appointment:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
        confirmButtonColor: "#00b100"
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (id) => {
    setActionLoadingId(id);
    await new Promise(resolve => setTimeout(resolve, 500));
    setAppointments(appointments.map(apt =>
      apt.id === id ? { ...apt, status: "completed" } : apt
    ));
    setActionLoadingId(null);
  };

  const handleCheckboxChange = (appointmentId) => {
    const newSelected = new Set(selectedAppointments);
    if (newSelected.has(appointmentId)) {
      newSelected.delete(appointmentId);
    } else {
      newSelected.add(appointmentId);
    }
    setSelectedAppointments(newSelected);
  };

  const getStatusCount = (status) => {
    if (status === "all") return appointments.length;
    return appointments.filter(app => app.status.toLowerCase() === status.toLowerCase()).length;
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesFilter = filter === "all" || apt.status === filter;
    const matchesSearch = apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Appointments</h1>
          <p className="text-gray-500">Manage your patient appointments</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium text-sm shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            {["all", "Pending", "Accepted", "Paid", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status.toLowerCase())}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
                  filter === status.toLowerCase()
                    ? "bg-brand-primary text-white border border-brand-primary shadow-md shadow-brand-primary/20"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-brand-primary hover:bg-gray-50"
                }`}
              >
                {status}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === status.toLowerCase()
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {getStatusCount(status)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Calendar className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500 font-medium">No appointments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border border-gray-200 rounded-2xl p-6 hover:border-brand-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shadow-sm border-l-4 ${getStatusBorderColor(appointment.status)}`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 lg:gap-8 overflow-x-auto pb-2">
                  {/* Patient Info */}
                  <div className="flex items-center gap-4 min-w-[220px] flex-shrink-0">
                    {appointment.patientImage ? (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-light to-brand-primary/20 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                        <img
                          src={appointment.patientImage}
                          alt={appointment.patientName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-xl ${getAvatarColor(appointment.patientName)} flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0`}>
                        {getInitials(appointment.patientName)}
                      </div>
                    )}
                    <div className="flex-shrink-0">
                      <h3 className="font-extrabold text-gray-900 text-lg">{appointment.patientName}</h3>
                      <p className="text-xs text-gray-500 mt-1">{appointment.reason || appointment.symptoms || "No reason"}</p>
                      <p className="text-xs font-mono text-gray-400">ID: {appointment.appointmentId}</p>
                    </div>
                  </div>

                  {/* Appointment Details - Compact Format */}
                  <div className="flex items-center gap-3 min-w-[320px] flex-shrink-0">
                    <div className="flex items-center gap-2 text-base">
                      <span className="font-semibold text-gray-900">{formatDate(appointment.appointmentDateTime)}</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-semibold text-gray-900">{formatTime(appointment.appointmentDateTime)}</span>
                      <span className="text-gray-400">•</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold border ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs text-brand-primary font-semibold">{appointment.requestType === "any_doctor" ? "Any Doctor" : appointment.requestType === "specific_doctor" ? "Specific Doctor" : appointment.requestType || "Any Doctor"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0 flex-wrap lg:flex-nowrap w-full lg:w-auto pl-0 lg:pl-6 border-l-0 lg:border-l border-gray-200 lg:ml-3">
                    {appointment.patientUserId && (
                      <button
                        onClick={() => navigate("/doctor/chat", { state: { selectUserId: appointment.patientUserId } })}
                        className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-white text-brand-dark rounded-xl font-medium hover:bg-gray-50 transition-all text-sm border-2 border-brand-primary"
                      >
                        <MessageSquare size={15} />
                        Chat
                      </button>
                    )}
                    {appointment.status.toLowerCase() === "pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(appointment.id)}
                          disabled={actionLoadingId === appointment.id}
                          className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all disabled:opacity-50 text-sm"
                        >
                          {actionLoadingId === appointment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(appointment.id)}
                          disabled={actionLoadingId === appointment.id}
                          className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-white text-brand-dark rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 text-sm border-2 border-brand-primary"
                        >
                          {actionLoadingId === appointment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X size={16} />
                          )}
                          Reject
                        </button>
                      </>
                    )}
                    {(appointment.status.toLowerCase() === "accepted" || appointment.status.toLowerCase() === "paid" || appointment.status.toLowerCase() === "confirmed") && (
                      <>
                        <button
                          onClick={() => handleComplete(appointment.id)}
                          disabled={actionLoadingId === appointment.id}
                          className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all disabled:opacity-50 text-sm border-2 border-brand-primary"
                        >
                          {actionLoadingId === appointment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                          Complete
                        </button>
                        {canJoinCall(appointment.appointmentDateTime) ? (
                          <button
                            onClick={() => {
                              console.log("Appointment object:", appointment);
                              console.log("Appointment ID:", appointment.id);
                              if (!appointment.id) {
                                console.error("Appointment ID is missing!");
                                return;
                              }
                              navigate(`/doctor/video-call?appointmentId=${appointment.id}`);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all text-sm border-2 border-brand-primary"
                          >
                            <Video size={16} />
                            Join Call
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-gray-100 text-gray-500 rounded-xl font-medium text-sm border-2 border-gray-200">
                            <Clock size={16} />
                            <span className="text-sm">
                              {(() => {
                                const now = new Date();
                                const appointmentTime = new Date(appointment.appointmentDateTime);
                                
                                // Convert both times to UTC for accurate comparison
                                const nowUTC = Date.UTC(
                                  now.getUTCFullYear(),
                                  now.getUTCMonth(),
                                  now.getUTCDate(),
                                  now.getUTCHours(),
                                  now.getUTCMinutes(),
                                  now.getUTCSeconds()
                                );
                                
                                const appointmentUTC = Date.UTC(
                                  appointmentTime.getUTCFullYear(),
                                  appointmentTime.getUTCMonth(),
                                  appointmentTime.getUTCDate(),
                                  appointmentTime.getUTCHours(),
                                  appointmentTime.getUTCMinutes(),
                                  appointmentTime.getUTCSeconds()
                                );
                                
                                const minutesDiff = Math.ceil((appointmentUTC - nowUTC) / (1000 * 60));
                                if (minutesDiff > 0) {
                                  return `Available in ${minutesDiff} min`;
                                } else {
                                  return "Call ended";
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {appointment.status.toLowerCase() === "completed" && appointment.consultationId && (
                      <button
                        onClick={() => navigate(`/doctor/consultation/${appointment.consultationId}`)}
                        className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all text-sm border-2 border-blue-500"
                      >
                        <FileText size={16} />
                        Consultation
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
