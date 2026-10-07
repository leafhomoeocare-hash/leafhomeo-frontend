import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
// import { getPatientProfile } from "../../api/patientApi";
import { getUser } from "../../api/authApi";
import { getImageUrl } from "../../utils/imageHelper";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem("token");
      const userRole = sessionStorage.getItem("user") ? JSON.parse(sessionStorage.getItem("user")).role : null;
      const localUser = JSON.parse(sessionStorage.getItem("user") || "{}");
      
      console.log("=== Profile Fetch Debug ===");
      console.log("Token present:", !!token);
      console.log("userRole from sessionStorage:", userRole);
      console.log("Local user data:", localUser);

      if (!token) {
        navigate("/login");
        return;
      }

      const userResponse = await getUser();

      console.log("API Response:", userResponse);
      console.log("API Response data:", userResponse.data);

      if (userResponse.status === 1) {
        setProfileData(userResponse.data);
      } else {
        setError(userResponse.message || "Failed to fetch profile data");
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
            onClick={fetchProfile}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl hover:bg-brand-hover transition-all"
          >
            Retry
          </button>
        </div>
      </PatientLayout>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">My Profile</h1>
            <p className="text-gray-500">View your personal information</p>
          </div>
          <button
            onClick={() => navigate("/patient/profile/edit")}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all"
          >
            <Edit size={18} />
            Edit Profile
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-brand-primary to-brand-hover p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-sm overflow-hidden border-2 border-white/30">
                <img
                  src={getImageUrl(profileData.image) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profileData.name}</h2>
                <p className="text-white/80 mt-1">Patient ID: {profileData.id}</p>
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
                    <p className="text-xs text-gray-400 font-semibold">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.dob || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <User className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Gender</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{profileData.gender || "-"}</p>
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
                    <p className="text-xs text-gray-400 font-semibold">House Number</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.houseNumber || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Address Line 1</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.addressLine1 || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Address Line 2</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.addressLine2 || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">City</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.city || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">State</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.state || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Pincode</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.pincode || "-"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-brand-light rounded-xl">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold">Country</p>
                    <p className="text-sm font-medium text-gray-900">{profileData.country || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => navigate("/patient/profile/edit")}
            className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-brand-primary transition-all flex items-center gap-3"
          >
            <Edit className="h-5 w-5 text-brand-primary" />
            <div className="text-left">
              <p className="font-bold text-gray-900">Edit Profile</p>
              <p className="text-xs text-gray-500">Update your personal information</p>
            </div>
          </button>
          <button
            onClick={() => navigate("/patient/profile/change-password")}
            className="p-4 bg-white border-2 border-gray-100 rounded-xl hover:border-brand-primary transition-all flex items-center gap-3"
          >
            <User className="h-5 w-5 text-brand-primary" />
            <div className="text-left">
              <p className="font-bold text-gray-900">Change Password</p>
              <p className="text-xs text-gray-500">Update your password</p>
            </div>
          </button>
        </div>
      </div>
    </PatientLayout>
  );
}
