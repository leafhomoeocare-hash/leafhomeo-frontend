import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { 
  Search, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  User,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { acceptAppointment, rejectAppointment, getDoctorAppointments } from "../../api/doctorApi";
import { getImageUrl } from "../../utils/imageHelper";
import Swal from "sweetalert2";
import { useNotification } from "../../context/NotificationContext";

export default function AppointmentRequests() {
  const navigate = useNavigate();
  const { showAppointmentAccepted, showAppointmentRejected } = useNotification();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters & Search
  const [filter, setFilter] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Sorting & Pagination
  const [sortColumn, setSortColumn] = useState("appointmentDateTime");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, entriesPerPage]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getDoctorAppointments(filter);
      if (response.status === 1) {
        setAppointments(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      // Fallback mock data if API unavailable
      setAppointments([
        { 
          id: 1, 
          appointmentId: "REQ1001",
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
          appointmentId: "REQ1002",
          patientId: 2,
          patientName: "Priya Patel", 
          patientImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
          patientPhone: "+91 87654 32109",
          appointmentDateTime: new Date().toISOString(),
          status: "pending",
          reason: "Joint pain"
        }
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
            Accepted
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
            Rejected
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

  // Processed Data (Filtered & Sorted)
  const processedAppointments = useMemo(() => {
    let result = appointments.filter(apt => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (apt.patientName || "").toLowerCase().includes(term) ||
        (apt.appointmentId || "").toString().toLowerCase().includes(term) ||
        (apt.patientPhone || apt.phone || "").toLowerCase().includes(term) ||
        (apt.reason || apt.symptoms || "").toLowerCase().includes(term);

      const matchesFilter = filter === "all" || (apt.status || "").toLowerCase() === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });

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
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Appointment Requests</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">Review and respond to incoming patient appointment requests</p>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Pending Requests</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {appointments.filter(a => (a.status || "").toLowerCase() === "pending").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Accepted</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {appointments.filter(a => ["accepted", "confirmed"].includes((a.status || "").toLowerCase())).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Completed</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {appointments.filter(a => (a.status || "").toLowerCase() === "completed").length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total Requests</p>
                <p className="text-2xl font-extrabold text-gray-900">{appointments.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center">
                <Calendar className="h-5 w-5 text-brand-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by patient name, phone, or reason..."
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

            {/* Entries Dropdown */}
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

          {/* Status Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-gray-100">
            {["pending", "all", "accepted", "completed", "rejected"].map((status) => {
              const isSelected = filter === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer capitalize ${
                    isSelected
                      ? "bg-brand-primary text-white shadow-xs"
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
                    onClick={() => handleSort("patientName")}
                    className="py-3 px-3.5 cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Patient Details</span>
                      {getSortIcon("patientName")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("appointmentDateTime")}
                    className="py-3 px-3.5 cursor-pointer hover:bg-gray-100/80 transition-colors select-none group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Requested Date & Time</span>
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
                        <p className="text-xs text-gray-500">No appointment requests found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      className="hover:bg-brand-light/30 transition-colors"
                    >
                      {/* ID */}
                      <td className="py-3 px-3.5 font-mono text-gray-700 font-semibold whitespace-nowrap w-24">
                        #{apt.appointmentId || apt.id}
                      </td>

                      {/* Patient Details */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5 min-w-[170px]">
                          {apt.patientImage ? (
                            <img
                              src={getImageUrl(apt.patientImage)}
                              alt={apt.patientName}
                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-lg ${getAvatarColor(
                                apt.patientName
                              )} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}
                            >
                              {getInitials(apt.patientName)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-gray-900 block truncate">
                              {apt.patientName}
                            </span>
                            <span className="text-[11px] text-gray-400 block truncate">
                              {apt.reason || apt.symptoms || apt.patientPhone || apt.phone || "No details provided"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Requested Date & Time */}
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

                      {/* Type */}
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
                          {(apt.status || "").toLowerCase() === "pending" ? (
                            <>
                              <button
                                onClick={() => handleAccept(apt.id)}
                                disabled={actionLoadingId === apt.id}
                                className="h-8 px-3 bg-brand-primary hover:bg-brand-hover text-white rounded-lg font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                {actionLoadingId === apt.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check size={13} />
                                )}
                                <span>Accept</span>
                              </button>
                              <button
                                onClick={() => handleReject(apt.id)}
                                disabled={actionLoadingId === apt.id}
                                className="h-8 px-3 bg-white text-rose-600 hover:bg-rose-50 border border-rose-300 rounded-lg font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {actionLoadingId === apt.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <X size={13} />
                                )}
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-gray-300 font-mono text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
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
      </div>
    </DoctorLayout>
  );
}
