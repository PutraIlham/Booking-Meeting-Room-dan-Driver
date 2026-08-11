
"use client";

import React, { useEffect, useState } from "react";
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
  Eye, Trash2, CalendarDays, BedDouble, 
  Filter as FilterIcon, X, Clock, CheckCircle, XCircle, Building,
  Download
} from "lucide-react";
import { exportToExcel, formatDateForExcel, formatTimeForExcel } from "@/utils/excelExport";
import { apiClient, endpoints } from "@/lib/api-client";

type RoomBooking = {
  booking_id: number;
  user_id: number;
  room_id: number;
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
  user?: {
    email: string;
  };
  room?: {
    room_name: string;
    image?: string;
    floor: string;
    capacity: string;
  };
};

type SortDirection = 'asc' | 'desc';

type DateFilter = {
  startDate: string | null;
  endDate: string | null;
};

const columns = [
  {
    header: "Booking ID",
    accessor: "booking_id",
  },
  {
    header: "Room",
    accessor: "room",
    className: "hidden md:table-cell",
  },
  {
    header: "PIC",
    accessor: "pic",
  },
  {
    header: "User Email",
    accessor: "user.email",
    className: "hidden md:table-cell",
  },
  {
    header: "Agenda",
    accessor: "agenda",
    className: "hidden md:table-cell",
  },
  {
    header: "Start Time",
    accessor: "start_time",
    className: "hidden md:table-cell",
  },
  {
    header: "End Time",
    accessor: "end_time",
    className: "hidden lg:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "action",
  },
];

