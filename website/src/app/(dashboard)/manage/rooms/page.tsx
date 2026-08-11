"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch"; // This is our enhanced component
import FilterDropdown from "@/components/FilterDropdown"; // Our new filter component
import SortDropdown, { SortDirection } from "@/components/SortDropdown"; // Our new sort component
import CapacityFilter from "@/components/CapacityFilter"; // Our capacity range filter
import AlertMessage from "@/components/AlertMessage";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BedDouble, Plus, Edit, Trash2, X, Save, 
  Camera, AlertCircle, Users, Eye, ImageOff,
  Filter as FilterIcon
} from "lucide-react";

// Base API URL configuration
const API_BASE_URL = "http://20.251.153.107:3001";
const API_ENDPOINT = `${API_BASE_URL}/api`;

// Add this interface near the top of the file, after the imports
interface Room {
  room_id: string;
  room_name: string;
  room_type: string;
  capacity: number;
  facilities?: string;
  image?: string;
  [key: string]: any; // Add index signature to allow string indexing
}

// Add this interface after the Room interface
interface RoomFormData {
  room_name: string;
  room_type: string;
  capacity: string;
  facilities: string;
}

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Room ID",
    accessor: "room_id",
    className: "hidden md:table-cell",
  },
  {
    header: "Room Name",
    accessor: "room_name",
    className: "hidden md:table-cell",
  },
  {
    header: "Room Type",
    accessor: "room_type",
    className: "hidden md:table-cell",
  },
  {
    header: "Capacity",
    accessor: "capacity",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

// Room types for dropdown
const roomTypes = [
  "Small Room",
  "Middle Room",
  "Big Room"
];

// Enhanced image URL handling function
const fixImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  console.log(`Original image URL: ${imageUrl}`);
  
  let fixedUrl = imageUrl;
  
  // Handle local filesystem paths (should be in backend only)
  if (typeof imageUrl === 'string' && imageUrl.startsWith('E:')) {
    console.log(`Converting local path to API proxy: ${imageUrl}`);
    return `/api/image-proxy?path=${encodeURIComponent(imageUrl)}`;
  }
  
  // Fix double slash issue in URLs
  if (typeof imageUrl === 'string' && imageUrl.includes('//uploads')) {
    fixedUrl = imageUrl.replace('//uploads', '/uploads');
    console.log(`Fixed double slash: ${fixedUrl}`);
  }
  
  // Ensure the URL has the correct protocol (https)
  if (typeof fixedUrl === 'string' && fixedUrl.startsWith('http://')) {
    fixedUrl = fixedUrl.replace('http://', 'https://');
    console.log(`Fixed protocol: ${fixedUrl}`);
  }
  
  // For absolute URLs that include the server domain, keep them as-is
  if (typeof fixedUrl === 'string' && fixedUrl.startsWith('https://')) {
    console.log(`Using absolute URL as-is: ${fixedUrl}`);
    return fixedUrl;
  }
  
  // For relative URLs starting with /uploads, prefix with API_BASE_URL
  if (typeof fixedUrl === 'string' && fixedUrl.startsWith('/uploads')) {
    fixedUrl = `${API_BASE_URL}${fixedUrl}`;
    console.log(`Added API base URL to uploads path: ${fixedUrl}`);
    return fixedUrl;
  }
  
  // Add the server base URL if the image path is relative without a leading /
  if (typeof fixedUrl === 'string' && 
      !fixedUrl.startsWith('http') && 
      !fixedUrl.startsWith('/') && 
      !fixedUrl.startsWith('data:')) {
    fixedUrl = `${API_BASE_URL}/uploads/${fixedUrl}`;
    console.log(`Created full URL: ${fixedUrl}`);
    return fixedUrl;
  }
  
  console.log(`Final fixed URL: ${fixedUrl}`);
  return fixedUrl;
};

