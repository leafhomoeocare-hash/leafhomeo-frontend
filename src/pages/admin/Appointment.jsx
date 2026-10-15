import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Calendar, Clock, ChevronDown, User, Phone, Check, AlertCircle, MessageSquare } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { getAppointments, updateShippingStatus } from "../../api/appointmentApi";
import { getImageUrl } from "../../utils/imageHelper";

// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const COLUMNS = [
  { key: "appointmentId", label: "Appointment ID" },
  { key: "name", label: "Patient" },
  { key: "datetime", label: "Date & Time" },
  { key: "doctor", label: "Doctor" },
  { key: "status", label: "Status" },
  { key: "payment", label: "Payment" },
  { key: "shipping", label: "Shipping" },
  { key: "tracking", label: "Tracking" },
  { key: "actions", label: "Actions" },

];

const STATUS_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const PAYMENT_STYLES = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  refunded: "bg-gray-50 text-gray-600 border-gray-200",
};

const SHIPPING_STYLES = {
  draft: "bg-gray-50 text-gray-600 border-gray-200",
  prepared: "bg-blue-50 text-blue-700 border-blue-200",
  ready_to_transit: "bg-purple-50 text-purple-700 border-purple-200",
  in_transit: "bg-orange-50 text-orange-700 border-orange-200",
};

function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  return { date, time };
}

function calculateAge(dob) {
  if (!dob) return "-";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : "-";
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

function formatRequestType(type) {
  if (type === "any_doctor") return "Any Doctor";
  if (type === "specific_doctor") return "Specific Doctor";
  return type || "-";
}

function StatusBadge({ status }) {
  const key = (status || "pending").toLowerCase();
  const styleClass = STATUS_STYLES[key] || STATUS_STYLES.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        key === 'confirmed' || key === 'completed' ? 'bg-emerald-500' :
        key === 'pending' ? 'bg-amber-500' : 'bg-rose-500'
      }`} />
      {status || "Pending"}
    </span>
  );
}

function PaymentBadge({ status }) {
  const key = (status || "pending").toLowerCase();
  const styleClass = PAYMENT_STYLES[key] || PAYMENT_STYLES.pending;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        key === 'paid' ? 'bg-emerald-500' :
        key === 'pending' ? 'bg-amber-500' :
        key === 'failed' ? 'bg-rose-500' : 'bg-gray-500'
      }`} />
      {status || "Pending"}
    </span>
  );
}

