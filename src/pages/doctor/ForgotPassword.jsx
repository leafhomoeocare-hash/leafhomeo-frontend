import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Leaf, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { forgotPassword, verifyOTP, resetPassword } from "../../api/authApi";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await forgotPassword({ email: formData.email });
      
      if (response.status === 1) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Sent',
          text: 'Please check your email for the OTP',
          confirmButtonColor: '#00B100',
        });
        setStep(2);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to send OTP',
          confirmButtonColor: '#00B100',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Something went wrong',
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
      const response = await verifyOTP({ email: formData.email, otp: formData.otp });
      
      if (response.status === 1) {
        Swal.fire({
          icon: 'success',
          title: 'OTP Verified',
          text: 'Please set your new password',
          confirmButtonColor: '#00B100',
        });
        setStep(3);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Invalid OTP',
          confirmButtonColor: '#00B100',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Something went wrong',
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
      const response = await resetPassword({ 
        email: formData.email, 
        otp: formData.otp, 
        password: formData.password 
      });
      
      if (response.status === 1) {
        Swal.fire({
          icon: 'success',
          title: 'Password Reset Successful',
          text: 'Please login with your new password',
          confirmButtonColor: '#00B100',
        }).then(() => {
          navigate("/doctor/login");
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || 'Failed to reset password',
          confirmButtonColor: '#00B100',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Something went wrong',
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
        {/* Header */}
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
            Doctor Password Recovery
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > 1 ? <CheckCircle size={16} /> : '1'}
            </div>
            <div className={`w-12 h-1 ${step > 1 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > 2 ? <CheckCircle size={16} /> : '2'}
            </div>
            <div className={`w-12 h-1 ${step > 2 ? 'bg-brand-primary' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
              3
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => {
            if (step === 1) navigate("/doctor/login");
            else if (step === 2) setStep(1);
            else setStep(2);
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-primary mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          {step === 1 ? 'Back to Login' : step === 2 ? 'Back' : 'Back'}
        </button>

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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@email.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
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
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="Enter 6-digit OTP"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium text-center tracking-widest"
                maxLength={6}
                required
              />
              <p className="text-xs text-gray-500 mt-1">OTP sent to {formData.email}</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-primary hover:bg-brand-hover text-white font-bold rounded-xl shadow-md shadow-brand-primary/20 transition-all cursor-pointer flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
