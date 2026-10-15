import React, { useState, useEffect } from "react";
import DoctorLayout from "../../components/DoctorLayout";
import { 
  Clock, 
  Loader2, 
  Save,
  Plus,
  Trash2,
  Bell,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getDoctorAvailability, addAvailability, deleteAvailability } from "../../api/doctorApi";
import Swal from "sweetalert2";

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" }
];

export default function Availability() {
  const [dayWiseSlots, setDayWiseSlots] = useState({});
  const [expandedDays, setExpandedDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await getDoctorAvailability();
      if (response.status === 1 && response.data) {
        const organizedSlots = {};
        
        // Initialize all days with empty arrays
        DAYS_OF_WEEK.forEach(day => {
          organizedSlots[day.value] = [];
        });

        // Populate with existing slots
        Object.keys(response.data).forEach(day => {
          response.data[day].forEach(slotData => {
            if (typeof slotData === 'object' && slotData.id) {
              organizedSlots[day].push({
                id: Date.now() + Math.random(),
                dbId: slotData.id,
                time: slotData.startTime,
                isNew: false,
                applyToAllDays: false
              });
            } else {
              organizedSlots[day].push({
                id: Date.now() + Math.random(),
                dbId: null,
                time: typeof slotData === 'string' ? slotData : slotData.startTime,
                isNew: false,
                applyToAllDays: false
              });
            }
          });
        });

        setDayWiseSlots(organizedSlots);
        
        // Expand all days by default
        const expanded = {};
        DAYS_OF_WEEK.forEach(day => {
          expanded[day.value] = true;
        });
        setExpandedDays(expanded);
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDayExpansion = (dayValue) => {
    setExpandedDays(prev => ({
      ...prev,
      [dayValue]: !prev[dayValue]
    }));
  };

  const addTimeSlot = (dayValue) => {
    setDayWiseSlots(prev => ({
      ...prev,
      [dayValue]: [
        ...prev[dayValue],
        {
          id: Date.now(),
          dbId: null,
          time: "09:00",
          isNew: true,
          applyToAllDays: false
        }
      ]
    }));
  };

  const removeTimeSlot = async (dayValue, slotId) => {
    const slot = dayWiseSlots[dayValue].find(s => s.id === slotId);
    
    const result = await Swal.fire({
      title: "Are you sure?",
      text: slot?.applyToAllDays 
        ? "This time slot will be removed from all days." 
        : "This time slot will be removed from your availability.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#00b100",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove it!",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      if (slot && slot.dbId) {
        try {
          const response = await deleteAvailability(slot.dbId);
          if (response.status === 1) {
            await Swal.fire({
              icon: "success",
              title: "Deleted!",
              text: "Time slot has been deleted from database.",
              timer: 2000,
              showConfirmButton: false,
              timerProgressBar: true
            });
          } else {
            await Swal.fire({
              icon: "error",
              title: "Error",
              text: response.message || "Failed to delete time slot",
              confirmButtonColor: "#00b100"
            });
            return;
          }
        } catch (error) {
          console.error("Error deleting availability:", error);
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to delete time slot",
            confirmButtonColor: "#00b100"
          });
          return;
        }
      }
      
      if (slot?.applyToAllDays) {
        // Remove from all days
        setDayWiseSlots(prev => {
          const updated = { ...prev };
          DAYS_OF_WEEK.forEach(day => {
            updated[day.value] = updated[day.value].filter(s => s.time !== slot.time);
          });
          return updated;
        });
      } else {
        // Remove from specific day only
        setDayWiseSlots(prev => ({
          ...prev,
          [dayValue]: prev[dayValue].filter(slot => slot.id !== slotId)
        }));
      }
      
      if (!slot || !slot.dbId) {
        await Swal.fire({
          icon: "success",
          title: "Removed!",
          text: "Time slot has been removed.",
          confirmButtonColor: "#00b100"
        });
      }
    }
  };

  const updateTimeSlot = (dayValue, slotId, field, value) => {
    // Just update the specific slot, don't touch other days
    setDayWiseSlots(prev => ({
      ...prev,
      [dayValue]: prev[dayValue].map(slot =>
        slot.id === slotId ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const toggleApplyToAllDays = (dayValue, slotId) => {
    const slot = dayWiseSlots[dayValue].find(s => s.id === slotId);
    if (!slot) return;

    if (slot.applyToAllDays) {
      // Uncheck - remove this time slot from all other days
      setDayWiseSlots(prev => {
        const updated = { ...prev };
        DAYS_OF_WEEK.forEach(day => {
          if (day.value !== dayValue) {
            updated[day.value] = updated[day.value].filter(s => s.time !== slot.time);
          }
        });
        // Update the current slot
        updated[dayValue] = updated[dayValue].map(s =>
          s.id === slotId ? { ...s, applyToAllDays: false } : s
        );
        return updated;
      });
    } else {
      // Check - add this time slot to all other days (always add, even if exists)
      setDayWiseSlots(prev => {
        const updated = { ...prev };
        DAYS_OF_WEEK.forEach(day => {
          if (day.value !== dayValue) {
            // Always add the slot, don't check if it exists
            updated[day.value] = [
              ...updated[day.value],
              {
                id: Date.now() + Math.random(),
                dbId: null,
                time: slot.time,
                isNew: true,
                applyToAllDays: true
              }
            ];
          }
        });
        // Update the current slot
        updated[dayValue] = updated[dayValue].map(s =>
          s.id === slotId ? { ...s, applyToAllDays: true } : s
        );
        return updated;
      });
    }
  };

  const handleSaveAvailability = async () => {
    const totalSlots = Object.values(dayWiseSlots).flat().length;
    
    if (totalSlots === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Availability",
        text: "Please add at least one time slot",
        confirmButtonColor: "#00b100"
      });
      return;
    }

    // Validate entries
    for (const dayValue of DAYS_OF_WEEK.map(d => d.value)) {
      for (const slot of dayWiseSlots[dayValue]) {
        if (!slot.time) {
          Swal.fire({
            icon: "warning",
            title: "Invalid Time",
            text: "Please set a time for each slot",
            confirmButtonColor: "#00b100"
          });
          return;
        }
      }
    }

    try {
      setSaving(true);
      
      // Collect all slots (both new and existing) for saving
      const availabilityMap = {};
      
      // First, collect all applyToAllDays times from current state
      const applyToAllTimes = new Set();
      Object.keys(dayWiseSlots).forEach(dayValue => {
        dayWiseSlots[dayValue].forEach(slot => {
          if (slot.applyToAllDays) {
            applyToAllTimes.add(slot.time);
          }
        });
      });
      
      // Now build the availability map for each day
      DAYS_OF_WEEK.forEach(day => {
        const daySlots = [];
        
        // Add applyToAllDays times
        applyToAllTimes.forEach(time => {
          daySlots.push(time);
        });
        
        // Add day-specific times (not applyToAllDays) from current state
        dayWiseSlots[day.value].forEach(slot => {
          if (!slot.applyToAllDays) {
            daySlots.push(slot.time);
          }
        });
        
        // Remove duplicates
        const uniqueSlots = [...new Set(daySlots)];
        
        if (uniqueSlots.length > 0) {
          availabilityMap[day.value] = uniqueSlots;
        }
      });
      
      if (Object.keys(availabilityMap).length > 0) {
        const payload = {
          availability: Object.keys(availabilityMap).map(day => ({
            dayOfWeek: day,
            slots: availabilityMap[day]
          }))
        };
        
        console.log('Sending payload:', JSON.stringify(payload, null, 2));

        const response = await addAvailability(payload.availability);
        console.log('Response:', response);

        if (response.status === 1) {
          await fetchAvailability();
          // Handle partial success with skipped duplicates
          if (response.skippedSlots && response.skippedSlots.length > 0) {
            Swal.fire({
              icon: "success",
              title: "Saved with Duplicates",
              text: response.message || "Availability saved successfully",
              footer: `<small class="text-gray-500">Skipped: ${response.skippedSlots.join(', ')}</small>`,
              timer: 3000,
              showConfirmButton: false,
              timerProgressBar: true
            });
          } else {
            Swal.fire({
              icon: "success",
              title: "Success",
              text: "Availability saved successfully",
              timer: 2000,
              showConfirmButton: false,
              timerProgressBar: true
            });
          }
        } else {
          // Handle error cases
          console.log('Error response:', response.message);
          if (response.message && response.message.includes("already exist")) {
            Swal.fire({
              icon: "warning",
              title: "No Changes",
              text: response.message,
              confirmButtonColor: "#00b100"
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: response.message || "Failed to save availability",
              confirmButtonColor: "#00b100"
            });
          }
        }
      } else {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "No new slots to save",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        });
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      console.error("Error response data:", error.response?.data);

      // Handle 400 errors from backend
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message && errorData.message.includes("already exist")) {
          Swal.fire({
            icon: "warning",
            title: "No Changes",
            text: errorData.message,
            confirmButtonColor: "#00b100"
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errorData.message || "Failed to save availability",
            confirmButtonColor: "#00b100"
          });
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Something went wrong",
          confirmButtonColor: "#00b100"
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Weekly Availability</h1>
          <p className="text-gray-500">Manage your available time slots for each day</p>
        </div>

        {/* Info Card */}
        <div className="bg-brand-light/30 border border-brand-primary/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <Bell className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">How it works</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Add time slots for specific days. After setting a time, check "Apply to all days" to automatically 
                add the same time slot to all other days. Uncheck to remove from other days.
              </p>
            </div>
          </div>
        </div>

        {/* Day-wise Sections */}
        <div className="space-y-3 mb-8">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.value}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Day Header */}
              <button
                onClick={() => toggleDayExpansion(day.value)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">{day.label}</span>
                  <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-full">
                    {dayWiseSlots[day.value]?.length || 0} slots
                  </span>
                </div>
                {expandedDays[day.value] ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {/* Slots Section */}
              {expandedDays[day.value] && (
                <div className="p-4 border-t border-gray-200">
                  {/* Slots Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                    {dayWiseSlots[day.value]?.map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex flex-col gap-2 border rounded-lg p-2 ${
                          slot.applyToAllDays 
                            ? 'bg-brand-primary/10 border-brand-primary/30' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.time}
                            onChange={(e) => updateTimeSlot(day.value, slot.id, 'time', e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:border-brand-primary focus:outline-none"
                          />
                          <button
                            onClick={() => removeTimeSlot(day.value, slot.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`apply-all-${slot.id}`}
                            checked={slot.applyToAllDays || false}
                            onChange={() => toggleApplyToAllDays(day.value, slot.id)}
                            className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                          />
                          <label htmlFor={`apply-all-${slot.id}`} className="text-xs text-gray-600">
                            Apply to all days
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Slot Button */}
                  <button
                    onClick={() => addTimeSlot(day.value)}
                    className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-hover transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Time Slot for {day.label}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSaveAvailability}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Availability
              </>
            )}
          </button>
        </div>
      </div>
    </DoctorLayout>
  );
}