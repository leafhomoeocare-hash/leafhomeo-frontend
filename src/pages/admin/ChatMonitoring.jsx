import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MessageSquare, ArrowLeft } from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { getAppointmentChatHistory } from "../../api/chatApi";

export default function AdminChatMonitoring() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  
  const [appointment, setAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChatHistory();
  }, [appointmentId]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAppointmentChatHistory(appointmentId);
      if (response.status === 1) {
        setAppointment(response.data.appointment);
        setMessages(response.data.messages || []);
      } else {
        setError(response.message || "Failed to load chat history");
      }
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setError("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-140px)]">
          <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-140px)]">
          <div className="text-center">
            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => navigate('/admin/appointments')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!appointment) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-140px)]">
          <div className="text-center">
            <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Appointment not found</p>
            <button 
              onClick={() => navigate('/admin/appointments')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Appointments
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-140px)] rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm flex flex-col">
        {/* Header */}
        <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/appointments')}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h3 className="font-semibold text-gray-900">Chat Monitoring</h3>
              <p className="text-xs text-gray-500">Appointment #{appointment.appointmentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{appointment.patient.name}</p>
              <p className="text-xs text-gray-500">Patient</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">
              {appointment.patient.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="h-8 w-px bg-gray-200" />
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{appointment.doctor.name}</p>
              <p className="text-xs text-gray-500">Doctor</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
              {appointment.doctor.name.substring(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={48} className="text-gray-300 mb-4" />
              <p className="text-sm text-gray-500">No chat messages found for this appointment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isPatient = msg.sender?.id === appointment.patient.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isPatient ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        isPatient
                          ? "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                          : "bg-green-600 text-white rounded-br-none"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold opacity-70">
                          {msg.sender?.name}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Kolkata'
                          })}
                        </span>
                      </div>
                      <p>{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin monitoring notice */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center font-semibold">
            Admin can only view chat history - message sending disabled
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}