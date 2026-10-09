import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PatientLayout from "../../components/PatientLayout";
import { getAvailabilitySlots, bookAppointment } from "../../api/appointmentApi";
import { getImageUrl } from "../../utils/imageHelper";
import Swal from "sweetalert2";
import {
  Calendar,
  Clock,
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertCircle,
  Video,
  CalendarCheck
} from "lucide-react";

export default function AppointmentDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedDoctor = location.state?.selectedDoctor;

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!selectedDoctor) {
      navigate("/patient/doctors");
    }
  }, [selectedDoctor, navigate]);

  useEffect(() => {
    if (selectedDoctor) {
      fetchAvailableDates();
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (selectedDate && selectedDoctor) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedDoctor]);

  const fetchAvailableDates = async () => {
    try {
      setLoadingDates(true);
      const dates = [];
      const today = new Date();
      const minAllowedTime = new Date(today.getTime() + 8 * 60 * 60 * 1000);
      
      // Check next 30 days for available slots
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Check if this date is at least 8 hours from now
        const dateObj = new Date(dateStr);
        if (dateObj < minAllowedTime) {
          continue; // Skip dates that are less than 8 hours from now
        }
        
        try {
          const response = await getAvailabilitySlots(selectedDoctor.id, dateStr);
          if (response.status === 1 && response.slots && response.slots.length > 0) {
            // Filter slots that are at least 8 hours from now
            const validSlots = response.slots.filter(slot => {
              const [hours, minutes] = slot.time.split(':').map(Number);
              const slotTime = new Date(dateStr);
              slotTime.setHours(hours, minutes, 0, 0);
              return slot.available && slotTime >= minAllowedTime;
            });
            
            if (validSlots.length > 0) {
              dates.push({
                date: dateStr,
                hasSlots: true
              });
            }
          }
        } catch (err) {
          // Skip this date if error
        }
      }
      
      setAvailableDates(dates);
    } catch (err) {
      console.error("Error fetching doctor availability:", err);
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      setError(null);
      const response = await getAvailabilitySlots(selectedDoctor.id, selectedDate);
      if (response.status === 1) {
        // Filter slots based on 8-hour gap from current time
        const now = new Date();
        const minAllowedTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
        
        const filteredSlots = (response.slots || []).filter(slot => {
          const [hours, minutes] = slot.time.split(':').map(Number);
          const slotTime = new Date(selectedDate);
          slotTime.setHours(hours, minutes, 0, 0);
          
          return slot.available && slotTime >= minAllowedTime;
        });
        
        setAvailableSlots(filteredSlots);
      } else {
        setError(response.message || "Failed to fetch available slots");
      }
    } catch (err) {
      setError("Failed to fetch available slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !symptoms) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate that selected time is at least 8 hours from now
    const now = new Date();
    const minAllowedTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const selectedDateTime = new Date(`${selectedDate} ${selectedTime}`);
    
    if (selectedDateTime < minAllowedTime) {
      setError("Appointment must be at least 8 hours from now");
      return;
    }

    try {
      setBookingLoading(true);
      setError(null);

      // Create date in local timezone and convert to ISO string
      const appointmentDateTime = new Date(`${selectedDate} ${selectedTime}`);
      const appointmentDateTimeISO = appointmentDateTime.toISOString();

      const bookingData = {
        doctorId: selectedDoctor.id,
        requestType: "specific_doctor",
        appointmentDateTime: appointmentDateTimeISO,
        reason: symptoms
      };

      const response = await bookAppointment(bookingData);

      if (response.status === 1) {
        navigate("/patient/appointments", {
          state: {
            bookingSuccess: true,
            message: "Appointment request sent to Dr. " + selectedDoctor.name + "! You will be notified when they accept."
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

  if (!selectedDoctor) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === today;
      const isSelected = selectedDate === dateStr;
      const hasSlots = availableDates.find(d => d.date === dateStr)?.hasSlots;
      const isPastDate = new Date(dateStr) < new Date(today);
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            if (!isPastDate && hasSlots) {
              setSelectedDate(dateStr);
              setSelectedTime("");
              setAvailableSlots([]);
            }
          }}
          disabled={isPastDate || !hasSlots}
          className={`relative p-2 rounded-lg text-sm font-medium transition-all ${
            isSelected
              ? "bg-brand-primary text-white"
              : hasSlots && !isPastDate
              ? "bg-brand-light text-brand-dark border-2 border-brand-primary"
              : isToday
              ? "bg-gray-100 text-gray-900 border-2 border-gray-300"
              : isPastDate || !hasSlots
              ? "text-gray-300 cursor-not-allowed bg-gray-50"
              : "hover:bg-gray-100 text-gray-700"
          }`}
        >
          {day}
          {hasSlots && !isPastDate && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand-primary" />
          )}
        </button>
      );
    }
    
    return days;
  };

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/patient/doctors")}
            className="flex items-center text-gray-500 hover:text-gray-700 mb-4 font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Doctors
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Book Appointment with Dr. {selectedDoctor.name}</h1>
          <p className="text-gray-500">Select your preferred date and time from the available slots</p>
        </div>

        {/* Selected Doctor Info - Full Details */}
        <div className="bg-gradient-to-r from-brand-light/30 to-purple-50 rounded-2xl p-6 border border-brand-primary/20 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white shadow-md shrink-0">
              <img
                src={getImageUrl(selectedDoctor.image) || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80"}
                alt={selectedDoctor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-xl">{selectedDoctor.name}</h3>
              <p className="text-sm text-brand-primary font-semibold mt-1">
                {Array.isArray(selectedDoctor.specialization) ? selectedDoctor.specialization.join(", ") : selectedDoctor.specialization}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Qualification</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDoctor.qualification || "BHMS, MD"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Experience</p>
                  <p className="text-sm font-medium text-gray-900">{selectedDoctor.experience || "0"} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Consultation Fee</p>
                  <p className="text-sm font-bold text-gray-900">₹{selectedDoctor.consultationFee || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">Rating</p>
                  <p className="text-sm font-medium text-gray-900">4.8/5</p>
                </div>
              </div>

              {selectedDoctor.bio && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-semibold mb-1">About</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedDoctor.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Date Selection */}
          <div>
            <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand-primary" />
              Select Date
            </label>
            
            {loadingDates ? (
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl">
                <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              </div>
            ) : (
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setCurrentMonth(newDate);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="font-bold text-gray-900">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newDate = new Date(currentMonth);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setCurrentMonth(newDate);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {renderCalendarDays()}
                </div>
              </div>
            )}
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-primary" />
                Available Time Slots
              </label>
              
              {loadingSlots ? (
                <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-red-200 rounded-2xl text-red-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50">
                  <Clock className="h-8 w-8 mb-2 text-amber-600" />
                  <p className="text-sm text-amber-700 font-medium">No available time slots for this date.</p>
                  <p className="text-xs text-amber-600 mt-2 text-center">Appointments must be booked at least 8 hours in advance. Please select a future date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        selectedTime === slot.time
                          ? "border-brand-primary bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                          : slot.available
                          ? "border-gray-200 hover:border-brand-primary hover:bg-brand-light/30 text-gray-700"
                          : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
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
                Booking...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                Submit Request to Dr. {selectedDoctor.name.split(' ')[1] || 'Doctor'}
              </>
            )}
          </button>
        </form>
      </div>
    </PatientLayout>
  );
}
