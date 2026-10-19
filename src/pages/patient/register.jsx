import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Shield,
  Send,
  RotateCcw
} from "lucide-react";
import Swal from "sweetalert2";
import {
  sendPhoneOTP,
  verifyPhoneOTP,
  sendEmailOTP,
  verifyEmailOTP,
  getTermsConditions,
  register
} from "../../api/authApi";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    emailOtp: "",
    phoneOtp: "",
    termsAccepted: false
  });

  // State for Phone OTP
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // State for Email OTP
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // General State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [termsAndConditions, setTermsAndConditions] = useState("");

  // Cooldown timers
  useEffect(() => {
    let timer;
    if (emailCooldown > 0) {
      timer = setTimeout(() => setEmailCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  useEffect(() => {
    let timer;
    if (phoneCooldown > 0) {
      timer = setTimeout(() => setPhoneCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [phoneCooldown]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  // ===================== EMAIL OTP LOGIC =====================
  const handleSendEmailOTP = async () => {
    if (!formData.email) {
      setError("Please enter your email address first");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setEmailLoading(true);
      setError(null);

      const response = await sendEmailOTP({ email: formData.email.trim().toLowerCase() });

      if (response.status === 1) {
        setEmailOtpSent(true);
        setEmailCooldown(45);
        setSuccess("Verification OTP sent to your email!");

        if (response.data?.otp) {
          Swal.fire({
            icon: "info",
            title: "Email OTP (Development Mode)",
            text: `Your OTP is: ${response.data.otp}`,
            timer: 4000,
            showConfirmButton: false,
            timerProgressBar: true
          });
        }
      } else {
        setError(response.message || "Failed to send email OTP");
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Failed to send email OTP. Please check the email and try again.";
      setError(errMsg);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailOTP = async () => {
    if (!formData.emailOtp) {
      setError("Please enter the 6-digit OTP sent to your email");
      return;
    }

    try {
      setEmailLoading(true);
      setError(null);

      const response = await verifyEmailOTP({
        email: formData.email.trim().toLowerCase(),
        otp: formData.emailOtp.trim()
      });

      if (response.status === 1) {
        setEmailVerified(true);
        setSuccess("Email verified successfully! ✓");
        Swal.fire({
          icon: "success",
          title: "Email Verified",
          text: "Your email address has been verified successfully.",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Email OTP verification failed");
    } finally {
      setEmailLoading(false);
    }
  };

  // ===================== PHONE OTP LOGIC =====================
  const handleSendPhoneOTP = async () => {
    if (!formData.mobile) {
      setError("Please enter your mobile number first");
      return;
    }

    const cleanMobile = formData.mobile.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setPhoneLoading(true);
      setError(null);

      const response = await sendPhoneOTP({ mobile: formData.mobile });

      if (response.status === 1) {
        setPhoneOtpSent(true);
        setPhoneCooldown(60);
        setSuccess("OTP sent successfully to your mobile!");

        if (response.data?.formattedMobile) {
          setFormData((prev) => ({
            ...prev,
            mobile: response.data.formattedMobile
          }));
        }

        if (response.data?.otp) {
          Swal.fire({
            icon: "info",
            title: "Phone OTP (Development Mode)",
            text: `Your OTP is: ${response.data.otp}`,
            timer: 3000,
            showConfirmButton: false,
            timerProgressBar: true
          });
        }
      } else {
        setError(response.message || "Failed to send phone OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send phone OTP. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    if (!formData.phoneOtp) {
      setError("Please enter the OTP sent to your phone");
      return;
    }

    try {
      setPhoneLoading(true);
      setError(null);

      const response = await verifyPhoneOTP({
        mobile: formData.mobile,
        otp: formData.phoneOtp.trim()
      });

      if (response.status === 1) {
        setPhoneVerified(true);
        setSuccess("Phone number verified successfully! ✓");
        Swal.fire({
          icon: "success",
          title: "Phone Verified",
          text: "Your mobile number has been verified successfully.",
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Phone OTP verification failed.");
    } finally {
      setPhoneLoading(false);
    }
  };

  // ===================== TERMS & CONDITIONS =====================
  const fetchTermsAndConditions = async () => {
    try {
      const response = await getTermsConditions();
      if (response.status === 1) {
        setTermsAndConditions(response.data.text);
      }
    } catch (err) {
      console.error("Failed to fetch terms and conditions:", err);
    }
  };

  useEffect(() => {
    fetchTermsAndConditions();
  }, []);

  // ===================== FORM SUBMISSION =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!emailVerified) {
      setError("Please verify your email address before proceeding.");
      return;
    }

    if (!phoneVerified) {
      setError("Please verify your mobile number before proceeding.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!formData.termsAccepted) {
      setError("Please accept the terms and conditions");
      return;
    }

    try {
      setLoading(true);

      const response = await register({
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile,
        password: formData.password,
        termsAccepted: formData.termsAccepted,
        phoneVerified: phoneVerified,
        isEmailVerified: emailVerified
      });

      if (response.status === 1) {
        await Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Your account has been created. Redirecting to login...",
          timer: 2000,
          showConfirmButton: false
        });
        navigate("/login");
      } else {
        setError(response.message || response.data?.message || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2faf2] via-white to-brand-light flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-gray-100/80 p-6 sm:p-8 relative z-10 my-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-52 h-auto mx-auto mb-3 flex items-center justify-center">
            <img
              src="/Leaf-LOGO-Kit/SVG/final leaf logo_Full Logo Color.svg"
              alt="Leaf Homeo Care"
              className="w-full h-auto object-contain drop-shadow-md"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Create Patient Account
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete email and phone verification to secure your health record
          </p>
        </div>

        {/* Global Feedback Messages */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 rounded-xl border border-red-200 text-red-700 animate-shake">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
            <p className="text-xs sm:text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-green-50 rounded-xl border border-green-200 text-green-700">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-green-600" />
            <p className="text-xs sm:text-sm font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <User size={16} />
              </span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. / Mr. / Ms. John Doe"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-medium"
                required
              />
            </div>
          </div>

          {/* 1. EMAIL ADDRESS + OTP VERIFICATION */}
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-brand-100 bg-brand-50/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block">
                Email Address <span className="text-red-500">*</span>
              </label>
              {emailVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64a281] bg-[#64a281]/10 px-2.5 py-0.5 rounded-full border border-[#64a281]/30 shadow-2xs">
                  <CheckCircle size={13} className="text-[#64a281]" /> Email Verified
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="patient@example.com"
                className={`w-full h-11 pl-10 pr-32 rounded-xl border text-sm outline-hidden transition-all font-medium ${
                  emailVerified
                    ? "bg-[#64a281]/5 border-[#64a281]/40 text-gray-900"
                    : "bg-white border-gray-200 focus:ring-2 focus:ring-[#64a281]/20 focus:border-[#64a281]"
                }`}
                required
                disabled={emailVerified}
              />
              <button
                type="button"
                onClick={handleSendEmailOTP}
                disabled={emailLoading || emailVerified || emailCooldown > 0}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 z-10 ${
                  emailVerified
                    ? "bg-[#64a281] text-white cursor-default"
                    : emailCooldown > 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[#64a281] hover:bg-[#528f6e] text-white shadow-xs active:scale-95"
                }`}
              >
                {emailLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : emailVerified ? (
                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                ) : emailCooldown > 0 ? (
                  <RotateCcw className="h-3 w-3" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                {emailVerified
                  ? "Verified"
                  : emailCooldown > 0
                  ? `Resend (${emailCooldown}s)`
                  : emailOtpSent
                  ? "Resend OTP"
                  : "Send OTP"}
              </button>
            </div>

            {/* Email OTP Input Block */}
            {emailOtpSent && !emailVerified && (
              <div className="mt-2.5 pt-2.5 border-t border-[#64a281]/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span>Enter 6-digit code sent to your email</span>
                  <span className="text-[11px] text-gray-400">Valid for 10 min</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Shield size={16} />
                  </span>
                  <input
                    type="text"
                    name="emailOtp"
                    value={formData.emailOtp}
                    onChange={handleChange}
                    placeholder="Enter Email OTP"
                    maxLength={6}
                    className="w-full h-10 pl-10 pr-24 rounded-lg border border-[#64a281]/40 text-sm bg-white outline-hidden focus:ring-2 focus:ring-[#64a281]/20 focus:border-[#64a281] font-semibold tracking-wider text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyEmailOTP}
                    disabled={emailLoading || !formData.emailOtp}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-[#64a281] hover:bg-[#528f6e] text-white text-xs font-bold rounded-md transition-all disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
                  >
                    {emailLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. MOBILE NUMBER + OTP VERIFICATION */}
          <div className="space-y-1.5 p-3.5 rounded-2xl border border-brand-100 bg-brand-50/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider block">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              {phoneVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#64a281] bg-[#64a281]/10 px-2.5 py-0.5 rounded-full border border-[#64a281]/30 shadow-2xs">
                  <CheckCircle size={13} className="text-[#64a281]" /> Phone Verified
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone size={16} />
              </span>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="9876543210"
                className={`w-full h-11 pl-10 pr-32 rounded-xl border text-sm outline-hidden transition-all font-medium ${
                  phoneVerified
                    ? "bg-[#64a281]/5 border-[#64a281]/40 text-gray-900"
                    : "bg-white border-gray-200 focus:ring-2 focus:ring-[#64a281]/20 focus:border-[#64a281]"
                }`}
                required
                disabled={phoneVerified}
              />
              <button
                type="button"
                onClick={handleSendPhoneOTP}
                disabled={phoneLoading || phoneVerified || phoneCooldown > 0}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 z-10 ${
                  phoneVerified
                    ? "bg-[#64a281] text-white cursor-default"
                    : phoneCooldown > 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-[#64a281] hover:bg-[#528f6e] text-white shadow-xs active:scale-95"
                }`}
              >
                {phoneLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : phoneVerified ? (
                  <CheckCircle className="h-3.5 w-3.5 text-white" />
                ) : phoneCooldown > 0 ? (
                  <RotateCcw className="h-3 w-3" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                {phoneVerified
                  ? "Verified"
                  : phoneCooldown > 0
                  ? `Resend (${phoneCooldown}s)`
                  : phoneOtpSent
                  ? "Resend OTP"
                  : "Send OTP"}
              </button>
            </div>

            {/* Phone OTP Input Block */}
            {phoneOtpSent && !phoneVerified && (
              <div className="mt-2.5 pt-2.5 border-t border-[#64a281]/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span>Enter OTP sent to your phone</span>
                  <span className="text-[11px] text-gray-400">Valid for 10 min</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Shield size={16} />
                  </span>
                  <input
                    type="text"
                    name="phoneOtp"
                    value={formData.phoneOtp}
                    onChange={handleChange}
                    placeholder="Enter Phone OTP"
                    maxLength={6}
                    className="w-full h-10 pl-10 pr-24 rounded-lg border border-[#64a281]/40 text-sm bg-white outline-hidden focus:ring-2 focus:ring-[#64a281]/20 focus:border-[#64a281] font-semibold tracking-wider text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPhoneOTP}
                    disabled={phoneLoading || !formData.phoneOtp}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-[#64a281] hover:bg-[#528f6e] text-white text-xs font-bold rounded-md transition-all disabled:opacity-50 shadow-xs cursor-pointer active:scale-95"
                  >
                    {phoneLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full h-11 pl-10 pr-12 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-medium"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary p-1 rounded-lg transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className="w-full h-11 pl-10 pr-12 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-medium"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary p-1 rounded-lg transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="pt-1">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                required
              />
              <div className="flex-1">
                <label className="text-xs sm:text-sm text-gray-600 font-medium cursor-pointer">
                  I accept the{" "}
                  <Link
                    to="/terms-and-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-primary font-bold hover:underline"
                  >
                    Terms and Conditions
                  </Link>
                </label>
                {termsAndConditions && (
                  <details className="mt-1.5 text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700 font-medium">
                      Preview Terms
                    </summary>
                    <div className="mt-1.5 p-2.5 bg-gray-50 rounded-lg max-h-28 overflow-y-auto text-[11px] leading-relaxed">
                      {termsAndConditions.substring(0, 300)}...
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>

          {/* Verification Status Indicator */}
          {(!emailVerified || !phoneVerified) && (
            <div className="p-3 bg-brand-secondary-50/60 border border-brand-secondary-200 rounded-xl text-xs text-brand-dark space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5 text-brand-dark">
                <AlertCircle size={14} className="text-brand-primary" />
                Required before creating account:
              </p>
              <ul className="space-y-1 pl-1 text-[11px]">
                <li className={`flex items-center gap-1.5 ${emailVerified ? "text-brand-dark font-bold" : "text-brand-dark/70 font-medium"}`}>
                  {emailVerified ? (
                    <CheckCircle size={13} className="text-brand-primary shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                  )}
                  <span>{emailVerified ? "Email address verified" : "Verify Email address with OTP"}</span>
                </li>
                <li className={`flex items-center gap-1.5 ${phoneVerified ? "text-brand-dark font-bold" : "text-brand-dark/70 font-medium"}`}>
                  {phoneVerified ? (
                    <CheckCircle size={13} className="text-brand-primary shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0" />
                  )}
                  <span>{phoneVerified ? "Mobile number verified" : "Verify Mobile number with OTP"}</span>
                </li>
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !phoneVerified || !emailVerified || !formData.termsAccepted}
            className="w-full h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-5 font-medium">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-brand-primary font-bold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;