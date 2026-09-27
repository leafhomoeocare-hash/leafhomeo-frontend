import React, { useState, useEffect } from "react";
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
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  MoreVertical,
  MessageSquare,
  Star,
  Send,
  CreditCard
} from "lucide-react";

export default function MyAppointments() {
  const navigate = useNavigate();
  const location = useLocation();
  const bookingSuccess = location.state?.bookingSuccess;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState(new Set());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState(null);

  useEffect(() => {
    if (bookingSuccess) {
      // Clear the state after showing success
      window.history.replaceState({}, document.title);
    }
    fetchAppointments();
  }, [filter, bookingSuccess]);

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

  const handleCheckboxChange = (appointmentId) => {
    const newSelected = new Set(selectedAppointments);
    if (newSelected.has(appointmentId)) {
      newSelected.delete(appointmentId);
    } else {
      newSelected.add(appointmentId);
    }
    setSelectedAppointments(newSelected);
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

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.doctorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || apt.status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

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

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Kolkata"
    });
  };

  const canJoinCall = (appointment) => {
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDateTime);
    const timeDiff = appointmentTime - now;
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
    // Allow joining 10 minutes before appointment until 30 minutes after
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
    return appointments.filter(app => app.status.toLowerCase() === status.toLowerCase()).length;
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Appointments</h1>
          <p className="text-gray-500">View and manage your appointments</p>
        </div>

        {/* Success Message */}
        {bookingSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800 font-medium">{location.state?.message}</p>
            <button
              onClick={() => window.history.replaceState({}, document.title)}
              className="ml-auto text-green-600 hover:text-green-800"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by doctor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium text-sm shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            {["all", "Pending", "Confirmed", "Paid", "Completed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status.toLowerCase())}
                className={`px-4 py-2.5 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
                  filter === status.toLowerCase()
                    ? status === "Cancelled"
                      ? "bg-rose-500 text-white border border-rose-500 shadow-md shadow-rose-500/20"
                      : "bg-brand-primary text-white border border-brand-primary shadow-md shadow-brand-primary/20"
                    : status === "Cancelled"
                      ? "bg-white border border-gray-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50"
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Calendar className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500 font-medium">No appointments found</p>
            <button
              onClick={() => navigate("/patient/book")}
              className="px-6 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-hover transition-all text-sm font-semibold shadow-md shadow-brand-primary/20"
            >
              Book New Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment, index) => (
              <div
                key={appointment.id}
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} border border-gray-200 rounded-2xl p-6 hover:border-brand-primary/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shadow-sm border-l-4 ${getStatusBorderColor(appointment.status)}`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 lg:gap-8 overflow-x-auto pb-2">
                  {/* Doctor Info */}
                  <div className="flex items-center gap-4 min-w-[220px] flex-shrink-0">
                    {appointment.doctorImage ? (
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-light to-brand-primary/20 overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                        <img
                          src={appointment.doctorImage}
                          alt={appointment.doctorName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-16 h-16 rounded-xl ${getAvatarColor(appointment.doctorName)} flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0`}>
                        {getInitials(appointment.doctorName)}
                      </div>
                    )}
                    <div className="flex-shrink-0">
                      <h3 className="font-extrabold text-gray-900 text-lg">{appointment.doctorName}</h3>
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
                    {appointment.status.toLowerCase() === "paid" && appointment.doctorUserId && (
                      <button
                        onClick={() => navigate("/patient/chat", { state: { selectUserId: appointment.doctorUserId } })}
                        className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-white text-brand-dark rounded-xl font-medium hover:bg-gray-50 transition-all text-sm border-2 border-brand-primary"
                      >
                        <MessageSquare size={15} />
                        Chat
                      </button>
                    )}
                    {appointment.status.toLowerCase() === "paid" && canJoinCall(appointment) && (
                      <button
                        onClick={() => navigate(`/patient/video-call?appointmentId=${appointment.id}`)}
                        className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all text-sm border-2 border-brand-primary"
                      >
                        <Video size={16} />
                        Start Video Call
                      </button>
                    )}
                    {appointment.status.toLowerCase() === "accepted" && (
                      <button
                        onClick={() => handleOpenPaymentModal(appointment)}
                        className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all text-sm"
                      >
                        <CreditCard size={15} />
                        Pay
                      </button>
                    )}
                    {appointment.status.toLowerCase() === "completed" && !appointment.hasReviewed && (
                      <button
                        onClick={() => handleOpenReviewModal(appointment)}
                        className="flex items-center gap-2 px-4 py-2.5 h-10 min-w-[100px] justify-center bg-white text-brand-dark rounded-xl font-medium hover:bg-gray-50 transition-all text-sm border-2 border-brand-primary"
                      >
                        <Star size={15} />
                        Write Review
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      disabled={cancellingId === appointment.id}
                      className={`p-2 h-10 w-10 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        cancellingId === appointment.id
                          ? "bg-red-100 text-red-600 border-2 border-red-300"
                          : "bg-gray-100 text-gray-400 border-2 border-gray-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                      } disabled:opacity-50`}
                      title="Cancel Appointment"
                    >
                      {cancellingId === appointment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {reviewModalOpen && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Write a Review</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Rate your experience with Dr. {selectedAppointment.doctorName}</p>
                </div>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Rating */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewRating(rating)}
                        className="p-2 transition-all"
                      >
                        <Star
                          size={32}
                          className={rating <= reviewRating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">Your Review</label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={5}
                    placeholder="Share your experience with this doctor..."
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 resize-none font-medium"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
              {/* Modal Header */}
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Complete Payment</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Appointment with Dr. {selectedAppointmentForPayment.doctorName}</p>
                </div>
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Modal Body */}
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
