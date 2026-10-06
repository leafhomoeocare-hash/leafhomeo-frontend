import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, User, ArrowRight, Stethoscope, FileText, X } from "lucide-react";
import { getBlogsForDoctor, getBlogByIdForDoctor } from "../../api/blogApi";
import DoctorLayout from "../../components/DoctorLayout";

const ENTRIES_OPTIONS = [6, 12, 24];

export default function DoctorBlog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getBlogsForDoctor(currentPage, entriesPerPage, debouncedSearch);
      if (response.status === 1) {
        setBlogs(response.data?.blogs || []);
        setTotalRecords(response.data?.totalRecords || 0);
        setTotalPages(response.data?.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, debouncedSearch]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleBlogClick = async (blog) => {
    try {
      const response = await getBlogByIdForDoctor(blog.id);
      if (response.status === 1) {
        setSelectedBlog(response.data);
        setShowBlogModal(true);
      }
    } catch (error) {
      console.error("Error fetching blog details:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endItem = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-brand-dark to-brand-primary rounded-2xl p-8 text-white shadow-lg shadow-brand-primary/30">
          <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-brand-primary/20 blur-3xl translate-x-12 -translate-y-12" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope size={24} className="text-green-200" />
              <span className="inline-block text-xs font-extrabold uppercase tracking-widest bg-white/10 text-green-200 border border-green-200/30 px-3 py-1.5 rounded-full">
                Professional Development
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold max-w-xl leading-tight tracking-tight mb-3">
              Clinical Excellence & <span className="text-green-200 font-black">Research Updates</span>
            </h1>

            <p className="text-white/80 text-sm max-w-xl leading-relaxed mb-6">
              Stay ahead with the latest research, case studies, and treatment protocols in homeopathy. Enhance your clinical practice with evidence-based insights.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-lg">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search clinical articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Professional Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-light rounded-xl">
                <FileText size={20} className="text-brand-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
                <p className="text-xs text-gray-500">Clinical Articles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading clinical articles...</p>
            </div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-100 shadow-sm text-center">
            <Stethoscope size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  onClick={() => handleBlogClick(blog)}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-brand-primary/10 hover:border-brand-primary/30 transition-all duration-300 cursor-pointer"
                >
                  {/* Blog Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-brand-light to-brand-primary/20">
                    {blog.image ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL}/${blog.image}`}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Stethoscope size={48} className="text-brand-primary/30" />
                      </div>
                    )}
                  </div>

                  {/* Blog Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                      {blog.title}
                    </h3>

                    <p
                      className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: blog.description?.replace(/<[^>]*>?/gm, '') || "",
                      }}
                    />

                    {/* Blog Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} />
                          <span>{formatDate(blog.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-brand-primary font-medium group-hover:translate-x-1 transition-transform">
                        <span>Read More</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-800">{startItem}</span> to <span className="font-semibold text-gray-800">{endItem}</span> of <span className="font-semibold text-gray-800">{totalRecords}</span> entries
                </p>
                <div className="flex items-center gap-3">
                  <select
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-hidden focus:border-brand-primary"
                  >
                    {ENTRIES_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} per page
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-lg border border-gray-200/50">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Blog Detail Modal */}
        {showBlogModal && selectedBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="relative h-64 overflow-hidden bg-gradient-to-br from-brand-light to-brand-primary/20">
                {selectedBlog.image ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${selectedBlog.image}`}
                    alt={selectedBlog.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Stethoscope size={64} className="text-brand-primary/30" />
                  </div>
                )}
                <button
                  onClick={() => setShowBlogModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {selectedBlog.title}
                  </h2>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 sm:p-8">
                {/* Blog Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} className="text-brand-primary" />
                    <span>{formatDate(selectedBlog.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User size={16} className="text-brand-primary" />
                    <span>{selectedBlog.author?.name || "Medical Board"}</span>
                    <span className="text-gray-400">({selectedBlog.authorType})</span>
                  </div>
                </div>

                {/* Blog Content */}
                <div
                  className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.description }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
