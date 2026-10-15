import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import Swal from "sweetalert2";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponStats,
} from "../../api/couponApi";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  Percent,
  DollarSign,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
} from "lucide-react";

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [selectedCouponStats, setSelectedCouponStats] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    expireTime: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await getAllCoupons();
      if (response.status === 1) {
        setCoupons(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch coupons",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        expireTime: coupon.expireTime.split("T")[0],
        description: coupon.description || "",
        isActive: coupon.isActive,
      });
    } else {
      setEditingCoupon(null);
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        expireTime: "",
        description: "",
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCoupon(null);
    setFormData({
      code: "",
      discountType: "percentage",
      discountValue: "",
      expireTime: "",
      description: "",
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
      };

      let response;
      if (editingCoupon) {
        response = await updateCoupon(editingCoupon.id, payload);
      } else {
        response = await createCoupon(payload);
      }

      if (response.status === 1) {
        Swal.fire({
          icon: "success",
          title: editingCoupon ? "Coupon Updated" : "Coupon Created",
          text: response.message,
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        }).then(() => {
          handleCloseModal();
          fetchCoupons();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message,
        });
      }
    } catch (error) {
      console.error("Error submitting coupon:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to save coupon",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coupon) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You want to delete coupon "${coupon.code}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10B981",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await deleteCoupon(coupon.id);
      if (response.status === 1) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Coupon has been deleted.",
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        }).then(() => {
          fetchCoupons();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message,
        });
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete coupon",
      });
    }
  };

  const handleViewStats = async (coupon) => {
    try {
      const response = await getCouponStats(coupon.id);
      if (response.status === 1) {
        setSelectedCouponStats(response.data);
        setStatsModalOpen(true);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch coupon stats",
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expireTime) => {
    const expireDate = new Date(expireTime);
    expireDate.setHours(23, 59, 59, 999); // Set to end of the day
    return new Date() > expireDate;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Coupon Management
            </h1>
            <p className="text-gray-500">Create and manage discount coupons</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md shadow-green-600/20"
          >
            <Plus className="h-5 w-5" />
            Create Coupon
          </button>
        </div>

        {/* Coupons Grid */}
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Percent className="h-12 w-12 text-gray-300" />
            <p className="text-gray-500 font-medium">No coupons found</p>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-semibold shadow-md shadow-green-600/20"
            >
              Create First Coupon
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white border-2 rounded-2xl p-6 hover:shadow-xl transition-all ${
                  !coupon.isActive || isExpired(coupon.expireTime)
                    ? "border-gray-200 opacity-60"
                    : "border-green-200"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-extrabold text-gray-900">
                      {coupon.code}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      {coupon.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          coupon.isActive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                      {isExpired(coupon.expireTime) && (
                        <span className="text-sm font-medium text-red-600">
                          (Expired)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {coupon.discountType === "fixed" ? (
                      <DollarSign className="h-5 w-5 text-green-600" />
                    ) : (
                      <Percent className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>

                {/* Discount Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Discount:</span>
                    <span className="text-xl font-bold text-green-600">
                      {coupon.discountType === "fixed"
                        ? `₹${coupon.discountValue}`
                        : `${coupon.discountValue}%`}
                    </span>
                  </div>
                </div>

                {/* Expiry */}
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>Expires: {formatDate(coupon.expireTime)}</span>
                </div>

                {/* Description */}
                {coupon.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {coupon.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewStats(coupon)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Stats
                  </button>
                  <button
                    onClick={() => handleOpenModal(coupon)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(coupon)}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-gray-100">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-gray-900">
                  {editingCoupon ? "Edit Coupon" : "Create Coupon"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g., WELCOME50"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) =>
                      setFormData({ ...formData, discountType: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Discount Value
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({ ...formData, discountValue: e.target.value })
                      }
                      placeholder={
                        formData.discountType === "percentage" ? "20" : "50"
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 pl-10"
                      required
                      min="0"
                      max={formData.discountType === "percentage" ? "100" : undefined}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {formData.discountType === "percentage" ? "%" : "₹"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expireTime}
                    onChange={(e) =>
                      setFormData({ ...formData, expireTime: e.target.value })
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    placeholder="Describe this coupon..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingCoupon ? "Update Coupon" : "Create Coupon"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Modal */}
        {statsModalOpen && selectedCouponStats && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
              <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-gray-900">
                  Coupon Statistics
                </h3>
                <button
                  onClick={() => setStatsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Coupon Code</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedCouponStats.code}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <p className="text-sm text-gray-600">Total Usage</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedCouponStats.totalUsage}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <p className="text-sm text-gray-600">Total Discount</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{selectedCouponStats.totalDiscount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}