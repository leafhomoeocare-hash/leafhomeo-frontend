import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import {
  getUser,
  updateProfile,
  sendEmailOTP,
  updateEmail,
  sendPhoneOTP,
  updateMobile
} from "../../api/authApi";
import { getImageUrl } from "../../utils/imageHelper";
import Swal from "sweetalert2";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Camera,
  X,
  Shield,
  RotateCcw,
  Send,
  Edit3,
  Check
} from "lucide-react";

export default function EditProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    gender: "",
    dob: "",
    houseNumber: "",
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: ""
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Verification status from DB
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Email Change & OTP states
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Mobile Change & OTP states
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newMobile, setNewMobile] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // Cooldown timers
  useEffect(() => {
    let timer;
    if (emailCooldown > 0) {
      timer = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  useEffect(() => {
    let timer;
    if (phoneCooldown > 0) {
      timer = setTimeout(() => setPhoneCooldown(phoneCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [phoneCooldown]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = sessionStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const userResponse = await getUser();

      if (userResponse.status === 1) {
        const data = userResponse.data;
        setFormData({
          name: data.name || "",
          email: data.email || "",
          mobile: data.mobile || "",
          gender: data.gender || "",
          dob: data.dob || "",
          houseNumber: data.houseNumber || "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          landmark: data.landmark || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          country: data.country || ""
        });

        setIsEmailVerified(Boolean(data.isEmailVerified));
        setIsPhoneVerified(Boolean(data.isPhoneVerified));

        if (data.image) {
          setImagePreview(getImageUrl(data.image));
        }
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  // ===================== EMAIL VERIFICATION HANDLERS =====================
  const handleStartChangeEmail = () => {
    setIsChangingEmail(true);
    setNewEmail(formData.email);
    setEmailOtpSent(false);
    setEmailOtp("");
  };

  const handleCancelChangeEmail = () => {
    setIsChangingEmail(false);
    setNewEmail("");
    setEmailOtpSent(false);
    setEmailOtp("");
  };

  const handleSendEmailOTP = async () => {
    const targetEmail = (newEmail || formData.email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Email",
        text: "Please enter a valid email address.",
        confirmButtonColor: "#10b981"
      });
      return;
    }

    try {
      setEmailLoading(true);
      const res = await sendEmailOTP({ email: targetEmail });
      if (res.status === 1) {
        setEmailOtpSent(true);
        setEmailCooldown(45);

        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: `A 6-digit verification code was sent to ${targetEmail}.`,
          timer: 2500,
          showConfirmButton: false
        });

      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Send OTP",
          text: res.message || "Failed to send OTP. Please try again.",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send email verification OTP.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "#10b981"
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    const targetEmail = (newEmail || formData.email).trim().toLowerCase();
    if (!emailOtp || emailOtp.trim().length < 4) {
      Swal.fire({
        icon: "warning",
        title: "Enter OTP",
        text: "Please enter the OTP sent to your email.",
        confirmButtonColor: "#10b981"
      });
      return;
    }

    try {
      setEmailLoading(true);
      const res = await updateEmail({
        email: targetEmail,
        otp: emailOtp.trim()
      });

      if (res.status === 1) {
        setFormData(prev => ({ ...prev, email: targetEmail }));
        setIsEmailVerified(true);
        setIsChangingEmail(false);
        setEmailOtpSent(false);
        setEmailOtp("");

        // Update local sessionStorage cache if exists
        try {
          const userStr = sessionStorage.getItem("user");
          if (userStr) {
            const parsed = JSON.parse(userStr);
            parsed.email = targetEmail;
            parsed.isEmailVerified = true;
            sessionStorage.setItem("user", JSON.stringify(parsed));
          }
        } catch (e) {
          console.error("Error updating cached user:", e);
        }

        Swal.fire({
          icon: "success",
          title: "Email Verified!",
          text: "Your email address has been verified and updated successfully.",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: res.message || "Invalid OTP",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Error",
        text: err.response?.data?.message || "OTP verification failed. Please try again.",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setEmailLoading(false);
    }
  };

  // ===================== MOBILE VERIFICATION HANDLERS =====================
  const handleStartChangePhone = () => {
    setIsChangingPhone(true);
    setNewMobile(formData.mobile);
    setPhoneOtpSent(false);
    setPhoneOtp("");
  };

  const handleCancelChangePhone = () => {
    setIsChangingPhone(false);
    setNewMobile("");
    setPhoneOtpSent(false);
    setPhoneOtp("");
  };

  const handleSendPhoneOTP = async () => {
    const targetMobile = (newMobile || formData.mobile).trim();
    const cleanDigits = targetMobile.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Mobile Number",
        text: "Please enter a valid 10-digit mobile number.",
        confirmButtonColor: "#10b981"
      });
      return;
    }

    try {
      setPhoneLoading(true);
      const res = await sendPhoneOTP({ mobile: targetMobile });
      if (res.status === 1) {
        setPhoneOtpSent(true);
        setPhoneCooldown(60);

        if (res.data?.formattedMobile) {
          setNewMobile(res.data.formattedMobile);
        }

        Swal.fire({
          icon: "success",
          title: "OTP Sent!",
          text: `A verification code was sent to your phone.`,
          timer: 2500,
          showConfirmButton: false
        });

      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Send OTP",
          text: res.message || "Failed to send phone OTP.",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to send phone OTP. Please try again.",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    const targetMobile = (newMobile || formData.mobile).trim();
    if (!phoneOtp || phoneOtp.trim().length < 4) {
      Swal.fire({
        icon: "warning",
        title: "Enter OTP",
        text: "Please enter the OTP sent to your phone.",
        confirmButtonColor: "#10b981"
      });
      return;
    }

    try {
      setPhoneLoading(true);
      const res = await updateMobile({
        mobile: targetMobile,
        otp: phoneOtp.trim()
      });

      if (res.status === 1) {
        const updatedNum = res.data?.mobile || targetMobile;
        setFormData(prev => ({ ...prev, mobile: updatedNum }));
        setIsPhoneVerified(true);
        setIsChangingPhone(false);
        setPhoneOtpSent(false);
        setPhoneOtp("");

        // Update local sessionStorage cache if exists
        try {
          const userStr = sessionStorage.getItem("user");
          if (userStr) {
            const parsed = JSON.parse(userStr);
            parsed.mobile = updatedNum;
            parsed.isPhoneVerified = true;
            sessionStorage.setItem("user", JSON.stringify(parsed));
          }
        } catch (e) {
          console.error("Error updating cached user:", e);
        }

        Swal.fire({
          icon: "success",
          title: "Phone Verified!",
          text: "Your mobile number has been verified and updated successfully.",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: res.message || "Invalid OTP",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Verification Error",
        text: err.response?.data?.message || "OTP verification failed. Please try again.",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  // ===================== GENERAL PROFILE SUBMIT =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });
      if (image) {
        formDataToSend.append("image", image);
      }

      const updateResponse = await updateProfile(formDataToSend);

      if (updateResponse.status === 1) {
        // Update user name and image in sessionStorage
        try {
          const userStr = sessionStorage.getItem("user");
          if (userStr) {
            const parsed = JSON.parse(userStr);
            parsed.name = formData.name;
            sessionStorage.setItem("user", JSON.stringify(parsed));
          }
        } catch (e) {
          console.error("Failed to update cached user:", e);
        }

        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Profile updated successfully!",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        }).then(() => {
          navigate("/patient/profile");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: updateResponse.message || "Failed to update profile",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setSaving(false);
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

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/patient/profile")}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
          </button>
          <div className="flex items-center gap-6">
            <div className="relative">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-4 border-brand-primary/20"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="h-24 w-24 rounded-full bg-brand-light text-brand-primary border-4 border-brand-primary/20 flex items-center justify-center">
                  <User size={32} />
                </div>
              )}
              <label
                htmlFor="image-upload"
                className="absolute bottom-0 right-0 bg-brand-primary text-white rounded-full p-2 cursor-pointer hover:bg-brand-hover transition-colors shadow-sm"
              >
                <Camera size={16} />
              </label>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Edit Profile</h1>
              <p className="text-gray-500">Update your personal and contact information</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-100 rounded-2xl p-8 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section: Personal Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                Personal Information
              </h3>
            </div>

            {/* Full Name */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 block">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium transition-all"
                />
              </div>
            </div>

            {/* EMAIL ADDRESS & VERIFICATION BLOCK */}
            <div className="space-y-3 md:col-span-2 p-5 rounded-2xl border-2 border-brand-100/80 bg-brand-50/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-gray-800">Email Address</label>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle size={13} className="text-emerald-600" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300">
                      <AlertCircle size={13} className="text-amber-600" /> Unverified
                    </span>
                  )}
                </div>

                {!isChangingEmail && (
                  <div className="flex items-center gap-2">
                    {!isEmailVerified && (
                      <button
                        type="button"
                        onClick={handleStartChangeEmail}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Shield size={13} /> Verify Email
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStartChangeEmail}
                      className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} /> Change Email
                    </button>
                  </div>
                )}
              </div>

              {/* Email Input View Mode (Verified / Locked) */}
              {!isChangingEmail ? (
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 font-medium cursor-not-allowed select-none"
                  />
                </div>
              ) : (
                /* Email Change & Verification Active Mode */
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter new email address"
                      disabled={emailOtpSent}
                      className="w-full pl-12 pr-36 py-3 rounded-xl border-2 border-brand-primary/50 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-900 font-medium bg-white"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSendEmailOTP}
                        disabled={emailLoading || emailCooldown > 0}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-hover text-white transition-all disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        {emailLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : emailCooldown > 0 ? (
                          <RotateCcw className="h-3 w-3" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        {emailCooldown > 0
                          ? `Resend (${emailCooldown}s)`
                          : emailOtpSent
                          ? "Resend OTP"
                          : "Send OTP"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelChangeEmail}
                        className="p-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* POPUP / EXPANDED OTP FIELD FOR EMAIL */}
                  {emailOtpSent && (
                    <div className="p-4 bg-white rounded-xl border-2 border-emerald-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-semibold text-gray-800">
                          Enter 6-digit OTP sent to: <span className="text-brand-primary font-bold">{newEmail}</span>
                        </span>
                        <span className="text-gray-400 font-medium">Valid for 10 min</span>
                      </div>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary" />
                        <input
                          type="text"
                          value={emailOtp}
                          onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="w-full pl-12 pr-32 py-2.5 rounded-lg border-2 border-emerald-300 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 font-bold tracking-widest text-gray-800 text-base"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyEmailOTP}
                          disabled={emailLoading || emailOtp.length < 4}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition-all disabled:opacity-50 shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          {emailLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MOBILE NUMBER & VERIFICATION BLOCK */}
            <div className="space-y-3 md:col-span-2 p-5 rounded-2xl border-2 border-brand-100/80 bg-brand-50/20">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-gray-800">Mobile Number</label>
                  {isPhoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      <CheckCircle size={13} className="text-emerald-600" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300">
                      <AlertCircle size={13} className="text-amber-600" /> Unverified
                    </span>
                  )}
                </div>

                {!isChangingPhone && (
                  <div className="flex items-center gap-2">
                    {!isPhoneVerified && (
                      <button
                        type="button"
                        onClick={handleStartChangePhone}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Shield size={13} /> Verify Mobile
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleStartChangePhone}
                      className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} /> Change Mobile
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Input View Mode (Verified / Locked) */}
              {!isChangingPhone ? (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.mobile}
                    disabled
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-700 font-medium cursor-not-allowed select-none"
                  />
                </div>
              ) : (
                /* Mobile Change & Verification Active Mode */
                <div className="space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      disabled={phoneOtpSent}
                      className="w-full pl-12 pr-36 py-3 rounded-xl border-2 border-brand-primary/50 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-900 font-medium bg-white"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleSendPhoneOTP}
                        disabled={phoneLoading || phoneCooldown > 0}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand-primary hover:bg-brand-hover text-white transition-all disabled:opacity-50 flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        {phoneLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : phoneCooldown > 0 ? (
                          <RotateCcw className="h-3 w-3" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        {phoneCooldown > 0
                          ? `Resend (${phoneCooldown}s)`
                          : phoneOtpSent
                          ? "Resend OTP"
                          : "Send OTP"}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelChangePhone}
                        className="p-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* POPUP / EXPANDED OTP FIELD FOR PHONE */}
                  {phoneOtpSent && (
                    <div className="p-4 bg-white rounded-xl border-2 border-emerald-200 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-semibold text-gray-800">
                          Enter OTP sent to: <span className="text-brand-primary font-bold">{newMobile}</span>
                        </span>
                        <span className="text-gray-400 font-medium">Valid for 10 min</span>
                      </div>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-primary" />
                        <input
                          type="text"
                          value={phoneOtp}
                          onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit OTP"
                          maxLength={6}
                          className="w-full pl-12 pr-32 py-2.5 rounded-lg border-2 border-emerald-300 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 font-bold tracking-widest text-gray-800 text-base"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyPhoneOTP}
                          disabled={phoneLoading || phoneOtp.length < 4}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition-all disabled:opacity-50 shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          {phoneLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Verify
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium cursor-pointer"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
                />
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                Address Information
              </h3>
            </div>

            {/* House Number */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 block">House Number</label>
              <input
                type="text"
                name="houseNumber"
                value={formData.houseNumber}
                onChange={handleChange}
                placeholder="House / Flat / Building No."
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>

            {/* Address Line 1 */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 block">Address Line 1</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                placeholder="Street address or locality"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>

            {/* Address Line 2 */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 block">Address Line 2</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Apartment, suite, unit (optional)"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>

            {/* Landmark */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">Landmark</label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="Nearby landmark"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>

            {/* State */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State / Province"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>

            {/* Pincode */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="Postal / Zip code"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>

            {/* Country */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-gray-700 block">Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate("/patient/profile")}
              className="px-6 py-3 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-hover transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PatientLayout>
  );
}
