import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Leaf, Lock, Mail, User, Phone, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Shield, Send } from "lucide-react";
import Swal from "sweetalert2";
import { sendPhoneOTP, verifyPhoneOTP, getTermsConditions, register } from "../../api/authApi";
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
    otp: "",
    termsAccepted: false
  });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSendOTP = async () => {
    if (!formData.mobile) {
      setError("Please enter mobile number first");
      return;
    }

    // Clean and validate mobile number
    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setError("Please enter a valid mobile number (at least 10 digits)");
      return;
    }

    try {
      setOtpLoading(true);
      setError(null);
      
      const response = await sendPhoneOTP({ mobile: formData.mobile });
      
      if (response.status === 1) {
        setOtpSent(true);
        setSuccess("OTP sent successfully!");
        
        // Update form data with formatted mobile number if provided
        if (response.data?.formattedMobile) {
          setFormData(prev => ({
            ...prev,
            mobile: response.data.formattedMobile
          }));
        }
        
        // In development, show the OTP for testing
        if (response.data?.otp) {
          Swal.fire({
            icon: "info",
            title: "OTP Sent (Development Mode)",
            text: `Your OTP is: ${response.data.otp}`,
            confirmButtonColor: "#10b981"
          });
        }
      } else {
        setError(response.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp) {
      setError("Please enter the OTP");
      return;
    }

    try {
      setOtpLoading(true);
      setError(null);
      
      const response = await verifyPhoneOTP({ 
        mobile: formData.mobile, 
        otp: formData.otp 
      });
      
      if (response.status === 1) {
        setPhoneVerified(true);
        setSuccess("Phone number verified successfully!");
      } else {
        setError(response.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

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

  // Fetch terms and conditions on component mount
  useEffect(() => {
    fetchTermsAndConditions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!phoneVerified) {
      setError("Please verify your phone number first");
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
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          otp: formData.otp,
          termsAccepted: formData.termsAccepted,
          phoneVerified: phoneVerified
        }
      );

      if (response.status === 1) {
        navigate("/login");
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2faf2] via-white to-brand-light flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100/80 p-8 relative z-10 animate-scaleUp">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img
              src="/Leaf-LOGO-Kit/SVG/final leaf logo_App icon.svg"
              alt="Leaf Homeo Care"
              className="w-full h-full object-contain drop-shadow-md rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Leaf Homeo Care
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Create your patient account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-green-50 rounded-xl border border-green-200 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
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
                placeholder="John Doe"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-medium"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="patient@email.com"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-medium"
                required
              />
            </div>
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-secondary uppercase tracking-wider block">
              Mobile Number <span className="text-red-500">*</span>
            </label>
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
                    ? 'bg-green-50 border-green-300 text-green-800' 
                    : 'bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary'
                }`}
                required
                disabled={phoneVerified}
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpLoading || phoneVerified}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 z-10 ${
                  phoneVerified 
                    ? 'bg-green-600 text-white cursor-default' 
                    : 'bg-brand-primary text-white hover:bg-brand-hover'
                }`}
              >
                {otpLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : phoneVerified ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
                {phoneVerified ? "Verified" : "Send OTP"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter 10-digit number. Country code (+91) will be added automatically.
            </p>
          </div>

          {/* OTP Verification */}
          {otpSent && !phoneVerified && (
            <div className="space-y-1.5 bg-brand-light/30 p-4 rounded-xl border border-brand-primary/20">
              <label className="text-xs font-bold text-brand-secondary uppercase tracking-wider block mb-2">
                OTP Verification <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Shield size={16} />
                </span>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  className="w-full h-11 pl-10 pr-32 rounded-xl border border-brand-primary/30 text-sm outline-hidden transition-all bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-medium"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 z-10"
                >
                  {otpLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                OTP sent to your mobile. Valid for 10 minutes.
              </p>
            </div>
          )}

          {/* Phone Verified Badge */}
          {phoneVerified && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-50 to-brand-light rounded-xl border border-green-300 shadow-sm">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-bold text-green-700">
                Phone number verified successfully ✓
              </p>
            </div>
          )}

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
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
                placeholder="••••••••"
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
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
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
                placeholder="••••••••"
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

          {/* Terms and Conditions */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                required
              />
              <div className="flex-1">
                <label className="text-sm text-gray-600 font-medium cursor-pointer">
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
                  <details className="mt-2 text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700 font-medium">
                      Preview Terms
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                      {termsAndConditions.substring(0, 300)}...
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading || !phoneVerified || !formData.termsAccepted}
            className="w-full h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
        <p className="text-center text-gray-600 text-sm mt-6 font-medium">
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