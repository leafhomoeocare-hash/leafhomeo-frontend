import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  Stethoscope,
  GraduationCap,
  Award,
  Lock,
  LogOut,
  Star,
  MessageSquare,
  Edit
} from "lucide-react";
import { getUser } from "../../api/authApi";
import { getImageUrl } from "../../utils/imageHelper";
import axios from "axios";

export default function DoctorProfile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUser();
        if (response.status === 1) {
          setProfileData(response.data);
        } else {
          setError(response.message || "Failed to fetch profile");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError("Something went wrong. Please try again.");
        
        // Use mock data if API fails
        setProfileData({
          id: 1,
          name: "Dr. Rajesh Kumar",
          email: "dr.rajesh@leafhomeo.com",
          mobile: "+91 98765 43210",
          specialization: "Homeopathy",
          qualification: "BHMS, MD",
          experience: 15,
          consultationFee: "500.00",
          bio: "Experienced homeopathy doctor specializing in chronic diseases and lifestyle disorders.",
          IsExpert: true,
          image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const token = sessionStorage.getItem("token");
        const API = axios.create({
          baseURL: import.meta.env.VITE_API_URL,
        });
        API.interceptors.request.use((config) => {
          if (token) {
            config.headers.Authorization = token;
          }
          return config;
        });
        const response = await API.get("/api/v1/patient/get-doctor-details", {
          params: { doctorId: profileData?.id }
        });
        if (response.data.status === 1) {
          setReviews(response.data.data.reviews || []);
        }
      } catch (err) {
        console.error("Reviews fetch error:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    if (profileData?.id) {
      fetchReviews();
    }
  }, [profileData?.id]);

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </DoctorLayout>
    );
  }

  if (error) {
    return (
      <DoctorLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-gray-600">{error}</p>
        </div>
      </DoctorLayout>
    );
  }

  if (!profileData) {
    return null;
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

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/doctor/login";
  };

  return (
    <DoctorLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-500">View your professional information</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-hover p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm overflow-hidden border-2 border-white/30">
                <img
                  src={getImageUrl(profileData.image) || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80"}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profileData.name}</h2>
                <p className="text-white/80 mt-1">Doctor ID: {profileData.id}</p>
                <p className="text-white/70 mt-1 text-sm">{profileData.specialization}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <User className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Full Name</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.name || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Mail className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Email Address</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.email || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Phone className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Mobile Number</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.mobile || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Calendar className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Joined Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(profileData.joinedDate)}</p>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h3>
                
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Stethoscope className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Specialization</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.specialization || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <GraduationCap className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Qualification</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.qualification || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Award className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Experience</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.experience ? `${profileData.experience} years` : "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <Award className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Consultation Fee</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(profileData.consultationFee)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <User className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Expert Status</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.IsExpert ? "Expert Doctor" : "Regular Doctor"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <User className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Bio</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.bio || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-6 bg-white border-2 border-gray-100 rounded-2xl p-6">
          <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-primary" />
            Patient Reviews
          </h3>
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
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
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/doctor/profile/change-password")}
            className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-brand-primary transition-all flex items-center gap-3"
          >
            <Lock className="h-5 w-5 text-brand-primary" />
            <div className="text-left">
              <p className="font-bold text-gray-900">Change Password</p>
              <p className="text-xs text-gray-500">Update your password</p>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-red-500 transition-all flex items-center gap-3"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <div className="text-left">
              <p className="font-bold text-gray-900">Logout</p>
              <p className="text-xs text-gray-500">Sign out from your account</p>
            </div>
          </button>
        </div>
      </div>
    </DoctorLayout>
  );
}
