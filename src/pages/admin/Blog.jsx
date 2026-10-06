import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Plus,
  X,
  Search,
  Edit,
  Trash2,
  Image as ImageIcon,
  FileText,
  Calendar,
  Tag,
  User,
  ChevronDown,
  Eye,
  Shield,
  Stethoscope,
} from "lucide-react";
import AdminLayout from "../../components/AdminLayout";
import { getAllBlogs, createBlog, updateBlog, deleteBlog, getAuthors } from "../../api/blogApi";

// Get current admin user from session storage
const getCurrentAdmin = () => {
  const userStr = sessionStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role === "admin" ? user : null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const ENTRIES_OPTIONS = [5, 10, 25, 50];

// ReactQuill modules for toolbar
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

// ReactQuill formats
const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike', 'color', 'background',
  'list', 'bullet', 'align', 'link', 'image'
];

const COLUMNS = [
  { key: "title", label: "Title" },
  { key: "author", label: "Author" },
  { key: "blogType", label: "Blog Type" },
  { key: "createdAt", label: "Created At" },
  { key: "actions", label: "Actions" },
];

const emptyForm = {
  id: null,
  title: "",
  description: "",
  authorType: "admin",
  authorId: "",
  blogType: "all",
  image: null,
};

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
      {children} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function BlogManagement() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [authors, setAuthors] = useState([]);
  const [authorsLoading, setAuthorsLoading] = useState(false);
  const [authorSearch, setAuthorSearch] = useState("");
  const currentAdmin = getCurrentAdmin();

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAllBlogs(currentPage, entriesPerPage, debouncedSearch);
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

  const fetchAuthors = async (type) => {
    try {
      setAuthorsLoading(true);
      const response = await getAuthors(type);
      if (response.status === 1) {
        setAuthors(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching authors:", error);
    } finally {
      setAuthorsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.authorType === "doctor") {
      fetchAuthors("doctor");
    } else if (formData.authorType === "admin" && currentAdmin) {
      // Auto-select current admin (only if not already set)
      if (!formData.authorId) {
        setFormData((prev) => ({ ...prev, authorId: currentAdmin.id }));
      }
    }
  }, [formData.authorType]);

  const handleAddClick = () => {
    setFormData(emptyForm);
    setPreviewImage(null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleEditClick = (blog) => {
    setFormData({
      id: blog.id,
      title: blog.title || "",
      description: blog.description || "",
      authorType: blog.authorType || "admin",
      authorId: blog.authorId || "",
      blogType: blog.blogType || "all",
      image: null,
    });
    setPreviewImage(blog.image ? `${import.meta.env.VITE_API_URL}/${blog.image}` : null);
    setImageFile(null);
    setShowModal(true);
  };

  const handleViewClick = (blog) => {
    setSelectedBlog(blog);
    setShowViewModal(true);
  };

  const handleDeleteClick = async (blog) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${blog.title}"`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await deleteBlog(blog.id);
        if (response.status === 1) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: response.message || "Blog deleted successfully",
          });
          fetchBlogs();
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: response.message || "Failed to delete blog",
          });
        }
      } catch (error) {
        console.error("Error deleting blog:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete blog",
        });
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Title is required",
      });
      return;
    }

    if (!formData.authorId) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Author is required",
      });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        image: imageFile || formData.image,
      };

      let response;
      if (formData.id) {
        response = await updateBlog(payload);
      } else {
        response = await createBlog(payload);
      }

      if (response.status === 1) {
        Swal.fire({
          icon: "success",
          title: formData.id ? "Updated!" : "Created!",
          text: response.message || `Blog ${formData.id ? "updated" : "created"} successfully`,
        });
        setShowModal(false);
        fetchBlogs();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.message || `Failed to ${formData.id ? "update" : "create"} blog`,
        });
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to ${formData.id ? "update" : "create"} blog`,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };



  const getBlogTypeBadgeColor = (type) => {
    switch (type) {
      case "patient":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "doctor":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "all":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const filteredAuthors = authors.filter((author) =>
    author.name?.toLowerCase().includes(authorSearch.toLowerCase()) ||
    author.email?.toLowerCase().includes(authorSearch.toLowerCase())
  );

  const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const endItem = Math.min(currentPage * entriesPerPage, totalRecords);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage blog posts</p>
          </div>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
          >
            <Plus size={18} />
            <span>Add Blog</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-light rounded-xl">
                <FileText size={20} className="text-brand-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
                <p className="text-xs text-gray-500">Total Blogs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Stethoscope size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {blogs.filter((b) => b.blogType === "patient").length}
                </p>
                <p className="text-xs text-gray-500">Patient Blogs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-xl">
                <User size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {blogs.filter((b) => b.blogType === "doctor").length}
                </p>
                <p className="text-xs text-gray-500">Doctor Blogs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search blogs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 rounded-xl border border-gray-200 text-sm outline-hidden transition-all focus:border-brand-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
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
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : blogs.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-gray-500">
                      No blogs found
                    </td>
                  </tr>
                ) : (
                  blogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{blog.title || "N/A"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-dark font-bold text-xs">
                            {blog.author?.name?.[0] || "A"}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{blog.author?.name || "N/A"}</div>
                            <div className="text-xs text-gray-500 capitalize">{blog.authorType || "admin"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getBlogTypeBadgeColor(
                            blog.blogType
                          )}`}
                        >
                          {blog.blogType || "all"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {formatDate(blog.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewClick(blog)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditClick(blog)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(blog)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-800">{startItem}</span> to <span className="font-semibold text-gray-800">{endItem}</span> of <span className="font-semibold text-gray-800">{totalRecords}</span> entries
            </p>
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {formData.id ? "Edit Blog" : "Add New Blog"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <FieldLabel required>Title</FieldLabel>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-hidden transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  placeholder="Enter blog title"
                  required
                />
              </div>

              {/* Author Type */}
              <div>
                <FieldLabel required>Author Type</FieldLabel>
                <select
                  value={formData.authorType}
                  onChange={(e) => {
                    setFormData({ ...formData, authorType: e.target.value, authorId: "" });
                    setAuthorSearch("");
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-hidden transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="admin">Admin</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>

              {/* Author Selection */}
              <div>
                <FieldLabel required>Author</FieldLabel>
                {formData.authorType === "admin" ? (
                  <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-dark font-bold text-xs">
                      {currentAdmin?.name?.[0] || "A"}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{currentAdmin?.name || "Admin"}</div>
                      <div className="text-xs text-gray-500">{currentAdmin?.email || ""}</div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowAuthorDropdown(!showAuthorDropdown)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-hidden transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-left flex items-center justify-between"
                    >
                      <span>
                        {formData.authorId
                          ? authors.find((a) => a.id === Number(formData.authorId))?.name || "Select author"
                          : "Select author"}
                      </span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>

                    {showAuthorDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-gray-100">
                          <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search author..."
                              value={authorSearch}
                              onChange={(e) => setAuthorSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-hidden focus:border-brand-primary"
                            />
                          </div>
                        </div>
                        {authorsLoading ? (
                          <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
                        ) : filteredAuthors.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">No authors found</div>
                        ) : (
                          filteredAuthors.map((author) => (
                            <button
                              key={author.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, authorId: author.id });
                                setShowAuthorDropdown(false);
                              }}
                              className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand-dark font-bold text-xs">
                                {author.name?.[0] || "A"}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{author.name}</div>
                                <div className="text-xs text-gray-500">{author.email}</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Blog Type */}
              <div>
                <FieldLabel required>Blog Type</FieldLabel>
                <select
                  value={formData.blogType}
                  onChange={(e) => setFormData({ ...formData, blogType: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-hidden transition-all focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="all">All (Patient & Doctor)</option>
                  <option value="patient">Patient Only</option>
                  <option value="doctor">Doctor Only</option>
                </select>
              </div>

              {/* Content */}
              <div>
                <FieldLabel required>Content</FieldLabel>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <ReactQuill
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter blog content..."
                    style={{ minHeight: '200px' }}
                    className="bg-white"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <FieldLabel>Image</FieldLabel>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-brand-primary transition-colors">
                  {previewImage ? (
                    <div className="relative">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-500 mb-2">
                        Drag and drop an image, or click to select
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="inline-block px-4 py-2 bg-brand-primary text-white rounded-lg cursor-pointer hover:bg-brand-primary/90 transition-colors"
                      >
                        Select Image
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : formData.id ? "Update Blog" : "Create Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Blog Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedBlog.image && (
                <div>
                  <img
                    src={`${import.meta.env.VITE_API_URL}/${selectedBlog.image}`}
                    alt={selectedBlog.title}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBlogTypeBadgeColor(
                    selectedBlog.blogType
                  )}`}
                >
                  <Tag size={14} className="mr-1.5" />
                  {selectedBlog.blogType}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedBlog.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {formatDate(selectedBlog.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} />
                    {selectedBlog.author?.name} ({selectedBlog.authorType})
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                  Content
                </h4>
                <div
                  className="text-gray-700 blog-content"
                  dangerouslySetInnerHTML={{ __html: selectedBlog.description }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default BlogManagement;
