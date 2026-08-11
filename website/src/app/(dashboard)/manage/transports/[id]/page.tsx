"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Image from "next/image";
import { 
  Car, Edit, Trash2, ArrowLeft, Save,
  AlertCircle, User, Users, Camera, Clock
} from "lucide-react";

// Add the missing formatDate function
const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return "Invalid date";
  
  // Format as "Month DD, YYYY at HH:MM AM/PM"
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

interface Transport {
  vehicle_id: string;
  vehicle_name: string;
  driver_name: string;
  capacity: number;
  image: string;
  vehicle_type: string;
  features: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateStatus {
  type: 'success' | 'error' | 'info' | null;
  message: string | null;
}

interface EditData {
  vehicle_name: string;
  driver_name: string;
  capacity: number;
  image: string;
  vehicle_type: string;
  features: string;
}

const SingleTransportPage = () => {
  const router = useRouter();
  const params = useParams();
  const transportId = params.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [transport, setTransport] = useState<Transport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<EditData>({
    vehicle_name: "",
    driver_name: "",
    capacity: 0,
    image: "",
    vehicle_type: "",
    features: ""
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ type: null, message: null });
  const [isSaving, setIsSaving] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  // Create a custom axios instance
  const createApiClient = () => {
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      console.log("No admin token found, redirecting to login");
      router.push("/sign-in");
      return null;
    }
    
    return axios.create({
      baseURL: "http://20.251.153.107:3001/api",
      headers: { Authorization: `Bearer ${token}` },
      timeout: 45000 // Increased timeout to 45 seconds for image uploads
    });
  };