function ShippingBadge({ status }) {
  const key = (status || "draft").toLowerCase();
  const styleClass = SHIPPING_STYLES[key] || SHIPPING_STYLES.draft;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        key === 'draft' ? 'bg-gray-500' :
        key === 'prepared' ? 'bg-blue-500' :
        key === 'ready_to_transit' ? 'bg-purple-500' :
        key === 'in_transit' ? 'bg-orange-500' : 'bg-gray-500'
      }`} />
      {status === 'ready_to_transit' ? 'Ready to Transit' : status || "Draft"}
    </span>
  );
}

export default function AppointmentManagement() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const entriesPerPage = 10; // Fixed entries per page

  const [updatingShipping, setUpdatingShipping] = useState(false);
  const [confirmShippingChange, setConfirmShippingChange] = useState(null);

  const handleShippingStatusChange = async (appt, newStatus) => {
    if (appt.shippingStatus === newStatus) return;
    setConfirmShippingChange({ appt, newStatus });
  };

  const confirmShippingStatusUpdate = async () => {
    if (!confirmShippingChange) return;
    const { appt, newStatus } = confirmShippingChange;
    try {
      setUpdatingShipping(true);
      const response = await updateShippingStatus(appt.id, newStatus);
      if (response.status === 1) {
        setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, shippingStatus: newStatus } : a));
      } else throw new Error(response.message || "Failed to update shipping status");
    } catch (error) {
      console.error("Failed to update shipping status:", error);
      alert("Failed to update shipping status: " + error.message);
    } finally {
      setUpdatingShipping(false);
      setConfirmShippingChange(null);
    }
  };

  const cancelShippingStatusUpdate = () => {
    setConfirmShippingChange(null);
  };

  const getAvailableShippingStatuses = (currentStatus) => {
    const statusFlow = {
      draft: ['prepared'],
      prepared: ['ready_to_transit'],
      ready_to_transit: ['in_transit'],
      in_transit: []
    };
    
    return statusFlow[currentStatus] || [];
  };

  const handleViewChat = (appt) => {
    if (!appt.id) {
      alert("Cannot view chat - appointment information missing");
      return;
    }
    // Navigate to admin chat monitoring page
    navigate(`/admin/chat-monitoring/${appt.id}`);
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAppointments(currentPage, entriesPerPage, appliedSearch);
      if (response.status === 1) {
        setAppointments(response.data?.appointments || []);
        setTotalRecords(response.data?.totalRecords || 0);
        setTotalPages(response.data?.totalPages || 1);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, appliedSearch]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Debounced search - auto search after 500ms of no typing
  const debouncedSearch = useCallback(
    debounce((value) => {
      setAppliedSearch(value);
      setCurrentPage(1);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  const handleSearchClick = () => {
    setAppliedSearch(search);
    setCurrentPage(1);
  };

  const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endItem = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track, reschedule, and manage all patient consultations.</p>
        </div>
      </div>

      {/* Search row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by patient name, phone, doctor..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all focus:border-brand-primary"
          />
        </div>
        <button
          onClick={handleSearchClick}
          className="flex h-11 items-center justify-center gap-2 text-white px-6 rounded-xl text-sm font-semibold shadow-xs transition-colors bg-brand-primary hover:bg-brand-hover cursor-pointer"
        >
          <Search size={16} />
          Search
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Table - desktop/tablet */}
        <div className="hidden md:block">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-left text-gray-500 uppercase tracking-wider text-[10px]">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-3 font-semibold whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((appt) => {
                const dt = formatDateTime(appt.appointmentDate);
                return (
                  <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 text-xs">#{appt.appointmentId || appt.id}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate(`/admin/appointments/${appt.id}`, { state: { appointmentId: appt.id } })}>
                        {appt.patient?.image ? (
                          <img
                            src={getImageUrl(appt.patient.image)}
                            alt={appt.patient.name}
                            className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center font-bold text-brand-dark text-[10px] border border-brand-primary/10 flex-shrink-0">
                            {appt.patient?.name?.[0] || "P"}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-gray-900 block text-xs hover:underline truncate max-w-[150px]">{appt.patient?.name}</span>
                          <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{appt.patient?.email || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {typeof dt === "object" ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 font-semibold text-gray-800 text-xs">
                            <Calendar size={11} className="text-brand-primary" />
                            {dt.date}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                            <Clock size={10} />
                            {dt.time}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {appt.doctor?.image ? (
                          <img
                            src={getImageUrl(appt.doctor.image)}
                            alt={appt.doctor.name}
                            className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://cdn-icons-png.flaticon.com/512/387/387561.png";
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center font-bold text-brand-dark text-[10px] border border-brand-primary/10 flex-shrink-0">
                            {appt.doctor?.name?.replace("Dr. ", "")?.[0] || "D"}
                          </div>
                        )}
                        <span className="font-semibold text-gray-900 text-xs truncate max-w-[120px]">{appt.doctor?.name || "Not Assigned"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <PaymentBadge status={appt.payment?.status || "pending"} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {appt.trackingUrl ? (
                        <a
                          href={appt.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline font-semibold"
                        >
                          Track Package
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {appt.status === "completed" ? (
                        <select
                          value={appt.shippingStatus || "draft"}
                          onChange={(e) => handleShippingStatusChange(appt, e.target.value)}
                          disabled={updatingShipping}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border focus:outline-none focus:border-green-500 disabled:opacity-50 appearance-none ${SHIPPING_STYLES[appt.shippingStatus || "draft"] || SHIPPING_STYLES.draft}`}
                        >
                          <option value={appt.shippingStatus || "draft"}>{appt.shippingStatus === 'ready_to_transit' ? 'Ready to Transit' : (appt.shippingStatus || "Draft")}</option>
                          {getAvailableShippingStatuses(appt.shippingStatus || "draft").map(status => (
                            <option key={status} value={status}>
                              {status === 'ready_to_transit' ? 'Ready to Transit' : status.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <ShippingBadge status={appt.shippingStatus || "draft"} />
                      )}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {appt.doctor ? (
                        <button
                          onClick={() => handleViewChat(appt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <MessageSquare size={14} />
                          View Chat
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>

                  </tr>
                );
              })}
              {!loading && appointments.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No appointments match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards - mobile only */}
        <div className="md:hidden divide-y divide-gray-100">
          {appointments.map((appt) => {
            const dt = formatDateTime(appt.appointmentDate);
            return (
              <div key={appt.id} className="p-5 hover:bg-gray-50/50">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-80" onClick={() => navigate(`/admin/appointments/${appt.id}`, { state: { appointmentId: appt.id } })}>
                    {appt.patient?.image ? (
                      <img
                        src={getImageUrl(appt.patient.image)}
                        alt={appt.patient.name}
                        className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-sm border border-brand-primary/10 flex-shrink-0">
                        {appt.patient?.name?.[0] || "P"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate hover:underline">{appt.patient?.name}</p>
                      <p className="text-xs text-gray-400 truncate">{appt.patient?.email || "-"}</p>
                    </div>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium text-gray-600 mb-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                      <Phone size={11} /> Phone
                    </p>
                    <p className="text-gray-900 mt-0.5">{appt.patient?.mobile || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Doctor</p>
                    <p className="text-gray-900 mt-0.5 truncate">{appt.doctor?.name || "Not Assigned"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                      <Calendar size={11} /> Appointment Date & Time
                    </p>
                    <p className="text-gray-900 mt-0.5 font-semibold">
                      {typeof dt === "object" ? `${dt.date} at ${dt.time}` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Payment</p>
                    <div className="mt-0.5">
                      <PaymentBadge status={appt.payment?.status || "pending"} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Shipping</p>
                    <div className="mt-0.5">
                      {appt.status === "completed" ? (
                        <select
                          value={appt.shippingStatus || "draft"}
                          onChange={(e) => handleShippingStatusChange(appt, e.target.value)}
                          disabled={updatingShipping}
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold border focus:outline-none focus:border-green-500 disabled:opacity-50 appearance-none ${SHIPPING_STYLES[appt.shippingStatus || "draft"] || SHIPPING_STYLES.draft}`}
                        >
                          <option value={appt.shippingStatus || "draft"}>{appt.shippingStatus === 'ready_to_transit' ? 'Ready to Transit' : (appt.shippingStatus || "Draft")}</option>
                          {getAvailableShippingStatuses(appt.shippingStatus || "draft").map(status => (
                            <option key={status} value={status}>
                              {status === 'ready_to_transit' ? 'Ready to Transit' : status.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <ShippingBadge status={appt.shippingStatus || "draft"} />
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  {appt.doctor && appt.status === "paid" && (
                    <button
                      onClick={() => handleViewChat(appt)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <MessageSquare size={14} />
                      View Chat
                    </button>
                  )}
                  <button className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl border border-gray-100">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            );
          })}
          {!loading && appointments.length === 0 && (
            <div className="px-5 py-12 text-center text-gray-400 font-medium">No appointments match your search.</div>
          )}
        </div>

        {/* Footer (pagination) */}
        <div className="px-6 py-4 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/20">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-800">{startItem}</span> to <span className="font-semibold text-gray-800">{endItem}</span> of <span className="font-semibold text-gray-800">{totalRecords}</span> entries
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={goPrevPage}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-lg border border-gray-200/50">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goNextPage}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Shipping Status Confirmation Modal */}
      {confirmShippingChange && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight mb-2">Update Shipping Status</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to change the shipping status from <span className="font-semibold text-gray-900 capitalize">{confirmShippingChange.appt.shippingStatus || "Draft"}</span> to <span className="font-semibold text-gray-900 capitalize">{confirmShippingChange.newStatus.replace('_', ' ')}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmShippingChange(null)}
                disabled={updatingShipping}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmShippingStatusUpdate}
                disabled={updatingShipping}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {updatingShipping ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
