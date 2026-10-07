import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import { getUser } from "../../api/authApi";
import Swal from "sweetalert2";
import {
  Bell,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/get-notifications`, {
        headers: {
          Authorization: sessionStorage.getItem("token")
        }
      });
      const data = await response.json();

      if (data.status === 1) {
        setNotifications(data.data || []);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Failed to fetch notifications",
          confirmButtonColor: "#10b981"
        });
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-500">View your recent notifications</p>
          </div>
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-hover transition-all"
          >
            <Bell size={18} />
            Refresh
          </button>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 bg-white border-2 border-gray-100 rounded-2xl p-8">
            <Bell className="h-16 w-16 text-gray-300" />
            <p className="text-gray-500 font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border-2 rounded-2xl p-6 transition-all ${
                  notification.isRead
                    ? "border-gray-100 opacity-70"
                    : "border-brand-primary/30 shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 p-3 rounded-full ${
                    notification.isRead
                      ? "bg-gray-100 text-gray-400"
                      : "bg-brand-light text-brand-primary"
                  }`}>
                    <Bell size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">
                          {notification.isRead ? "Notification" : "New Notification"}
                        </h3>
                        <p className="text-gray-600 text-sm">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
                        <Clock size={14} />
                        {formatTime(notification.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {notification.isRead ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Check size={14} />
                          Read
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-primary font-medium">
                          <AlertCircle size={14} />
                          Unread
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
