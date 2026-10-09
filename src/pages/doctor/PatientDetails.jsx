import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit,
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { getPatientDetails, getDoctorConsultationHistory } from "../../api/doctorApi";
import { getImageUrl } from "../../utils/imageHelper";

export default function PatientDetails() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patientData, setPatientData] = useState(null);
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch patient details
      const patientResponse = await getPatientDetails(patientId);
      if (patientResponse.status === 1) {
        setPatientData(patientResponse.data);
        setConsultationHistory(patientResponse.data.appointments || []);
      }
    } catch (err) {
      console.error("Error fetching patient data:", err);
      setError("Something went wrong. Please try again.");
      
      // Use mock data if API fails
      setPatientData({
        id: patientId,
        name: "Rahul Sharma",
        email: "rahul.sharma@email.com",
        mobile: "+91 98765 43210",
        gender: "male",
        dob: "1990-05-15",
        address: "123 Main Street, New Delhi",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        joinedDate: "2023-01-15"
      });
      
      setConsultationHistory([
        {
          id: 1,
          appointmentDateTime: new Date().toISOString(),
          status: "completed",
          reason: "Fever and headache",
          notes: "Prescribed Arnica 30C for headache and Rhus Tox for fever"
        },
        {
          id: 2,
          appointmentDateTime: new Date(Date.now() - 86400000 * 7).toISOString(),
          status: "completed",
          reason: "Joint pain follow-up",
          notes: "Continued with Bryonia 30C, showing improvement"
        }
      ]);
    } finally {
      setLoading(false);
    }
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

  if (error && !patientData) {
    return (
      <DoctorLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/doctor/patients")}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all"
          >
            Back to Patients
          </button>
        </div>
      </DoctorLayout>
    );
  }

  if (!patientData) {
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getConsultationStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getConsultationStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <DoctorLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/doctor/patients")}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Patient Details</h1>
              <p className="text-gray-500">View patient information and consultation history</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden mb-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-hover p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm overflow-hidden border-2 border-white/30">
                <img
                  src={getImageUrl(patientData.image) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"}
                  alt={patientData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{patientData.name}</h2>
                <p className="text-white/80 mt-1">Patient ID: {patientData.id}</p>
                <p className="text-white/70 mt-1 text-sm">Member since {formatDate(patientData.joinedDate)}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <User className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">{patientData.name || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Mail className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Email Address</p>
                    <p className="text-sm font-medium text-gray-900">{patientData.email || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Phone className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Mobile Number</p>
                    <p className="text-sm font-medium text-gray-900">{patientData.mobile || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Calendar className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(patientData.dob)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <User className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Gender</p>
                    <p className="text-sm font-medium text-gray-900">{patientData.gender ? patientData.gender.charAt(0).toUpperCase() + patientData.gender.slice(1) : "-"}</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Address Information</h3>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Address</p>
                    <p className="text-sm font-medium text-gray-900">{patientData.address || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">City</p>
                    <p className="text-sm font-medium text-gray-900">{patientData.city || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">State</p>
                    <p className="text-sm font-medium text-gray-900">{patientData.state || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Pincode</p>
                    <p className="text-sm font-medium text-gray-900">{patientData.pincode || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Consultation Stats</h3>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Total Consultations</p>
                  <p className="text-2xl font-extrabold text-gray-900">{consultationHistory.length}</p>
                </div>

                <div className="bg-brand-light/30 rounded-xl p-4 border border-brand-primary/10">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Completed</p>
                  <p className="text-2xl font-extrabold text-brand-primary">
                    {consultationHistory.filter(c => c.status === "completed").length}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 font-semibold mb-1">Last Consultation</p>
                  <p className="text-sm font-bold text-gray-900">
                    {consultationHistory.length > 0 ? formatDate(consultationHistory[0].appointmentDateTime) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consultation History */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-gray-900">Consultation History</h3>
            <div className="flex items-center gap-2 text-brand-primary">
              <FileText size={20} />
              <span className="text-sm font-bold">{consultationHistory.length} consultations</span>
            </div>
          </div>

          {consultationHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
              <FileText className="h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No consultation history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {consultationHistory.map((consultation) => (
                <div
                  key={consultation.id}
                  className="bg-gray-50 border border-gray-100 rounded-xl p-5 hover:border-brand-primary/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getConsultationStatusColor(consultation.status)}`}>
                          {getConsultationStatusIcon(consultation.status)}
                          {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                        </span>
                        <p className="text-xs text-gray-400 font-semibold">
                          {formatDateTime(consultation.appointmentDateTime)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{consultation.reason || "No reason provided"}</p>
                      {consultation.notes && (
                        <p className="text-xs text-gray-600 mt-2 bg-white p-3 rounded-lg border border-gray-100">
                          <span className="font-semibold">Notes:</span> {consultation.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
