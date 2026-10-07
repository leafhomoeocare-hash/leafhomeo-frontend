import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit,
  Loader2,
  AlertCircle,
  Stethoscope,
  GraduationCap,
  Award,
  Save,
  X
} from "lucide-react";
import { getUser, updateProfile } from "../../api/authApi";
import Swal from "sweetalert2";

export default function DoctorEditProfile() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getUser();
      if (response.status === 1) {
        const data = response.data;
        setProfileData({
          id: data.id,
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || "",
          specialization: data.specialization || "",
          qualification: data.qualification || "",
          experience: data.experience || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          registrationNumber: data.registrationNumber || "",
        });
      } else {
        setError(response.message || "Failed to fetch profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Something went wrong. Please try again.");
      
      // Use mock data if API fails
      setProfileData({
        id: 1,
        name: "Dr. Rajesh Kumar",
        email: "dr.rajesh@leafhomeo.com",
        mobile: "+91 98765 43210",
        specialization: "Homeopathy",
        qualification: "BHMS, MD",
        experience: "15 years",
        address: "123 Medical Center, New Delhi",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        registrationNumber: "HMC-12345",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await updateProfile(profileData);
      if (response.status === 1) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Profile updated successfully!",
          confirmButtonColor: "#00b100"
        });
        navigate("/doctor/profile");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || "Failed to update profile",
          confirmButtonColor: "#00b100"
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
        confirmButtonColor: "#00b100"
      });
    } finally {
      setSaving(false);
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

  if (error && !profileData) {
    return (
      <DoctorLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate("/doctor/profile")}
            className="px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all"
          >
            Back to Profile
          </button>
        </div>
      </DoctorLayout>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <DoctorLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Edit Profile</h1>
            <p className="text-gray-500">Update your professional information</p>
          </div>
          <button
            onClick={() => navigate("/doctor/profile")}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Edit Form */}
        <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
          <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="tel"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Specialization</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Stethoscope size={16} />
                    </span>
                    <input
                      type="text"
                      value={Array.isArray(profileData.specialization) ? profileData.specialization.join(", ") : profileData.specialization}
                      onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Qualification</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <GraduationCap size={16} />
                    </span>
                    <input
                      type="text"
                      value={profileData.qualification}
                      onChange={(e) => setProfileData({ ...profileData, qualification: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Experience</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Award size={16} />
                    </span>
                    <input
                      type="text"
                      value={profileData.experience}
                      onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                      placeholder="e.g., 15 years"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Registration Number</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Award size={16} />
                    </span>
                    <input
                      type="text"
                      value={profileData.registrationNumber}
                      onChange={(e) => setProfileData({ ...profileData, registrationNumber: e.target.value })}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Address Information</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Address</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">City</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">State</label>
                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Pincode</label>
                  <input
                    type="text"
                    value={profileData.pincode}
                    onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate("/doctor/profile")}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DoctorLayout>
  );
}