const RoomImage = ({ 
  image, 
  alt, 
  className = "w-full h-full object-cover", 
  fallbackIcon = null 
}) => {
  const [imgSrc, setImgSrc] = useState(fixImageUrl(image));
  const [hasError, setHasError] = useState(false);
  
  const handleError = () => {
    if (!hasError) {
      console.log(`Error loading image: ${imgSrc}`);
      setHasError(true);
      setImgSrc(getPlaceholderImage());
    }
  };
  
  if (!image && !hasError) {
    return (
      <div className="flex items-center justify-center h-full">
        {fallbackIcon || <BedDouble size={20} className="text-gray-300" />}
      </div>
    );
  }
  
  return (
    <img 
      src={imgSrc}
      alt={alt || "Room"}
      className={className}
      onError={handleError}
    />
  );
};

// Better placeholder image with SVG data URI
const getPlaceholderImage = () => {
  // Return a data URI SVG of a bed icon as a guaranteed fallback
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='%23cccccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 4v16M22 4v16M2 8h20M2 16h20'/%3E%3Cpath d='M4 16V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8'/%3E%3C/svg%3E";
};

// Reusable Room Image component


const RoomManagePage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>("Checking...");
  
  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    room_name: "",
    room_type: "",
    capacity: "",
    facilities: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New state for search, filter, and sort
  const [searchText, setSearchText] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [capacityFilter, setCapacityFilter] = useState<{min: number, max: number} | null>(null);
  const [sorting, setSorting] = useState<{field: string, direction: SortDirection} | null>(null);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  
  // Prepare filter options
  const typeFilterOptions = roomTypes.map(type => ({
    id: type,
    label: type
  }));
  
  // Prepare sort options
  const sortOptions = [
    { id: "room_name", label: "Room Name" },
    { id: "room_type", label: "Room Type" },
    { id: "capacity", label: "Capacity" },
    { id: "createdAt", label: "Date Created" }
  ];

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
    
    // Create axios instance with auth header using API_ENDPOINT constant
    const apiClient = axios.create({
      baseURL: API_ENDPOINT,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return apiClient;
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchRooms();
  }, [router]);

  // Apply all filters and sort whenever the data or filter criteria change
  useEffect(() => {
    applyFiltersAndSort();
  }, [rooms, searchText, typeFilters, capacityFilter, sorting]);

  // Apply search, filters, and sorting to the rooms data
  const applyFiltersAndSort = () => {
    let result = [...rooms];
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(room => 
        room.room_name.toLowerCase().includes(searchLower) ||
        room.room_type.toLowerCase().includes(searchLower) ||
        (room.facilities && room.facilities.toLowerCase().includes(searchLower)) ||
        room.room_id.toString().includes(searchLower)
      );
    }
    
    // Apply room type filter
    if (typeFilters.length > 0) {
      result = result.filter(room => typeFilters.includes(room.room_type));
    }
    
    // Apply capacity filter
    if (capacityFilter) {
      result = result.filter(room => 
        room.capacity >= capacityFilter.min && room.capacity <= capacityFilter.max
      );
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
    
    setFilteredRooms(result);
  };

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    
    const apiClient = createApiClient();
    if (!apiClient) return;
    
    try {
      console.log("Fetching rooms...");
      const response = await apiClient.get("/rooms");
      console.log("Rooms fetched successfully:", response.data);
      setRooms(response.data);
      setAuthStatus("Authenticated and data loaded");
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      
      // Check for unauthorized error
      if (error.response?.status === 401) {
        setAuthStatus("Authentication failed (401) - token may be invalid");
        localStorage.removeItem("adminToken");
        router.push("/sign-in");
        return;
      }
      
      setError(
        error.response?.data?.message || 
        "Unable to load rooms. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearch = (value: string) => {
    setSearchText(value);
  };
  
  // Handle room type filter changes
  const handleTypeFilterChange = (selected: string[]) => {
    setTypeFilters(selected);
  };
  
  // Handle capacity filter changes
  const handleCapacityFilter = (min: number, max: number) => {
    setCapacityFilter({ min, max });
  };
  
  // Clear capacity filter
  const clearCapacityFilter = () => {
    setCapacityFilter(null);
  };
  
  // Handle sorting changes
  const handleSort = (field: string, direction: SortDirection) => {
    setSorting({ field, direction });
  };

  // Open modal for creating a new room
  const handleAddRoom = () => {
    setFormData({
      room_name: "",
      room_type: roomTypes[0],
      capacity: "1",
      facilities: "",
    });
    setSelectedFile(null);
    setPreviewImage(null);
    setFormErrors({});
    setIsEditMode(false);
    setCurrentRoom(null);
    setIsModalOpen(true);
  };

  // Open modal for editing an existing room
  const handleEditRoom = (room: Room) => {
    setIsEditMode(true);
    setCurrentRoom(room);
    setFormData({
      room_name: room.room_name,
      room_type: room.room_type,
      capacity: room.capacity.toString(),
      facilities: room.facilities || "",
    });
    setIsModalOpen(true);
  };

  // Confirm dialog for deleting a room
  const handleDeleteClick = (roomId: string) => {
    setRoomToDelete(roomId);
    setShowDeleteConfirm(true);
  };

  // Delete a room
  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    setIsDeleting(true);
    const apiClient = createApiClient();
    if (!apiClient) return;
    
    try {
      await apiClient.delete(`/rooms/${roomToDelete}`);
      setRooms(rooms.filter(room => room.room_id !== roomToDelete));
      
      // Show success alert
      setAlertType('success');
      setAlertMessage('Room deleted successfully');
    } catch (err) {
      console.error("Error deleting room:", err);
      
      // Show error alert
      setAlertType('error');
      setAlertMessage('Failed to delete room. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setRoomToDelete(null);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user makes a change
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // Trigger file input click for image upload
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection for image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log(`Selected file: ${file.name}, size: ${(file.size / 1024).toFixed(2)}KB, type: ${file.type}`);
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.room_name.trim()) {
      errors.room_name = 'Room name is required';
    }
    
    if (!formData.room_type) {
      errors.room_type = 'Room type is required';
    }
    
    const capacity = parseInt(formData.capacity);
    if (isNaN(capacity) || capacity <= 0) {
      errors.capacity = 'Capacity must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission (create/update room)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    const apiClient = createApiClient();
    if (!apiClient) return;

    // Prepare form data for submission
    const formDataToSend = new FormData();
    formDataToSend.append('room_name', formData.room_name.trim());
    formDataToSend.append('room_type', formData.room_type);
    formDataToSend.append('capacity', formData.capacity.toString());
    formDataToSend.append('facilities', formData.facilities.trim());
    
    if (selectedFile) {
      formDataToSend.append('image', selectedFile);
    }
    
    try {
      let response;
      if (isEditMode && currentRoom) {
        // Update existing room
        response = await apiClient.put(`/rooms/${currentRoom.room_id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Update the rooms list with the updated room
        setRooms(rooms.map(room => 
          room.room_id === currentRoom.room_id ? response.data : room
        ));
        
        // Show success alert
        setAlertType('success');
        setAlertMessage('Room updated successfully');
      } else {
        // Create new room
        response = await apiClient.post('/rooms', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Add the new room to the rooms list
        setRooms([...rooms, response.data]);
        
        // Show success alert
        setAlertType('success');
        setAlertMessage('Room created successfully');
      }
      
      // Close the modal and reset form
      setIsModalOpen(false);
      
      // Hide the message after 3 seconds
      setTimeout(() => {
        setAlertMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error saving room:", err);
      
      // Extract error message from response
      let errorMessage = 'Failed to save room. Please try again.';
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      // Show error alert
      setAlertType('error');
      setAlertMessage(errorMessage);
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

  // Updated renderRow function with RoomImage component
  const renderRow = (item: Room) => (
    <tr
      key={item.room_id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100">
          <RoomImage 
            image={item.image} 
            alt={item.room_name}
            fallbackIcon={<BedDouble size={20} className="text-gray-300" />}
          />
        </div>
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.room_name}</h3>
          <p className="text-xs text-gray-500">
            Type: {item.room_type}
          </p>
          <p className="text-xs text-gray-500">
            Capacity: {item.capacity} persons
          </p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.room_id}</td>
      <td className="hidden md:table-cell">{item.room_name}</td>
      <td className="hidden md:table-cell">{item.room_type}</td>
      <td className="hidden lg:table-cell">{item.capacity}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/manage/rooms/${item.room_id}`}>
            <button className="w-7 h-7 flex items-center justify-center text-white rounded-full bg-lamaSky hover:bg-sky-500">
            <Eye size={14} />
            </button>
          </Link>
          <button
            onClick={() => handleEditRoom(item)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-orange-300 text-white hover:bg-orange-500"
            title="Edit Room"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => handleDeleteClick(item.room_id)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-red-300 text-white hover:bg-red-500"
            title="Delete Room"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );

  // Calculate filter counts for display in UI
  const activeFilterCount = (typeFilters.length > 0 ? 1 : 0) + 
                           (capacityFilter ? 1 : 0);

  return (
    <div className="min-h-screen">
      {alertMessage && (
        <AlertMessage 
          type={alertType} 
          message={alertMessage} 
          onClose={() => setAlertMessage(null)} 
        />
      )}
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
              onClick={() => window.location.reload()}
              className="text-blue-500 hover:underline text-xs"
            >
              Reload page
            </button>
          </div>
        </div>

        {/* TOP */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold text-sky-800 flex items-center">
              <BedDouble size={20} className="mr-2 text-sky-500" />
              Manage Rooms
            </h1>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <TableSearch 
                value={searchText} 
                onSearch={handleSearch} 
                placeholder="Search rooms..."
              />
              <div className="flex items-center gap-4 self-end">
                <div className="flex flex-wrap gap-2">
                  <FilterDropdown
                    title="Room Type"
                    options={typeFilterOptions}
                    selectedOptions={typeFilters}
                    onChange={handleTypeFilterChange}
                  />
                  <CapacityFilter
                    minValue={1}
                    maxValue={50}
                    onFilter={handleCapacityFilter}
                    isActive={capacityFilter !== null}
                    onClear={clearCapacityFilter}
                  />
                  <SortDropdown
                    options={sortOptions}
                    currentSort={sorting}
                    onSort={handleSort}
                  />
                </div>
                <button 
                  onClick={handleAddRoom}
                  className="h-9 px-4 flex items-center justify-center rounded-full bg-sky-500 text-sm text-white hover:bg-sky-600 transition-colors"
                >
                  <Plus size={18} className="mr-1" />
                  <span className="font-medium">Add Room</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {typeFilters.length > 0 && (
                  <div className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs flex items-center">
                    <span>Types: {typeFilters.length}</span>
                    <button 
                      onClick={() => setTypeFilters([])} 
                      className="ml-1 text-sky-500 hover:text-sky-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {capacityFilter && (
                  <div className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs flex items-center">
                    <span>Capacity: {capacityFilter.min}-{capacityFilter.max}</span>
                    <button 
                      onClick={clearCapacityFilter} 
                      className="ml-1 text-sky-500 hover:text-sky-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setTypeFilters([]);
                    clearCapacityFilter();
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
              <p className="text-gray-600">Loading rooms...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 p-4 rounded-md text-red-800 mt-4">
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => fetchRooms()}
              className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && rooms.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
                <BedDouble size={32} className="text-sky-300" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-sky-800">No Rooms Found</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first room.</p>
            <button 
              onClick={handleAddRoom}
              className="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors flex items-center mx-auto"
            >
              <Plus size={18} className="mr-2" />
              Add New Room
            </button>
          </div>
        )}

        {/* No Results After Filtering */}
        {!loading && !error && rooms.length > 0 && filteredRooms.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
                <FilterIcon size={32} className="text-sky-300" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-sky-800">No Matching Rooms</h3>
            <p className="text-gray-500 mb-6">No rooms match your current search or filters.</p>
            <button 
              onClick={() => {
                setTypeFilters([]);
                clearCapacityFilter();
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
        {!loading && !error && filteredRooms.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 overflow-hidden">
            {/* Table Header with Search, Filter, and Add Button */}
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-2">
                Showing {filteredRooms.length} of {rooms.length} rooms
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-100">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Info</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Room Name</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Room Type</th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sky-100">
                    {filteredRooms.map((item) => (
                      <tr key={item.room_id} className="hover:bg-sky-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                              <RoomImage 
                                image={item.image} 
                                alt={item.room_name}
                                fallbackIcon={<BedDouble size={20} className="text-gray-300" />}
                              />
                            </div>
                            <div className="flex flex-col">
                              <h3 className="font-semibold text-sky-800">{item.room_name}</h3>
                              <p className="text-xs text-gray-500">
                                Type: {item.room_type}
                              </p>
                              <p className="text-xs text-gray-500">
                                Capacity: {item.capacity} persons
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{item.room_name}</td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{item.room_type}</td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{item.capacity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link href={`/manage/rooms/${item.room_id}`}>
                              <button className="w-7 h-7 flex items-center justify-center text-white rounded-full bg-sky-500 hover:bg-sky-600 transition-colors">
                                <Eye size={14} />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(item.room_id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                              title="Delete Room"
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

        {/* Add/Edit Room Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-sky-400 to-sky-500 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                      <BedDouble size={20} />
                    </div>
                    <h2 className="text-xl font-bold">
                      {isEditMode ? 'Edit Room' : 'Add New Room'}
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
                  {/* Room Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="room_name"
                      value={formData.room_name}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-300 ${
                        formErrors.room_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter room name"
                    />
                    {formErrors.room_name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.room_name}</p>
                    )}
                  </div>
                  
                  {/* Room Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="room_type"
                      value={formData.room_type}
                      onChange={handleInputChange}
                      className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-300 ${
                        formErrors.room_type ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      {roomTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {formErrors.room_type && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.room_type}</p>
                    )}
                  </div>
                  
                  {/* Capacity */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        min="1"
                        max="100"
                        className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-sky-300 ${
                          formErrors.capacity ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <div className="ml-2 text-gray-500 flex items-center">
                        <Users size={18} className="mr-1" />
                        <span>persons</span>
                      </div>
                    </div>
                    {formErrors.capacity && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>
                    )}
                  </div>
                  
                  {/* Facilities */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Facilities
                    </label>
                    <textarea
                      name="facilities"
                      value={formData.facilities}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-sky-300"
                      placeholder="Enter room facilities (e.g., Wi-Fi, TV, Mini-bar)"
                    />
                  </div>
                  
                  {/* Image Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Image
                    </label>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <div className="mt-2 aspect-video bg-gray-100 rounded-lg overflow-hidden relative mb-2 border border-gray-200">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt="Room preview"
                          className="w-full h-full object-cover"
                        />
                      ) : currentRoom && currentRoom.image ? (
                        <RoomImage
                          image={currentRoom.image}
                          alt={currentRoom.room_name}
                          fallbackIcon={<BedDouble size={48} className="text-gray-300 mb-2" />}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <BedDouble size={48} className="text-gray-300 mb-2" />
                          <p className="text-gray-400 text-sm">No image selected</p>
                        </div>
                      )}
                      
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        className="absolute bottom-3 right-3 bg-sky-500 text-white rounded-lg p-2 hover:bg-sky-600 transition-colors"
                      >
                        <Camera size={20} />
                      </button>
                    </div>
                    {formErrors.image && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.image}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a JPEG or PNG image (max 5MB). Leave empty to keep the current image.
                    </p>
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
                      {isEditMode ? 'Update Room' : 'Create Room'}
                    </>
                  )}
                </button>
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
                  Are you sure you want to delete this room? This action cannot be undone and all associated data will be permanently removed.
                </p>
                
                {/* Get room details for the room to be deleted */}
                {roomToDelete && 
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                        <BedDouble size={24} className="text-sky-500" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-sky-800">
                          {rooms.find(room => room.room_id === roomToDelete)?.room_name || 'Unknown Room'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {roomToDelete}
                        </p>
                      </div>
                    </div>
                  </div>
                }
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setRoomToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteRoom}
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
                        Delete Room
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

export default RoomManagePage;