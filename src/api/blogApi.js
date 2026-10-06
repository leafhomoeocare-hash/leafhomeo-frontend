import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach token automatically to every request made with this instance
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `${token}`;
  }
  return config;
});

// Admin Blog APIs
export const createBlog = async (blogData) => {
  const formData = new FormData();

  if (blogData.title) formData.append('title', String(blogData.title));
  if (blogData.description) formData.append('description', String(blogData.description));
  if (blogData.authorType) formData.append('authorType', String(blogData.authorType));
  if (blogData.authorId) formData.append('authorId', String(blogData.authorId));
  if (blogData.blogType) formData.append('blogType', String(blogData.blogType));

  // Only append image if it's a File object
  if (blogData.image instanceof File) {
    formData.append('image', blogData.image);
  }

  const response = await API.post("/api/v1/admin/blog/create", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAllBlogs = async (page = 1, limit = 10, search = "") => {
  const response = await API.post("/api/v1/admin/blog/get-all", { page, limit, search });
  return response.data;
};

export const getBlogById = async (blogId) => {
  const response = await API.post("/api/v1/admin/blog/get-by-id", { blogId });
  return response.data;
};

export const updateBlog = async (blogData) => {
  const formData = new FormData();

  if (blogData.id) formData.append('id', String(blogData.id));
  if (blogData.title) formData.append('title', String(blogData.title));
  if (blogData.description) formData.append('description', String(blogData.description));
  if (blogData.authorType) formData.append('authorType', String(blogData.authorType));
  if (blogData.authorId) formData.append('authorId', String(blogData.authorId));
  if (blogData.blogType) formData.append('blogType', String(blogData.blogType));

  // Only append image if it's a File object
  if (blogData.image instanceof File) {
    formData.append('image', blogData.image);
  }

  const response = await API.post("/api/v1/admin/blog/update", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteBlog = async (blogId) => {
  const response = await API.post("/api/v1/admin/blog/delete", { blogId });
  return response.data;
};

export const getAuthors = async (type) => {
  const response = await API.post("/api/v1/admin/blog/get-authors", { type });
  return response.data;
};

// Patient Blog APIs
export const getBlogsForPatient = async (page = 1, limit = 10, search = "") => {
  const response = await API.post("/api/v1/patient/blog/get-all", { page, limit, search });
  return response.data;
};

export const getBlogByIdForPatient = async (blogId) => {
  const response = await API.post("/api/v1/patient/blog/get-by-id", { blogId });
  return response.data;
};

// Doctor Blog APIs
export const getBlogsForDoctor = async (page = 1, limit = 10, search = "") => {
  const response = await API.post("/api/v1/doctor/blog/get-all", { page, limit, search });
  return response.data;
};

export const getBlogByIdForDoctor = async (blogId) => {
  const response = await API.post("/api/v1/doctor/blog/get-by-id", { blogId });
  return response.data;
};