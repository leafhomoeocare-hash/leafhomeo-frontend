import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import { getImageUrl } from "../../utils/imageHelper";
import {
  Plus,
  X,
  Search,
  Star,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  IndianRupee,
  FileText,
  Award,
  ChevronDown,
  Edit,
  Trash2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { getDoctors, addDoctor, updateDoctor, deleteDoctor } from "../../api/doctorApi";

const ENTRIES_OPTIONS = [5, 10, 25, 50];

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Phone" },
  { key: "specialization", label: "Speciality" },
  { key: "qualification", label: "Qualification" },
  { key: "experience", label: "Experience" },
  { key: "consultationFee", label: "Fee" },
];

const emptyForm = {
  name: "",
  email: "",
  mobile: "",
  specialization: [],
  qualification: "",
  experience: "",
  consultationFee: "",
  bio: "",
  isExpert: false,
};

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

function AddDoctorModal({ open, onClose, onSave, doctorToEdit = null }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (doctorToEdit) {
      setForm({
        name: doctorToEdit.user?.name || "",
        email: doctorToEdit.user?.email || "",
        mobile: doctorToEdit.user?.mobile || "",
        specialization: Array.isArray(doctorToEdit.specialization) ? doctorToEdit.specialization : [],
        qualification: doctorToEdit.qualification || "",
        experience: doctorToEdit.experience || "",
        consultationFee: doctorToEdit.consultationFee || "",
        bio: doctorToEdit.bio || "",
        isExpert: doctorToEdit.isExpert || doctorToEdit.IsExpert || false,
      });
      setPreviewImage(getImageUrl(doctorToEdit.user?.image));
    } else {
      setForm(emptyForm);
      setPreviewImage(null);
    }
    setErrors({});
    setImageFile(null);
  }, [doctorToEdit, open]);

  if (!open) return null;

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Doctor's name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.mobile.trim()) e.mobile = "Mobile number is required";
    else if (!/^[+]?[\d\s-]{10,15}$/.test(form.mobile)) e.mobile = "Enter a valid mobile number";
    // Check if there are specializations in array or temp field
    const hasSpecializations = (form.specialization && form.specialization.length > 0) ||
                              (form.tempSpecialization && form.tempSpecialization.trim());
    if (!hasSpecializations) e.specialization = "At least one specialization is required";
    if (!form.qualification.trim()) e.qualification = "Qualification is required";
    if (!form.experience || Number(form.experience) < 0) e.experience = "Enter valid years of experience";
    if (!form.consultationFee || Number(form.consultationFee) <= 0) e.consultationFee = "Enter a valid fee";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    // Add tempSpecialization to array if it exists
    let formToSubmit = { ...form };
    if (form.tempSpecialization && form.tempSpecialization.trim()) {
      formToSubmit = {
        ...formToSubmit,
        specialization: [...form.specialization, form.tempSpecialization.trim()],
        tempSpecialization: '',
      };
    }

    // Remove tempSpecialization from final submission
    delete formToSubmit.tempSpecialization;

    if (!validate()) return;
    try {
      setSubmitting(true);
      await onSave({
        ...formToSubmit,
        experience: Number(formToSubmit.experience),
        consultationFee: Number(formToSubmit.consultationFee),
        image: imageFile,
      });
      setForm(emptyForm);
      setErrors({});
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setErrors({});
    onClose();
  };

  const inputBase =
    "w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-dark to-brand-primary text-white">
          <div>
            <h2 className="text-lg font-bold">{doctorToEdit ? "Edit Doctor Details" : "Add New Doctor"}</h2>
            <p className="text-xs text-white/80 mt-0.5">{doctorToEdit ? "Modify doctor details" : "Fill in the details to add a doctor to HomeoConsult"}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-1.5 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <FieldLabel required>Full Name</FieldLabel>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Dr. Full Name"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary ${
                errors.name ? "border-rose-400 focus:ring-rose-400" : "border-gray-200"
              }`}
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Email</FieldLabel>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="doctor@email.com"
                  className={`${inputBase} ${errors.email ? "border-rose-400 focus:ring-rose-400" : "border-gray-200"}`}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <FieldLabel required>Mobile</FieldLabel>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={form.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`${inputBase} ${errors.mobile ? "border-rose-400 focus:ring-rose-400" : "border-gray-200"}`}
                />
              </div>
              {errors.mobile && <p className="text-xs text-rose-500 mt-1">{errors.mobile}</p>}
            </div>
          </div>

          <div>
            <FieldLabel required>Specializations</FieldLabel>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.tempSpecialization || ""}
                    onChange={(e) => handleChange("tempSpecialization", e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (form.tempSpecialization && form.tempSpecialization.trim()) {
                          handleChange("specialization", [...form.specialization, form.tempSpecialization.trim()]);
                          handleChange("tempSpecialization", "");
                        }
                      }
                    }}
                    placeholder="e.g. Pediatric Homeopathy"
                    className={`${inputBase} ${errors.specialization ? "border-rose-400 focus:ring-rose-400" : "border-gray-200"}`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (form.tempSpecialization && form.tempSpecialization.trim()) {
                      handleChange("specialization", [...form.specialization, form.tempSpecialization.trim()]);
                      handleChange("tempSpecialization", "");
                    }
                  }}
                  className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-hover transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
              {form.specialization.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.specialization.map((spec, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-light text-brand-dark rounded-full text-sm font-medium border border-brand-primary/20"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => {
                          handleChange("specialization", form.specialization.filter((_, i) => i !== index));
                        }}
                        className="text-brand-primary hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.specialization && <p className="text-xs text-rose-500 mt-1">{errors.specialization}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Qualification</FieldLabel>
              <div className="relative">
                <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.qualification}
                  onChange={(e) => handleChange("qualification", e.target.value)}
                  placeholder="BHMS, MD"
                  className={`${inputBase} ${errors.qualification ? "border-rose-400 focus:ring-rose-400" : "border-gray-200"}`}
                />
              </div>
              {errors.qualification && <p className="text-xs text-rose-500 mt-1">{errors.qualification}</p>}
            </div>
            <div>
              <FieldLabel required>Experience (yrs)</FieldLabel>
              <input
                type="number"
                min="0"
                value={form.experience}
                onChange={(e) => handleChange("experience", e.target.value)}
                placeholder="e.g. 8"
                className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary ${
                  errors.experience ? "border-rose-400 focus:ring-rose-400" : "border-gray-200"
                }`}
              />
              {errors.experience && <p className="text-xs text-rose-500 mt-1">{errors.experience}</p>}
            </div>
          </div>

          <div>
            <FieldLabel required>Consultation Fee</FieldLabel>
            <div className="relative">
              <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                min="0"
                value={form.consultationFee}
                onChange={(e) => handleChange("consultationFee", e.target.value)}
                placeholder="500"
                className={`${inputBase} ${errors.consultationFee ? "border-rose-400 focus:ring-rose-400" : "border-gray-200"}`}
              />
            </div>
            {errors.consultationFee && <p className="text-xs text-rose-500 mt-1">{errors.consultationFee}</p>}
          </div>

          <div>
            <FieldLabel>Bio</FieldLabel>
            <div className="relative">
              <FileText size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={form.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                placeholder="Short professional summary about the doctor..."
                rows={3}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-hidden transition-all bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-brand-primary focus:border-brand-primary resize-none"
              />
            </div>
          </div>

          <div>
            <FieldLabel>Profile Image</FieldLabel>
            <div className="flex items-center gap-4">
              {previewImage && (
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImageFile(file);
                      setPreviewImage(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-hover cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-brand-primary" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Mark as Expert</p>
                <p className="text-xs text-gray-500">Highlights this doctor as a featured expert</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange("isExpert", !form.isExpert)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.isExpert ? "bg-brand-primary" : "bg-gray-300"
              }`}
              aria-pressed={form.isExpert}
              aria-label="Toggle expert status"
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  form.isExpert ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/80">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-colors shadow-sm disabled:opacity-60 bg-brand-primary hover:bg-brand-hover cursor-pointer"
          >
            {submitting ? "Saving..." : doctorToEdit ? "Save Changes" : "Add Doctor"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState(null);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleOpenDetails = (doc) => {
    setSelectedDoctor(doc);
    setDetailsOpen(true);
  };

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getDoctors(currentPage, entriesPerPage, debouncedSearch);
      if (response.status === 1) {
        setDoctors(response.data.doctors);
        setTotalRecords(response.data.totalRecords);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, debouncedSearch]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleEntriesChange = (value) => {
    setEntriesPerPage(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  const handleEditClick = (doc) => {
    setDoctorToEdit(doc);
    setModalOpen(true);
  };

  const handleDeleteClick = async (doc) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete Dr. ${doc.user?.name || ""}? This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00B100',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await deleteDoctor(doc.id);
          if (response.status === 1) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: response.message || "Doctor deleted successfully",
              confirmButtonColor: '#00B100',
            });
            fetchDoctors();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: response.message || "Failed to delete doctor",
              confirmButtonColor: '#00B100',
            });
          }
        } catch (error) {
          console.error(error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || "Failed to delete doctor due to server error",
            confirmButtonColor: '#00B100',
          });
        }
      }
    });
  };

  const handleCloseModal = () => {
    setDoctorToEdit(null);
    setModalOpen(false);
  };

  const handleSave = async (doctorPayload) => {
    try {
      if (doctorToEdit) {
        const payload = {
          ...doctorPayload,
          doctorId: doctorToEdit.id, // Use doctor table's primary key
        };
        const response = await updateDoctor(payload);
        if (response.status === 1) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: response.message || "Doctor updated successfully",
            confirmButtonColor: '#00B100',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || "Failed to update doctor",
            confirmButtonColor: '#00B100',
          });
        }
      } else {
        const response = await addDoctor(doctorPayload);
        if (response.status === 1) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: response.message || "Doctor added successfully",
            confirmButtonColor: '#00B100',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || "Failed to add doctor",
            confirmButtonColor: '#00B100',
          });
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || "Failed to save doctor due to server error",
        confirmButtonColor: '#00B100',
      });
    }
    await fetchDoctors();
    setCurrentPage(1);
    handleCloseModal();
  };

  const goPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endItem = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">Doctors</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all registered doctors and highlight experts.</p>
        </div>
      </div>

      {/* Search + Add row */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, mobile, specialization..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 text-sm outline-hidden transition-all focus:border-brand-primary"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setDoctorToEdit(null);
              setModalOpen(true);
            }}
            className="flex h-11 items-center justify-center gap-2 text-white px-5 rounded-xl text-sm font-semibold shadow-xs transition-colors bg-brand-primary hover:bg-brand-hover cursor-pointer"
          >
            <Plus size={16} />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Entries per page header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={entriesPerPage}
                onChange={(e) => handleEntriesChange(Number(e.target.value))}
                className="appearance-none border border-gray-200 rounded-xl pl-3 pr-8 py-1.5 text-sm text-gray-700 outline-hidden focus:border-brand-primary bg-white cursor-pointer"
              >
                {ENTRIES_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
            <span className="text-sm text-gray-500 font-medium">entries per page</span>
          </div>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-brand-primary font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-ping" />
              Loading...
            </span>
          )}
        </div>

        {/* Table - desktop/tablet */}
        <div className="hidden md:block">
          <table className="w-full text-sm text-left table-auto">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr className="text-left text-gray-500 uppercase tracking-wider text-xs">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-6 py-4 font-semibold">
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {doctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      {doc.user?.image ? (
                        <img
                          src={getImageUrl(doc.user.image)}
                          alt={doc.user?.name || "Doctor"}
                          className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://cdn-icons-png.flaticon.com/512/387/387561.png";
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-xs flex-shrink-0 border border-brand-primary/10">
                          {doc.user?.name?.replace("Dr. ", "")?.[0] || "D"}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                          {doc.user?.name}
                          {(doc.isExpert || doc.IsExpert) && (
                            <Star size={13} className="text-amber-400 fill-amber-400" />
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          {doc.user?.isPasswordSet ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                              <ShieldCheck size={10} />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <ShieldAlert size={10} />
                              Not Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-gray-600 font-medium">{doc.user?.email}</td>
                  <td className="px-6 py-4.5 text-gray-600 font-medium">{doc.user?.mobile}</td>
                  <td className="px-6 py-4.5 text-gray-800 font-semibold">
                    {Array.isArray(doc.specialization) ? doc.specialization.join(", ") : (doc.specialization || "-")}
                  </td>
                  <td className="px-6 py-4.5 text-gray-600 font-medium">{doc.qualification}</td>
                  <td className="px-6 py-4.5 text-gray-600 font-medium">{doc.experience} Years</td>
                  <td className="px-6 py-4.5 text-gray-800 font-bold">₹{doc.consultationFee}</td>
                  <td className="px-6 py-4.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        doc.isExpert || doc.IsExpert
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {doc.isExpert || doc.IsExpert ? "Expert" : "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditClick(doc)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Edit Doctor"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(doc)}
                        className="text-rose-600 hover:text-rose-800 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Doctor"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && doctors.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 2} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No doctors match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards - mobile only */}
        <div className="md:hidden divide-y divide-gray-100">
          {doctors.map((doc) => (
            <div key={doc.id} className="p-5 hover:bg-gray-50/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {doc.user?.image ? (
                    <img
                      src={getImageUrl(doc.user.image)}
                      alt={doc.user?.name || "Doctor"}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-gray-100"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://cdn-icons-png.flaticon.com/512/387/387561.png";
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-sm flex-shrink-0 border border-brand-primary/10">
                      {doc.user?.name?.replace("Dr. ", "")?.[0] || "D"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5 truncate">
                      {doc.user?.name}
                      {(doc.isExpert || doc.IsExpert) && (
                        <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </p>
                    <p className="text-xs font-semibold text-brand-primary truncate">
                      {Array.isArray(doc.specialization) ? doc.specialization.join(", ") : (doc.specialization || "-")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {doc.user?.isPasswordSet ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                          <ShieldCheck size={10} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <ShieldAlert size={10} />
                          Not Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditClick(doc)}
                    className="text-blue-600 hover:text-blue-800 p-1.5 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(doc)}
                    className="text-rose-600 hover:text-rose-800 p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4 text-xs font-medium text-gray-600">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Email</p>
                  <p className="text-gray-900 truncate mt-0.5">{doc.user?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Phone</p>
                  <p className="text-gray-900 mt-0.5">{doc.user?.mobile}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Qualification</p>
                  <p className="text-gray-900 mt-0.5">{doc.qualification}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Experience</p>
                  <p className="text-gray-900 mt-0.5">{doc.experience} Years</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Fee</p>
                  <p className="text-gray-900 mt-0.5 font-bold">₹{doc.consultationFee}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Status</p>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      doc.isExpert || doc.IsExpert
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {doc.isExpert || doc.IsExpert ? "Expert" : "General"}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {!loading && doctors.length === 0 && (
            <div className="px-5 py-12 text-center text-gray-400 font-medium">No doctors match your search.</div>
          )}
        </div>

        {/* Table footer (pagination) */}
        <div className="px-6 py-4 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/20">
          <p className="text-sm text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-800">{startItem}</span> to <span className="font-semibold text-gray-800">{endItem}</span> of <span className="font-semibold text-gray-800">{totalRecords}</span> entries
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={goPrevPage}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-bold text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-lg border border-gray-200/50">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goNextPage}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AddDoctorModal open={modalOpen} onClose={handleCloseModal} onSave={handleSave} doctorToEdit={doctorToEdit} />
    </AdminLayout>
  );
}
