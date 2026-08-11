"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch"; // Enhanced search component
import FilterDropdown from "@/components/FilterDropdown"; // Filter component
import SortDropdown, { SortDirection } from "@/components/SortDropdown"; // Sort component
import Image from "next/image";
import { Upload, FileText, Download, MailQuestion, Mail, AtSign } from "lucide-react";
import * as XLSX from 'xlsx';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, Plus, Edit, Trash2, X, Save, 
  AlertCircle, Users, Eye, Mail as MailIcon, Phone, Lock,
  Calendar, Filter as FilterIcon
} from "lucide-react";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "User ID",
    accessor: "id",
    className: "hidden md:table-cell",
  },
  {
    header: "Name",
    accessor: "name",
    className: "hidden md:table-cell",
  },
  {
    header: "Email",
    accessor: "email",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const UserManagePage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>("Checking...");
  const [showImportModal, setShowImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: null, message: null });
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New state for search, filter, and sort
  const [searchText, setSearchText] = useState("");
  const [emailDomainFilters, setEmailDomainFilters] = useState<string[]>([]);
  const [hasPhoneFilter, setHasPhoneFilter] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{field: string, direction: SortDirection} | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [emailDomainOptions, setEmailDomainOptions] = useState<{id: string, label: string}[]>([]);

  // Phone filter options
  const phoneFilterOptions = [
    { id: "has-phone", label: "Has Phone Number" },
    { id: "no-phone", label: "No Phone Number" }
  ];

  // Prepare sort options
  const sortOptions = [
    { id: "name", label: "Name" },
    { id: "email", label: "Email" },
    { id: "createdAt", label: "Date Created" }
  ];

  // Excel import methods
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setFileError(null);
    
    if (!files || files.length === 0) {
      setExcelFile(null);
      return;
    }
    
    const file = files[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExt !== 'xlsx' && fileExt !== 'xls') {
      setFileError('Please upload only Excel files (.xlsx or .xls)');
      setExcelFile(null);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setFileError('File size should not exceed 5MB');
      setExcelFile(null);
      return;
    }
    
    setExcelFile(file);
  };
  
  const resetImportModal = () => {
    setExcelFile(null);
    setFileError(null);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenImportModal = () => {
    resetImportModal();
    setShowImportModal(true);
  };
  
  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setTimeout(() => resetImportModal(), 300);
  };
  
  const generateExcelTemplate = () => {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Define sample data with headers
    const data = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '1234567890',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password456',
        phone: '0987654321',
      },
    ];
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add comments/notes about required fields
    const comments = {
      A1: { a: 'Required. Full name of the user.' },
      B1: { a: 'Required. Must be a valid email address.' },
      C1: { a: 'Required. Minimum 6 characters.' },
      D1: { a: 'Optional. Phone number, numeric only.' },
    };
    
    if (!worksheet['!cols']) worksheet['!cols'] = [];
    worksheet['!cols'] = [
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Password
      { wch: 15 }, // Phone
    ];
    
    worksheet['!comments'] = comments;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users Template');
    
    // Generate Excel file and download
    XLSX.writeFile(workbook, 'user_import_template.xlsx');
  };
  
  const handleImportExcel = async () => {
    if (!excelFile) {
      setFileError('Please select a file to import');
      return;
    }
    
    setIsImporting(true);
    setImportResults(null);
    
    try {
      const apiClient = createApiClient();
      if (!apiClient) return;
      
      // Create form data
      const formData = new FormData();
      formData.append('excelFile', excelFile);
      
      // Send request
      const response = await apiClient.post('/users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Set results
      setImportResults(response.data.data);
      
      // If successful, refresh user list
      if (response.data.data.successCount > 0) {
        fetchUsers();
      }
      
      setStatusMessage({
        type: 'success',
        message: `Import completed: ${response.data.data.successCount} users added successfully`
      });
      
      // Hide the success message after 3 seconds
      setTimeout(() => {
        setStatusMessage({ type: null, message: null });
      }, 3000);
    } catch (error) {
      console.error('Error importing users:', error);
      
      let errorMessage = 'Failed to import users. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setFileError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  // Create a custom axios instance to avoid conflicts 
  const createApiClient = () => {
    // Get token from localStorage
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      console.log("No admin token found, redirecting to login");
      router.push("/sign-in");
      setAuthStatus("No token found");
      return null;
    }
    
    setAuthStatus(`Token found (${token.substring(0, 10)}...)`);
    
    // Create axios instance with auth header
    const apiClient = axios.create({
      baseURL: "http://20.251.153.107:3001/api",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return apiClient;
  };

  // Extract email domains from user data
  useEffect(() => {
    if (users.length > 0) {
      // Extract domains from email addresses
      const domains = users
        .map(user => {
          if (!user.email) return null;
          const parts = user.email.split('@');
          return parts.length === 2 ? parts[1] : null;
        })
        .filter(domain => domain !== null);
      
      // Get unique domains and sort them
      const uniqueDomains = [...new Set(domains)].sort();
      
      // Convert to filter options format
      const domainOptions = uniqueDomains.map(domain => ({
        id: domain,
        label: domain
      }));
      
      setEmailDomainOptions(domainOptions);
    }
  }, [users]);

  // Apply filters and sort whenever the data or filter criteria change
  useEffect(() => {
    applyFiltersAndSort();
  }, [users, searchText, emailDomainFilters, hasPhoneFilter, sorting]);

  // Apply search, filters, and sorting to the users data
  const applyFiltersAndSort = () => {
    let result = [...users];
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(user => 
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.phone && user.phone.includes(searchLower)) ||
        user.id.toString().includes(searchLower)
      );
    }
    
    // Apply email domain filter
    if (emailDomainFilters.length > 0) {
      result = result.filter(user => {
        if (!user.email) return false;
        const parts = user.email.split('@');
        return parts.length === 2 && emailDomainFilters.includes(parts[1]);
      });
    }
    
    // Apply phone filter
    if (hasPhoneFilter.length > 0) {
      if (hasPhoneFilter.includes('has-phone')) {
        result = result.filter(user => user.phone && user.phone.trim() !== '');
      } else if (hasPhoneFilter.includes('no-phone')) {
        result = result.filter(user => !user.phone || user.phone.trim() === '');
      }
    }
    
    // Apply sorting
    if (sorting) {
      result.sort((a, b) => {
        let valueA = a[sorting.field];
        let valueB = b[sorting.field];
        
        // Handle string comparisons
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        // Handle date comparisons
        if (sorting.field === 'createdAt' || sorting.field === 'updatedAt') {
          valueA = new Date(valueA).getTime();
          valueB = new Date(valueB).getTime();
        }
        
        if (valueA < valueB) return sorting.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sorting.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredUsers(result);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Direct API call for testing
      console.log("Fetching users directly...");
      
      // Get token from localStorage
      const token = localStorage.getItem("adminToken");
      
      if (!token) {
        console.log("No admin token found, redirecting to login");
        router.push("/sign-in");
        setAuthStatus("No token found");
        return;
      }
      
      setAuthStatus(`Token found (${token.substring(0, 10)}...)`);
      
      const response = await axios.get("http://20.251.153.107:3001/api/users", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("API Response:", response);
      
      // Check if data is in the expected format
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log("Users fetched successfully:", response.data.data);
        setUsers(response.data.data);
        setAuthStatus("Authenticated and data loaded");
      } else {
        console.error("Unexpected response format:", response.data);
        setError("Received an unexpected response format from the server.");
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      
      // Check for unauthorized error
      if (error.response?.status === 401) {
        setAuthStatus("Authentication failed (401) - token may be invalid");
        localStorage.removeItem("adminToken");
        router.push("/sign-in");
        return;
      }
      
      setError(
        error.response?.data?.message || 
        "Unable to load users. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearch = (value: string) => {
    setSearchText(value);
  };
  
  // Handle email domain filter changes
  const handleEmailDomainFilterChange = (selected: string[]) => {
    setEmailDomainFilters(selected);
  };
  
  // Handle phone filter changes
  const handlePhoneFilterChange = (selected: string[]) => {
    setHasPhoneFilter(selected);
  };
  
  // Handle sorting changes
  const handleSort = (field: string, direction: SortDirection) => {
    setSorting({ field, direction });
  };

  // Open modal for creating a new user
  const handleAddUser = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: ""
    });
    setFormErrors({});
    setIsEditMode(false);
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing user
  const handleEditUser = (user: User) => {
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      confirmPassword: ""
    });
    setFormErrors({});
    setIsEditMode(true);
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  // Confirm dialog for deleting a user
  const handleDeleteClick = (userId: number) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  // Delete a user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    const apiClient = createApiClient();
    if (!apiClient) return;
    
    try {
      await apiClient.delete(`/users/${userToDelete}`);
      setUsers(users.filter(user => user.id !== userToDelete));
      setStatusMessage({
        type: 'success',
        message: 'User deleted successfully'
      });
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        setStatusMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error deleting user:", err);
      setStatusMessage({
        type: 'error',
        message: 'Failed to delete user. Please try again.'
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user makes a change
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    // Clear confirmPassword error if password changes
    if (name === 'password' && formErrors.confirmPassword) {
      setFormErrors({
        ...formErrors,
        confirmPassword: ''
      });
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^[0-9]+$/.test(formData.phone)) {
      errors.phone = 'Phone must contain only numbers';
    }
    
    // Only validate password fields for new users or if password is provided for existing users
    if (!isEditMode) {
      // Creating new user - password is required
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (formData.password) {
      // Editing user - password validation only if a new password is provided
      if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission (create/update user)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    const apiClient = createApiClient();
    if (!apiClient) return;

    try {
      let response;
      // Prepare data to send to the API
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };
      
      // Add password only if it's provided (required for new users)
      if (formData.password) {
        dataToSend.password = formData.password;
      }
      
      if (isEditMode && currentUser) {
        // Update existing user
        response = await apiClient.put(`/users/${currentUser.id}`, dataToSend);
        
        // Update the users list with the updated user
        setUsers(users.map(user => 
          user.id === currentUser.id ? response.data.data : user
        ));
        
        setStatusMessage({
          type: 'success',
          message: 'User updated successfully'
        });
      } else {
        // Create new user
        response = await apiClient.post('/users', dataToSend);
        
        // Add the new user to the users list
        setUsers([...users, response.data.data]);
        
        setStatusMessage({
          type: 'success',
          message: 'User created successfully'
        });
      }
      
      // Close the modal and reset form
      setIsModalOpen(false);
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        setStatusMessage({ type: null, message: null });
      }, 3000);
    } catch (err) {
      console.error("Error saving user:", err);
      
      // Extract error message from response
      let errorMessage = 'Failed to save user. Please try again.';
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      setStatusMessage({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Format date to more readable format
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getInitials = (name: string) => {
    if (!name) return "UN";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Calculate filter counts
  const activeFilterCount = (emailDomainFilters.length > 0 ? 1 : 0) + 
                           (hasPhoneFilter.length > 0 ? 1 : 0);

  const renderRow = (item: User) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center text-sky-500 font-semibold">
          {getInitials(item.name)}
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-xs text-gray-500">
            <MailIcon size={12} className="inline mr-1" />
            {item.email}
          </p>
          <p className="text-xs text-gray-500">
            <Phone size={12} className="inline mr-1" />
            {item.phone || 'Not provided'}
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.id}</td>
      <td className="hidden md:table-cell">{item.name}</td>
      <td className="hidden md:table-cell">{item.email}</td>
      <td className="hidden lg:table-cell">{item.phone || '-'}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/manage/users/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center text-white rounded-full bg-lamaSky hover:bg-sky-500">
              <Eye size={14} />
            </button>
          </Link>
          <button
            onClick={() => handleEditUser(item)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-orange-300 text-white hover:bg-orange-500"
            title="Edit User"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleDeleteClick(item.id)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-300 text-white hover:bg-red-500"
            title="Delete User"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Auth status (for debugging - remove in production) */}
        <div className="bg-gray-50 p-2 mb-4 rounded text-xs text-gray-600 border flex justify-between">
          <div>
            <span>Auth status: {authStatus}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminInfo");
                router.push("/sign-in");
              }}
              className="text-red-500 hover:underline text-xs"
            >
              Sign out
            </button>
            <button
              onClick={() => fetchUsers()}
              className="text-sky-500 hover:underline text-xs"
            >
              Reload users
            </button>
          </div>
        </div>

        {/* Status message */}
        {statusMessage.message && (
          <div className={`mb-4 p-3 rounded-lg ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-center">
              {statusMessage.type === 'success' ? (
                <div className="mr-2 flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                </div>
              ) : (
                <AlertCircle size={18} className="mr-2 flex-shrink-0 text-red-500" />
              )}
              <p>{statusMessage.message}</p>
            </div>
          </div>
        )}

        {/* TOP */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold text-sky-800 flex items-center">
              <Users size={20} className="mr-2 text-sky-500" />
              Manage Users
            </h1>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <TableSearch 
                value={searchText} 
                onSearch={handleSearch} 
                placeholder="Search users..."
              />
              <div className="flex items-center gap-4 self-end">
                <div className="flex flex-wrap gap-2">
                  {emailDomainOptions.length > 0 && (
                    <FilterDropdown
                      title="Email Domain"
                      options={emailDomainOptions}
                      selectedOptions={emailDomainFilters}
                      onChange={handleEmailDomainFilterChange}
                    />
                  )}
                  <FilterDropdown
                    title="Phone"
                    options={phoneFilterOptions}
                    selectedOptions={hasPhoneFilter}
                    onChange={handlePhoneFilterChange}
                  />
                  <SortDropdown
                    options={sortOptions}
                    currentSort={sorting}
                    onSort={handleSort}
                  />
                </div>
                <button 
                  onClick={handleAddUser}
                  className="h-9 px-4 flex items-center justify-center rounded-full bg-lamaYellow text-sm hover:bg-yellow-400 transition-colors"
                >
                  <Plus size={18} className="mr-1" />
                  <span className="font-medium">Add User</span>
                </button>
                <button 
                  onClick={handleOpenImportModal}
                  className="h-9 px-4 flex items-center justify-center rounded-full bg-sky-500 text-white text-sm hover:bg-sky-600 transition-colors"
                >
                  <Upload size={18} className="mr-1" />
                  <span className="font-medium">Import Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {emailDomainFilters.length > 0 && (
                  <div className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs flex items-center">
                    <AtSign size={14} className="mr-1" />
                    <span>Domains: {emailDomainFilters.length}</span>
                    <button 
                      onClick={() => setEmailDomainFilters([])} 
                      className="ml-1 text-sky-500 hover:text-sky-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {hasPhoneFilter.length > 0 && (
                  <div className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs flex items-center">
                    <Phone size={14} className="mr-1" />
                    <span>
                      {hasPhoneFilter.includes('has-phone') ? 'Has Phone' : 'No Phone'}
                    </span>
                    <button 
                      onClick={() => setHasPhoneFilter([])} 
                      className="ml-1 text-sky-500 hover:text-sky-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setEmailDomainFilters([]);
                    setHasPhoneFilter([]);
                    setSorting(null);
                    setSearchText("");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 p-4 rounded-md text-red-800 mt-4">
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => fetchUsers()}
              className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
                <Users size={32} className="text-sky-300" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-sky-800">No Users Found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first user.</p>
            <button 
              onClick={handleAddUser}
              className="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors flex items-center mx-auto"
            >
              <Plus size={18} className="mr-2" />
              Add New User
            </button>
          </div>
        )}

        {/* No Results After Filtering */}
        {!loading && !error && users.length > 0 && filteredUsers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
                <FilterIcon size={32} className="text-sky-300" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-sky-800">No Matching Users</h3>
            <p className="text-gray-500 mb-6">No users match your current search or filters.</p>
            <button 
              onClick={() => {
                setEmailDomainFilters([]);
                setHasPhoneFilter([]);
                setSorting(null);
                setSearchText("");
              }}
              className="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors flex items-center mx-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Data table */}
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 overflow-hidden">
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-2">
                Showing {filteredUsers.length} of {users.length} users
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-100">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Info</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Name</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Email</th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sky-100">
                    {filteredUsers.map((item) => (
                      <tr key={item.id} className="hover:bg-sky-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center text-sky-500 font-semibold">
                              {getInitials(item.name)}
                            </div>
                            <div className="flex flex-col">
                              <h3 className="font-semibold text-sky-800">{item.name}</h3>
                              <p className="text-xs text-gray-500">
                                <MailIcon size={12} className="inline mr-1" />
                                {item.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                <Phone size={12} className="inline mr-1" />
                                {item.phone || 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{item.name}</td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{item.email}</td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{item.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditUser(item)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-orange-300 text-white hover:bg-orange-500 transition-colors"
                              title="Edit User"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-300 text-white hover:bg-red-500 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination />
            </div>
          </div>
        )}

        {/* Add/Edit User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-sky-400 to-sky-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                      <User size={20} />
                    </div>
                    <h2 className="text-xl font-bold">
                      {isEditMode ? 'Edit User' : 'Add New User'}
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="overflow-y-auto p-6">
                <form onSubmit={handleSubmit}>
                  {/* Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-300 ${
                        formErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter full name"
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-300 ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email address"
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>
                  
                  {/* Phone */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-300 ${
                        formErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter phone number"
                    />
                    {formErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Phone number should contain only digits.
                    </p>
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {!isEditMode && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full p-2 pl-9 border rounded-lg outline-none focus:ring-2 focus:ring-sky-300 ${
                          formErrors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
                      />
                      <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {formErrors.password && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Password must be at least 6 characters long.
                    </p>
                  </div>
                  
                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password {!isEditMode && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full p-2 pl-9 border rounded-lg outline-none focus:ring-2 focus:ring-sky-300 ${
                          formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={isEditMode ? "Confirm new password" : "Confirm password"}
                      />
                      <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {formErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                </form>
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 flex items-center"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      {isEditMode ? 'Update User' : 'Create User'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Excel Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-sky-400 to-sky-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                      <FileText size={20} />
                    </div>
                    <h2 className="text-xl font-bold">
                      Import Users from Excel
                    </h2>
                  </div>
                  <button
                    onClick={handleCloseImportModal}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              {/* Modal Body */}
              <div className="overflow-y-auto p-6">
                {/* File Selection */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Excel File
                    </label>
                    <button
                      onClick={generateExcelTemplate}
                      className="text-xs text-sky-500 hover:text-sky-700 flex items-center"
                    >
                      <Download size={14} className="mr-1" />
                      Download Template
                    </button>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {excelFile ? (
                      <div className="flex items-center justify-between bg-sky-50 p-3 rounded">
                        <div className="flex items-center">
                          <FileText size={20} className="text-sky-500 mr-2" />
                          <div className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                            {excelFile.name}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setExcelFile(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Upload size={36} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500 mb-2">
                          Drag and drop or click to select
                        </p>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-sky-100 text-sky-600 rounded-md text-sm font-medium hover:bg-sky-200"
                        >
                          Select Excel File
                        </button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  {fileError && (
                    <p className="text-red-500 text-xs mt-2">{fileError}</p>
                  )}
                  
                  <div className="mt-3">
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Note:</span> Excel file should contain columns for name, email, password, and optionally phone. Only .xlsx and .xls formats are supported.
                    </p>
                  </div>
                </div>
                
                {/* Import Results */}
                {importResults && (
                  <div className="mt-6 border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 p-3 border-b">
                      <h3 className="font-medium text-gray-700">Import Results</h3>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-sky-50 p-3 rounded-lg text-center">
                          <p className="text-sm text-gray-500">Processed</p>
                          <p className="text-xl font-semibold text-gray-700">{importResults.totalProcessed}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-sm text-gray-500">Success</p>
                          <p className="text-xl font-semibold text-green-600">{importResults.successCount}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg text-center">
                          <p className="text-sm text-gray-500">Failed</p>
                          <p className="text-xl font-semibold text-red-600">{importResults.failedCount}</p>
                        </div>
                      </div>
                      
                      {importResults.failedCount > 0 && importResults.errors && (
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Errors</h4>
                          <div className="max-h-40 overflow-y-auto border rounded">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-xs font-medium text-gray-500 text-left">Row</th>
                                  <th className="px-3 py-2 text-xs font-medium text-gray-500 text-left">Email</th>
                                  <th className="px-3 py-2 text-xs font-medium text-gray-500 text-left">Error</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {importResults.errors.map((error, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 text-xs text-gray-500">{error.row}</td>
                                    <td className="px-3 py-2 text-xs text-gray-900">{error.email}</td>
                                    <td className="px-3 py-2 text-xs text-red-500">{error.error}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseImportModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {importResults ? 'Close' : 'Cancel'}
                </button>
                {!importResults && (
                  <button
                    type="button"
                    onClick={handleImportExcel}
                    disabled={!excelFile || isImporting}
                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isImporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload size={18} className="mr-2" />
                        Import Users
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 text-white">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                    <Trash2 size={20} />
                  </div>
                  <h2 className="text-xl font-bold">Confirm Deletion</h2>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <p className="text-gray-700 mb-6">
                  Are you sure you want to delete this user? This action cannot be undone and all associated data will be permanently removed.
                </p>
                
                {/* Get user details for the user to be deleted */}
                {userToDelete && 
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-500 font-semibold">
                        {getInitials(users.find(user => user.id === userToDelete)?.name || 'Unknown User')}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium">
                          {users.find(user => user.id === userToDelete)?.name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {users.find(user => user.id === userToDelete)?.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  </div>
                }
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setUserToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} className="mr-2" />
                        Delete User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagePage;