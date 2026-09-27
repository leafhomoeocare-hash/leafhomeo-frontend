import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import { bookAppointment } from "../../api/appointmentApi";
import Swal from "sweetalert2";
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  Video,
  Users
} from "lucide-react";

export default function BookAnyDoctor() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !symptoms) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setBookingLoading(true);
      setError(null);

      // Create date in local timezone and convert to ISO string
      const appointmentDateTime = new Date(`${selectedDate} ${selectedTime}`);
      const appointmentDateTimeISO = appointmentDateTime.toISOString();

      console.log("=== NEW CODE DEPLOYED ===");
      console.log("Timezone Fix Applied: ISO Conversion");
      console.log("Sending:", appointmentDateTimeISO);
      console.log("==========================");

      const bookingData = {
        requestType: "any_doctor",
        appointmentDateTime: appointmentDateTimeISO,
        reason: symptoms
      };

      const response = await bookAppointment(bookingData);

      if (response.status === 1) {
        navigate("/patient/appointments", {
          state: {
            bookingSuccess: true,
            message: "Appointment request sent to all available doctors! You will be notified when a doctor accepts your request."
          }
        });
      } else {
        setError(response.message || "Failed to book appointment");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong. Please try again.",
        confirmButtonColor: "#10b981"
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const allTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00", "12:30",
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30"
  ];

  // Filter time slots based on current time and 8-hour gap
  const timeSlots = allTimeSlots.filter(time => {
    const now = new Date();
    const selectedDateObj = new Date(selectedDate);
    
    // Check if selected date is today
    const isToday = selectedDate === today;
    
    if (isToday) {
      // For today, check if slot is at least 8 hours from now
      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, minutes, 0, 0);
      
      // Calculate 8 hours from now
      const minAllowedTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      
      return slotTime >= minAllowedTime;
    } else {
      // For future dates, check if it's at least 8 hours from now
      const [hours, minutes] = time.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, minutes, 0, 0);
      
      const minAllowedTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      
      return slotTime >= minAllowedTime;
    }
  });

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/patient/doctors")}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-4 font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Booking Options
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Request Appointment with Any Available Doctor</h1>
          <p className="text-gray-500">Your request will be sent to all available doctors. The first available doctor will accept your request.</p>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-brand-light/30 to-purple-50 rounded-2xl p-6 border border-brand-primary/20 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-primary/10 rounded-xl">
              <Users className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">How it works</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Submit your appointment request with preferred date and time</li>
                <li>• All available doctors will receive your request</li>
                <li>• The first available doctor will accept your appointment</li>
                <li>• You'll receive a notification once a doctor accepts</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Date Selection */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-primary" />
              Select Preferred Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime("");
              }}
              min={today}
              required
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 font-medium"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-primary" />
                Select Preferred Time
              </label>
              
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {timeSlots.map((time, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        selectedTime === time
                          ? "border-brand-primary bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                          : "border-gray-200 hover:border-brand-primary hover:bg-brand-light/30 text-gray-700"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-amber-700 font-medium text-sm">
                    ⚠️ No available time slots for this date. Appointments must be booked at least 8 hours in advance.
                  </p>
                  <p className="text-amber-600 text-xs mt-2">
                    Please select a future date to see available slots.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Symptoms */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block">
              Describe Your Symptoms
            </label>
            <textarea
              required
              rows={5}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Please describe your symptoms or health concern in detail..."
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-gray-800 resize-none font-medium"
            />
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
            <Video className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-sm text-blue-800 font-medium">
              Consultations are conducted via secure video call. Please ensure you have a stable internet connection and are available at the scheduled time.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-200 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={bookingLoading || !selectedTime || !symptoms}
            className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-hover text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bookingLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Submit Request to All Doctors
              </>
            )}
          </button>
        </form>
      </div>
    </PatientLayout>
  );
}
