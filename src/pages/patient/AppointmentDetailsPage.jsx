import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import { getMyAppointments, cancelAppointment } from "../../api/appointmentApi";
import { getImageUrl } from "../../utils/imageHelper";
import Payment from "../../components/Payment";
import Swal from "sweetalert2";
import axios from "axios";
import {
  Calendar,
  Clock,
  Video,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle,
  MessageSquare,
  Star,
  Send,
  CreditCard,
  ArrowLeft
} from "lucide-react";

export default function AppointmentDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentId = location.state?.appointmentId;

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetails();
    } else {
      // If no appointmentId in state, try to get it from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) {
        fetchAppointmentDetailsById(id);
      } else {
        setError("Appointment ID not provided");
        setLoading(false);
      }
    }
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await getMyAppointments();
      if (response.status === 1) {
        const apt = response.data?.find(a => a.id === appointmentId);
        if (apt) {
          setAppointment(apt);
        } else {
          setError("Appointment not found");
        }
      } else {
        setError(response.message || "Failed to fetch appointment");
      }
    } catch (err) {
      console.error("Error fetching appointment:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentDetailsById = async (id) => {
    try {
      setLoading(true);
      const response = await getMyAppointments();
      if (response.status === 1) {
        const apt = response.data?.find(a => a.id === parseInt(id));
        if (apt) {
          setAppointment(apt);
        } else {
          setError("Appointment not found");
        }
      } else {
        setError(response.message || "Failed to fetch appointment");
      }
    } catch (err) {
      console.error("Error fetching appointment:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
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
      setCancellingId(appointment.id);
      const response = await cancelAppointment(appointment.id);

      if (response.status === 1) {
        Swal.fire({
          icon: "success",
          title: "Cancelled!",
          text: "Appointment cancelled successfully",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        }).then(() => {
          navigate("/patient/appointments");
        });
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
        doctorId: appointment.doctorId,
        appointmentId: appointment.id,
        rating: reviewRating,
        review: reviewText
      });

      if (response.data.status === 1) {
        Swal.fire({
          icon: "success",
          title: "Review Submitted!",
          text: "Thank you for your feedback.",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        }).then(() => {
          setReviewModalOpen(false);
          fetchAppointmentDetails();
        });
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

  const handlePaymentSuccess = async () => {
    setPaymentModalOpen(false);
    await fetchAppointmentDetails();
    Swal.fire({
      icon: "success",
      title: "Payment Successful!",
      text: "Your appointment has been confirmed.",
      confirmButtonColor: "#10b981"
    });
  };

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

  const canJoinCall = () => {
    if (!appointment?.appointmentDateTime) return false;
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDateTime);
    const timeDiff = appointmentTime - now;
    const minutesDiff = Math.ceil(timeDiff / (1000 * 60));
    return minutesDiff >= -30 && minutesDiff <= 10;
  };

  const getStepStatus = (stepNumber) => {
    const status = (appointment?.status || "").toLowerCase();
    if (status === "cancelled" || status === "rejected") return "cancelled";
    
    if (stepNumber === 1) {
      return status === "pending" || status === "accepted" || status === "paid" || status === "completed" ? "completed" : "pending";
    }
    if (stepNumber === 2) {
      return status === "accepted" || status === "paid" || status === "completed" ? "completed" : status === "pending" ? "pending" : "cancelled";
    }
    if (stepNumber === 3) {
      return status === "paid" || status === "completed" ? "completed" : status === "accepted" ? "pending" : "cancelled";
    }
    if (stepNumber === 4) {
      return status === "completed" ? "completed" : status === "paid" ? "pending" : "cancelled";
    }
    return "pending";
  };

  const steps = [
    {
      number: 1,
      title: "Doctors receive request",
      description: "Transmitted to licensed specialists currently online."
    },
    {
      number: 2,
      title: "Doctor accepts slot & notification arrives",
      description: "A physician reviews your case overview and approves the time. You will get an SMS and push alert with doctor profile details."
    },
    {
      number: 3,
      title: "Secure consultation fee",
      description: "Confirm payment via insurance or card to lock in the appointment."
    },
    {
      number: 4,
      title: "Join encrypted video room",
      description: "One-click secure video consultation and digital prescription."
    }
  ];

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </PatientLayout>
    );
  }

  if (error || !appointment) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{error || "Appointment not found"}</p>
            <button
              onClick={() => navigate("/patient/appointments")}
              className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </PatientLayout>
    );
  }

  const statusLower = (appointment.status || "").toLowerCase();
  const isAccepted = statusLower === "accepted" || statusLower === "confirmed";
  const isPaid = statusLower === "paid";
  const isCompleted = statusLower === "completed";
  const isCancelled = statusLower === "cancelled" || statusLower === "rejected";

  return (
    <PatientLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/patient/appointments")}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-4 font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Appointments
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Appointment Details</h1>
          <p className="text-gray-500">Booking ID #{appointment.appointmentId || appointment.id}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Info Card */}
            <div className="bg-gradient-to-r from-brand-light/30 to-blue-50/30 border border-brand-primary/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-xl">
                  <AlertCircle size={20} className="text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Appointment Status</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {appointment.status === 'pending' && (
                      "Your appointment request has been submitted. Waiting for doctor to accept your request. The doctor will review and accept or decline based on availability."
                    )}
                    {appointment.status === 'accepted' && (
                      "Great! The doctor has accepted your appointment. Please complete the payment to confirm your booking."
                    )}
                    {appointment.status === 'payment_pending' && (
                      "Payment is pending. Please complete the payment to confirm your appointment with the doctor."
                    )}
                    {appointment.status === 'paid' && (
                      "Payment completed successfully! Your appointment is confirmed. You can now chat with the doctor before the consultation."
                    )}
                    {appointment.status === 'completed' && (
                      "Your consultation has been completed. You can leave a review for the doctor."
                    )}
                    {appointment.status === 'cancelled' && (
                      "This appointment has been cancelled."
                    )}
                    {appointment.status === 'rejected' && (
                      "The doctor has declined this appointment request. You can book another appointment with a different doctor or time."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor Info Card */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 flex gap-4">
              <img 
                src={getImageUrl(appointment.doctorImage) || "https://cdn-icons-png.flaticon.com/512/387/387561.png"}
                alt="Doctor" 
                className="w-20 h-20 rounded-2xl object-cover border border-gray-200 flex-shrink-0"
                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/387/387561.png"; }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Doctor</span>
                <h4 className="font-bold text-gray-900 mt-0.5 text-lg truncate">
                  {appointment.doctorName ? `Dr. ${appointment.doctorName}` : "Doctor not assigned"}
                </h4>
                {appointment.specialization && (
                  <p className="text-sm text-brand-primary font-bold mt-1 truncate">
                    {appointment.specialization}
                  </p>
                )}
                {appointment.qualification && (
                  <p className="text-sm text-gray-500 font-semibold">Qual: {appointment.qualification}</p>
                )}
              </div>
            </div>

            {/* Booking Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/30 p-6 border border-gray-100/50 rounded-2xl">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Date</p>
                <p className="text-sm text-gray-800 font-bold mt-1">{formatDate(appointment.appointmentDateTime)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Time</p>
                <p className="text-sm text-gray-800 font-bold mt-1">{formatTime(appointment.appointmentDateTime)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Request Type</p>
                <span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                  {appointment.requestType === "any_doctor" ? "Any Doctor" : appointment.requestType === "specific_doctor" ? "Specific Doctor" : appointment.requestType || "Standard"}
                </span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Status</p>
                <div className="mt-1">
                  {getStatusBadge(appointment.status)}
                </div>
              </div>
            </div>

            {/* Reason / Symptoms */}
            <div>
              <p className="text-sm text-gray-400 font-semibold mb-2">Reason / Symptoms</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words bg-gray-50 p-6 rounded-xl border border-gray-200 leading-relaxed">
                {appointment.reason || "No symptoms specified"}
              </p>
            </div>

            {/* Payment Info */}
            <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Consultation Fee</p>
                  <p className="text-2xl font-extrabold text-emerald-700 mt-1">₹{appointment.consultationFee || 500}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Payment Status</p>
                  <span className={`inline-flex mt-1.5 items-center px-2.5 py-1 rounded-full text-sm font-semibold border ${
                    appointment.paymentStatus === 'paid' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {appointment.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              {/* Cancel Button */}
              {!isCancelled && !isCompleted && (
                <button
                  onClick={handleCancelAppointment}
                  disabled={cancellingId === appointment.id}
                  className="flex-1 min-w-[140px] h-11 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancellingId === appointment.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      Cancel Appointment
                    </>
                  )}
                </button>
              )}

              {/* Pay Button */}
              {isAccepted && (
                <button
                  onClick={() => setPaymentModalOpen(true)}
                  className="flex-1 min-w-[140px] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Pay Now
                </button>
              )}

              {/* Chat Button */}
              {isPaid && !isCancelled && appointment.doctorUserId && (
                <button
                  onClick={() => navigate(`/patient/chat`, { state: { selectUserId: appointment.doctorUserId } })}
                  className="flex-1 min-w-[140px] h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  Chat with Doctor
                </button>
              )}

              {/* Video Call */}
              {isPaid && !isCancelled && canJoinCall() && (
                <button
                  onClick={() => navigate(`/patient/video-call?appointmentId=${appointment.id}`)}
                  className="flex-1 min-w-[140px] h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Video size={16} />
                  Join Video Call
                </button>
              )}

              {/* Write Review */}
              {isCompleted && !isCancelled && !appointment.hasReviewed && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="flex-1 min-w-[140px] h-11 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Star size={16} className="fill-amber-400 text-amber-400" />
                  Write Review
                </button>
              )}
            </div>
          </div>

          {/* Sidebar - Status Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs sticky top-6">
              <h3 className="text-lg font-extrabold text-gray-900 mb-6">What happens next?</h3>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const stepStatus = getStepStatus(step.number);
                  const isCompleted = stepStatus === "completed";
                  const isPending = stepStatus === "pending";
                  const isCancelled = stepStatus === "cancelled";
                  const isLast = index === steps.length - 1;

                  return (
                    <div key={step.number} className="flex gap-3 relative">
                      {/* Vertical Track Line */}
                      {!isLast && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      <div className="flex-shrink-0 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? "bg-emerald-500 text-white" :
                          isPending ? "bg-gray-200 text-gray-500" :
                          "bg-gray-100 text-gray-400"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle size={16} />
                          ) : (
                            <span className="text-sm font-bold">{step.number}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                        <h4 className={`font-bold text-sm mb-1 ${
                          isCompleted ? "text-emerald-700" :
                          isPending ? "text-gray-900" :
                          "text-gray-400"
                        }`}>
                          {step.title}
                        </h4>
                        <p className={`text-xs leading-relaxed ${
                          isCompleted ? "text-emerald-600" :
                          isPending ? "text-gray-600" :
                          "text-gray-400"
                        }`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {reviewModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Write a Review</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Rate your experience with Dr. {appointment.doctorName}</p>
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
        {paymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Complete Payment</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Appointment with Dr. {appointment.doctorName}</p>
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
                  appointmentId={appointment.id}
                  amount={appointment.consultationFee || 500}
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
