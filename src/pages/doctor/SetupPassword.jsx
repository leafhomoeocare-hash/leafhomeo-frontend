import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { setupPassword } from "../../api/authApi";
import Swal from "sweetalert2";

export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState(true);

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setTokenValid(false);
      setError("Invalid or missing setup link. Please contact support.");
    }
  }, [token, email]);

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tokenValid) {
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const response = await setupPassword({
        token,
        email,
        password: formData.password,
      });

      if (response.status === 1) {
        Swal.fire({
          icon: "success",
          title: "Password Set Successfully",
          text: "You can now login with your new password",
          confirmButtonColor: "#00B100",
        }).then(() => {
          navigate("/doctor/login");
        });
      } else {
        setError(response.message || "Failed to set password");
      }
    } catch (err) {
      console.error("Setup password error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-light/50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-red-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate("/doctor/login")}
                className="w-full bg-brand-primary text-white py-3 rounded-xl font-semibold hover:bg-brand-hover transition-all"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light/50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img
              src="/Leaf-LOGO-Kit/SVG/final leaf logo_App icon.svg"
              alt="Leaf Homeo Care"
              className="w-full h-full object-contain drop-shadow-md rounded-2xl"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Set Your Password</h1>
          <p className="text-gray-600">Create a secure password for your account</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-brand-primary focus:ring-0 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {/* Password Requirements */}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 font-medium">Password must contain:</p>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    formData.password.length >= 8 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {formData.password.length >= 8 ? <CheckCircle size={12} className="inline mr-1" /> : ""}8+ characters
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    /[A-Z]/.test(formData.password) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {/[A-Z]/.test(formData.password) ? <CheckCircle size={12} className="inline mr-1" /> : ""}Uppercase
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    /[a-z]/.test(formData.password) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {/[a-z]/.test(formData.password) ? <CheckCircle size={12} className="inline mr-1" /> : ""}Lowercase
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    /[0-9]/.test(formData.password) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {/[0-9]/.test(formData.password) ? <CheckCircle size={12} className="inline mr-1" /> : ""}Number
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirm your password"
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-brand-primary focus:ring-0 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className="mt-2">
                  {formData.password === formData.confirmPassword ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Passwords match
                    </p>
                  ) : (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} /> Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-semibold hover:bg-brand-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Setting Password...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Set Password
                </>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate("/doctor/login")}
              className="text-sm text-gray-600 hover:text-brand-primary font-medium transition-colors"
            >
              ← Back to Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © {new Date().getFullYear()} Leaf Homeo Care. All rights reserved.
        </p>
      </div>
    </div>
  );
}
