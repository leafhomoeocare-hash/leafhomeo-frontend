import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import { getMyAppointments, cancelAppointment } from "../../api/appointmentApi";
import Payment from "../../components/Payment";
import Swal from "sweetalert2";
import axios from "axios";
import {
  Calendar,
  Clock,
  Video,
  X,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  Send,
  CreditCard,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";

export default function MyAppointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingSuccess = location.state?.bookingSuccess;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters & Search
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Sorting & Pagination
  const [sortColumn, setSortColumn] = useState("appointmentDateTime");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Modals & Action loading
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState(null);

  useEffect(() => {
    if (bookingSuccess) {
      window.history.replaceState({}, document.title);
    }
    fetchAppointments();
  }, [bookingSuccess]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, entriesPerPage]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getMyAppointments();

      if (response.status === 1) {
        setAppointments(response.data || []);
      } else {
        setError(response.message || "Failed to fetch appointments");
      }
    } catch (err) {
      console.error("Appointments fetch error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You want to cancel this appointment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, cancel it!"
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setCancellingId(appointmentId);
      const response = await cancelAppointment(appointmentId);

      if (response.status === 1) {
        Swal.fire({
          icon: "success",
          title: "Cancelled!",
          text: "Appointment cancelled successfully",
          confirmButtonColor: "#10b981"
        });
        await fetchAppointments();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || "Failed to cancel appointment",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      console.error("Cancel appointment error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to cancel appointment",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setCancellingId(null);
    }
  };

  const handleOpenReviewModal = (appointment) => {
    setSelectedAppointment(appointment);
    setReviewRating(0);
    setReviewText("");
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !reviewText.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Incomplete Review",
        text: "Please provide both a rating and review text.",
        confirmButtonColor: "#10b981"
      });
      return;
    }

    try {
      setSubmittingReview(true);
      const token = sessionStorage.getItem("token");
      const API = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
      });
      API.interceptors.request.use((config) => {
        if (token) {
          config.headers.Authorization = token;
        }
        return config;
      });

      const response = await API.post("/api/v1/appointment/review", {
        doctorId: selectedAppointment.doctorId,
        appointmentId: selectedAppointment.id,
        rating: reviewRating,
        review: reviewText
      });

      if (response.data.status === 1) {
        Swal.fire({
          icon: "success",
          title: "Review Submitted!",
          text: "Thank you for your feedback.",
          confirmButtonColor: "#10b981"
        });
        setReviewModalOpen(false);
        await fetchAppointments();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.data.message || "Failed to submit review",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      console.error("Review submission error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to submit review",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenPaymentModal = (appointment) => {
    setSelectedAppointmentForPayment(appointment);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false);
    setSelectedAppointmentForPayment(null);
    await fetchAppointments();
    Swal.fire({
      icon: "success",
      title: "Payment Successful!",
      text: "Your appointment has been confirmed.",
      confirmButtonColor: "#10b981"
    });
  };

  // Status Styles & Badges
  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500" />
            Pending
          </span>
        );
      case "accepted":
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            {s === "accepted" ? "Accepted" : "Confirmed"}
          </span>
        );
      case "paid":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle className="w-3 h-3 text-teal-500" />
            Paid
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle className="w-3 h-3 text-blue-500" />
            Completed
          </span>
        );
      case "cancelled":
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" />
            {s === "cancelled" ? "Cancelled" : "Rejected"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Kolkata"
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata"
    });
  };

  const canJoinCall = (appointment) => {
    if (!appointment?.appointmentDateTime) return false;
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDateTime);
    const timeDiff = appointmentTime - now;
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
    return minutesDiff >= -30 && minutesDiff <= 10;
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

  const getStatusCount = (status) => {
    if (status === "all") return appointments.length;
    return appointments.filter(app => (app.status || "").toLowerCase() === status.toLowerCase()).length;
  };

  // Sorting Handler
  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnKey);
      setSortOrder("asc");
    }
  };

  // Filtered & Sorted Appointments
  const processedAppointments = useMemo(() => {
    let result = appointments.filter(apt => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (apt.doctorName || "").toLowerCase().includes(term) ||
        (apt.appointmentId || "").toString().toLowerCase().includes(term) ||
        (apt.reason || apt.symptoms || "").toLowerCase().includes(term);

      const matchesFilter = filter === "all" || (apt.status || "").toLowerCase() === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (sortColumn === "appointmentDateTime") {
        aVal = new Date(a.appointmentDateTime || 0).getTime();
        bVal = new Date(b.appointmentDateTime || 0).getTime();
      } else if (sortColumn === "appointmentId") {
        aVal = (a.appointmentId || a.id || "").toString();
        bVal = (b.appointmentId || b.id || "").toString();
      } else if (typeof aVal === "string") {
        aVal = (aVal || "").toLowerCase();
        bVal = (bVal || "").toLowerCase();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [appointments, filter, searchTerm, sortColumn, sortOrder]);

  // Pagination Slice
  const totalEntries = processedAppointments.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentAppointments = processedAppointments.slice(startIndex, startIndex + entriesPerPage);

  const getSortIcon = (columnKey) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-brand-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-brand-primary" />
    );
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Appointments</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">View, search, and manage all your homeopathic consultations</p>
        </div>

        {/* Success Message */}
        {bookingSuccess && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-800 text-xs font-semibold">{location.state?.message || "Appointment booked successfully!"}</p>
            <button
              onClick={() => window.history.replaceState({}, document.title)}
              className="ml-auto text-emerald-600 hover:text-emerald-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-600">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        )}

        {/* Filters and Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by doctor, ID, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-gray-300 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-gray-800"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Entries Per Page */}
            <div className="flex items-center gap-2 self-end lg:self-center">
              <span className="text-xs text-gray-500 font-medium">Show</span>
              <div className="relative">
                <select
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                  className="appearance-none bg-white border border-gray-300 rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-gray-700 focus:outline-none focus:border-brand-primary cursor-pointer"
                >
                  {[5, 10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              </div>
              <span className="text-xs text-gray-500 font-medium">entries</span>
            </div>


          </div>

          {/* Status Filter Badges */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-gray-100">
            {["all", "Pending", "Confirmed", "Paid", "Completed", "Cancelled"].map((status) => {
              const statusKey = status.toLowerCase();
              const isSelected = filter === statusKey;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(statusKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? status === "Cancelled"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "bg-brand-primary text-white shadow-xs"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/60"
                  }`}
                >
                  {status}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {getStatusCount(status)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  <th
                    onClick={() => handleSort("appointmentId")}
                    className="py-3 px-3.5 cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ID</span>
                      {getSortIcon("appointmentId")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("doctorName")}
                    className="py-3 px-3.5 cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Doctor</span>
                      {getSortIcon("doctorName")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("appointmentDateTime")}
                    className="py-3 px-3.5 cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Date & Time</span>
                      {getSortIcon("appointmentDateTime")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("requestType")}
                    className="py-3 px-3.5 cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Type</span>
                      {getSortIcon("requestType")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="py-3 px-3.5 cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-right font-bold w-48">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {currentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Calendar className="h-8 w-8 text-gray-300" />
                        <p className="text-xs text-gray-500">No appointments match your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentAppointments.map((apt) => {
                    const statusLower = (apt.status || "").toLowerCase();
                    const isAccepted = statusLower === "accepted" || statusLower === "confirmed";
                    const isPaid = statusLower === "paid";
                    const isCompleted = statusLower === "completed";
                    const canCancel = ["pending", "accepted", "confirmed"].includes(statusLower);

                    return (
                      <tr
                        key={apt.id}
                        className="hover:bg-brand-light/30 transition-colors"
                      >
                        {/* ID */}
                        <td className="py-3 px-3.5 font-mono text-gray-700 font-semibold whitespace-nowrap w-24">
                          #{apt.appointmentId || apt.id}
                        </td>

                        {/* Doctor Info */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5 min-w-[170px]">
                            {apt.doctorImage ? (
                              <img
                                src={apt.doctorImage}
                                alt={apt.doctorName}
                                className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-lg ${getAvatarColor(
                                  apt.doctorName
                                )} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                              >
                                {getInitials(apt.doctorName)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-gray-900 block truncate">
                                Dr. {apt.doctorName?.replace(/^Dr\.\s*/i, "")}
                              </span>
                              <span className="text-[11px] text-gray-400 block truncate">
                                {apt.reason || apt.symptoms || "General Consultation"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-3.5 whitespace-nowrap w-36">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-gray-800 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-brand-primary inline" />
                              {formatDate(apt.appointmentDateTime)}
                            </span>
                            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400 inline" />
                              {formatTime(apt.appointmentDateTime)}
                            </span>
                          </div>
                        </td>

                        {/* Request Type */}
                        <td className="py-3 px-3.5 whitespace-nowrap w-32">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700">
                            {apt.requestType === "any_doctor"
                              ? "Any Doctor"
                              : apt.requestType === "specific_doctor"
                              ? "Specific Doctor"
                              : apt.requestType || "Standard"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 whitespace-nowrap w-28">
                          {getStatusBadge(apt.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 whitespace-nowrap text-right w-48">
                          <div className="flex items-center justify-end gap-1.5 w-full">
                            {/* Pay Button */}
                            {isAccepted && (
                              <button
                                onClick={() => handleOpenPaymentModal(apt)}
                                className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <CreditCard size={13} />
                                <span>Pay</span>
                              </button>
                            )}

                            {/* Chat Button */}
                            {isPaid && apt.doctorUserId && (
                              <button
                                onClick={() =>
                                  navigate("/patient/chat", {
                                    state: { selectUserId: apt.doctorUserId }
                                  })
                                }
                                className="h-8 px-3 bg-white text-brand-dark hover:bg-emerald-50 text-xs border border-brand-primary font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                title="Chat with Doctor"
                              >
                                <MessageSquare size={13} />
                                <span>Chat</span>
                              </button>
                            )}

                            {/* Video Call */}
                            {isPaid && canJoinCall(apt) && (
                              <button
                                onClick={() =>
                                  navigate(`/patient/video-call?appointmentId=${apt.id}`)
                                }
                                className="h-8 px-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                                title="Join Video Call"
                              >
                                <Video size={13} />
                                <span>Call</span>
                              </button>
                            )}

                            {/* Write Review */}
                            {isCompleted && !apt.hasReviewed && (
                              <button
                                onClick={() => handleOpenReviewModal(apt)}
                                className="h-8 px-3 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              >
                                <Star size={13} className="fill-amber-400 text-amber-400" />
                                <span>Review</span>
                              </button>
                            )}

                            {/* Cancel */}
                            {canCancel && (
                              <button
                                onClick={() => handleCancelAppointment(apt.id)}
                                disabled={cancellingId === apt.id}
                                className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Cancel Appointment"
                              >
                                {cancellingId === apt.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                                ) : (
                                  <X size={15} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-800">
                {totalEntries === 0 ? 0 : startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold text-gray-800">
                {Math.min(startIndex + entriesPerPage, totalEntries)}
              </span>{" "}
              of <span className="font-bold text-gray-800">{totalEntries}</span> entries
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <span className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-bold text-gray-700">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {reviewModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Write a Review</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Rate your experience with Dr. {selectedAppointment.doctorName}</p>
                </div>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">Rating</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 cursor-pointer transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={star <= reviewRating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">Your Feedback</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    placeholder="Describe your consultation experience..."
                    className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-brand-primary text-gray-800 resize-none font-medium"
                  />
                </div>
              </div>

              <div className="bg-gray-50/80 border-t border-gray-100 px-6 py-3.5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex items-center gap-1.5 bg-brand-primary hover:bg-brand-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModalOpen && selectedAppointmentForPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Complete Payment</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Appointment with Dr. {selectedAppointmentForPayment.doctorName}</p>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <Payment
                  appointmentId={selectedAppointmentForPayment.id}
                  amount={selectedAppointmentForPayment.consultationFee || 500}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setPaymentModalOpen(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
