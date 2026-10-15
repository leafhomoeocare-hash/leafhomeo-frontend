import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import AdminLayout from "../../components/AdminLayout";
import { User, Mail, Phone, Calendar, LogOut, Shield, Key, Lock, X, Eye, EyeOff } from "lucide-react";
import { getUser, changePassword } from "../../api/authApi";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await getUser();
      if (response.status === 1) {
        setUser(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await changePassword(passwordForm);
      if (response.status === 1) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password changed successfully!',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        }).then(() => {
          setChangePasswordModalOpen(false);
          setPasswordForm({ oldPassword: "", newPassword: "" });
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.message || "Failed to change password",
          confirmButtonColor: '#00B100',
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Something went wrong',
        confirmButtonColor: '#00B100',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    window.location.href = "/admin/login";
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
          <div className="mb-6">
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Profile Information</h3>
          </div>

          {loading && !user ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="w-20 h-20 rounded-2xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-2xl border border-brand-primary/10">
                  {user?.name?.[0] || "A"}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{user?.name}</h4>
                  <p className="text-sm text-brand-primary font-bold uppercase tracking-wide bg-brand-light px-2.5 py-0.5 rounded-md inline-block mt-1">
                    {user?.role}
                  </p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <User size={14} /> Full Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{user?.name || "-"}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Mail size={14} /> Email Address
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{user?.email || "-"}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Phone size={14} /> Mobile Number
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{user?.mobile || "-"}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} /> Member Since
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(user?.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-6">
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setChangePasswordModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-brand-primary/30 hover:bg-brand-light/30 transition-all cursor-pointer group"
              >
                <div className="p-2 bg-brand-light text-brand-primary rounded-lg group-hover:scale-110 transition-transform">
                  <Key size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors">Change Password</p>
                  <p className="text-xs text-gray-400">Update your password</p>
                </div>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 hover:bg-red-50 transition-all cursor-pointer group"
              >
                <div className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:scale-110 transition-transform">
                  <LogOut size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-red-600">Logout</p>
                  <p className="text-xs text-gray-400">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-dark to-brand-primary rounded-2xl p-6 text-white">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <Shield size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Account Security</h4>
                <p className="text-xs text-white/70 mt-1">Your account is protected</p>
              </div>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Your account is secure with industry-standard encryption. Regular password updates are recommended.
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Change Password</h3>
                <p className="text-xs text-gray-400 mt-0.5">Update your password</p>
              </div>
              <button
                onClick={() => setChangePasswordModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">Old Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                    className="w-full h-11 pl-10 pr-12 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full h-11 pl-10 pr-12 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setChangePasswordModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Key size={14} />
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
