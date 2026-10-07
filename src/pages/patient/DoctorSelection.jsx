import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import { getExpertDoctors } from "../../api/doctorApi";
import Swal from "sweetalert2";
import useDebounce from "../../hooks/useDebounce";
import {
  Star,
  MapPin,
  Clock,
  Calendar,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Users,
  UserCheck,
  User,
  ArrowRight
} from "lucide-react";

export default function DoctorSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Check if we should show doctor list (when accessed from sidebar or Browse Doctors button)
  const searchParams = new URLSearchParams(location.search);
  const showDoctorList = searchParams.get('showList') === 'true';

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      const filtered = allDoctors.filter(doctor =>
        (doctor.name && typeof doctor.name === 'string' && doctor.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (doctor.specialization && (
          (typeof doctor.specialization === 'string' && doctor.specialization.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
          (Array.isArray(doctor.specialization) && doctor.specialization.some(s => s.toLowerCase().includes(debouncedSearchTerm.toLowerCase())))
        ))
      );
      setDoctors(filtered);
    } else {
      setDoctors(allDoctors);
    }
  }, [debouncedSearchTerm, allDoctors]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await getExpertDoctors("");
      if (response.status === 1) {
        setAllDoctors(response.data || []);
        setDoctors(response.data || []);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || "Failed to fetch doctors",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookAnyDoctor = () => {
    navigate("/patient/book/any-doctor");
  };

  const handleBookSpecificDoctor = (doctor) => {
    navigate("/patient/book/doctor", { state: { selectedDoctor: doctor } });
  };

  const handleViewProfile = (doctor) => {
    const slug = doctor.name || doctor.id;
    navigate(`/patient/doctors/${slug}`);
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

  if (error) {
    return (
      <PatientLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={fetchDoctors}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl hover:bg-brand-hover transition-all"
          >
            Retry
          </button>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {showDoctorList ? "Our Expert Doctors" : "Book an Appointment"}
          </h1>
          <p className="text-gray-500">
            {showDoctorList ? "Browse our expert homeopaths and select your preferred specialist" : "Choose how you'd like to book your consultation"}
          </p>
        </div>

        {/* Booking Options - Only show when showDoctorList is false */}
        {!showDoctorList && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Option A: Any Doctor */}
            <div
              onClick={handleBookAnyDoctor}
              className="group relative p-8 bg-gradient-to-br from-brand-light/30 to-purple-50 border-2 border-brand-primary/20 rounded-3xl cursor-pointer transition-all duration-300 hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand-primary/10 transition-all" />
              
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-brand-light to-brand-primary/30 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-brand-primary" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-brand-primary transition-colors">
                  Request to Any Available Doctor
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  Submit your appointment request to all available doctors. The first available doctor will accept your request.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1.5 bg-brand-light text-brand-dark rounded-full text-xs font-bold border border-brand-primary/20">
                    ⚡ Fastest
                  </span>
                  <span className="px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200">
                    Multiple Options
                  </span>
                </div>
                
                <div className="flex items-center text-brand-primary font-bold group-hover:translate-x-2 transition-transform">
                  Continue <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Option B: Specific Doctor */}
            <div
              onClick={() => navigate("/patient/doctors?showList=true")}
              className="group relative p-8 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-3xl cursor-pointer transition-all duration-300 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-200 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-200 transition-all" />
              
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-8 w-8 text-purple-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
                  Choose a Specific Doctor
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                  Browse our expert homeopaths and select your preferred specialist for your appointment.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold border border-purple-200">
                    🎯 Specific
                  </span>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-200">
                    📅 Schedule
                  </span>
                </div>
                
                <div className="flex items-center text-purple-600 font-bold group-hover:translate-x-2 transition-transform">
                  Browse Doctors <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Doctors Section - Only show when showDoctorList is true */}
        {showDoctorList && (
          <div id="doctors-section">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialization..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>

            {/* Doctors Grid */}
            {doctors.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
                <AlertCircle className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500">No doctors found matching your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="group bg-white border-2 border-gray-100 rounded-3xl p-5 hover:border-brand-primary hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-light to-brand-primary/20 overflow-hidden border-2 border-white shadow-md shrink-0">
                        <img
                          src={doctor.image ? (doctor.image.startsWith("http") ? doctor.image : `${import.meta.env.VITE_API_URL}/${doctor.image}`) : "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80"}
                          alt={doctor.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-gray-900 text-base group-hover:text-brand-primary transition-colors truncate">{doctor.name}</h5>
                        <p className="text-xs font-bold text-brand-primary uppercase tracking-wide truncate mt-1">
                          {Array.isArray(doctor.specialization) ? doctor.specialization.join(", ") : doctor.specialization}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Star size={14} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-bold text-gray-900">{doctor.averageRating || "0.0"}</span>
                          <span className="text-xs text-gray-400">({doctor.totalReviews || 0})</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-gray-50 to-brand-light/30 rounded-xl p-3 text-center border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Experience</p>
                        <p className="text-sm font-bold text-gray-900">{doctor.experience || "0"} yrs</p>
                      </div>
                      <div className="bg-gradient-to-br from-brand-light to-brand-primary/30 rounded-xl p-3 text-center border border-brand-primary/20">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Fee</p>
                        <p className="text-sm font-bold text-brand-primary">₹{doctor.consultationFee || 0}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewProfile(doctor)}
                        className="flex-1 py-3 bg-white border-2 border-brand-primary text-brand-primary font-bold rounded-xl hover:bg-brand-light hover:border-brand-primary transition-all flex items-center justify-center gap-2"
                      >
                        <User size={16} />
                        View Profile
                      </button>
                      <button
                        onClick={() => handleBookSpecificDoctor(doctor)}
                        className="flex-1 py-3 bg-gradient-to-r from-brand-primary to-brand-hover text-white font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Calendar size={16} />
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
