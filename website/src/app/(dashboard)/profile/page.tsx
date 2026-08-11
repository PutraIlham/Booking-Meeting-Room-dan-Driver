"use client";

import React, { useState, useEffect } from 'react';
import axios from "axios";
import { 
  User, 
  Mail, 
  Key, 
  Save, 
  Edit2, 
  X, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import { useRouter } from "next/navigation";

const ProfilePage = () => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  
  // Profile data
  const [profile, setProfile] = useState({
    username: '',
    email: '',
  });
  
  // Edit form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  // Form validation errors
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Fetch profile data on component mount
  useEffect(() => {
    // First try to get user data from localStorage
    const storedAdmin = localStorage.getItem('adminInfo');
    
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin);
        setProfile({
          username: adminData.username || '',
          email: adminData.email || ''
        });
      } catch (error) {
        console.error("Error parsing stored admin info:", error);
      }
    } else {
      // If no data in localStorage, try to fetch from API
      fetchProfileData();
    }
  }, []);
  
  // Reset form data when switching to edit mode
  useEffect(() => {
    if (isEditing) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        password: '',
        confirmPassword: ''
      });
      
      // Reset errors
      setErrors({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [isEditing, profile]);

  // Create API client with token
  const createApiClient = () => {
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      setNotification({
        type: 'error',
        message: 'Sesi anda telah berakhir. Silakan login kembali.'
      });
      return null;
    }
    
    return {
      baseURL: "http://20.251.153.107:3001/api",
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  // Fetch profile data from API
  const fetchProfileData = async () => {
    setIsLoading(true);
    
    const apiClient = createApiClient();
    if (!apiClient) {
      setIsLoading(false);
      return;
    }
    
    try {
      // This endpoint should return the current admin profile
      // Since your backend might not have this exact endpoint yet,
      // we'll use a fallback to just display the data from localStorage
      const storedAdmin = localStorage.getItem('adminInfo');
      
      if (storedAdmin) {
        try {
          const adminData = JSON.parse(storedAdmin);
          setProfile({
            username: adminData.username || '',
            email: adminData.email || ''
          });
          setNotification({
            type: 'success',
            message: 'Profil berhasil dimuat dari data tersimpan.'
          });
          setIsLoading(false);
          return;
        } catch (error) {
          console.error("Error parsing stored admin info:", error);
        }
      }
      
      // If we don't have stored data or failed to parse it, try the API
      const response = await axios.get(`${apiClient.baseURL}/admin/profile`, {
        headers: apiClient.headers
      });
      
      if (response.data) {
        const profileData = {
          username: response.data.username || '',
          email: response.data.email || ''
        };
        
        setProfile(profileData);
        
        // Also update localStorage
        localStorage.setItem('adminInfo', JSON.stringify(profileData));
        
        setNotification({
          type: 'success',
          message: 'Profil berhasil dimuat.'
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      
      // Check for unauthorized error
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        setNotification({
          type: 'error',
          message: 'Sesi anda telah berakhir. Silakan login kembali.'
        });
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      } else {
        setNotification({
          type: 'error',
          message: error.response?.data?.message || 'Gagal memuat profil.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async () => {
    // Validate form
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const apiClient = createApiClient();
    if (!apiClient) {
      setIsLoading(false);
      return;
    }
    
    // Only include password if it's provided
    const updateData = {
      username: formData.username,
      email: formData.email,
      ...(formData.password ? { password: formData.password } : {})
    };
    
    try {
      // Debug info
      console.log("Updating profile with data:", updateData);
      console.log("Using authorization token:", apiClient.headers.Authorization);
      
      // Get the admin ID from localStorage (fix for "Admin tidak ditemukan")
      const storedAdmin = localStorage.getItem('adminInfo');
      let adminId = null;
      if (storedAdmin) {
        try {
          const adminData = JSON.parse(storedAdmin);
          adminId = adminData.id;
          // Include admin ID in the request to help the backend identify the admin
          if (adminId) {
            updateData.admin_id = adminId;
          }
        } catch (error) {
          console.error("Error parsing stored admin info:", error);
        }
      }
      
      // IMPORTANT: Fixed the API endpoint to match your routes
      const response = await axios.put(
        `${apiClient.baseURL}/admins/auth/profile`,
        updateData,
        { headers: apiClient.headers }
      );
      
      if (response.data) {
        console.log("Profile update successful:", response.data);
        
        // Update local profile state
        const updatedProfile = {
          username: response.data.admin.username,
          email: response.data.admin.email,
          id: response.data.admin.id || adminId  // Keep the ID if it wasn't returned
        };
        
        setProfile({
          username: updatedProfile.username,
          email: updatedProfile.email
        });
        
        // Update localStorage
        localStorage.setItem('adminInfo', JSON.stringify(updatedProfile));
        
        // Update token if returned
        if (response.data.token) {
          localStorage.setItem("adminToken", response.data.token);
        }
        
        setNotification({
          type: 'success',
          message: 'Profil berhasil diperbarui.'
        });
        
        // Exit edit mode
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Show more detailed error information
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }
      
      // Check for unauthorized error
      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        setNotification({
          type: 'error',
          message: 'Sesi anda telah berakhir. Silakan login kembali.'
        });
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      } else if (error.response?.status === 404) {
        // Handle "Admin tidak ditemukan" error
        setNotification({
          type: 'error',
          message: 'Admin tidak ditemukan. Silakan login kembali untuk memperbarui sesi anda.'
        });
      } else {
        setNotification({
          type: 'error',
          message: error.response?.data?.message || 'Gagal memperbarui profil.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear password mismatch error when either password field changes
    if (name === 'password' || name === 'confirmPassword') {
      if (errors.confirmPassword && errors.confirmPassword.includes('tidak cocok')) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    }
  };

  // Validate form before submission
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username tidak boleh kosong.';
      isValid = false;
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email tidak boleh kosong.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid.';
      isValid = false;
    }
    
    // Password validation (only if provided)
    if (formData.password) {
      if (formData.password.length < 6) {
        newErrors.password = 'Password harus minimal 6 karakter.';
        isValid = false;
      }
      
      // Confirm password validation
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Konfirmasi password tidak cocok.';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Cancel editing and reset form
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: profile.username || '',
      email: profile.email || '',
      password: '',
      confirmPassword: ''
    });
    setErrors({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  // Notification component
  const Notification = ({ type, message }) => {
    if (!message) return null;
    
    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
    const Icon = type === 'success' ? CheckCircle : AlertCircle;
    
    return (
      <div className={`${bgColor} ${textColor} p-4 rounded-md border ${borderColor} mb-6 flex items-start`}>
        <Icon size={18} className="flex-shrink-0 mr-2 mt-0.5" />
        <span>{message}</span>
      </div>
    );
  };

  // Loading state for entire page
  if (isLoading && !profile.username) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-sky-500 animate-spin"></div>
          <div className="mt-4 text-sky-800 font-medium text-center">Memuat Profil</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col">
      {/* Main Content - Full Screen */}
      <div className="w-full h-full flex flex-col p-4 md:p-8">
        <div className="w-full max-w-4xl mx-auto">
          {notification.message && (
            <Notification type={notification.type} message={notification.message} />
          )}
          
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 w-full">
            {isEditing ? (
              // Edit Mode
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-xl font-medium text-sky-800">Edit Profil</h1>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username field */}
                  <div className="md:col-span-2">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-600 mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className={`block w-full pl-10 py-2.5 rounded-lg border ${
                          errors.username ? 'border-red-300' : 'border-gray-200'
                        } focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors`}
                        placeholder="Masukkan username"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                    )}
                  </div>
                  
                  {/* Email field */}
                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`block w-full pl-10 py-2.5 rounded-lg border ${
                          errors.email ? 'border-red-300' : 'border-gray-200'
                        } focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors`}
                        placeholder="Masukkan email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  
                  {/* Password field */}
                  <div className="md:col-span-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-1">
                      Password Baru <span className="text-gray-400 text-xs">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key size={16} className="text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                          errors.password ? 'border-red-300' : 'border-gray-200'
                        } focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors`}
                        placeholder="Kosongkan jika tidak ingin mengubah"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>
                  
                  {/* Confirm Password field */}
                  {formData.password && (
                    <div className="md:col-span-1">
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-600 mb-1">
                        Konfirmasi Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Key size={16} className="text-gray-400" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`block w-full pl-10 py-2.5 rounded-lg border ${
                            errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                          } focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors`}
                          placeholder="Masukkan kembali password baru"
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Warning message for password change */}
                {formData.password && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start mt-6">
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mr-2 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Mengubah password akan membuat anda harus login kembali dengan password baru.
                    </p>
                  </div>
                )}
                
                {/* Form actions */}
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center shadow-sm"
                  >
                    <X size={16} className="mr-2" />
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={updateProfile}
                    className="px-5 py-2.5 bg-sky-500 text-white rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-colors flex items-center shadow-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCcw size={16} className="mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={16} className="mr-2" />
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              // View Mode - Redesigned for full screen
              <div>
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                  <h1 className="text-xl font-medium text-sky-800">Profil Admin</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors flex items-center"
                    disabled={isLoading}
                  >
                    <Edit2 size={16} className="mr-2" />
                    <span className="hidden md:inline">Edit Profil</span>
                  </button>
                </div>
                
                <div className="p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-28 h-28 bg-sky-50 rounded-full flex items-center justify-center">
                      <User size={48} className="text-sky-500" />
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full text-center md:text-left">
                    <div className="space-y-6">
                      {/* Username */}
                      <div className="md:flex md:items-baseline md:gap-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2 md:mb-0 md:w-1/4">
                          Username
                        </h3>
                        <p className="text-xl font-medium text-gray-900 md:w-3/4">{profile.username || 'Tidak tersedia'}</p>
                      </div>
                      
                      {/* Email */}
                      <div className="md:flex md:items-baseline md:gap-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2 md:mb-0 md:w-1/4">
                          Email
                        </h3>
                        <p className="text-xl font-medium text-gray-900 md:w-3/4">{profile.email || 'Tidak tersedia'}</p>
                      </div>
                      
                      {/* Role - Optional additional field */}
                      <div className="md:flex md:items-baseline md:gap-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2 md:mb-0 md:w-1/4">
                          Role
                        </h3>
                        <p className="text-xl font-medium text-gray-900 md:w-3/4">
                          <span className="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm">
                            Administrator
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Refresh button - shown only in view mode */}
          {!isEditing && (
            <div className="flex justify-center mt-4">
              <button
                onClick={fetchProfileData}
                className="px-4 py-2 bg-transparent text-gray-600 hover:text-sky-600 transition-colors flex items-center text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCcw size={14} className="mr-2 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  <>
                    <RefreshCcw size={14} className="mr-2" />
                    Segarkan Data
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;