"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import BookingStatusFilter from "@/components/BookingStatusFilter";
import DateRangeFilter from "@/components/DateRangeFilter";
import BookingSortDropdown from "@/components/BookingSortDropdown";
import AlertMessage from "@/components/AlertMessage";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Eye, Trash2, Car, MapPin, Calendar, CheckCircle, XCircle, Clock,
  Filter as FilterIcon, X, ArrowRight, Download
} from "lucide-react";
import { exportToExcel, formatDateForExcel, formatTimeForExcel } from "@/utils/excelExport";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://20.251.153.107:3001';

const fixImageUrl = (imageUrl: string | undefined | null): string | null => {
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
  return fixedUrl || '';
};

const getPlaceholderImage = () => {
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiA3NzljYWIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1jYXIiPjxwYXRoIGQ9Ik0xOSAxN2MwIDIuMi0yLjIgNC01IDRzLTUtMS44LTUtNFMyMSAxMyAxOSAxM3oiLz48cGF0aCBkPSJNMTMgMTkgSDlWMjBIMTVWMTlaIi8+PHBhdGggZD0iTTE5IDEzSDVjLTEuMSAwLTIgLjktMiAydjNoMTh2LTNjMC0xLjEtLjktMi0yLTJ6Ii8+PC9zdmc+';
};

const TransportImage = ({ 
  image, 
  alt = "Transport Image",
  className = "w-full h-full object-cover", 
  fallbackIcon = null 
}: { 
  image?: string | null; 
  alt?: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
}) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    if (!image) {
      setHasError(true);
      return;
    }
    
    const fixedUrl = fixImageUrl(image);
    console.log(`TransportImage initial imgSrc: ${fixedUrl} (from ${image})`);
    
    // Basic URL validation
    if (!fixedUrl) {
      console.error('Invalid image URL after fixing');
      setHasError(true);
      return;
    }
    
    setImgSrc(fixedUrl);
    setHasError(false);
    
    // Debug log on component mount/update
    console.log(`TransportImage rendering for image: ${image}`);
    console.log(`Processed URL: ${fixedUrl}`);
  }, [image]);
  
  const handleError = () => {
    console.error(`Error loading image: ${imgSrc} (original: ${image})`);
    setHasError(true);
  };
  
  if (!image || hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        {fallbackIcon || <Car size={24} className="text-gray-300" />}
      </div>
    );
  }
  
  return (
    <img 
      src={imgSrc || ''}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
};

type TransportBooking = {
  booking_id: number;
  user_id: number;
  transport_id: number;
  booking_date: string;
  agenda: string;
  start_time: string;
  end_time: string;
  pic: string;
  section: string;
  description?: string;
  status: string;
  notes?: string;
  approver_id?: number;
  approved_at?: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
  };
  transport?: {
    vehicle_name: string;
    image?: string;
    driver_name?: string;
    capacity?: number;
  };
};

type SortDirection = 'asc' | 'desc';

type DateFilter = {
  startDate: string | null;
  endDate: string | null;
};

// Columns definition
const columns = [
  { header: "Booking ID", accessor: "booking_id" },
  { header: "Transport", accessor: "transport", className: "hidden md:table-cell" },
  { header: "PIC", accessor: "pic" },
  { header: "User Email", accessor: "user.email", className: "hidden md:table-cell" },
  { header: "Agenda", accessor: "agenda", className: "hidden md:table-cell" },
  { header: "Start Time", accessor: "start_time", className: "hidden md:table-cell" },
  { header: "End Time", accessor: "end_time", className: "hidden lg:table-cell" },
  { header: "Destination", accessor: "destination", className: "hidden md:table-cell" },
  { header: "Status", accessor: "status", className: "hidden md:table-cell" },
  { header: "Actions", accessor: "action" },
];

const TransportBookingListPage = () => {
  const router = useRouter();
  const [transportBookings, setTransportBookings] = useState<TransportBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>("Checking...");
  
  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  // New state for search, filter, and sort
  const [searchText, setSearchText] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ startDate: null, endDate: null });
  const [sorting, setSorting] = useState<{ field: string; direction: SortDirection } | null>(null);
  const [filteredBookings, setFilteredBookings] = useState<TransportBooking[]>([]);
  const [destinationFilter, setDestinationFilter] = useState<string>("");

  // Sort options
  const sortOptions = [
    { id: "booking_id", label: "Booking ID" },
    { id: "booking_date", label: "Booking Date" },
    { id: "agenda", label: "Agenda" },
    { id: "start_time", label: "Start Time" },
    { id: "status", label: "Status" },
    { id: "destination", label: "Destination" }
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
    
    // Create axios instance with auth header
    const apiClient = axios.create({
      baseURL: "http://20.251.153.107:3001/api",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return apiClient;
  };

  // Apply search, filters, and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [transportBookings, searchText, statusFilters, dateFilter, sorting, destinationFilter]);

  // Fetch data on component mount
  useEffect(() => {
    fetchTransportBookings();
  }, []);

  // Apply all filters and sorting
  const applyFiltersAndSort = () => {
    let result = [...transportBookings];
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(booking => 
        booking.booking_id.toString().includes(searchLower) ||
        booking.agenda.toLowerCase().includes(searchLower) ||
        booking.pic.toLowerCase().includes(searchLower) ||
        booking.section.toLowerCase().includes(searchLower) ||
        booking.destination.toLowerCase().includes(searchLower) ||
        booking.transport_id.toString().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (statusFilters.length > 0) {
      result = result.filter(booking => 
        statusFilters.includes(booking.status.toLowerCase())
      );
    }
    
    // Apply date filter
    if (dateFilter.startDate || dateFilter.endDate) {
      result = result.filter(booking => {
        const bookingDate = new Date(booking.booking_date);
        
        if (dateFilter.startDate && dateFilter.endDate) {
          const startDate = new Date(dateFilter.startDate);
          const endDate = new Date(dateFilter.endDate);
          return bookingDate >= startDate && bookingDate <= endDate;
        } else if (dateFilter.startDate) {
          const startDate = new Date(dateFilter.startDate);
          return bookingDate >= startDate;
        } else if (dateFilter.endDate) {
          const endDate = new Date(dateFilter.endDate);
          return bookingDate <= endDate;
        }
        
        return true;
      });
    }
    
    // Apply destination filter (if any)
    if (destinationFilter) {
      result = result.filter(booking => 
        booking.destination.toLowerCase().includes(destinationFilter.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sorting) {
      result.sort((a, b) => {
        let valueA: any = sorting.field === 'user.email' ? a.user?.email : a[sorting.field as keyof TransportBooking];
        let valueB: any = sorting.field === 'user.email' ? b.user?.email : b[sorting.field as keyof TransportBooking];
        
        // Special handling for dates and times
        if (sorting.field === 'booking_date' || sorting.field === 'createdAt' || sorting.field === 'updatedAt') {
          valueA = new Date(valueA).getTime();
          valueB = new Date(valueB).getTime();
        } else if (sorting.field === 'start_time' || sorting.field === 'end_time') {
          valueA = valueA.replace(':', '');
          valueB = valueB.replace(':', '');
        } else if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) return sorting.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sorting.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    setFilteredBookings(result);
  };

  const fetchTransportBookings = async () => {
    setLoading(true);
    setError(null);
    
    const apiClient = createApiClient();
    if (!apiClient) return;
    
    try {
      console.log("Fetching transport bookings...");
      // First, fetch all transports to ensure we have the data
      const transportsResponse = await apiClient.get("/transports");
      const transportsMap = new Map(
        transportsResponse.data.map((transport: any) => [
          transport.transport_id,
          {
            transport_id: transport.transport_id,
            vehicle_name: transport.vehicle_name,
            image: transport.image,
            driver_name: transport.driver_name,
            capacity: transport.capacity
          }
        ])
      );

      // Then fetch bookings with their relations
      const response = await apiClient.get("/transport-bookings", {
        params: {
          include: 'transport,user',
          populate: {
            transport: true,
            user: true
          }
        }
      });
      console.log("Transport bookings API response:", response.data);
      
      // Transform the data to ensure transport data is properly structured
      const transformedData = response.data.map((booking: any) => {
        console.log("Processing booking:", booking); // Debug log
        
        // Get transport data from our map
        const transportData = transportsMap.get(booking.transport_id) || {
          transport_id: booking.transport_id,
          vehicle_name: `Transport #${booking.transport_id}`,
          image: null,
          driver_name: 'No driver assigned',
          capacity: 'Not specified'
        };

        return {
          ...booking,
          transport: transportData,
          user: booking.user || null
        };
      });
      
      console.log("Transformed data:", transformedData);
      setTransportBookings(transformedData);
      setAuthStatus("Authenticated and data loaded");
    } catch (error: any) {
      console.error("Error fetching transport bookings:", error);
      
      if (error.response?.status === 401) {
        setAuthStatus("Authentication failed (401) - token may be invalid");
        localStorage.removeItem("adminToken");
        router.push("/sign-in");
        return;
      }
      
      setError(
        error.response?.data?.message || 
        "Unable to load transport bookings. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  // Handle status filter changes
  const handleStatusChange = (selected: string[]) => {
    setStatusFilters(selected);
  };

  // Handle date filter changes
  const handleDateChange = (dates: DateFilter) => {
    setDateFilter(dates);
  };

  // Handle destination filter
  const handleDestinationFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestinationFilter(e.target.value);
  };

  // Handle sorting changes
  const handleSort = (field: string, direction: SortDirection) => {
    setSorting({ field, direction });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText("");
    setStatusFilters([]);
    setDateFilter({ startDate: null, endDate: null });
    setDestinationFilter("");
    setSorting(null);
  };

  // Format time to 12-hour format
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle delete
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    setIsDeleting(true);
    const apiClient = createApiClient();
    if (!apiClient) return;
    
    try {
      await apiClient.delete(`/transport-bookings/${bookingToDelete}`);
      
      // Remove the deleted booking from state
      setTransportBookings(prevBookings => 
        prevBookings.filter(booking => booking.booking_id !== bookingToDelete)
      );
      
      // Close modal
      setShowDeleteConfirm(false);
      setBookingToDelete(null);
      
      // Show success alert
      setAlertType('success');
      setAlertMessage('Transport booking has been successfully deleted.');
      
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      setError(
        error.response?.data?.message || 
        "Unable to delete the transport booking. Please try again later."
      );
      
      // Show error alert
      setAlertType('error');
      setAlertMessage(error.response?.data?.message || 
        "Unable to delete the transport booking. Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get appropriate badge color based on status
  const getStatusColor = (status: string, booking: TransportBooking) => {
    // Check if booking is expired
    const isExpired = checkIfExpired(booking);
    if (isExpired) {
      return 'bg-gray-100 text-gray-500';
    }

    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get appropriate status icon
  const getStatusIcon = (status: string, booking: TransportBooking) => {
    // Check if booking is expired
    const isExpired = checkIfExpired(booking);
    if (isExpired) {
      return <Clock size={14} className="mr-1 text-gray-400" />;
    }

    switch (status.toLowerCase()) {
      case 'approved':
        return <CheckCircle size={14} className="mr-1 text-green-500" />;
      case 'rejected':
        return <XCircle size={14} className="mr-1 text-red-500" />;
      case 'pending':
        return <Clock size={14} className="mr-1 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Function to check if booking is expired
  const checkIfExpired = (booking: TransportBooking) => {
    if (!booking) return false;
    
    const now = new Date();
    const bookingDate = new Date(booking.booking_date);
    const [endHours, endMinutes] = booking.end_time.split(':');
    bookingDate.setHours(parseInt(endHours), parseInt(endMinutes));
    
    return now > bookingDate;
  };

  // Get display status
  const getDisplayStatus = (booking: TransportBooking) => {
    if (!booking) return "Unknown";
    
    if (booking.status.toLowerCase() === 'pending' && checkIfExpired(booking)) {
      return "Expired";
    }
    
    return booking.status;
  };

  // Calculate active filters count
  const activeFilterCount = (statusFilters.length > 0 ? 1 : 0) + 
                           ((dateFilter.startDate || dateFilter.endDate) ? 1 : 0) +
                           (destinationFilter ? 1 : 0);

  // Modified renderRow to include enhanced status and destination
  const renderRow = (item: TransportBooking) => {
    console.log("Rendering row with data:", item); // Debug log
    
    return (
      <tr
        key={item.booking_id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">#{item.booking_id}</td>
        <td className="hidden md:table-cell p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden">
              <TransportImage 
                image={item.transport?.image}
                alt={item.transport?.vehicle_name || 'Transport Image'}
                className="w-full h-full object-cover"
                fallbackIcon={<Car size={16} className="text-gray-400" />}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">
                {item.transport?.vehicle_name || `Transport #${item.transport_id}`}
              </span>
              <span className="text-xs text-gray-500">{item.transport?.driver_name ? `Driver: ${item.transport.driver_name}` : 'No driver assigned'}</span>
              {item.transport?.capacity && (
                <span className="text-xs text-gray-500">Capacity: {item.transport.capacity}</span>
              )}
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{item.pic}</span>
            <span className="text-xs text-gray-500">{item.section}</span>
          </div>
        </td>
        <td className="hidden md:table-cell p-4">{item.user?.email || 'N/A'}</td>
        <td className="hidden md:table-cell p-4">{item.agenda}</td>
        <td className="hidden md:table-cell p-4">{formatTime(item.start_time)}</td>
        <td className="hidden lg:table-cell p-4">{formatTime(item.end_time)}</td>
        <td className="hidden md:table-cell p-4">
          <div className="flex items-center">
            <MapPin size={14} className="mr-1 text-gray-400" />
            {item.destination}
          </div>
        </td>
        <td className="hidden md:table-cell p-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getStatusColor(item.status, item)}`}>
            {getStatusIcon(item.status, item)}
            {getDisplayStatus(item)}
          </span>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Link href={`/list/transport-bookings/${item.booking_id}`}>
              <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky text-white hover:bg-sky-500">
                <Eye size={16} />
              </button>
            </Link>
            <button 
              onClick={() => {
                setBookingToDelete(item.booking_id);
                setShowDeleteConfirm(true);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-300 text-white hover:bg-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Add export function
  const handleExport = () => {
    const exportData = filteredBookings.map(booking => ({
      'Booking ID': booking.booking_id,
      'PIC': booking.pic,
      'Section': booking.section,
      'User Email': booking.user?.email || 'N/A',
      'Agenda': booking.agenda,
      'Booking Date': formatDateForExcel(booking.booking_date),
      'Start Time': formatTimeForExcel(booking.start_time),
      'End Time': formatTimeForExcel(booking.end_time),
      'Transport ID': booking.transport_id,
      'Destination': booking.destination,
      'Status': getDisplayStatus(booking),
      'Description': booking.description || '',
      'Notes': booking.notes || ''
    }));

    exportToExcel(exportData, `transport-bookings-${new Date().toISOString().split('T')[0]}`);
  };

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
              <Car size={20} className="mr-2 text-sky-500" />
              Transport Bookings
            </h1>
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <TableSearch 
                value={searchText} 
                onSearch={handleSearch} 
                placeholder="Search bookings..."
              />
              <div className="flex items-center gap-4 self-end">
                <div className="flex flex-wrap gap-2">
                  <BookingStatusFilter
                    selectedStatuses={statusFilters}
                    onStatusChange={handleStatusChange}
                  />
                  <DateRangeFilter
                    dateFilter={dateFilter}
                    onDateChange={handleDateChange}
                  />
                  <BookingSortDropdown
                    options={sortOptions}
                    currentSort={sorting}
                    onSort={handleSort}
                  />
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    disabled={filteredBookings.length === 0}
                  >
                    <Download size={16} />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Destination Filter */}
          <div className="mb-4">
            <div className="max-w-xs">
              <label htmlFor="destinationFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Destination
              </label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="destinationFilter"
                  value={destinationFilter}
                  onChange={handleDestinationFilter}
                  placeholder="Enter destination"
                  className="pl-9 pr-3 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 text-sm"
                />
                {destinationFilter && (
                  <button 
                    onClick={() => setDestinationFilter("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {statusFilters.length > 0 && (
                  <div className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs flex items-center">
                    <span>Status: {statusFilters.length} selected</span>
                    <button 
                      onClick={() => setStatusFilters([])} 
                      className="ml-1 text-sky-500 hover:text-sky-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {(dateFilter.startDate || dateFilter.endDate) && (
                  <div className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>
                      {dateFilter.startDate ? formatDate(dateFilter.startDate) : '...'}
                      {dateFilter.endDate ? ` - ${formatDate(dateFilter.endDate)}` : ''}
                    </span>
                    <button 
                      onClick={() => setDateFilter({ startDate: null, endDate: null })} 
                      className="ml-1 text-sky-500 hover:text-sky-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {destinationFilter && (
                  <div className="bg-sky-100 text-sky-800 px-2 py-1 rounded-full text-xs flex items-center">
                    <MapPin size={14} className="mr-1" />
                    <span>Destination: {destinationFilter}</span>
                    <button 
                      onClick={() => setDestinationFilter("")} 
                      className="ml-1 text-sky-500 hover:text-sky-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <button 
                  onClick={clearAllFilters}
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
              <p className="text-gray-600">Loading transport bookings...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 p-4 rounded-md text-red-800 mt-4">
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && transportBookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
                <Car size={32} className="text-sky-300" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-sky-800">No Transport Bookings Found</h3>
            <p className="text-gray-500 mb-6">No transport bookings have been created yet.</p>
            <FormModal table="room-booking" type="create" />
          </div>
        )}

        {/* No Results After Filtering */}
        {!loading && !error && transportBookings.length > 0 && filteredBookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
                <FilterIcon size={32} className="text-sky-300" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-sky-800">No Matching Bookings</h3>
            <p className="text-gray-500 mb-6">No transport bookings match your current search or filters.</p>
            <button 
              onClick={clearAllFilters}
              className="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors flex items-center mx-auto"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Data table */}
        {!loading && !error && filteredBookings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 overflow-hidden">
            <div className="p-4">
              <div className="text-xs text-gray-500 mb-2">
                Showing {filteredBookings.length} of {transportBookings.length} transport bookings
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-100">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Transport</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">PIC</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">User Email</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Agenda</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Start Time</th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">End Time</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Destination</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sky-100">
                    {filteredBookings.map((item) => (
                      <tr key={item.booking_id} className="hover:bg-sky-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-800">#{item.booking_id}</td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-16 w-16 mr-4">
                              <TransportImage 
                                image={item.transport?.image}
                                alt={item.transport?.vehicle_name || 'Transport Image'}
                                className="w-full h-full rounded-lg object-cover"
                                fallbackIcon={
                                  <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                                    <Car size={24} className="text-gray-400" />
                                  </div>
                                }
                              />
                            </div>
                            <div className="flex flex-col justify-center">
                              <div className="text-sm font-medium text-sky-800">
                                {item.transport?.vehicle_name || `Transport ${item.transport_id}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.transport?.driver_name ? `Driver: ${item.transport.driver_name}` : 'No driver assigned'}
                              </div>
                              {item.transport?.capacity && (
                                <div className="text-xs text-gray-500">
                                  Capacity: {item.transport.capacity}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-sky-800">{item.pic}</div>
                          <div className="text-xs text-gray-500">{item.section}</div>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">
                          {item.user?.email || 'N/A'}
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{item.agenda}</td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{formatTime(item.start_time)}</td>
                        <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{formatTime(item.end_time)}</td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-sky-800">{item.destination}</td>
                        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status, item)}`}>
                            {getStatusIcon(item.status, item)}
                            {getDisplayStatus(item)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/list/transport-bookings/${item.booking_id}`}
                              className="text-sky-600 hover:text-sky-900"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => {
                                setBookingToDelete(item.booking_id);
                                setShowDeleteConfirm(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
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
                  Are you sure you want to delete this transport booking? This action cannot be undone and all associated data will be permanently removed.
                </p>
                
                {bookingToDelete && 
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Car size={24} className="text-sky-500" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-sky-800">
                          Transport Booking #{bookingToDelete}
                        </h3>
                        <div className="text-sm text-gray-500 flex flex-col gap-1 mt-1">
                          <p>{transportBookings.find(booking => booking.booking_id === bookingToDelete)?.agenda || 'Unknown Booking'}</p>
                          {transportBookings.find(booking => booking.booking_id === bookingToDelete)?.destination && (
                            <div className="flex items-center text-xs">
                              <MapPin size={12} className="mr-1" />
                              {transportBookings.find(booking => booking.booking_id === bookingToDelete)?.destination}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                }
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setBookingToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteBooking}
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
                        Delete Booking
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

export default TransportBookingListPage;