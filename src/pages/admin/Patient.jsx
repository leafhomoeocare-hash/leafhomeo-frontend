import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { Search, MoreVertical, Mail, Phone, ChevronDown, MapPin, Calendar, Trash2, X, User, Eye } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { getPatients, deletePatient, getPatientDetails } from "../../api/appointmentApi";


const ENTRIES_OPTIONS = [5, 10, 25, 50];

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Phone" },
  { key: "gender", label: "Gender" },
  { key: "location", label: "Location" },
  { key: "createdAt", label: "Registered On" },
];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getPatients(currentPage, entriesPerPage, debouncedSearch);
      if (response.status === 1) {
        setPatients(response.data?.patients || []);
        setTotalRecords(response.data?.totalRecords || 0);
        setTotalPages(response.data?.totalPages || 1);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, debouncedSearch]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleEntriesChange = (value) => {
    setEntriesPerPage(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const handleDeletePatient = async (patientId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00B100',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setActionLoading(true);
          const response = await deletePatient(patientId);
          if (response.status === 1) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Patient deleted successfully',
              confirmButtonColor: '#00B100',
            });
            fetchPatients();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: response.message || "Failed to delete patient",
              confirmButtonColor: '#00B100',
            });
          }
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Something went wrong',
            confirmButtonColor: '#00B100',
          });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleViewPatient = async (patient) => {
    try {
      setActionLoading(true);
      const response = await getPatientDetails(patient.id);
      if (response.status === 1) {
        setViewPatient(response.data);
        setViewModalOpen(true);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || "Failed to fetch patient details",
          confirmButtonColor: '#00B100',
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong',
        confirmButtonColor: '#00B100',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endItem = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Patients</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage registered patients on Leaf Homeo Care.</p>
        </div>
      </div>

      {/* Search row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, mobile..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 text-sm outline-hidden transition-all focus:border-brand-primary"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
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
            <span className="flex items-center gap-1.5 text-xs text-brand-primary font-bold animate-pulse">
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
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-xs border border-brand-primary/10 flex-shrink-0">
                        {patient.user?.name?.[0] || "P"}
                      </div>
                      <span className="font-semibold text-gray-900">{patient.user?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-gray-600 whitespace-nowrap font-medium">{patient.user?.email}</td>
                  <td className="px-6 py-4.5 text-gray-600 whitespace-nowrap font-medium">{patient.user?.mobile}</td>
                  <td className="px-6 py-4.5 text-gray-700 font-semibold whitespace-nowrap capitalize">{patient.gender || "-"}</td>
                  <td className="px-6 py-4.5 text-gray-600 whitespace-nowrap font-medium">
                    {[patient.city, patient.country].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className="px-6 py-4.5 text-gray-400 font-semibold whitespace-nowrap">{formatDate(patient.createdAt)}</td>
                  <td className="px-6 py-4.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewPatient(patient)}
                        disabled={actionLoading}
                        className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePatient(patient.id)}
                        disabled={actionLoading}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && patients.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 1} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No patients match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards - mobile only */}
        <div className="md:hidden divide-y divide-gray-100">
          {patients.map((patient) => (
            <div key={patient.id} className="p-5 hover:bg-gray-50/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-sm border border-brand-primary/10 flex-shrink-0">
                    {patient.user?.name?.[0] || "P"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{patient.user?.name}</p>
                    <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 mt-0.5">
                      <Calendar size={12} />
                      Registered {formatDate(patient.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewPatient(patient)}
                    disabled={actionLoading}
                    className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDeletePatient(patient.id)}
                    disabled={actionLoading}
                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium text-gray-600">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                    <Mail size={11} /> Email
                  </p>
                  <p className="text-gray-900 truncate mt-0.5">{patient.user?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                    <Phone size={11} /> Phone
                  </p>
                  <p className="text-gray-900 mt-0.5">{patient.user?.mobile}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Gender</p>
                  <p className="text-gray-900 mt-0.5 capitalize">{patient.gender || "-"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                    <MapPin size={11} /> Location
                  </p>
                  <p className="text-gray-900 mt-0.5 truncate">
                    {[patient.city, patient.country].filter(Boolean).join(", ") || "-"}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {!loading && patients.length === 0 && (
            <div className="px-5 py-12 text-center text-gray-400 font-medium">No patients match your search.</div>
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

      {/* View Patient Modal */}
      {viewModalOpen && viewPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Patient Details</h3>
                <p className="text-xs text-gray-400 mt-0.5">View complete patient information</p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-xl border border-brand-primary/10">
                  {viewPatient.user?.name?.[0] || "P"}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{viewPatient.user?.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">Patient ID: #{viewPatient.id}</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.user?.email || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Mobile</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.user?.mobile || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Gender</p>
                    <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{viewPatient.gender || "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.dob ? formatDate(viewPatient.dob) : "-"}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Address Information</h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">House Number</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.houseNumber || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Address Line 1</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.addressLine1 || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Address Line 2</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.addressLine2 || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Landmark</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.landmark || "-"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">City</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.city || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">State</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.state || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Pincode</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.pincode || "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Country</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{viewPatient.country || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Registration Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Registered On</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(viewPatient.createdAt)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Last Updated</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(viewPatient.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
