import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Save, Loader2, FileText, User, Calendar, Clock, Upload, X, Image as ImageIcon } from "lucide-react";
import DoctorLayout from "../../components/DoctorLayout";
import axios from "axios";
import Swal from "sweetalert2";

const ConsultationForm = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = location.state?.mode === 'edit' || new URLSearchParams(location.search).get('mode') === 'edit';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [existingScreenshots, setExistingScreenshots] = useState([]);
  const [formData, setFormData] = useState({
    appointmentId: "",
    chiefComplaints: "",
    appetite: "",
    thirst: "",
    desire: "",
    aversion: "",
    habits: "",
    stool: "",
    urine: "",
    perspiration: "",
    menWomen: "",
    sleep: "",
    dream: "",
    thermal: "",
    amelioration: "",
    aggravation: "",
    otherComplaints: "",
    levelsOfHealth: "",
    perception: "",
    callDuration: "",
  });

  useEffect(() => {
    const idToUse = consultationId;
    
    if (idToUse) {
      setAppointmentId(idToUse);
      fetchConsultationByAppointmentId(idToUse);
    } else {
      setLoading(false);
    }
  }, [consultationId]);

  const fetchConsultationByAppointmentId = async (aptId) => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/appointment/consultation/by-appointment/${aptId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.status === 1) {
        const data = response.data.data;
        setConsultation(data);
        setFormData({
          appointmentId: data.appointmentId || aptId,
          chiefComplaints: data.chiefComplaints || "",
          appetite: data.appetite || "",
          thirst: data.thirst || "",
          desire: data.desire || "",
          aversion: data.aversion || "",
          habits: data.habits || "",
          stool: data.stool || "",
          urine: data.urine || "",
          perspiration: data.perspiration || "",
          menWomen: data.menWomen || "",
          sleep: data.sleep || "",
          dream: data.dream || "",
          thermal: data.thermal || "",
          amelioration: data.amelioration || "",
          aggravation: data.aggravation || "",
          otherComplaints: data.otherComplaints || "",
          levelsOfHealth: data.levelsOfHealth || "",
          perception: data.perception || "",
          callDuration: data.callDuration || "",
        });

        if (data.screenshots) {
          try {
            const parsedScreenshots = typeof data.screenshots === 'string'
              ? JSON.parse(data.screenshots)
              : data.screenshots;
            setExistingScreenshots(Array.isArray(parsedScreenshots) ? parsedScreenshots : []);
          } catch (e) {
            console.error("Error parsing screenshots:", e);
            setExistingScreenshots([]);
          }
        }
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching consultation by appointment:", error);
      setConsultation(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleScreenshotChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      Swal.fire({
        icon: "warning",
        title: "Limit Exceeded",
        text: "Maximum 5 screenshots allowed",
      });
      return;
    }
    setScreenshots(files);
  };

  const removeExistingScreenshot = (index) => {
    setExistingScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewScreenshot = (index) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = sessionStorage.getItem("token");

      const formDataToSend = new FormData();
      formDataToSend.append("appointmentId", appointmentId);
      Object.keys(formData).forEach((key) => {
        if (key !== "appointmentId") {
          formDataToSend.append(key, formData[key]);
        }
      });

      screenshots.forEach((file) => {
        formDataToSend.append("screenshots", file);
      });

      formDataToSend.append("existingScreenshots", JSON.stringify(existingScreenshots));

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/appointment/submit-consultation`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status === 1) {
        if (appointmentId) {
          localStorage.removeItem(`consultation_draft_${appointmentId}`);
        }
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Consultation updated successfully",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        }).then(() => {
          navigate("/doctor/appointments");
        });
      }
    } catch (error) {
      console.error("Error updating consultation:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update consultation",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    if (!appointmentId) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "No appointment ID found. Cannot save draft.",
      });
      return;
    }
    try {
      localStorage.setItem(`consultation_draft_${appointmentId}`, JSON.stringify(formData));
      Swal.fire({
        icon: "success",
        title: "Draft Saved",
        text: "Your draft has been saved. You can continue later.",
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true
      });
    } catch (err) {
      console.error("Error saving draft:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save draft",
      });
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/doctor/appointments")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? "Consultation Form" : "Consultation Details"}</h1>
              <p className="text-sm text-gray-500 mt-1">{isEditMode ? "Review and update consultation details" : "View consultation information"}</p>
              {!isEditMode && appointmentId && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold mt-2 border border-gray-200">
                  Read Only
                </span>
              )}
            </div>
          </div>
          {consultation && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
              <Calendar size={16} />
              <span>Appointment ID: {consultation.appointment?.appointmentId || consultation.appointmentId}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Screenshots Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-800">Screenshots</h2>
                {isEditMode && <span className="text-xs text-gray-500 ml-2">(Max 5)</span>}
              </div>
            </div>
            <div className="p-6">
              {existingScreenshots.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Existing Screenshots</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {existingScreenshots.map((screenshot, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`${import.meta.env.VITE_API_URL}${screenshot}`}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={() => removeExistingScreenshot(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isEditMode && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Upload New Screenshots</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                    <input
                      type="file"
                      id="screenshots"
                      multiple
                      accept="image/*"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="screenshots"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {screenshots.length > 0
                          ? `${screenshots.length} file(s) selected`
                          : "Click to upload screenshots"}
                      </span>
                      <span className="text-xs text-gray-400">PNG, JPG up to 5 files</span>
                    </label>
                  </div>

                  {screenshots.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {screenshots.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New Screenshot ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewScreenshot(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isEditMode && existingScreenshots.length === 0 && (
                <p className="text-gray-500 text-sm">No screenshots available</p>
              )}
            </div>
          </div>

          {/* Chief Complaints Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">Chief Complaints & Associate Symptoms</h2>
              </div>
            </div>
            <div className="p-6">
              {isEditMode ? (
                <textarea
                  name="chiefComplaints"
                  value={formData.chiefComplaints}
                  onChange={handleChange}
                  rows={4}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-700 placeholder-gray-400 resize-none"
                  placeholder="Enter chief complaints and associate symptoms..."
                />
              ) : (
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {formData.chiefComplaints || "Not specified"}
                </div>
              )}
            </div>
          </div>

          {/* Personal History Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-800">Personal History</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'appetite', label: 'Appetite' },
                  { name: 'thirst', label: 'Thirst' },
                  { name: 'desire', label: 'Desire' },
                  { name: 'aversion', label: 'Aversion' },
                  { name: 'habits', label: 'Habits' },
                  { name: 'stool', label: 'Stool' },
                  { name: 'urine', label: 'Urine' },
                  { name: 'perspiration', label: 'Perspiration' },
                  { name: 'menWomen', label: 'Men/Women' },
                  { name: 'sleep', label: 'Sleep' },
                  { name: 'dream', label: 'Dream' },
                  { name: 'thermal', label: 'Thermal' },
                  { name: 'amelioration', label: 'Amelioration' },
                  { name: 'aggravation', label: 'Aggravation' },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{field.label}</label>
                    {isEditMode ? (
                      <textarea
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-gray-700 placeholder-gray-400 resize-none"
                        placeholder={`Enter ${field.label.toLowerCase()} details...`}
                      />
                    ) : (
                      <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 whitespace-pre-wrap">
                        {formData[field.name] || "Not specified"}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Other Complaints Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">Other Complaints</h2>
              </div>
            </div>
            <div className="p-6">
              {isEditMode ? (
                <textarea
                  name="otherComplaints"
                  value={formData.otherComplaints}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-gray-700 placeholder-gray-400 resize-none"
                  placeholder="Enter other complaints..."
                />
              ) : (
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {formData.otherComplaints || "Not specified"}
                </div>
              )}
            </div>
          </div>

          {/* Levels of Health Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-800">Levels of Health</h2>
              </div>
            </div>
            <div className="p-6">
              {isEditMode ? (
                <textarea
                  name="levelsOfHealth"
                  value={formData.levelsOfHealth}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-gray-700 placeholder-gray-400 resize-none"
                  placeholder="Enter levels of health..."
                />
              ) : (
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {formData.levelsOfHealth || "Not specified"}
                </div>
              )}
            </div>
          </div>

          {/* Perception & Prescription Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-800">Perception & Prescription</h2>
              </div>
            </div>
            <div className="p-6">
              {isEditMode ? (
                <textarea
                  name="perception"
                  value={formData.perception}
                  onChange={handleChange}
                  rows={6}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-gray-700 placeholder-gray-400 resize-none"
                  placeholder="Enter perception and prescription details..."
                />
              ) : (
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {formData.perception || "Not specified"}
                </div>
              )}
            </div>
          </div>

          {/* Call Duration Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-50 to-sky-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-600" />
                <h2 className="text-lg font-semibold text-gray-800">Call Duration</h2>
              </div>
            </div>
            <div className="p-6">
              {isEditMode ? (
                <input
                  type="text"
                  name="callDuration"
                  value={formData.callDuration}
                  onChange={handleChange}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-gray-700 placeholder-gray-400"
                  placeholder="Enter call duration..."
                />
              ) : (
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {formData.callDuration || "Not recorded"}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate("/doctor/appointments")}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              {isEditMode ? "Cancel" : "Back"}
            </button>
            {isEditMode && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-8 py-3 border-2 border-amber-400 text-amber-700 rounded-xl font-semibold hover:bg-amber-50 transition-all"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </DoctorLayout>
  );
};

export default ConsultationForm;
