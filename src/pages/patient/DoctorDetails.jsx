import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Stethoscope,
  GraduationCap,
  Award,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  Star,
  Video,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle,
  MessageSquare
} from "lucide-react";
import { getPublicDoctorProfile } from "../../api/doctorApi";
import { getImageUrl } from "../../utils/imageHelper";

export default function DoctorDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getPublicDoctorProfile(slug);
        if (response.status === 1) {
          setProfileData(response.data);
          setReviews(response.data.reviews || []);
        } else {
          setError(response.message || "Failed to fetch profile");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [slug]);

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
            onClick={() => navigate("/patient/doctors")}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all"
          >
            Back to Doctors
          </button>
        </div>
      </PatientLayout>
    );
  }

  if (!profileData) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">No profile data found</p>
        </div>
      </PatientLayout>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "-";
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const handleBookAppointment = () => {
    navigate("/patient/book/doctor", { state: { selectedDoctor: profileData } });
  };

  return (
    <PatientLayout>
      <div className="min-h-screen bg-gradient-to-br from-brand-light/30 to-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/patient/doctors")}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-6 font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Doctors
          </button>

          {/* Profile Header Card */}
          <div className="bg-white border-2 border-gray-100 rounded-3xl overflow-hidden shadow-lg mb-6">
            {/* Cover Image */}
            <div className="h-56 bg-gradient-to-r from-brand-primary via-brand-hover to-purple-600 relative">
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
            </div>

            {/* Profile Info */}
            <div className="px-8 pb-8">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-24 relative">
                {/* Profile Image */}
                <div className="w-40 h-40 rounded-3xl bg-white overflow-hidden border-4 border-white shadow-2xl shrink-0">
                  <img
                    src={getImageUrl(profileData.image) || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80"}
                    alt={profileData.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name and Basic Info */}
                <div className="flex-1 pt-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-4xl font-extrabold text-gray-900">{profileData.name}</h1>
                    {profileData.IsExpert && (
                      <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold border border-amber-200">
                        <Award size={14} />
                        Expert Doctor
                      </span>
                    )}
                  </div>
                  <p className="text-xl text-brand-primary font-semibold mt-2">
                    {Array.isArray(profileData.specialization) ? profileData.specialization.join(", ") : profileData.specialization}
                  </p>
                  <div className="flex items-center gap-6 mt-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                      <span className="text-lg font-bold text-gray-900">{profileData.averageRating || "4.8"}</span>
                      <span className="text-sm text-gray-400">({profileData.totalReviews || 120} reviews)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={18} />
                      <span className="text-base font-medium">{profileData.experience || "0"} years experience</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <CheckCircle size={18} className="text-green-500" />
                      <span className="text-base font-medium">Verified</span>
                    </div>
                  </div>
                </div>

                {/* Consultation Fee */}
                <div className="bg-gradient-to-br from-brand-light to-brand-primary/30 rounded-2xl p-6 text-center border-2 border-brand-primary/20">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Consultation Fee</p>
                  <p className="text-3xl font-extrabold text-brand-primary mt-1">{formatCurrency(profileData.consultationFee)}</p>
                  <p className="text-xs text-gray-400 mt-1">per session</p>
                </div>
              </div>

              {/* Bio */}
              {profileData.bio && (
                <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-brand-light/30 rounded-2xl border border-gray-100">
                  <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-brand-primary" />
                    About Dr. {profileData.name?.split(' ')[1] || 'Doctor'}
                  </h3>
                  <p className="text-base text-gray-700 leading-relaxed">{profileData.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Personal Information */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
                <User className="h-5 w-5 text-brand-primary" />
                Personal Information
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <User className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full Name</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.name || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <Mail className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email Address</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <Phone className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Mobile Number</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.mobile || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <Calendar className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Joined Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(profileData.joinedDate)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-brand-primary" />
                Professional Information
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <Stethoscope className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Specialization</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.specialization || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <GraduationCap className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Qualification</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.qualification || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <Award className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Experience</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.experience ? `${profileData.experience} years` : "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <MapPin className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Location</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">Available Online</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Info */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
                <Video className="h-5 w-5 text-brand-primary" />
                Consultation Details
              </h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <Video className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Consultation Type</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">Video Consultation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <Clock className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">30 minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <Award className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Consultation Fee</p>
                    <p className="text-sm font-bold text-brand-primary mt-0.5">{formatCurrency(profileData.consultationFee)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-brand-light rounded-xl shrink-0">
                    <CheckCircle className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Availability</p>
                    <p className="text-sm font-medium text-green-600 mt-0.5">Available Today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
              <Star className="h-5 w-5 text-brand-primary" />
              Patient Reviews
            </h3>
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{review.review}</p>
                    <p className="text-xs font-semibold text-gray-900">- {review.patientName}</p>
                  </div>
                ))}
                {reviews.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">+ {reviews.length - 3} more reviews</p>
                )}
              </div>
            )}
          </div>

          {/* Book Appointment CTA */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-hover rounded-3xl p-8 text-white shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl">
                  <Video className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Book Your Consultation Now</h3>
                  <p className="text-base text-white/90 mt-1">Secure video consultation with Dr. {profileData.name?.split(' ')[1] || 'Doctor'}</p>
                  <p className="text-sm text-white/70 mt-2">Available for appointments today</p>
                </div>
              </div>
              <button
                onClick={handleBookAppointment}
                className="px-8 py-4 bg-white text-brand-primary rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center gap-3 text-lg shadow-xl"
              >
                <CalendarIcon size={20} />
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