  // Fetch transport data
  const fetchTransportData = async () => {
    setLoading(true);
    setError(null);
    
    const apiClient = createApiClient();
    if (!apiClient) return;
    
    try {
      const response = await apiClient.get(`/transports/${transportId}`);
      setTransport(response.data);
      setEditData({
        vehicle_name: response.data.vehicle_name || "",
        driver_name: response.data.driver_name || "",
        capacity: response.data.capacity || 0,
        image: response.data.image || "",
        vehicle_type: response.data.vehicle_type || "",
        features: response.data.features || ""
      });
      setVehicleTypes(response.data.vehicle_types || []);
    } catch (err) {
      console.error("Error fetching transport:", err);
      setUpdateStatus({
        type: 'error',
        message: "Unable to load transport information. Please try again later."
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit mode toggle
  const toggleEditMode = () => {
    if (isEditing && transport) {
      // Reset form data when canceling edit
      setEditData({
        vehicle_name: transport.vehicle_name || "",
        driver_name: transport.driver_name || "",
        capacity: transport.capacity || 0,
        image: transport.image || "",
        vehicle_type: transport.vehicle_type || "",
        features: transport.features || ""
      });
      setSelectedFile(null);
      setPreviewImage(null);
    }
    setIsEditing(!isEditing);
    setUpdateStatus({ type: null, message: null });
  };

  // Fix input change handler with proper type conversion
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    switch (name) {
      case 'capacity':
        setEditData(prev => ({
          ...prev,
          capacity: Number(value) || 0
        }));
        break;
      case 'vehicle_name':
      case 'driver_name':
      case 'image':
      case 'vehicle_type':
      case 'features':
        setEditData(prev => ({
          ...prev,
          [name]: value
        }));
        break;
      default:
        break;
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setUpdateStatus({
          type: 'error',
          message: 'File size must be less than 5MB'
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fixImageUrl = (imageUrl: string): string => {
    if (!imageUrl) return '/placeholder-vehicle.jpg';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${imageUrl}`;
  };

  // Improved handleSubmit function with better error handling
  const handleSubmit = async () => {
    try {
      setIsSaving(true);
      const formData = new FormData();
      
      // Add text fields with proper type conversion
      Object.entries(editData).forEach(([key, value]) => {
        if (typeof value === 'number') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      });
      
      // Add file if selected
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const response = await axios.put(`/api/transports/${transportId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setTransport(response.data.data);
        setUpdateStatus({
          type: 'success',
          message: 'Transport updated successfully'
        });
        setIsEditing(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        setUpdateStatus({
          type: 'error',
          message: error.message
        });
      } else {
        setUpdateStatus({
          type: 'error',
          message: 'An unexpected error occurred'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle transport deletion
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this transport? This action cannot be undone.")) {
      return;
    }
    
    const apiClient = createApiClient();
    if (!apiClient) return;
    
    try {
      await apiClient.delete(`/transports/${transportId}`);
      router.push("/manage/transports");
    } catch (err) {
      console.error("Error deleting transport:", err);
      setUpdateStatus({
        type: 'error',
        message: 'Failed to delete transport. Please try again.'
      });
    }
  };

  // Fix image error handling
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = '/placeholder-vehicle.jpg';
  };

  // Initial data fetch
  useEffect(() => {
    if (transportId) {
      fetchTransportData();
    }
  }, [transportId, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
          <div className="mt-4 text-blue-500 font-medium text-center">Loading</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-rose-50 to-rose-100 p-8">
            <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-rose-500" />
            </div>
          </div>
          <div className="p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Transport</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => router.back()}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center mx-auto"
            >
              <ArrowLeft size={16} className="mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No transport found
  if (!transport) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-8">
            <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-amber-500" />
            </div>
          </div>
          <div className="p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Transport Not Found</h3>
            <p className="text-gray-600 mb-6">The requested transport could not be found or may have been deleted.</p>
            <button 
              onClick={() => router.push("/manage/transports")}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center mx-auto"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Transports
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Status message */}
        {updateStatus.message && (
          <div className={`mb-6 p-4 rounded-xl ${
            updateStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            updateStatus.type === 'info' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-center">
              {updateStatus.type === 'success' ? (
                <div className="mr-2 flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                </div>
              ) : updateStatus.type === 'info' ? (
                <div className="mr-2 flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                </div>
              ) : (
                <AlertCircle size={20} className="mr-2 flex-shrink-0 text-red-500" />
              )}
              <p>{updateStatus.message}</p>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left column - Main info */}
          <div className="md:col-span-7 lg:col-span-8">
            {/* Transport info card */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 mb-6">
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Car size={24} />
                    </div>
                    <div className="ml-4">
                      {isEditing ? (
                        <input
                          type="text"
                          name="vehicle_name"
                          value={editData.vehicle_name}
                          onChange={handleInputChange}
                          className="bg-white/10 backdrop-blur-sm text-2xl font-bold p-1 rounded w-full text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                          placeholder="Vehicle Name"
                        />
                      ) : (
                        <h2 className="text-2xl font-bold">{transport.vehicle_name}</h2>
                      )}
                      <div className="mt-1 text-blue-50 flex items-center text-sm">
                        <span>ID: {transport.vehicle_id}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <button
                        onClick={toggleEditMode}
                        className="rounded-full w-10 h-10 flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
                        title="Cancel"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <button
                        onClick={toggleEditMode}
                        className="rounded-full w-10 h-10 flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-colors"
                        title="Edit Transport"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                    {isEditing ? (
                      <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="rounded-full w-10 h-10 flex items-center justify-center bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                        title="Save Changes"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                        ) : (
                          <Save size={18} />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleDelete}
                        className="rounded-full w-10 h-10 flex items-center justify-center bg-red-500 text-white hover:bg-red-600 transition-colors"
                        title="Delete Transport"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Image */}
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden relative mb-6 group">
                  <input 
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {previewImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={previewImage}
                        alt={transport.vehicle_name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  ) : transport.image ? (
                    <div className="relative w-full h-full">
                      <img
                        src={fixImageUrl(transport.image)}
                        alt={transport.vehicle_name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car size={64} className="text-gray-300" />
                      <p className="text-gray-400 absolute bottom-4">No image available</p>
                    </div>
                  )}
                  
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={triggerFileInput}
                        className="bg-white/90 backdrop-blur-sm rounded-xl p-3 flex items-center"
                      >
                        <Camera size={20} className="mr-2 text-blue-500" />
                        <span>Choose Image File (Max 5MB)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Transport Details */}
                <div className="space-y-4">
                  {/* Vehicle Type */}
                  <div className="flex items-start p-4 bg-indigo-50 rounded-2xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Car size={20} className="text-indigo-500" />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="uppercase text-xs font-semibold text-indigo-500 tracking-wider">Vehicle Type</h3>
                      {isEditing ? (
                        <select
                          name="vehicle_type"
                          value={editData.vehicle_type}
                          onChange={handleInputChange}
                          className="mt-1 p-2 border border-indigo-200 rounded w-full bg-white"
                        >
                          {vehicleTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-lg font-medium text-gray-800">
                          {transport.vehicle_type || "Not assigned"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="flex items-start p-4 bg-sky-50 rounded-2xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                      <Users size={20} className="text-sky-500" />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="uppercase text-xs font-semibold text-sky-500 tracking-wider">Capacity</h3>
                      {isEditing ? (
                        <input
                          type="number"
                          name="capacity"
                          value={editData.capacity}
                          onChange={handleInputChange}
                          min="1"
                          max="100"
                          className="mt-1 p-2 border border-sky-200 rounded w-full bg-white"
                          placeholder="Capacity"
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-800">
                          {transport.capacity} persons
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex items-start p-4 bg-emerald-50 rounded-2xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <User size={20} className="text-emerald-500" />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="uppercase text-xs font-semibold text-emerald-500 tracking-wider">Features</h3>
                      {isEditing ? (
                        <textarea
                          name="features"
                          value={editData.features}
                          onChange={handleInputChange}
                          rows="3"
                          className="mt-1 p-2 border border-emerald-200 rounded w-full bg-white"
                          placeholder="Vehicle Features"
                        />
                      ) : (
                        <p className="text-lg font-medium text-gray-800">
                          {transport.features || "No features information available"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-start p-4 bg-gray-50 rounded-2xl">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <Clock size={20} className="text-gray-500" />
                    </div>
                    <div className="ml-4 flex-grow">
                      <h3 className="uppercase text-xs font-semibold text-gray-500 tracking-wider">Last Updated</h3>
                      <p className="text-lg font-medium text-gray-800">
                        {formatDate(transport.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Actions */}
          <div className="md:col-span-5 lg:col-span-4">
            {/* Quick actions card */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 mb-6">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {!isEditing ? (
                    <button 
                      onClick={toggleEditMode}
                      className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center transition-colors"
                    >
                      <Edit size={18} className="mr-2" />
                      Edit Transport Details
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmit}
                      disabled={isSaving}
                      className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} className="mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}
                  <button 
                    onClick={handleDelete}
                    className={`w-full py-2.5 px-4 ${isEditing ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-red-500 hover:bg-red-600 text-white'} rounded-xl font-medium flex items-center justify-center transition-colors`}
                  >
                    <Trash2 size={18} className="mr-2" />
                    Delete Transport
                  </button>
                </div>
              </div>
            </div>
            
            {/* View related bookings */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 mb-6">
              <div className="p-6">
                <Link href={`/list/transport-bookings?transport=${transportId}`}>
                  <button className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium flex items-center justify-center transition-colors">
                    View Related Bookings
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Navigation links */}
            <div>
              <Link 
                href="/manage/transports" 
                className="flex items-center text-sky-500 hover:text-sky-600 font-medium transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Transport Management
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleTransportPage;