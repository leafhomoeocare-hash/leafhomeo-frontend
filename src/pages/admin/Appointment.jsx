import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Calendar, Clock, ChevronDown, User, Phone, Check, AlertCircle, X, MessageSquare } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { getAppointments, updateShippingStatus } from "../../api/appointmentApi";

const ENTRIES_OPTIONS = [5, 10, 25, 50];

const COLUMNS = [
  { key: "appointmentId", label: "Appointment ID" },
  { key: "name", label: "Patient" },
  { key: "mobile", label: "Phone" },
  { key: "datetime", label: "Date & Time" },
  { key: "doctor", label: "Doctor" },
  { key: "status", label: "Status" },
  { key: "payment", label: "Payment" },
  { key: "shipping", label: "Shipping" },
  { key: "tracking", label: "Tracking" },
  { key: "notes", label: "Notes" },
  { key: "chat", label: "Chat" },

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
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
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
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedAppt, setSelectedAppt] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatingShipping, setUpdatingShipping] = useState(false);
  const [confirmShippingChange, setConfirmShippingChange] = useState(null);

  const handleOpenDetails = (appt) => {
    setSelectedAppt(appt);
    setDetailsOpen(true);
  };

  const handleShippingStatusChange = async (appt, newStatus) => {
    // Don't open confirmation if status hasn't changed
    if (appt.shippingStatus === newStatus) {
      return;
    }
    setConfirmShippingChange({ appt, newStatus });
  };

  const confirmShippingStatusUpdate = async () => {
    if (!confirmShippingChange) return;

    const { appt, newStatus } = confirmShippingChange;
    
    try {
      setUpdatingShipping(true);
      
      const response = await updateShippingStatus(appt.id, newStatus);
      
      if (response.status === 1) {
        // Update local state
        setAppointments(prev => prev.map(a => 
          a.id === appt.id ? { ...a, shippingStatus: newStatus } : a
        ));
        
        if (selectedAppt?.id === appt.id) {
          setSelectedAppt(prev => ({ ...prev, shippingStatus: newStatus }));
        }
      } else {
        throw new Error(response.message || "Failed to update shipping status");
      }
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

  const handleSearchClick = () => {
    setAppliedSearch(search);
    setCurrentPage(1);
  };

  const handleEntriesChange = (value) => {
    setEntriesPerPage(value);
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
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
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
        {/* Entries per page header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={entriesPerPage}
                onChange={(e) => handleEntriesChange(Number(e.target.value))}
                className="appearance-none border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 text-sm text-gray-700 outline-hidden focus:border-brand-primary bg-white cursor-pointer"
              >
                {ENTRIES_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <span className="text-sm text-gray-500 font-medium">entries per page</span>
          </div>
          {loading && (
            <span className="text-xs text-brand-primary font-bold animate-pulse">
              Loading...
            </span>
          )}
        </div>

        {/* Table - desktop/tablet */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-left text-gray-500 uppercase tracking-wider text-xs">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-6 py-4 font-semibold whitespace-nowrap">
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
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <span className="font-semibold text-gray-900 text-sm">#{appt.appointmentId || appt.id}</span>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-3 cursor-pointer hover:opacity-80" onClick={() => handleOpenDetails(appt)}>
                        {appt.patient?.image ? (
                          <img
                            src={`http://localhost:5000/${appt.patient.image.replace(/\\/g, '/')}`}
                            alt={appt.patient.name}
                            className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-xs border border-brand-primary/10 flex-shrink-0">
                            {appt.patient?.name?.[0] || "P"}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-gray-900 block hover:underline">{appt.patient?.name}</span>
                          <span className="text-xs text-gray-400">{appt.patient?.email || "-"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-gray-600 whitespace-nowrap font-semibold">{appt.patient?.mobile || "-"}</td>
                    <td className="px-6 py-4.5 text-gray-600 whitespace-nowrap">
                      {typeof dt === "object" ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 font-semibold text-gray-800 text-sm">
                            <Calendar size={13} className="text-brand-primary" />
                            {dt.date}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                            <Clock size={12} />
                            {dt.time}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-gray-700 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {appt.doctor?.image ? (
                          <img
                            src={`http://localhost:5000/${appt.doctor.image.replace(/\\/g, '/')}`}
                            alt={appt.doctor.name}
                            className="w-8 h-8 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://cdn-icons-png.flaticon.com/512/387/387561.png";
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-xs border border-brand-primary/10 flex-shrink-0">
                            {appt.doctor?.name?.replace("Dr. ", "")?.[0] || "D"}
                          </div>
                        )}
                        <span className="font-semibold text-gray-900">{appt.doctor?.name || "Not Assigned"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      <PaymentBadge status={appt.payment?.status || "pending"} />
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {appt.trackingUrl ? (
                        <a 
                          href={appt.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Track Package
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 whitespace-nowrap">
                      {appt.status === "paid" ? (
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
                    <td className="px-6 py-4.5 text-gray-600 whitespace-nowrap text-sm max-w-xs truncate" title={appt.notes}>{appt.notes || "-"}</td>
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
                  <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-80" onClick={() => handleOpenDetails(appt)}>
                    {appt.patient?.image ? (
                      <img
                        src={`http://localhost:5000/${appt.patient.image.replace(/\\/g, '/')}`}
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
                      {appt.status === "paid" ? (
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
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Notes</p>
                    <p className="text-gray-900 mt-0.5 line-clamp-2">{appt.notes || "-"}</p>
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
      <AppointmentDetailsModal open={detailsOpen} onClose={() => setDetailsOpen(false)} appointment={selectedAppt} />
      
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
                onClick={cancelShippingStatusUpdate}
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

function AppointmentDetailsModal({ open, onClose, appointment, updatingShipping, handleShippingStatusChange }) {
  if (!open || !appointment) return null;

  const dt = formatDateTime(appointment.appointmentDate);
  const patientImg = appointment.patient?.image 
    ? `http://localhost:5000/${appointment.patient.image.replace(/\\/g, '/')}`
    : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const doctorImg = appointment.doctor?.image
    ? `http://localhost:5000/${appointment.doctor.image.replace(/\\/g, '/')}`
    : "https://cdn-icons-png.flaticon.com/512/387/387561.png";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-xl border border-gray-100 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Appointment Details</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-semibold">Booking ID #{appointment.id}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Patient & Doctor Avatars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Info Card */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex gap-4">
              <img 
                src={patientImg} 
                alt="Patient" 
                className="w-16 h-16 rounded-2xl object-cover border border-gray-200 flex-shrink-0" 
                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; }} 
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Patient</span>
                <h4 className="font-bold text-gray-900 mt-0.5 text-base truncate">{appointment.patient?.name}</h4>
                <p className="text-xs text-gray-500 mt-1 font-semibold truncate">{appointment.patient?.email}</p>
                <p className="text-xs text-gray-500 font-semibold">{appointment.patient?.mobile}</p>
                <div className="flex gap-4 mt-2 text-[11px] font-semibold text-gray-400">
                  <span>Gender: <span className="text-gray-700 capitalize">{appointment.patient?.gender || "-"}</span></span>
                  <span>DOB: <span className="text-gray-700">{appointment.patient?.dob || "-"}</span></span>
                </div>
              </div>
            </div>

            {/* Doctor Info Card */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex gap-4">
              <img 
                src={doctorImg} 
                alt="Doctor" 
                className="w-16 h-16 rounded-2xl object-cover border border-gray-200 flex-shrink-0" 
                onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/387/387561.png"; }} 
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Doctor</span>
                <h4 className="font-bold text-gray-900 mt-0.5 text-base truncate">{appointment.doctor?.name || "Not Assigned"}</h4>
                {appointment.doctor ? (
                  <>
                    <p className="text-xs text-brand-primary font-bold mt-1 truncate">{appointment.doctor.specialization}</p>
                    <p className="text-xs text-gray-500 font-semibold">Qual: {appointment.doctor.qualification}</p>
                    <p className="text-xs text-gray-500 font-semibold">Exp: {appointment.doctor.experience} Yrs</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Pending allocation</p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/30 p-4 border border-gray-100/50 rounded-2xl">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Date & Time</p>
              <p className="text-xs text-gray-800 font-bold mt-1">{typeof dt === "object" ? `${dt.date} at ${dt.time}` : "-"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Request Type</p>
              <span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                {(appointment.requestType || "").replace("_", " ")}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Booking Status</p>
              <div className="mt-1">
                <StatusBadge status={appointment.status} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Consultation Fee</p>
              <p className="text-xs text-gray-800 font-bold mt-1">₹{appointment.doctor?.consultationFee || "-"}</p>
            </div>
          </div>

          {/* Reason for Appointment */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Reason / Notes</p>
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-700 leading-relaxed font-medium">
              {appointment.notes || "No additional details provided."}
            </div>
          </div>

          {/* Payment Card */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="bg-gray-50/70 px-4 py-3 border-b border-gray-100">
              <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Payment Transaction Details</h4>
            </div>
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Amount</p>
                <p className="text-sm text-gray-900 font-bold mt-0.5">₹{appointment.payment?.amount || "0.00"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Status</p>
                <div className="mt-0.5">
                  <PaymentBadge status={appointment.payment?.status || "pending"} />
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Gateway</p>
                <p className="text-xs text-gray-800 font-bold mt-0.5 capitalize">{appointment.payment?.gateway || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Transaction ID</p>
                <p className="text-xs text-gray-800 font-semibold mt-0.5 break-all select-all">{appointment.payment?.transactionId || "-"}</p>
              </div>
            </div>
          </div>

          {/* Patient Address Card */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <div className="bg-gray-50/70 px-4 py-3 border-b border-gray-100">
              <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Patient Mailing Address</h4>
            </div>
            <div className="p-4 text-xs font-semibold text-gray-600 space-y-1">
              {appointment.patient?.houseNumber || appointment.patient?.addressLine1 ? (
                <>
                  <p className="text-gray-900"><span className="text-gray-400">House No / Area:</span> {appointment.patient.houseNumber || "-"}, {appointment.patient.addressLine1 || "-"}</p>
                  {appointment.patient.addressLine2 && <p className="text-gray-900"><span className="text-gray-400">Line 2:</span> {appointment.patient.addressLine2}</p>}
                  {appointment.patient.landmark && <p className="text-gray-900"><span className="text-gray-400">Landmark:</span> {appointment.patient.landmark}</p>}
                  <p className="text-gray-900"><span className="text-gray-400">City / Pincode:</span> {appointment.patient.city || "-"} - {appointment.patient.pincode || "-"}</p>
                  <p className="text-gray-900"><span className="text-gray-400">State / Country:</span> {appointment.patient.state || "-"}, {appointment.patient.country || "-"}</p>
                </>
              ) : (
                <p className="text-gray-400 italic">No address details registered.</p>
              )}
            </div>
          </div>

          {/* Consultation / Prescription Card */}
          {appointment.consultation && (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="bg-gray-50/70 px-4 py-3 border-b border-gray-100">
                <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Consultation & Prescription</h4>
              </div>
              <div className="p-4 space-y-3">
                {appointment.consultation.chiefComplaints && (
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Chief Complaints</p>
                    <p className="text-sm text-gray-700 mt-1">{appointment.consultation.chiefComplaints}</p>
                  </div>
                )}
                {appointment.consultation.perception && (
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Perception / Prescription</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{appointment.consultation.perception}</p>
                  </div>
                )}
                {appointment.consultation.callDuration && (
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Call Duration</p>
                    <p className="text-sm text-gray-700 mt-1">{appointment.consultation.callDuration}</p>
                  </div>
                )}
                {!appointment.consultation.chiefComplaints && !appointment.consultation.perception && (
                  <p className="text-gray-400 italic text-sm">No consultation details available.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
