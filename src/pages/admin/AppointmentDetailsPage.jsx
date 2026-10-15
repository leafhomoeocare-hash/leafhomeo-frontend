import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { getAppointments, updateShippingStatus } from "../../api/appointmentApi";
import { getImageUrl } from "../../utils/imageHelper";
import { Calendar, Clock, Check, X, Loader2, AlertCircle, ArrowLeft, MessageSquare } from "lucide-react";

export default function AdminAppointmentDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentId = location.state?.appointmentId;
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingShipping, setUpdatingShipping] = useState(false);
  const [confirmShippingChange, setConfirmShippingChange] = useState(null);

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
      const response = await getAppointments(1, 100, "");
      if (response.status === 1) {
        const apt = response.data?.appointments?.find(a => a.id === appointmentId);
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
      const response = await getAppointments(1, 100, "");
      if (response.status === 1) {
        const apt = response.data?.appointments?.find(a => a.id === parseInt(id));
        if (apt) setAppointment(apt);
        else setError("Appointment not found");
      } else setError(response.message || "Failed to fetch appointment");
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong");
    } finally { setLoading(false); }
  };

  const handleShippingStatusChange = (newStatus) => {
    if (appointment.shippingStatus === newStatus) return;
    setConfirmShippingChange(newStatus);
  };

  const confirmShippingStatusUpdate = async () => {
    if (!confirmShippingChange) return;
    try {
      setUpdatingShipping(true);
      const response = await updateShippingStatus(appointment.id, confirmShippingChange);
      if (response.status === 1) {
        setAppointment({ ...appointment, shippingStatus: confirmShippingChange });
      } else throw new Error(response.message || "Failed to update shipping status");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update shipping status: " + error.message);
    } finally {
      setUpdatingShipping(false);
      setConfirmShippingChange(null);
    }
  };

  const getAvailableShippingStatuses = (currentStatus) => {
    const statusFlow = { draft: ['prepared'], prepared: ['ready_to_transit'], ready_to_transit: ['in_transit'], in_transit: [] };
    return statusFlow[currentStatus] || [];
  };

  const handleViewChat = () => {
    if (!appointment.id) { alert("Cannot view chat - appointment information missing"); return; }
    navigate(`/admin/chat-monitoring/${appointment.id}`);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "-", time: "-" };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: "-", time: "-" };
    const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
    return { date, time };
  };

  const getStatusBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    const styleClass = s === 'confirmed' || s === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : s === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-rose-50 text-rose-700 border-rose-200";
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styleClass}`}><span className={`w-1.5 h-1.5 rounded-full ${s === 'confirmed' || s === 'completed' ? 'bg-emerald-500' : s === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />{status || "Pending"}</span>;
  };

  const getPaymentBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    const styleClass = s === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : s === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" : s === 'failed' ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-gray-50 text-gray-600 border-gray-200";
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styleClass}`}><span className={`w-1.5 h-1.5 rounded-full ${s === 'paid' ? 'bg-emerald-500' : s === 'pending' ? 'bg-amber-500' : s === 'failed' ? 'bg-rose-500' : 'bg-gray-500'}`} />{status || "Pending"}</span>;
  };

  const getShippingBadge = (status) => {
    const s = (status || "draft").toLowerCase();
    const styleClass = s === 'prepared' ? "bg-blue-50 text-blue-700 border-blue-200" : s === 'ready_to_transit' ? "bg-purple-50 text-purple-700 border-purple-200" : s === 'in_transit' ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-gray-50 text-gray-600 border-gray-200";
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styleClass}`}><span className={`w-1.5 h-1.5 rounded-full ${s === 'prepared' ? 'bg-blue-500' : s === 'ready_to_transit' ? 'bg-purple-500' : s === 'in_transit' ? 'bg-orange-500' : 'bg-gray-500'}`} />{s === 'ready_to_transit' ? 'Ready to Transit' : status || "Draft"}</span>;
  };

  const getStepStatus = (stepNumber) => {
    const status = (appointment?.status || "").toLowerCase();
    if (status === "cancelled" || status === "rejected") return "cancelled";
    if (stepNumber === 1) return (status === "pending" || status === "confirmed" || status === "completed") ? "completed" : "pending";
    if (stepNumber === 2) return (status === "confirmed" || status === "completed") ? "completed" : status === "pending" ? "pending" : "cancelled";
    if (stepNumber === 3) return status === "completed" ? "completed" : status === "confirmed" ? "pending" : "cancelled";
    if (stepNumber === 4) return status === "completed" ? "completed" : "cancelled";
    return "pending";
  };

  const steps = [
    { number: 1, title: "Appointment requested", description: "Patient has requested an appointment." },
    { number: 2, title: "Doctor accepted & payment", description: "Doctor accepted the appointment and patient completed payment." },
    { number: 3, title: "Consultation completed", description: "Video consultation completed successfully." },
    { number: 4, title: "Prescription shipped", description: "Digital prescription provided and medicine shipping tracked." }
  ];

  if (loading) return <AdminLayout><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div></AdminLayout>;

  if (error || !appointment) return <AdminLayout><div className="flex items-center justify-center min-h-[400px]"><div className="text-center"><AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">{error || "Appointment not found"}</p><button onClick={() => navigate("/admin/appointments")} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-hover">Back to Appointments</button></div></div></AdminLayout>;

  const dt = formatDateTime(appointment.appointmentDate);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate("/admin/appointments")} className="flex items-center text-gray-500 hover:text-gray-700 mb-4 font-medium"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Appointments</button>
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
                  <p className="text-sm text-gray-600 leading-relaxed">Review all appointment details below. You can monitor the shipping status of prescribed medicines.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 flex gap-4">
                {appointment.patient?.image ? <img src={getImageUrl(appointment.patient.image)} alt="Patient" className="w-16 h-16 rounded-2xl object-cover border border-gray-200 flex-shrink-0" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }} /> : <div className="w-16 h-16 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-sm border border-brand-primary/10 flex-shrink-0">{appointment.patient?.name?.[0] || "P"}</div>}
                <div className="min-w-0 flex-1"><span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Patient</span><h4 className="font-bold text-gray-900 mt-0.5 text-base truncate">{appointment.patient?.name}</h4>{appointment.patient?.email && <p className="text-xs text-gray-500 mt-1 font-semibold truncate">{appointment.patient.email}</p>}</div>
              </div>
              <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 flex gap-4">
                {appointment.doctor?.image ? <img src={getImageUrl(appointment.doctor.image)} alt="Doctor" className="w-16 h-16 rounded-2xl object-cover border border-gray-200 flex-shrink-0" onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/387/387561.png"; }} /> : <div className="w-16 h-16 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-sm border border-brand-primary/10 flex-shrink-0">{appointment.doctor?.name?.replace("Dr. ", "")?.[0] || "D"}</div>}
                <div className="min-w-0 flex-1"><span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Doctor</span><h4 className="font-bold text-gray-900 mt-0.5 text-base truncate">{appointment.doctor?.name || "Not Assigned"}</h4></div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/30 p-6 border border-gray-100/50 rounded-2xl">
              <div><p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Date</p><p className="text-sm text-gray-800 font-bold mt-1">{dt.date}</p></div>
              <div><p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Time</p><p className="text-sm text-gray-800 font-bold mt-1">{dt.time}</p></div>
              <div><p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Status</p><div className="mt-1">{getStatusBadge(appointment.status)}</div></div>
              <div><p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Payment</p><div className="mt-1">{getPaymentBadge(appointment.payment?.status || "pending")}</div></div>
            </div>
            <div className="bg-gray-50/30 p-6 border border-gray-100/50 rounded-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Shipping Status</p>
                  <div className="mt-1">
                    {appointment.status === "completed" ? (
                      <select
                        value={appointment.shippingStatus || "draft"}
                        onChange={(e) => handleShippingStatusChange(e.target.value)}
                        disabled={updatingShipping}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border focus:outline-none focus:border-green-500 disabled:opacity-50 appearance-none ${
                          appointment.shippingStatus === 'prepared' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          appointment.shippingStatus === 'ready_to_transit' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          appointment.shippingStatus === 'in_transit' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        <option value={appointment.shippingStatus || "draft"}>
                          {appointment.shippingStatus === 'ready_to_transit' ? 'Ready to Transit' : (appointment.shippingStatus || "Draft")}
                        </option>
                        {getAvailableShippingStatuses(appointment.shippingStatus || "draft").map(status => (
                          <option key={status} value={status}>
                            {status === 'ready_to_transit' ? 'Ready to Transit' : status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    ) : (
                      getShippingBadge(appointment.shippingStatus || "draft")
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Tracking</p>
                  <div className="mt-1">
                    {appointment.trackingUrl ? (
                      <a href={appointment.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-semibold">
                        Track Package
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
              {appointment.doctor && <button onClick={handleViewChat} className="flex-1 min-w-[140px] h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"><MessageSquare size={16} />View Chat</button>}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs sticky top-6">
              <h3 className="text-lg font-extrabold text-gray-900 mb-6">Appointment Progress</h3>
              <div className="space-y-4">
                {steps.map((step) => {
                  const stepStatus = getStepStatus(step.number);
                  const isCompleted = stepStatus === "completed";
                  const isPending = stepStatus === "pending";
                  return (
                    <div key={step.number} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? "bg-emerald-500 text-white" : isPending ? "bg-gray-200 text-gray-500" : "bg-gray-100 text-gray-400"}`}>{isCompleted ? <Check size={16} /> : <span className="text-sm font-bold">{step.number}</span>}</div>
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
        {confirmShippingChange && <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100 overflow-hidden p-6"><h3 className="text-lg font-extrabold text-gray-900 mb-2">Confirm Shipping Status Change</h3><p className="text-sm text-gray-600 mb-4">Are you sure you want to change shipping status to <strong>{confirmShippingChange === 'ready_to_transit' ? 'Ready to Transit' : confirmShippingChange.replace('_', ' ')}</strong>?</p><div className="flex gap-3"><button onClick={confirmShippingStatusUpdate} disabled={updatingShipping} className="flex-1 h-11 bg-brand-primary text-white font-bold rounded-xl hover:bg-brand-hover disabled:opacity-50">{updatingShipping ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Confirm"}</button><button onClick={() => setConfirmShippingChange(null)} className="flex-1 h-11 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300">Cancel</button></div></div></div>}
      </div>
    </AdminLayout>
  );
}
