import { useState } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Mail, ArrowLeft, ArrowRight, Lock, CheckCircle } from "lucide-react";
import { forgotPassword, verifyOTP, resetPassword } from "../../api/authApi";

export default function AdminForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      setError("");
      const res = await forgotPassword({ email: formData.email });
      if (res.status === 1) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent',
          text: res.message,
          confirmButtonColor: '#00B100',
        });
        setStep(2);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.message || "Failed to send OTP",
          confirmButtonColor: '#00B100',
        });
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || "Something went wrong",
        confirmButtonColor: '#00B100',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      setError("");
      const res = await verifyOTP({ email: formData.email, otp: formData.otp });
      if (res.status === 1) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Verified',
          text: res.message,
          confirmButtonColor: '#00B100',
        });
        setStep(3);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.message || "Invalid OTP",
          confirmButtonColor: '#00B100',
        });
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || "Something went wrong",
        confirmButtonColor: '#00B100',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match',
        confirmButtonColor: '#00B100',
      });
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      setError("");
      const res = await resetPassword({
        email: formData.email,
        otp: formData.otp,
        password: formData.password,
      });
      if (res.status === 1) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: res.message,
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        }).then(() => {
          navigate("/admin/login");
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: res.message || "Failed to reset password",
          confirmButtonColor: '#00B100',
        });
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || "Something went wrong",
        confirmButtonColor: '#00B100',
      });
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
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-light text-brand-primary border border-brand-primary/10 shadow-xs mb-4">
            <Leaf size={24} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            Leaf Homeo Care
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            {step === 1 && "Reset your password"}
            {step === 2 && "Verify your identity"}
            {step === 3 && "Set new password"}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
            step >= 1 ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-400"
          }`}>
            {step > 1 ? <CheckCircle size={14} /> : "1"}
          </div>
          <div className={`h-0.5 w-8 transition-all ${step >= 2 ? "bg-brand-primary" : "bg-gray-200"}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
            step >= 2 ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-400"
          }`}>
            {step > 2 ? <CheckCircle size={14} /> : "2"}
          </div>
          <div className={`h-0.5 w-8 transition-all ${step >= 3 ? "bg-brand-primary" : "bg-gray-200"}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
            step >= 3 ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-400"
          }`}>
            3
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center text-xs font-bold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-center text-xs font-bold text-rose-600">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="admin@leafhomeo.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send OTP"}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Enter OTP
              </label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium text-center tracking-widest"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-400 text-center">
                OTP sent to {formData.email}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </form>
        )}

        {/* Step 3: Reset Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
              <CheckCircle size={16} />
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/admin/login"
            className="text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