const RoomBookingListPage = () => {
  const router = useRouter();
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>("Checking...");

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ startDate: null, endDate: null });
  const [sorting, setSorting] = useState<{ field: string; direction: SortDirection } | null>(null);
  const [filteredBookings, setFilteredBookings] = useState<RoomBooking[]>([]);

  // Sort options
  const sortOptions = [
    { id: "booking_id", label: "Booking ID" },
    { id: "booking_date", label: "Booking Date" },
    { id: "agenda", label: "Agenda" },
    { id: "start_time", label: "Start Time" },
    { id: "status", label: "Status" }
  ];

  // Check authentication status
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("adminToken") : null;
    if (!token) {
      console.log("No admin token found, redirecting to login");
      router.push("/sign-in");
      setAuthStatus("No token found");
      return;
    }
    setAuthStatus(`Token found (${token.substring(0, 10)}...)`);
  }, [router]);

  // Apply search, filters, and sorting
  useEffect(() => {
    applyFiltersAndSort();
  }, [roomBookings, searchText, statusFilters, dateFilter, sorting]);

  // Fetch data on component mount
  useEffect(() => {
    fetchRoomBookings();
  }, []);

  // Apply all filters and sorting
  const applyFiltersAndSort = () => {
    let result = [...roomBookings];
    
    console.log("🔍 Applying filters to", result.length, "bookings");
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(booking => 
        booking.booking_id.toString().includes(searchLower) ||
        booking.agenda.toLowerCase().includes(searchLower) ||
        booking.pic.toLowerCase().includes(searchLower) ||
        booking.section.toLowerCase().includes(searchLower) ||
        booking.room_id.toString().includes(searchLower)
      );
      console.log("🔍 After search filter:", result.length, "bookings");
    }
    
    // Apply status filter
    if (statusFilters.length > 0) {
      result = result.filter(booking => 
        statusFilters.includes(booking.status.toLowerCase())
      );
      console.log("🔍 After status filter:", result.length, "bookings");
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
      console.log("🔍 After date filter:", result.length, "bookings");
    }
    
    // Apply sorting
    if (sorting) {
      result.sort((a, b) => {
        let valueA: any = sorting.field === 'user.email' ? a.user?.email : a[sorting.field as keyof RoomBooking];
        let valueB: any = sorting.field === 'user.email' ? b.user?.email : b[sorting.field as keyof RoomBooking];
        
        // Special handling for dates and times
        if (sorting.field === 'booking_date') {
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
    
    console.log("✅ Final filtered bookings:", result.length);
    setFilteredBookings(result);
  };

  const fetchRoomBookings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🚀 Starting to fetch room bookings...");
      
      // Method 1: Try to fetch bookings directly first
      console.log("📡 Fetching bookings from:", endpoints.bookings?.room || 'undefined endpoint');
      
      let bookingsResponse;
      try {
        // Try different API endpoints/methods
        if (endpoints.bookings?.room) {
          bookingsResponse = await apiClient.get(endpoints.bookings.room);
        } else if (endpoints.bookings) {
          bookingsResponse = await apiClient.get(endpoints.bookings);
        } else {
          // Fallback endpoint
          bookingsResponse = await apiClient.get('/api/bookings/room');
        }
        
        console.log("📋 Raw bookings response:", bookingsResponse);
        console.log("📋 Bookings data:", bookingsResponse.data);
        
      } catch (bookingError: any) {
        console.error("❌ Error fetching bookings:", bookingError);
        console.log("📡 Response status:", bookingError.response?.status);
        console.log("📡 Response data:", bookingError.response?.data);
        
        // Try alternative endpoint structure
        try {
          bookingsResponse = await apiClient.get('/room-bookings');
        } catch (altError) {
          throw bookingError; // Use original error
        }
      }

      // Method 2: Fetch rooms data (if needed)
      let roomsData = [];
      try {
        console.log("🏢 Fetching rooms from:", endpoints.rooms || 'undefined endpoint');
        const roomsResponse = await apiClient.get(endpoints.rooms || '/api/rooms');
        roomsData = roomsResponse.data.data || roomsResponse.data || [];
        console.log("🏢 Rooms data:", roomsData);
      } catch (roomError) {
        console.warn("⚠️ Could not fetch rooms data:", roomError);
        // Continue without rooms data
      }

      // Create rooms mapping
      const roomsMap = new Map(
        roomsData.map((room: any) => [
          room.room_id,
          {
            room_id: room.room_id,
            room_name: room.room_name || room.name || `Room ${room.room_id}`,
            image: room.image,
            floor: room.floor,
            capacity: room.capacity
          }
        ])
      );

      // Process bookings data
      const responseData = bookingsResponse.data.data || bookingsResponse.data || [];
      console.log("📊 Processing", responseData.length, "bookings");
      
  

      // Transform the data
      const transformedData = responseData.map((booking: any, index: number) => {
        console.log(`🔄 Processing booking ${index + 1}:`, booking);
        
        const transformed = {
          booking_id: booking.booking_id || booking.id,
          user_id: booking.user_id,
          room_id: booking.room_id,
          booking_date: booking.booking_date || booking.date,
          agenda: booking.agenda || booking.title || 'No agenda',
          start_time: booking.start_time,
          end_time: booking.end_time,
          pic: booking.pic || booking.person_in_charge || 'Unknown',
          section: booking.section || booking.department || 'Unknown',
          description: booking.description,
          status: booking.status || 'pending',
          notes: booking.notes,
          approver_id: booking.approver_id,
          approved_at: booking.approved_at,
          // Handle user data
          user: booking.user || (booking.user_email ? { email: booking.user_email } : { email: 'Unknown' }),
          // Handle room data
          room: booking.room || roomsMap.get(booking.room_id) || {
            room_id: booking.room_id,
            room_name: booking.room_name || `Room ${booking.room_id}`,
            floor: booking.floor || 'N/A',
            capacity: booking.capacity || 'N/A'
          }
        };
        
        console.log(`✅ Transformed booking ${index + 1}:`, transformed);
        return transformed;
      });
      
      console.log("🎉 Successfully processed", transformedData.length, "bookings");
      setRoomBookings(transformedData);
      setAuthStatus("Authenticated and data loaded");
      
      
    } catch (error: any) {
      console.error("💥 Error in fetchRoomBookings:", error);
      
      if (error.response?.status === 401) {
        setAuthStatus("Authentication failed (401) - token may be invalid");
        if (typeof window !== 'undefined') {
          localStorage.removeItem("adminToken");
        }
        router.push("/sign-in");
        return;
      }
      
      const errorMessage = error.response?.data?.message || 
        error.message ||
        "Unable to load room bookings. Please try again later.";
      
      setError(errorMessage);
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

  // Handle sorting changes
  const handleSort = (field: string, direction: SortDirection) => {
    setSorting({ field, direction });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText("");
    setStatusFilters([]);
    setDateFilter({ startDate: null, endDate: null });
    setSorting(null);
  };

  // Format time to 12-hour format
  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle delete booking
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    
    setIsDeleting(true);
    
    try {
      await apiClient.delete(`${endpoints.bookings.room}/${bookingToDelete}`);
      
      // Remove the deleted booking from state
      setRoomBookings(prevBookings => 
        prevBookings.filter(booking => booking.booking_id !== bookingToDelete)
      );
      
      // Close modal
      setShowDeleteConfirm(false);
      setBookingToDelete(null);
      
      // Show success alert
      setAlertType('success');
      setAlertMessage('Room booking has been successfully deleted.');
      
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      const errorMessage = error.response?.data?.message || 
        "Unable to delete the room booking. Please try again later.";
      
      setError(errorMessage);
      
      // Show error alert
      setAlertType('error');
      setAlertMessage(errorMessage);
      
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem("adminToken");
        }
        router.push("/sign-in");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Get appropriate badge color based on status
  const getStatusColor = (status: string, booking: RoomBooking) => {
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
  const getStatusIcon = (status: string, booking: RoomBooking) => {
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
  const checkIfExpired = (booking: RoomBooking) => {
    if (!booking || !booking.booking_date || !booking.end_time) return false;
    
    const now = new Date();
    const bookingDate = new Date(booking.booking_date);
    const [endHours, endMinutes] = booking.end_time.split(':');
    bookingDate.setHours(parseInt(endHours), parseInt(endMinutes));
    
    return now > bookingDate;
  };

  // Get display status
  const getDisplayStatus = (booking: RoomBooking) => {
    if (!booking) return "Unknown";
    
    if (booking.status.toLowerCase() === 'pending' && checkIfExpired(booking)) {
      return "Expired";
    }
    
    return booking.status;
  };

  // Calculate active filters count
  const activeFilterCount = (statusFilters.length > 0 ? 1 : 0) + 
                           ((dateFilter.startDate || dateFilter.endDate) ? 1 : 0);

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
      'Room ID': booking.room_id,
      'Status': getDisplayStatus(booking),
      'Description': booking.description || '',
      'Notes': booking.notes || ''
    }));

    exportToExcel(exportData, `room-bookings-${new Date().toISOString().split('T')[0]}`);
  };

  const renderRow = (item: RoomBooking) => {
    console.log("Rendering row with data:", item);
    
    return (
      <tr
        key={item.booking_id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4">#{item.booking_id}</td>
        <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
          <div className="flex items-start">
            {item.room?.image ? (
              <div className="flex-shrink-0 h-16 w-16 mr-4">
                <Image
                  src={item.room.image}
                  alt={item.room?.room_name || `Room ${item.room_id}`}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 h-16 w-16 mr-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building size={32} className="text-gray-400" />
              </div>
            )}
            <div className="flex flex-col justify-center">
              <div className="text-sm font-medium text-sky-800">
                {item.room?.room_name || `Room ${item.room_id}`}
              </div>
              {item.room?.floor && (
                <div className="text-xs text-gray-500">
                  Floor: {item.room.floor}
                </div>
              )}
              {item.room?.capacity && (
                <div className="text-xs text-gray-500">
                  Capacity: {item.room.capacity}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-col">
            <span className="font-medium text-sky-800">{item.pic}</span>
            <span className="text-xs text-gray-500">{item.section}</span>
          </div>
        </td>
        <td className="hidden md:table-cell p-4 text-sky-800">{item.user?.email || 'N/A'}</td>
        <td className="hidden md:table-cell p-4 text-sky-800">{item.agenda}</td>
        <td className="hidden md:table-cell p-4 text-sky-800">{formatTime(item.start_time)}</td>
        <td className="hidden lg:table-cell p-4 text-sky-800">{formatTime(item.end_time)}</td>
        <td className="hidden md:table-cell p-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getStatusColor(item.status, item)}`}>
            {getStatusIcon(item.status, item)}
            {getDisplayStatus(item)}
          </span>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-2">
            <Link href={`/list/room-bookings/${item.booking_id}`}>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {alertMessage && (
        <AlertMessage 
          type={alertType} 
          message={alertMessage} 
          onClose={() => setAlertMessage(null)} 
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TOP */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold text-sky-800 flex items-center">
              <Building size={20} className="mr-2 text-sky-500" />
              Room Bookings
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
                    <span>
                      Date: {dateFilter.startDate ? formatDate(dateFilter.startDate) : '...'}
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
              <p className="text-gray-600">Loading room bookings...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 p-4 rounded-md text-red-800 mt-4">
            <h3 className="font-bold mb-2">Error</h3>
            <p>{error}</p>
            <button 
              onClick={fetchRoomBookings}
              className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && roomBookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
                <CalendarDays size={32} className="text-sky-300" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-sky-800">No Room Bookings Found</h3>
            <p className="text-gray-500 mb-6">No room bookings have been created yet.</p>
            <FormModal table="room-booking" type="create" />
          </div>
        )}

        {/* No Results After Filtering */}
        {!loading && !error && roomBookings.length > 0 && filteredBookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-sky-100 p-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-sky-50 rounded-xl flex items-center justify-center">
                <FilterIcon size={32} className="text-sky-300" />
              </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-sky-800">No Matching Bookings</h3>
            <p className="text-gray-500 mb-6">No room bookings match your current search or filters.</p>
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
                Showing {filteredBookings.length} of {roomBookings.length} room bookings
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-100">
                  <thead className="bg-sky-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">PIC</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">User Email</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Agenda</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Start Time</th>
                      <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">End Time</th>
                      <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sky-100">
                    {filteredBookings.map((item) => renderRow(item))}
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
                  Are you sure you want to delete this room booking? This action cannot be undone and all associated data will be permanently removed.
                </p>
                
                {bookingToDelete && 
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center">
                        <Building size={24} className="text-sky-500" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-sky-800">
                          Room Booking #{bookingToDelete}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {roomBookings.find(booking => booking.booking_id === bookingToDelete)?.agenda || 'Unknown Booking'}
                        </p>
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

export default RoomBookingListPage;