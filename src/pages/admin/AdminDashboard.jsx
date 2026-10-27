import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Link } from "react-router-dom";
import { Users, Stethoscope, Calendar, IndianRupee, ArrowUpRight } from "lucide-react";
import { getDashboardStats } from "../../api/dashboardApi";

function StatusBadge({ status }) {
  const normalized = (status || "pending").toLowerCase();
  
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    payment_pending: "bg-amber-50 text-amber-700 border-amber-200",
    accepted: "bg-blue-50 text-blue-700 border-blue-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };

  const labels = {
    pending: "Pending",
    payment_pending: "Payment Pending",
    accepted: "Accepted",
    paid: "Paid",
    completed: "Completed",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  const badgeClass = styles[normalized] || "bg-gray-50 text-gray-700 border-gray-200";
  const label = labels[normalized] || status;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        normalized === "paid" || normalized === "completed" ? "bg-emerald-500" :
        normalized === "accepted" ? "bg-blue-500" :
        normalized === "pending" || normalized === "payment_pending" ? "bg-amber-500" : "bg-rose-500"
      }`} />
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, highlight, color, bg }) {
  if (highlight) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-brand-primary p-6 text-white shadow-lg shadow-brand-primary/20 transition-all duration-300 hover:scale-[1.02] flex-1 min-w-[240px]">
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
          <Icon size={120} />
        </div>
        <p className="text-sm font-medium text-white/80 flex items-center gap-2">
          <Icon size={18} />
          {label}
        </p>
        <p className="mt-4 text-3xl font-extrabold tracking-tight">{value}</p>
        <p className="mt-2 text-xs font-semibold text-white/75 flex items-center gap-1">
          Live statistics
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex-1 min-w-[240px]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${color}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">{value}</p>
      <p className="mt-2 text-xs font-medium text-gray-400 flex items-center gap-1">
        Live statistics
      </p>
    </div>
  );
}

function formatShortDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getDashboardStats();
        if (response.status === 1) {
          setStats(response.data.stats || {
            totalPatients: 0,
            activeDoctors: 0,
            totalAppointments: 0,
            totalRevenue: 0,
          });
          setAppointments(response.data.recentAppointments || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatRevenue = (val) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const statsList = [
    { label: "Total Patients", value: stats.totalPatients.toLocaleString("en-IN"), icon: Users, highlight: false, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Active Doctors", value: stats.activeDoctors.toString(), icon: Stethoscope, highlight: false, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Appointments", value: stats.totalAppointments.toLocaleString("en-IN"), icon: Calendar, highlight: false, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Total Revenue", value: formatRevenue(stats.totalRevenue), icon: IndianRupee, highlight: true, color: "text-white", bg: "bg-brand-primary" },
  ];

  return (
    <AdminLayout>
      {/* Title section */}
      <div className="mb-8 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500">Welcome back to your administration command center.</p>
        </div>
        {loading && (
          <span className="text-xs text-brand-primary font-bold animate-pulse">
            Loading Live Data...
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="mb-10 flex flex-wrap gap-5">
        {statsList.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Table section */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            Recent Appointments
          </h2>
          <Link 
            to="/admin/appointments" 
            className="group flex items-center gap-1 text-sm font-bold text-brand-primary hover:text-brand-hover transition-colors decoration-transparent"
          >
            View all
            <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="w-full overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          <table className="w-full text-xs sm:text-sm text-left min-w-[500px]">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-3 sm:px-6 py-2.5 sm:py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Patient</th>
                <th className="px-3 sm:px-6 py-2.5 sm:py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Doctor</th>
                <th className="px-3 sm:px-6 py-2.5 sm:py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Date</th>
                <th className="px-3 sm:px-6 py-2.5 sm:py-4 font-semibold text-gray-500 uppercase tracking-wider text-[10px] sm:text-xs">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-brand-light flex items-center justify-center font-bold text-brand-dark text-[10px] sm:text-xs">
                        {a.patientName[0]}
                      </div>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">{a.patientName}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-gray-700 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[150px]">{a.doctorName}</td>
                  <td className="px-3 sm:px-6 py-2.5 sm:py-4 text-gray-400 font-medium text-xs sm:text-sm">{formatShortDate(a.date)}</td>
                  <td className="px-3 sm:px-6 py-2.5 sm:py-4">
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
              {!loading && appointments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 sm:px-6 py-6 sm:py-8 text-center text-gray-400 font-medium text-xs sm:text-sm">
                    No recent appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
