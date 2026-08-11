"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import FormModal from "@/components/FormModal";
import { role } from "@/lib/data";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { 
  Building, Edit, Trash2, CheckCircle, XCircle, ArrowLeft,
  CalendarDays, Clock, User, Users, FileText, AlertCircle, 
  CheckCheck, Home, MessageSquare
} from "lucide-react";
import Image from "next/image";

const SingleRoomBookingPage = () => {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [notes, setNotes] = useState("");

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
      headers: { Authorization: `Bearer ${token}` }
    });
  };

  // Format date to more readable format
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time to 12-hour format
  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get appropriate status style with orange and sky theme
  const getStatusStyle = (status) => {
    if (!status) return {
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-200",
      icon: <AlertCircle size={14} />
    };
    
    // Check if booking is expired
    const isExpired = checkIfExpired(booking);
    if (isExpired) {
      return {
        bg: "bg-gray-100",
        text: "text-gray-500",
        border: "border-gray-200",
        icon: <Clock size={14} />
      };
    }
    
    switch (status.toLowerCase()) {
      case 'approved':
        return {
          bg: "bg-green-50",
          text: "text-green-600",
          border: "border-green-100",
          icon: <CheckCheck size={14} />
        };
      case 'rejected':
        return {
          bg: "bg-red-50",
          text: "text-red-600",
          border: "border-red-100",
          icon: <XCircle size={14} />
        };
      case 'pending':
        return {
          bg: "bg-orange-50",
          text: "text-orange-600",
          border: "border-orange-100",
          icon: <Clock size={14} />
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
          icon: <AlertCircle size={14} />
        };
    }
  };

  // Function to check if booking is expired
  const checkIfExpired = (booking) => {
    if (!booking) return false;
    
    const now = new Date();
    const bookingDate = new Date(booking.booking_date);
    const [endHours, endMinutes] = booking.end_time.split(':');
    bookingDate.setHours(parseInt(endHours), parseInt(endMinutes));
    
    return now > bookingDate;
  };

  // Get display status
  const getDisplayStatus = (booking) => {
    if (!booking) return "Unknown";
    
    if (booking.status.toLowerCase() === 'pending' && checkIfExpired(booking)) {
      return "Expired";
    }
    
    return booking.status;
  };

  // Fetch room booking data
  const fetchBookingData = async () => {
    setLoading(true);
    setError(null);
    
    const apiClient = createApiClient();
    if (!apiClient) return;
    
    try {
      // First, fetch all rooms to ensure we have the data
      const roomsResponse = await apiClient.get("/rooms");
      const roomsMap = new Map(
        roomsResponse.data.map((room: any) => [
          room.room_id,
          {
            room_id: room.room_id,
            room_name: room.room_name,
            image: room.image,
            capacity: room.capacity,
            room_type: room.room_type
          }
        ])
      );

      // Then fetch booking with its relations
      const response = await apiClient.get(`/room-bookings/${bookingId}`, {
        params: {
          include: 'room,user',
          populate: {
            room: true,
            user: true
          }
        }
      });

      // Get room data from our map
      const roomData = roomsMap.get(response.data.room_id) || {
        room_id: response.data.room_id,
        room_name: `Room #${response.data.room_id}`,
        image: null,
        capacity: 'Not specified',
        room_type: 'Not specified'
      };

      // Combine booking data with room data
      const bookingData = {
        ...response.data,
        room: roomData,
        user: response.data.user || null
      };

      setBooking(bookingData);
    } catch (err) {
      console.error("Error fetching room booking:", err);
      
      // Check for unauthorized error
      if (err.response?.status === 401) {
        localStorage.removeItem("adminToken");
        router.push("/sign-in");
        return;
      }
      
      setError(
        err.response?.data?.message || 
        "Unable to load room booking information. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Update booking status
  const updateBookingStatus = async (newStatus) => {
    setStatusLoading(true);
    setStatusMessage(null);
    
    const apiClient = createApiClient();
    if (!apiClient) return;
  
    try {
      const adminInfo = localStorage.getItem("adminInfo");
      let approver_id = null;
  
      if (adminInfo) {
        try {
          const adminData = JSON.parse(adminInfo);
          approver_id = adminData.id || null;
        } catch (e) {
          console.error("Error parsing admin info:", e);
        }
      }
  
      // Prepare the booking update data
      const updateData = {
        status: newStatus,
        approver_id: approver_id,
        approved_at: new Date().toISOString(),
        notes: notes
      };
  
      console.log(`Sending update request for booking ${bookingId} with status ${newStatus}`);
  
      // Update booking status
      const response = await apiClient.put(`/room-bookings/${bookingId}`, updateData);
  
      // Check response
      if (response.status === 200) {
        setStatusMessage({
          type: 'success',
          text: `Booking has been ${newStatus.toLowerCase()} successfully.${
            response.data.emailSent ? ' Notification email sent.' : ''
          }`
        });
  
        fetchBookingData(); // Refresh booking data
        setNotes(""); // Clear notes after successful update
      } else {
        setStatusMessage({
          type: 'error',
          text: `Failed to update booking. Server responded with status ${response.status}.`
        });
      }
    } catch (err) {
      console.error(`Error ${newStatus.toLowerCase()} booking:`, err);
      
      // Extract detailed error message if available
      const errorMessage = err.response?.data?.error || 
                           err.response?.data?.message || 
                           `Failed to ${newStatus.toLowerCase()} booking. Please try again.`;
      
      setStatusMessage({
        type: 'error',
        text: errorMessage
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle approve booking
  const handleApprove = () => {
    updateBookingStatus('approved');
  };
  
  // Handle reject booking
  const handleReject = () => {
    updateBookingStatus('rejected');
  };

  // Initial data fetch
  useEffect(() => {
    if (bookingId) {
      fetchBookingData();
    }
  }, [bookingId, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-sky-500 animate-spin"></div>
          <div className="mt-4 text-sky-500 font-medium text-center">Loading</div>
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
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unable to Load Booking</h3>
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

  // No booking found
  if (!booking) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-8">
            <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-amber-500" />
            </div>
          </div>
          <div className="p-8 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Booking Not Found</h3>
            <p className="text-gray-600 mb-6">The requested booking could not be found or may have been deleted.</p>
            <button 
              onClick={() => router.push("/list/room-bookings")}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center mx-auto"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Room Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(booking.status);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Status message */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-xl ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <div className="flex items-center">
              {statusMessage.type === 'success' ? (
                <CheckCircle size={20} className="mr-2 flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              )}
              <p>{statusMessage.text}</p>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main info */}
          <div className="md:col-span-8">
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 mb-6">
              {/* Header */}
              <div className="bg-gradient-to-r from-sky-400 to-sky-500 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Building size={24} />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-2xl font-bold">{booking.room?.room_name || `Room #${booking.room_id}`}</h2>
                      <div className="mt-1 text-sky-50 flex items-center text-sm">
                        <CalendarDays size={14} className="mr-1.5" />
                        <span>{formatDate(booking.booking_date)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`${statusStyle.bg} ${statusStyle.text} px-4 py-2 rounded-xl text-sm font-medium flex items-center`}>
                    {statusStyle.icon}
                    <span className="ml-2">{getDisplayStatus(booking)}</span>
                  </span>
                </div>
              </div>
              
              {/* Booking Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Room & Time Info */}
                  <div className="space-y-6">
                    {/* Room Details */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-4 bg-sky-50 border-b border-gray-200">
                        <h3 className="font-semibold text-sky-900 flex items-center">
                          <Building size={18} className="mr-2" />
                          Room Information
                        </h3>
                      </div>
                      <div className="p-4">
                        {booking.room?.image ? (
                          <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4">
                            <Image
                              src={booking.room.image}
                              alt={booking.room.room_name || "Room"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                            <Building size={48} className="text-gray-400" />
                          </div>
                        )}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Room Name:</span>
                            <span className="text-sm text-gray-900">{booking.room?.room_name || "Not specified"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Room Type:</span>
                            <span className="text-sm text-gray-900">{booking.room?.room_type || "Not specified"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Capacity:</span>
                            <span className="text-sm text-gray-900">{booking.room?.capacity || "Not specified"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time Details */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-4 bg-sky-50 border-b border-gray-200">
                        <h3 className="font-semibold text-sky-900 flex items-center">
                          <Clock size={18} className="mr-2" />
                          Time Information
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Date:</span>
                          <span className="text-sm text-gray-900">{formatDate(booking.booking_date)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Start Time:</span>
                          <span className="text-sm text-gray-900">{formatTime(booking.start_time)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">End Time:</span>
                          <span className="text-sm text-gray-900">{formatTime(booking.end_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Booking & User Info */}
                  <div className="space-y-6">
                    {/* Booking Details */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-4 bg-sky-50 border-b border-gray-200">
                        <h3 className="font-semibold text-sky-900 flex items-center">
                          <FileText size={18} className="mr-2" />
                          Booking Information
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Booking ID:</span>
                          <span className="text-sm text-gray-900">#{booking.booking_id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Status:</span>
                          <span className={`text-sm px-2 py-1 rounded-full ${getStatusStyle(booking.status).bg} ${getStatusStyle(booking.status).text}`}>
                            {getDisplayStatus(booking)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">PIC:</span>
                          <span className="text-sm text-gray-900">{booking.pic}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Section:</span>
                          <span className="text-sm text-gray-900">{booking.section}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Agenda:</span>
                          <span className="text-sm text-gray-900">{booking.agenda}</span>
                        </div>
                      </div>
                    </div>

                    {/* User Information */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="p-4 bg-sky-50 border-b border-gray-200">
                        <h3 className="font-semibold text-sky-900 flex items-center">
                          <Users size={18} className="mr-2" />
                          User Information
                        </h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">User ID:</span>
                          <span className="text-sm text-gray-900">{booking.user_id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Email:</span>
                          <span className="text-sm text-gray-900">{booking.user?.email || "Not specified"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {(booking.description || booking.notes) && (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-sky-50 border-b border-gray-200">
                          <h3 className="font-semibold text-sky-900 flex items-center">
                            <MessageSquare size={18} className="mr-2" />
                            Additional Information
                          </h3>
                        </div>
                        <div className="p-4 space-y-3">
                          {booking.description && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-1">Description:</span>
                              <p className="text-sm text-gray-900">{booking.description}</p>
                            </div>
                          )}
                          {booking.notes && (
                            <div>
                              <span className="text-sm font-medium text-gray-600 block mb-1">Notes:</span>
                              <p className="text-sm text-gray-900">{booking.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions Column */}
          <div className="md:col-span-4">
            {/* Admin actions card */}
            {role === "admin" && (
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100 mb-6">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Actions</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {booking.status === "pending" && !checkIfExpired(booking) && (
                      <>
                        <div className="mb-4">
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                            Notes (optional)
                          </label>
                          <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes or comments for this booking..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                            rows={3}
                          />
                        </div>
                        <button 
                          onClick={handleApprove}
                          disabled={statusLoading}
                          className="w-full py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {statusLoading ? (
                            <>
                              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} className="mr-2" />
                              Approve Booking
                            </>
                          )}
                        </button>
                        <button 
                          onClick={handleReject}
                          disabled={statusLoading}
                          className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {statusLoading ? (
                            <>
                              <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <XCircle size={18} className="mr-2" />
                              Reject Booking
                            </>
                          )}
                        </button>
                      </>
                    )}
                    {(booking.status !== "pending" || checkIfExpired(booking)) && (
                      <div className={`${booking.status === 'approved' ? 'bg-green-50 text-green-700' : booking.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'} p-3 rounded-xl text-center`}>
                        {checkIfExpired(booking) ? 'This booking has expired' : `This booking has been ${booking.status.toLowerCase()}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Navigation links */}
            <div>
              <Link 
                href="/list/room-bookings" 
                className="flex items-center text-sky-500 hover:text-sky-600 font-medium transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to Room Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleRoomBookingPage;