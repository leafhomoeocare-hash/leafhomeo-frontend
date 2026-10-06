import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import {
  Search,
  Calendar,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  ChevronDown
} from "lucide-react";
import { getDoctorConsultationHistory } from "../../api/doctorApi";
import useDebounce from "../../hooks/useDebounce";

const STATUS_STYLES = {
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  accepted: "bg-green-100 text-green-700 border-green-200",
};

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "cancelled":
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "accepted":
    case "confirmed":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getStatusIcon = (status) => {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
    case "rejected":
      return <XCircle className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "accepted":
    case "confirmed":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function ConsultationHistory() {
  const navigate = useNavigate();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchConsultations();
  }, [filter, dateFilter]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filter !== "all") filters.status = filter;
      if (dateFilter) filters.date = dateFilter;
      
      const response = await getDoctorConsultationHistory(filters);
      if (response.status === 1) {
        setConsultations(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching consultation history:", error);
      // Use mock data if API fails
      setConsultations([
        { 
          id: 1, 
          patientId: 1,
          patientName: "Rahul Sharma", 
          patientImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          appointmentDateTime: new Date().toISOString(),
          status: "completed",
          reason: "Fever and headache",
          notes: "Prescribed Arnica 30C for headache and Rhus Tox for fever"
        },
        { 
          id: 2, 
          patientId: 2,
          patientName: "Priya Patel", 
          patientImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
          appointmentDateTime: new Date(Date.now() - 86400000).toISOString(),
          status: "completed",
          reason: "Joint pain",
          notes: "Continued with Bryonia 30C, showing improvement"
        },
        { 
          id: 3, 
          patientId: 3,
          patientName: "Amit Kumar", 
          patientImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
          appointmentDateTime: new Date(Date.now() - 86400000 * 7).toISOString(),
          status: "completed",
          reason: "Digestive issues",
          notes: "Nux Vomica 30C prescribed for digestive complaints"
        },
        { 
          id: 4, 
          patientId: 4,
          patientName: "Sneha Gupta", 
          patientImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80",
          appointmentDateTime: new Date(Date.now() - 86400000 * 7).toISOString(),
          status: "cancelled",
          reason: "Skin allergy",
          notes: "Patient cancelled appointment"
        },
        { 
          id: 5, 
          patientId: 5,
          patientName: "Vikram Singh", 
          patientImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
          appointmentDateTime: new Date(Date.now() - 86400000 * 30).toISOString(),
          status: "completed",
          reason: "Respiratory problem",
          notes: "Arsenic Album 30C for respiratory issues"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patient/${patientId}`);
  };

  const filteredConsultations = consultations.filter(consultation => {
    const matchesFilter = filter === "all" || consultation.status === filter;
    const matchesSearch = consultation.patientName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         consultation.reason?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
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
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Consultation History</h1>
          <p className="text-gray-500">View all completed consultations with filters</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-brand-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1">Total Consultations</p>
                <p className="text-2xl font-extrabold text-gray-900">{consultations.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center">
                <FileText className="h-6 w-6 text-brand-primary" />
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-brand-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1">Completed</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {consultations.filter(c => c.status === "completed").length}
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
                <p className="text-xs text-gray-400 font-semibold mb-1">Cancelled</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {consultations.filter(c => c.status === "cancelled").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-brand-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-semibold mb-1">This Month</p>
                <p className="text-2xl font-extrabold text-gray-900">
                  {consultations.filter(c => {
                    const date = new Date(c.appointmentDateTime);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
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
              placeholder="Search by patient name or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all", "completed", "cancelled", "pending"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === status
                    ? "bg-brand-primary text-white"
                    : "bg-white border-2 border-gray-200 text-gray-700 hover:border-brand-primary"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-white border-2 border-gray-200 text-gray-700 hover:border-brand-primary transition-all"
            >
              <Filter size={16} />
              More Filters
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Additional Filters */}
        {showFilters && (
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-2">Date Range</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Consultations List */}
        {filteredConsultations.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500">No consultations found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation) => (
              <div
                key={consultation.id}
                className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-brand-primary/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Patient Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-light to-brand-primary/20 overflow-hidden border-2 border-white shadow-md shrink-0">
                      <img
                        src={consultation.patientImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"}
                        alt={consultation.patientName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{consultation.patientName}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(consultation.status)}`}>
                          {getStatusIcon(consultation.status)}
                          {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{consultation.reason || "No reason provided"}</p>
                      <p className="text-xs text-gray-400 font-semibold">
                        {formatDateTime(consultation.appointmentDateTime)}
                      </p>
                      {consultation.notes && (
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="font-semibold">Notes:</span> {consultation.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleViewPatient(consultation.patientId)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-white rounded-xl font-medium transition-all"
                    >
                      <User size={16} />
                      View Patient
                    </button>
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
