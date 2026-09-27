import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { 
  Search, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Filter, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  User
} from "lucide-react";
import { acceptAppointment, rejectAppointment, getDoctorAppointments } from "../../api/doctorApi";
import Swal from "sweetalert2";
import { useNotification } from "../../context/NotificationContext";

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

export default function AppointmentRequests() {
  const navigate = useNavigate();
  const { showAppointmentAccepted, showAppointmentRejected } = useNotification();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getDoctorAppointments(filter);
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
          status: "pending",
          reason: "Joint pain"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    const result = await Swal.fire({
      title: "Accept Appointment?",
      text: "Do you want to accept this appointment request?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#00b100",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, accept it!"
    });

    if (result.isConfirmed) {
      try {
        setActionLoadingId(id);
        const response = await acceptAppointment(id);
        if (response.status === 1) {
          const appointment = appointments.find(apt => apt.id === id);
          if (appointment) {
            showAppointmentAccepted(appointment.patientName);
          }
          Swal.fire({
            icon: "success",
            title: "Accepted!",
            text: "Appointment has been accepted successfully.",
            confirmButtonColor: "#00b100"
          });
          fetchAppointments();
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
    }
  };

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: "Reject Appointment?",
      text: "Do you want to reject this appointment request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#00b100",
      confirmButtonText: "Yes, reject it!"
    });

    if (result.isConfirmed) {
      try {
        setActionLoadingId(id);
        const response = await rejectAppointment(id);
        if (response.status === 1) {
          const appointment = appointments.find(apt => apt.id === id);
          if (appointment) {
            showAppointmentRejected(appointment.patientName);
          }
          Swal.fire({
            icon: "success",
            title: "Rejected!",
            text: "Appointment has been rejected.",
            confirmButtonColor: "#00b100"
          });
          fetchAppointments();
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
    }
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
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Appointment Requests</h1>
          <p className="text-gray-500">Manage incoming appointment requests from patients</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-brand-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1">Pending Requests</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {appointments.filter(a => a.status === "pending").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-brand-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1">Accepted Today</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {appointments.filter(a => a.status === "accepted").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-brand-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1">Completed</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {appointments.filter(a => a.status === "completed").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-brand-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1">Total Requests</p>
                <p className="text-2xl font-extrabold text-gray-900">{appointments.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                <Calendar className="h-6 w-6 text-brand-primary" />
              </div>
            </div>
          </div>
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
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "accepted", "completed", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
                  filter === status
                    ? "bg-brand-primary text-white border border-brand-primary shadow-md shadow-brand-primary/20"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-brand-primary hover:bg-gray-50"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === status
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
            <p className="text-gray-500 font-medium">No appointment requests found</p>
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
                      <p className="text-xs text-gray-500 mt-1">{appointment.reason || "No reason"}</p>
                      <p className="text-xs text-gray-400">{appointment.patientPhone || appointment.phone || "No phone"}</p>
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
                    {appointment.status.toLowerCase() === "pending" && (
                      <>
                        <button
                          onClick={() => handleAccept(appointment.id)}
                          disabled={actionLoadingId === appointment.id}
                          className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all disabled:opacity-50"
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
                          className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-white text-brand-dark rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 border-2 border-brand-primary"
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
