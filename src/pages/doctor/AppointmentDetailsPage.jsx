import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { getDoctorAppointments, acceptAppointment, rejectAppointment } from "../../api/doctorApi";
import { getImageUrl } from "../../utils/imageHelper";
import Swal from "sweetalert2";
import { Calendar, Clock, Video, Check, X, Loader2, CheckCircle, XCircle, MessageSquare, FileText, ArrowLeft, AlertCircle } from "lucide-react";

export default function DoctorAppointmentDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentId = location.state?.appointmentId;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (appointmentId) fetchAppointmentDetails();
    else {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      if (id) fetchAppointmentDetailsById(id);
      else { setError("Appointment ID not provided"); setLoading(false); }
    }
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await getDoctorAppointments("all");
      if (response.status === 1) {
        const apt = response.data?.find(a => a.id === appointmentId);
        if (apt) setAppointment(apt);
        else setError("Appointment not found");
      } else setError(response.message || "Failed to fetch appointment");
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong");
    } finally { setLoading(false); }
  };

  const fetchAppointmentDetailsById = async (id) => {
    try {
      setLoading(true);
      const response = await getDoctorAppointments("all");
      if (response.status === 1) {
        const apt = response.data?.find(a => a.id === parseInt(id));
        if (apt) setAppointment(apt);
        else setError("Appointment not found");
      } else setError(response.message || "Failed to fetch appointment");
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong");
    } finally { setLoading(false); }
  };

  const handleAccept = async () => {
    try {
      setActionLoadingId(appointment.id);
      const response = await acceptAppointment(appointment.id);
      if (response.status === 1) {
        setAppointment({ ...appointment, status: "accepted" });
        Swal.fire({ icon: "success", title: "Accepted", text: "Appointment accepted successfully", timer: 2000, showConfirmButton: false, timerProgressBar: true });
      } else Swal.fire({ icon: "error", title: "Error", text: response.message || "Failed to accept", confirmButtonColor: "#00b100" });
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong", confirmButtonColor: "#00b100" });
    } finally { setActionLoadingId(null); }
  };

  const handleReject = async () => {
    try {
      setActionLoadingId(appointment.id);
      const response = await rejectAppointment(appointment.id);
      if (response.status === 1) {
        setAppointment({ ...appointment, status: "rejected" });
        Swal.fire({ icon: "success", title: "Rejected", text: "Appointment rejected successfully", timer: 2000, showConfirmButton: false, timerProgressBar: true });
      } else Swal.fire({ icon: "error", title: "Error", text: response.message || "Failed to reject", confirmButtonColor: "#00b100" });
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Something went wrong", confirmButtonColor: "#00b100" });
    } finally { setActionLoadingId(null); }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3 text-amber-500" />Pending</span>;
    if (s === "accepted" || s === "confirmed") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3 h-3 text-emerald-500" />{s === "accepted" ? "Accepted" : "Confirmed"}</span>;
    if (s === "paid") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200"><CheckCircle className="w-3 h-3 text-teal-500" />Paid</span>;
    if (s === "completed") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><CheckCircle className="w-3 h-3 text-blue-500" />Completed</span>;
    if (s === "cancelled" || s === "rejected") return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><XCircle className="w-3 h-3 text-rose-500" />{s === "cancelled" ? "Cancelled" : "Rejected"}</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">{status}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  };

  const canJoinCall = () => {
    if (!appointment?.appointmentDateTime) return false;
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDateTime);
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    const appointmentUTC = Date.UTC(appointmentTime.getUTCFullYear(), appointmentTime.getUTCMonth(), appointmentTime.getUTCDate(), appointmentTime.getUTCHours(), appointmentTime.getUTCMinutes(), appointmentTime.getUTCSeconds());
    const minutesDiff = (appointmentUTC - nowUTC) / (1000 * 60);
    return minutesDiff <= 10 && minutesDiff >= -60;
  };

  const hasDraft = () => localStorage.getItem(`consultation_draft_${appointment.id}`) !== null;

  const getStepStatus = (stepNumber) => {
    const status = (appointment?.status || "").toLowerCase();
    if (status === "cancelled" || status === "rejected") return "cancelled";
    if (stepNumber === 1) return (status === "pending" || status === "accepted" || status === "paid" || status === "completed") ? "completed" : "pending";
    if (stepNumber === 2) return (status === "accepted" || status === "paid" || status === "completed") ? "completed" : status === "pending" ? "pending" : "cancelled";
    if (stepNumber === 3) return (status === "paid" || status === "completed") ? "completed" : status === "accepted" ? "pending" : "cancelled";
    if (stepNumber === 4) return status === "completed" ? "completed" : status === "paid" ? "pending" : "cancelled";
    return "pending";
  };

  const steps = [
    { number: 1, title: "Request received", description: "Patient has requested an appointment with you." },
    { number: 2, title: "Accept slot & patient notified", description: "Review the patient's case and accept the appointment. Patient will be notified." },
    { number: 3, title: "Payment completed", description: "Patient completes payment to confirm the appointment." },
    { number: 4, title: "Video consultation", description: "Conduct secure video consultation and provide digital prescription." }
  ];

  if (loading) return <DoctorLayout><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div></DoctorLayout>;

  if (error || !appointment) return <DoctorLayout><div className="flex items-center justify-center min-h-[400px]"><div className="text-center"><AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">{error || "Appointment not found"}</p><button onClick={() => navigate("/doctor/appointments")} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover">Back to Appointments</button></div></div></DoctorLayout>;

  const statusLower = (appointment.status || "").toLowerCase();
  const isPending = statusLower === "pending";
  const isCompleted = statusLower === "completed";
  const isPaidOrAccepted = ["accepted", "paid", "confirmed"].includes(statusLower);
  const canCallNow = isPaidOrAccepted && canJoinCall();

  return (
    <DoctorLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate("/doctor/appointments")} className="flex items-center text-gray-500 hover:text-gray-700 mb-4 font-medium"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Appointments</button>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Appointment Details</h1>
          <p className="text-gray-500">Booking ID #{appointment.appointmentId || appointment.id}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-r from-blue-50/30 to-purple-50/30 border border-blue-200/50 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-xl"><AlertCircle size={20} className="text-blue-600" /></div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Appointment Status</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {appointment.status === 'pending' && "Patient has requested this appointment. Please review the patient's information and accept or decline based on your availability."}
                    {appointment.status === 'accepted' && "You have accepted this appointment. Waiting for patient to complete the payment."}
                    {appointment.status === 'payment_pending' && "Payment is pending from the patient. Once payment is completed, the appointment will be confirmed."}
                    {appointment.status === 'paid' && "Payment completed successfully! The appointment is confirmed. You can now chat with the patient before the consultation."}
                    {appointment.status === 'completed' && "The consultation has been completed. You can review the consultation notes."}
                    {appointment.status === 'cancelled' && "This appointment has been cancelled."}
                    {appointment.status === 'rejected' && "You have declined this appointment request."}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 flex gap-4">
              <img src={getImageUrl(appointment.patientImage) || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} alt="Patient" className="w-20 h-20 rounded-2xl object-cover border border-gray-200 flex-shrink-0" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }} />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Patient</span>
                <h4 className="font-bold text-gray-900 mt-0.5 text-lg truncate">{appointment.patientName}</h4>
                {appointment.patientEmail && <p className="text-sm text-gray-500 mt-1 font-semibold truncate">{appointment.patientEmail}</p>}
                {appointment.patientMobile && <p className="text-sm text-gray-500 font-semibold">{appointment.patientMobile}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/30 p-6 border border-gray-100/50 rounded-2xl">
              <div><p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Date</p><p className="text-sm text-gray-800 font-bold mt-1">{formatDate(appointment.appointmentDateTime)}</p></div>
              <div><p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Time</p><p className="text-sm text-gray-800 font-bold mt-1">{formatTime(appointment.appointmentDateTime)}</p></div>
              <div><p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Request Type</p><span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">{appointment.requestType === "any_doctor" ? "Any Doctor" : appointment.requestType === "specific_doctor" ? "Specific Doctor" : appointment.requestType || "Standard"}</span></div>
              <div><p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Status</p><div className="mt-1">{getStatusBadge(appointment.status)}</div></div>
            </div>
            <div><p className="text-sm text-gray-400 font-semibold mb-2">Reason / Symptoms</p><p className="text-sm text-gray-900 whitespace-pre-wrap break-words bg-gray-50 p-6 rounded-xl border border-gray-200 leading-relaxed">{appointment.reason || appointment.symptoms || "No symptoms specified"}</p></div>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              {appointment.patientUserId && <button onClick={() => navigate("/doctor/chat", { state: { selectUserId: appointment.patientUserId } })} className="flex-1 min-w-[140px] h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"><MessageSquare size={16} />Chat with Patient</button>}
              {isPending && <><button onClick={handleAccept} disabled={actionLoadingId === appointment.id} className="flex-1 min-w-[140px] h-11 bg-brand-primary text-white hover:bg-brand-hover font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">{actionLoadingId === appointment.id ? <><Loader2 size={16} className="animate-spin" />Accepting...</> : <><Check size={16} />Accept</>}</button><button onClick={handleReject} disabled={actionLoadingId === appointment.id} className="flex-1 min-w-[140px] h-11 bg-white text-rose-600 hover:bg-rose-50 border border-rose-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50">{actionLoadingId === appointment.id ? <><Loader2 size={16} className="animate-spin" />Rejecting...</> : <><X size={16} />Reject</>}</button></>}
              {canCallNow && <button onClick={() => navigate(`/doctor/video-call?appointmentId=${appointment.id}`)} className="flex-1 min-w-[140px] h-11 bg-brand-primary text-white hover:bg-brand-hover font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"><Video size={16} />Join Call</button>}
              {statusLower === 'paid' && <button onClick={() => navigate(`/doctor/consultation-form?appointmentId=${appointment.id}`)} className="flex-1 min-w-[140px] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"><FileText size={16} />Consultation Form</button>}
              {isCompleted && appointment.consultationId && <button onClick={() => navigate(`/doctor/consultation/${appointment.consultationId}`)} className="flex-1 min-w-[140px] h-11 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"><FileText size={16} />View Prescription</button>}
              {hasDraft() && !isCompleted && <button onClick={() => navigate(`/doctor/consultation-form?appointmentId=${appointment.id}`)} className="flex-1 min-w-[140px] h-11 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"><FileText size={16} />Complete Draft</button>}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs sticky top-6">
              <h3 className="text-lg font-extrabold text-gray-900 mb-6">Appointment Progress</h3>
              <div className="space-y-4">
                {steps.map((step, index) => {
                  const stepStatus = getStepStatus(step.number);
                  const isCompleted = stepStatus === "completed";
                  const isPending = stepStatus === "pending";
                  const isLast = index === steps.length - 1;
                  return (
                    <div key={step.number} className="flex gap-3 relative">
                      {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />}
                      <div className="flex-shrink-0 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? "bg-emerald-500 text-white" : isPending ? "bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-400"}`}>{isCompleted ? <CheckCircle size={16} /> : <span className="text-sm font-bold">{step.number}</span>}</div>
                      </div>
                      <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                        <h4 className={`font-bold text-sm mb-1 ${isCompleted ? "text-emerald-700" : isPending ? "text-gray-900" : "text-gray-400"}`}>{step.title}</h4>
                        <p className={`text-xs leading-relaxed ${isCompleted ? "text-emerald-600" : isPending ? "text-gray-600" : "text-gray-400"}`}>{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
