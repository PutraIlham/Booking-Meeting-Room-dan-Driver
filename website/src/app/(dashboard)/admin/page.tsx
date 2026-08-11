"use client";

import React, { useState, useEffect } from 'react';
import axios from "axios";
import {
  Building, Users, Car, CalendarDays, Clock, 
  ArrowUp, ArrowDown, CheckCircle, XCircle, AlertCircle, 
  PieChart, Calendar, Layers, Activity, CheckCheck, User,
  Filter, Info, MapPin, Clock3, X
} from 'lucide-react';
import { Calendar as BigCalendar, momentLocalizer, View as CalendarView } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();


// Custom CSS to override calendar styles - add this after the import
const calendarStyles = `
  .rbc-calendar {
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  
  .rbc-header {
    padding: 10px 3px;
    font-weight: 500;
    font-size: 13px;
    color: #0369a1;
    background-color: #f0f9ff;
  }
  
  .rbc-month-view {
    border: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .rbc-month-row {
    overflow: visible;
  }
  
  .rbc-day-bg {
    transition: background-color 0.2s ease;
  }
  
  .rbc-day-bg:hover {
    background-color: #f8fafc;
  }
  
  .rbc-off-range-bg {
    background-color: #f8fafc;
  }
  
  .rbc-today {
    background-color: #f0f9ff !important;
  }
  
  .rbc-event {
    transition: transform 0.1s ease, box-shadow 0.1s ease;
  }
  
  .rbc-event:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0,0,0,0.1);
  }
  
  .rbc-date-cell {
    padding: 4px 5px 0;
    font-size: 13px;
    text-align: center;
  }
  
  .rbc-button-link {
    font-weight: 500;
    color: #334155;
  }
  
  .rbc-show-more {
    font-size: 11px;
    font-weight: 500;
    color: #0284c7;
    background-color: transparent;
    padding: 1px 5px;
  }
  
  .rbc-day-slot .rbc-event {
    border: none;
  }
  
  .rbc-time-view {
    border-radius: 8px;
    overflow: hidden;
    border: none;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  
  .rbc-time-header {
    border-bottom: 1px solid #e2e8f0;
  }
  
  .rbc-timeslot-group {
    border-bottom: 1px solid #f1f5f9;
  }
  
  .rbc-event-label {
    font-size: 11px;
  }
  
  .rbc-event-content {
    font-size: 12px;
  }
  
  .rbc-agenda-view table.rbc-agenda-table {
    border: none;
    border-spacing: 0;
    border-collapse: separate;
  }
  
  .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
    padding: 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .rbc-agenda-view table.rbc-agenda-table .rbc-agenda-time-cell {
    padding-left: 15px;
    color: #0369a1;
  }
  
  .rbc-toolbar button {
    color: #0369a1;
  }
  
  .rbc-toolbar button.rbc-active {
    background-color: #0ea5e9;
    color: white;
  }
  
  /* Enhanced status-specific event styling */
  .event-pending {
    background-color: #bfdbfe !important; /* blue-200 */
    color: #1e40af !important; /* blue-800 */
    border-left: 3px solid #3b82f6 !important; /* blue-500 */
  }
  
  .event-approved {
    background-color: #bbf7d0 !important; /* green-200 */
    color: #166534 !important; /* green-800 */
    border-left: 3px solid #22c55e !important; /* green-500 */
  }
  
  .event-rejected {
    background-color: #fecaca !important; /* red-200 */
    color: #991b1b !important; /* red-800 */
    border-left: 3px solid #ef4444 !important; /* red-500 */
  }
  
  .event-cancelled {
    background-color: #e5e7eb !important; /* gray-200 */
    color: #1f2937 !important; /* gray-800 */
    border-left: 3px solid #6b7280 !important; /* gray-500 */
  }
  
  .event-room {
    background-color: #e0f2fe !important; /* sky-100 */
    color: #0369a1 !important; /* sky-700 */
    border-left: 3px solid #0ea5e9 !important; /* sky-500 */
  }
  
  .event-transport {
    background-color: #bae6fd !important; /* sky-200 */
    color: #0c4a6e !important; /* sky-900 */
    border-left: 3px solid #0284c7 !important; /* sky-600 */
  }
  
  .event-current {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important; /* blue-500 with transparency */
    animation: pulse 2s infinite;
  }
  
  .event-expired {
    background-color: #f3f4f6 !important; /* gray-100 */
    color: #4b5563 !important; /* gray-600 */
    border-left: 3px solid #9ca3af !important; /* gray-400 */
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
    }
    70% {
      box-shadow: 0 0 0 5px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }
`;

// Set up the localizer for the calendar
const localizer = momentLocalizer(moment);

// Add these interfaces at the top of the file, after the imports
interface Room {
  id: number;
  room_id?: number;
  name: string;
  room_name?: string;
  type: string;
  room_type?: string;
  capacity?: number;
  facilities?: string[];
  image?: string | null;
  status: string;
}

interface Transport {
  id: number;
  transport_id?: number;
  name: string;
  vehicle_name?: string;
  driver_name: string;
  driver?: string;
  capacity?: number;
  image?: string | null;
  status: string;
}

interface RoomBooking {
  id?: number;
  booking_id?: number;
  room_id?: number;
  room?: Room;
  room_details?: Room | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  pic: string;
  purpose?: string;
  section?: string;
}

interface TransportBooking {
  id?: number;
  booking_id?: number;
  transport_id?: number;
  transport?: Transport;
  transport_details?: Transport | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  destination?: string;
  driver_name?: string;
  section?: string;
}

// Add CalendarEvent interface
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: 'room' | 'transport';
    status: string;
    timeStatus: string;
    details: RoomBooking | TransportBooking;
    personName?: string;
  };
}

// Update View type to match react-big-calendar
type View = CalendarView;

const DashboardPage = () => {
  // Add the custom styles to the document
  useEffect(() => {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.appendChild(document.createTextNode(calendarStyles));
    
    // Append to document head
    document.head.appendChild(styleElement);
    
    // Cleanup on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  const [stats, setStats] = useState({
    roomBookings: { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 },
    transportBookings: { total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 },
    rooms: { total: 0, available: 0 },
    transports: { total: 0, available: 0 }
  });
  
  const [recentRoomBookings, setRecentRoomBookings] = useState<RoomBooking[]>([]);
  const [recentTransportBookings, setRecentTransportBookings] = useState<TransportBooking[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [availableTransports, setAvailableTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'
  const [calendarView, setCalendarView] = useState<View>('month'); // 'month', 'week', 'day'
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showRoomBookings, setShowRoomBookings] = useState(true);
  const [showTransportBookings, setShowTransportBookings] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Format date to more readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  // Format time to 12-hour format
  const formatTime = (timeString: string | undefined | null): string => {
    if (!timeString) return "";
    const timeParts = timeString.split(':').map(part => parseInt(part, 10));
    const date = new Date();
    date.setHours(timeParts[0] || 0);
    date.setMinutes(timeParts[1] || 0);
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Create a custom axios instance
  const createApiClient = () => {
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      console.warn("No admin token found");
      return null;
    }
    
    return {
      baseURL: "http://20.251.153.107:3001/api",
      headers: { Authorization: `Bearer ${token}` }
    };
  };
  // Get appropriate status style with a more subtle design
  const getStatusStyle = (status: string | null) => {
    if (!status) return {
      bg: "bg-gray-50",
      text: "text-gray-600",
      icon: <AlertCircle size={14} />,
      color: "#e5e7eb" // gray-200
    };
    
    switch (status.toLowerCase()) {
      case 'approved':
        return {
          bg: "bg-green-50",
          text: "text-green-600",
          icon: <CheckCheck size={14} />,
          color: "#bbf7d0" // green-200
        };
      case 'rejected':
        return {
          bg: "bg-red-50",
          text: "text-red-600",
          icon: <XCircle size={14} />,
          color: "#fecaca" // red-200
        };
      case 'pending':
        return {
          bg: "bg-blue-50",
          text: "text-blue-600",
          icon: <Clock size={14} />,
          color: "#bfdbfe" // blue-200
        };
      case 'cancelled':
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          icon: <XCircle size={14} />,
          color: "#e5e7eb" // gray-200
        };
      case 'expired':
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          icon: <Clock size={14} />,
          color: "#f3f4f6" // gray-100
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-600",
          icon: <AlertCircle size={14} />,
          color: "#e5e7eb" // gray-200
        };
    }
  };
  // Process bookings into calendar events with improved information
  const processBookingsForCalendar = (roomBookings: RoomBooking[], transportBookings: TransportBooking[]): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const now = new Date();
    
    // Process room bookings
    if (showRoomBookings) {
      roomBookings.forEach(booking => {
        if (booking.booking_date && booking.start_time && booking.end_time) {
          try {
            const bookingDate = new Date(booking.booking_date);
            
            // Parse start time
            const startTimeParts = booking.start_time.split(':').map(part => parseInt(part, 10));
            const startDate = new Date(bookingDate);
            startDate.setHours(startTimeParts[0] || 0, startTimeParts[1] || 0, 0);
            
            // Parse end time
            const endTimeParts = booking.end_time.split(':').map(part => parseInt(part, 10));
            const endDate = new Date(bookingDate);
            endDate.setHours(endTimeParts[0] || 0, endTimeParts[1] || 0, 0);
            
            // Calculate booking status for visual enhancements
            let timeStatus = 'upcoming';
            let bookingStatus = booking.status || 'pending';
            
            if (endDate < now) {
              timeStatus = 'past';
              // If booking is still pending and date has passed, mark as expired
              if (bookingStatus.toLowerCase() === 'pending') {
                bookingStatus = 'expired';
              }
            } else if (startDate <= now && endDate >= now) {
              timeStatus = 'current';
            }
            
            // Create a cleaner title
            const roomName = booking.room_details?.name || booking.room_details?.room_name || `Room ${booking.room_id || booking.room?.id || 'N/A'}`;
            const personName = booking.pic || "Unassigned";
            
            events.push({
              id: `room-${booking.booking_id || booking.id}`,
              title: `${roomName}${timeStatus === 'current' ? ' (In Use)' : ''}`,
              start: startDate,
              end: endDate,
              resource: {
                type: 'room',
                status: bookingStatus,
                timeStatus,
                details: {
                  ...booking,
                  status: bookingStatus // Update the status in details as well
                },
                personName
              }
            });
          } catch (error) {
            console.error("Error processing room booking:", error);
          }
        }
      });
    }
    
    // Process transport bookings
    if (showTransportBookings) {
      transportBookings.forEach(booking => {
        if (booking.booking_date && booking.start_time && booking.end_time) {
          try {
            const bookingDate = new Date(booking.booking_date);
            
            // Parse start time
            const startTimeParts = booking.start_time.split(':').map(part => parseInt(part, 10));
            const startDate = new Date(bookingDate);
            startDate.setHours(startTimeParts[0] || 0, startTimeParts[1] || 0, 0);
            
            // Parse end time
            const endTimeParts = booking.end_time.split(':').map(part => parseInt(part, 10));
            const endDate = new Date(bookingDate);
            endDate.setHours(endTimeParts[0] || 0, endTimeParts[1] || 0, 0);
            
            // Calculate booking status for visual enhancements
            let timeStatus = 'upcoming';
            let bookingStatus = booking.status || 'pending';
            
            if (endDate < now) {
              timeStatus = 'past';
              // If booking is still pending and date has passed, mark as expired
              if (bookingStatus.toLowerCase() === 'pending') {
                bookingStatus = 'expired';
              }
            } else if (startDate <= now && endDate >= now) {
              timeStatus = 'current';
            }
            
            // Create a cleaner title with destination if available
            const vehicleName = booking.transport_details?.name || booking.transport_details?.vehicle_name || `Vehicle ${booking.transport_id || booking.transport?.id || 'N/A'}`;
            const destination = booking.destination ? ` to ${booking.destination}` : '';
            
            events.push({
              id: `transport-${booking.booking_id || booking.id}`,
              title: `${vehicleName}${destination}${timeStatus === 'current' ? ' (In Use)' : ''}`,
              start: startDate,
              end: endDate,
              resource: {
                type: 'transport',
                status: bookingStatus,
                timeStatus,
                details: {
                  ...booking,
                  status: bookingStatus // Update the status in details as well
                }
              }
            });
          } catch (error) {
            console.error("Error processing transport booking:", error);
          }
        }
      });
    }
    
    return events;
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    const apiClient = createApiClient();
    if (!apiClient) {
      setError("No authentication token found");
      setLoading(false);
      return;
    }
    
    try {
      // Fetch room bookings
      const roomBookingsResponse = await axios.get(`${apiClient.baseURL}/room-bookings`, {
        headers: apiClient.headers
      });
      
      // Fetch transport bookings
      const transportBookingsResponse = await axios.get(`${apiClient.baseURL}/transport-bookings`, {
        headers: apiClient.headers
      });
      
      // Fetch rooms
      const roomsResponse = await axios.get(`${apiClient.baseURL}/rooms`, {
        headers: apiClient.headers
      });
      
      // Fetch transports
      const transportsResponse = await axios.get(`${apiClient.baseURL}/transports`, {
        headers: apiClient.headers
      });
      
      // Process room bookings data with proper typing
      const roomBookings = (roomBookingsResponse.data || []) as RoomBooking[];
      const roomStats = {
        total: roomBookings.length,
        pending: roomBookings.filter((booking: RoomBooking) => booking.status?.toLowerCase() === 'pending').length,
        approved: roomBookings.filter((booking: RoomBooking) => booking.status?.toLowerCase() === 'approved').length,
        rejected: roomBookings.filter((booking: RoomBooking) => booking.status?.toLowerCase() === 'rejected').length,
        cancelled: roomBookings.filter((booking: RoomBooking) => booking.status?.toLowerCase() === 'cancelled').length
      };
      
      // Process transport bookings data with proper typing
      const transportBookings = (transportBookingsResponse.data || []) as TransportBooking[];
      const transportStats = {
        total: transportBookings.length,
        pending: transportBookings.filter((booking: TransportBooking) => booking.status?.toLowerCase() === 'pending').length,
        approved: transportBookings.filter((booking: TransportBooking) => booking.status?.toLowerCase() === 'approved').length,
        rejected: transportBookings.filter((booking: TransportBooking) => booking.status?.toLowerCase() === 'rejected').length,
        cancelled: transportBookings.filter((booking: TransportBooking) => booking.status?.toLowerCase() === 'cancelled').length
      };
      
      // Process rooms data with proper typing
      const rooms = (roomsResponse.data || []) as Room[];
      const roomsStats = {
        total: rooms.length,
        available: rooms.filter((room: Room) => room.status?.toLowerCase() === 'available').length || rooms.length
      };
      
      // Process transports data with proper typing
      const transports = (transportsResponse.data || []) as Transport[];
      const transportsStats = {
        total: transports.length,
        available: transports.filter((transport: Transport) => transport.status?.toLowerCase() === 'available').length || transports.length
      };
      
      // Set stats
      setStats({
        roomBookings: roomStats,
        transportBookings: transportStats,
        rooms: roomsStats,
        transports: transportsStats
      });
      
      // Get rooms with proper mapping to match model
      const mappedRooms = rooms.map(room => ({
        id: room.room_id || room.id,
        name: room.room_name || room.name,
        type: room.room_type || room.type,
        capacity: room.capacity,
        facilities: room.facilities ? (typeof room.facilities === 'string' ? room.facilities.split(',').map((f: string) => f.trim()) : Array.isArray(room.facilities) ? room.facilities : []) : [],
        image: room.image || null,
        status: room.status || 'available'
      }));
      // Get transports with proper mapping to match model
      const mappedTransports = transports.map(transport => ({
        id: transport.transport_id || transport.id,
        name: transport.vehicle_name || transport.name,
        driver: transport.driver_name || transport.driver,
        capacity: transport.capacity,
        image: transport.image || null,
        status: transport.status || 'available'
      }));
      
      // Get today's date for filtering today's bookings
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Get recent room bookings (sort by date and take latest 5)
      const sortedRoomBookings = [...roomBookings].sort((a, b) => {
        return new Date(b.booking_date || 0).getTime() - new Date(a.booking_date || 0).getTime();
      });
      
      // Map room booking data to include room details and update expired status
      const enhancedRoomBookings = sortedRoomBookings.slice(0, 5).map(booking => {
        const roomInfo = mappedRooms.find(r => r.id == (booking.room_id || booking.room?.id));
        
        // Check if booking is expired
        const now = new Date();
        const bookingDate = new Date(booking.booking_date);
        const [endHours, endMinutes] = booking.end_time.split(':');
        bookingDate.setHours(parseInt(endHours), parseInt(endMinutes));
        
        // Update status to expired if booking is pending and has passed
        let updatedStatus = booking.status;
        if (booking.status?.toLowerCase() === 'pending' && now > bookingDate) {
          updatedStatus = 'expired';
        }
        
        return {
          ...booking,
          status: updatedStatus,
          room_details: roomInfo || null
        };
      });
      
      setRecentRoomBookings(enhancedRoomBookings);
      
      // Get recent transport bookings (sort by date and take latest 5)
      const sortedTransportBookings = [...transportBookings].sort((a, b) => {
        return new Date(b.booking_date || 0).getTime() - new Date(a.booking_date || 0).getTime();
      });
      
      // Map transport booking data to include transport details and update expired status
      const enhancedTransportBookings = sortedTransportBookings.slice(0, 5).map(booking => {
        const transportInfo = mappedTransports.find(t => t.id == (booking.transport_id || booking.transport?.id));
        
        // Check if booking is expired
        const now = new Date();
        const bookingDate = new Date(booking.booking_date);
        const [endHours, endMinutes] = booking.end_time.split(':');
        bookingDate.setHours(parseInt(endHours), parseInt(endMinutes));
        
        // Update status to expired if booking is pending and has passed
        let updatedStatus = booking.status;
        if (booking.status?.toLowerCase() === 'pending' && now > bookingDate) {
          updatedStatus = 'expired';
        }
        
        return {
          ...booking,
          status: updatedStatus,
          transport_details: transportInfo || null
        };
      });
      
      setRecentTransportBookings(enhancedTransportBookings);
      
      // Get available rooms
      const availableRoomsList = mappedRooms.filter(room => 
        room.status?.toLowerCase() === 'available' || !room.status
      );
      setAvailableRooms(availableRoomsList.slice(0, 5));
      
      // Get available transports
      const availableTransportsList = mappedTransports.filter(transport => 
        transport.status?.toLowerCase() === 'available' || !transport.status
      );
      setAvailableTransports(availableTransportsList.slice(0, 5));
      
      // Process all bookings for calendar
      const enhancedAllRoomBookings = roomBookings.map(booking => {
        const roomInfo = mappedRooms.find(r => r.id == (booking.room_id || booking.room?.id));
        return {
          ...booking,
          room_details: roomInfo || null
        };
      });
      
      const enhancedAllTransportBookings = transportBookings.map(booking => {
        const transportInfo = mappedTransports.find(t => t.id == (booking.transport_id || booking.transport?.id));
        return {
          ...booking,
          transport_details: transportInfo || null
        };
      });
      
      // Set calendar events
      const events = processBookingsForCalendar(enhancedAllRoomBookings, enhancedAllTransportBookings);
      setCalendarEvents(events);
      
    } catch (err: unknown) {
      console.error("Error fetching dashboard data:", err);
      
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response) {
        if (err.response.status === 401) {
          setError("Authentication failed - Please login again");
          localStorage.removeItem("adminToken");
          // You might want to redirect to login page here
          // router.push("/sign-in");
        } else {
          setError("Failed to fetch dashboard data. Please try again later.");
        }
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate approval rate
  const calculateApprovalRate = (data: { total: number; approved: number }): number => {
    if (data.total === 0) return 0;
    return Number(((data.approved / data.total) * 100).toFixed(1));
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update calendar events when filters change
  useEffect(() => {
    if (recentRoomBookings.length > 0 || recentTransportBookings.length > 0) {
      const events = processBookingsForCalendar(recentRoomBookings, recentTransportBookings);
      setCalendarEvents(events);
    }
  }, [showRoomBookings, showTransportBookings]);

  // Custom calendar event styling with class-based approach for better performance
  const eventStyleGetter = (event: CalendarEvent, start: Date, end: Date, isSelected: boolean) => {
    // Base classes to apply
    let className = "";
    
    // Add classes based on status
    if (event.resource && event.resource.status) {
      className += ` event-${event.resource.status.toLowerCase()}`;
    } else {
      // Apply default class based on resource type
      if (event.resource && event.resource.type) {
        className += ` event-${event.resource.type}`;
      }
    }
    
    // Add current/in-use class
    if (event.resource && event.resource.timeStatus === 'current') {
      className += " event-current";
    }
    
    // Base style with common properties
    const style: React.CSSProperties = {
      fontSize: '12px',
      borderRadius: '6px',
      display: 'block',
      padding: '3px 6px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    };
    
    if (isSelected) {
      style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    }
    
    return {
      className,
      style
    };
  };

  // Custom toolbar component for calendar
  interface ToolbarProps {
    date: Date;
    view: View;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
    onView: (view: View) => void;
  }

  const CustomToolbar = (toolbar: ToolbarProps) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };
    
    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };
    
    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };
    
    const label = () => {
      const date = toolbar.date;
      return (
        <span className="text-sky-800 font-medium text-lg">
          {date.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric'
          })}
        </span>
      );
    };
    
    return (
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-4 py-2 space-y-3 md:space-y-0">
        {/* Date navigation controls */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={goToToday}
            className="px-3 py-1.5 bg-white text-sky-600 rounded-md text-sm hover:bg-sky-50 border border-sky-100 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            Today
          </button>
          <div className="flex rounded-md overflow-hidden shadow-sm border border-sky-100">
            <button 
              onClick={goToBack}
              className="p-1.5 bg-white text-sky-600 hover:bg-sky-50 transition-all duration-200 focus:outline-none focus:bg-sky-50"
            >
              <ArrowUp className="rotate-90" size={16} />
            </button>
            <button 
              onClick={goToNext}
              className="p-1.5 bg-white text-sky-600 hover:bg-sky-50 transition-all duration-200 focus:outline-none focus:bg-sky-50 border-l border-sky-100"
            >
              <ArrowDown className="rotate-90" size={16} />
            </button>
          </div>
          <div className="text-base font-medium">{label()}</div>
        </div>
        
        {/* View controls */}
        <div className="flex items-center space-x-3">
          {/* Calendar view options */}
          <div className="inline-flex bg-white rounded-md shadow-sm border border-sky-100 overflow-hidden">
            <button 
              onClick={() => toolbar.onView('week')}
              className={`px-3 py-1.5 text-sm font-medium border-l border-r border-sky-100 transition-all duration-200 ${
                toolbar.view === 'week' 
                  ? 'bg-sky-500 text-white border-sky-500' 
                  : 'text-gray-600 hover:bg-sky-50'
              }`}
            >
              detail
            </button>
          </div>
          
          {/* Resource filters */}
          <div className="inline-flex bg-white rounded-md shadow-sm border border-sky-100 overflow-hidden">
            <button 
              onClick={() => setShowRoomBookings(!showRoomBookings)}
              className={`px-3 py-1.5 text-sm font-medium flex items-center transition-all duration-200 ${
                showRoomBookings 
                  ? 'bg-sky-50 text-sky-600' 
                  : 'text-gray-400 hover:bg-sky-50'
              }`}
            >
              <Building size={16} className="mr-1" />
              Rooms
            </button>
            <button 
              onClick={() => setShowTransportBookings(!showTransportBookings)}
              className={`px-3 py-1.5 text-sm font-medium flex items-center border-l border-sky-100 transition-all duration-200 ${
                showTransportBookings 
                  ? 'bg-sky-50 text-sky-600' 
                  : 'text-gray-400 hover:bg-sky-50'
              }`}
            >
              <Car size={16} className="mr-1" />
              Transport
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add interface for event modal props
  interface EventModalProps {
    event: CalendarEvent;
    onClose: () => void;
  }

  // Update the EventModal component with proper typing
  const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
    const resource = event.resource;
    const details = resource.details;
    
    const getRoomDetails = (details: RoomBooking) => (
      <>
        <div>
          <p className="text-sm text-gray-500">Person in Charge</p>
          <p className="font-medium">{details.pic}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Purpose</p>
          <p className="font-medium">{details.purpose || 'Not specified'}</p>
        </div>
      </>
    );
    
    const getTransportDetails = (details: TransportBooking) => (
      <>
        <div>
          <p className="text-sm text-gray-500">Destination</p>
          <p className="font-medium">{details.destination || 'Not specified'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Driver</p>
          <p className="font-medium">{details.driver_name || 'Not assigned'}</p>
        </div>
      </>
    );
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">{event.title}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-medium">
                {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize">{resource.status}</p>
            </div>
            
            {resource.type === 'room' && getRoomDetails(details as RoomBooking)}
            {resource.type === 'transport' && getTransportDetails(details as TransportBooking)}
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-sky-500 animate-spin"></div>
          <div className="mt-4 text-sky-800 font-medium text-center">Loading Dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8">
        {/* Today's Date */}
        <div className="bg-white rounded-lg shadow-sm border mb-4 border-sky-100 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <Calendar size={20} className="text-sky-500 mr-2" />
                  <h3 className="font-medium text-sky-800">Today</h3>
                </div>
                <p className="text-gray-600 mt-2">
                  {new Date().toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}
                </p>
              </div>
            </div>
        
        {/* Calendar View */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-sky-100">
          <h2 className="text-lg font-medium text-sky-800 mb-4 flex items-center">
            <Calendar size={20} className="mr-2 text-sky-500" />
            Booking Calendar
          </h2>
          
          {/* Calendar container with custom styling */}
          <div className="bg-white rounded-lg overflow-hidden" style={{ height: '650px' }}>
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['month', 'week', 'day'] as View[]}
              defaultView={calendarView}
              onView={(view: View) => setCalendarView(view)}
              defaultDate={calendarDate}
              onNavigate={(date: Date) => setCalendarDate(date)}
              components={{
                toolbar: CustomToolbar as any, // Type assertion needed due to react-big-calendar's type definitions
                event: (props: { event: CalendarEvent }) => {
                  const { event } = props;
                  const resource = event.resource || {};
                  const status = resource.status || 'pending';
                  const timeStatus = resource.timeStatus || 'upcoming';
                  
                  // Get appropriate icon based on booking type and status
                  let Icon = resource.type === 'room' ? Building : Car;
                  if (status === 'pending') Icon = Clock;
                  if (status === 'approved') Icon = CheckCircle;
                  if (status === 'rejected') Icon = XCircle;
                  if (status === 'cancelled') Icon = XCircle;
                  if (status === 'expired') Icon = XCircle;
                  if (timeStatus === 'current') Icon = Clock3;
                  
                  // Get time for display
                  const startTime = event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  const endTime = event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  
                  // Show person or destination based on resource type
                  let secondaryInfo = '';
                  if (resource.type === 'room' && resource.personName) {
                    secondaryInfo = resource.personName;
                  } else if (resource.type === 'transport' && 'destination' in resource.details) {
                    secondaryInfo = resource.details.destination || '';
                  }
                  
                  return (
                    <div className="flex items-center w-full overflow-hidden">
                      <div className={`flex-shrink-0 mr-1.5 ${timeStatus === 'current' ? 'text-blue-500 animate-pulse' : ''}`}>
                        <Icon size={12} />
                      </div>
                      <div className="truncate text-xs">
                        <div className="font-medium truncate">
                          {event.title.replace(' (In Use)', '').replace('Room: ', '').replace('Transport: ', '')}
                          {timeStatus === 'current' && calendarView === 'month' && <span className="ml-1 text-blue-500">●</span>}
                        </div>
                        {calendarView !== 'month' && (
                          <div className="flex items-center space-x-1">
                            <span className="truncate opacity-75">{startTime} - {endTime}</span>
                            {secondaryInfo && (
                              <>
                                <span className="opacity-50">•</span>
                                <span className="truncate opacity-75">{secondaryInfo}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              }}
              eventPropGetter={eventStyleGetter}
              popup
              tooltipAccessor={(event: CalendarEvent) => {
                const resource = event.resource;
                if (!resource) return event.title;
                
                if (resource.type === 'room') {
                  const details = resource.details as RoomBooking;
                  return `Room: ${details.room_details?.name || 'Unknown Room'}\n` + 
                         `Time: ${formatTime(details.start_time)} - ${formatTime(details.end_time)}\n` +
                         `Person: ${details.pic || 'Not specified'}\n` +
                         `Section: ${details.section || 'Not specified'}\n` +
                         `Status: ${details.status || 'Not specified'}`;
                } else {
                  const details = resource.details as TransportBooking;
                  return `Vehicle: ${details.transport_details?.name || 'Unknown Vehicle'}\n` + 
                         `Time: ${formatTime(details.start_time)} - ${formatTime(details.end_time)}\n` +
                         `Destination: ${details.destination || 'Not specified'}\n` +
                         `Driver: ${details.transport_details?.driver || 'Not specified'}\n` +
                         `Status: ${details.status || 'Not specified'}`;
                }
              }}
              dayPropGetter={(date: Date) => {
                const today = new Date();
                if (date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear()) {
                  return {
                    className: 'rbc-today',
                    style: { backgroundColor: '#f0f9ff' } // sky-50 for today's highlight
                  };
                }
                return {};
              }}
            />
          </div>
          
          {/* Event Popup */}
          {selectedEvent && (
            <EventModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
          
          {/* Calendar legend with improved styling */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm p-4 bg-white border border-sky-100 rounded-md shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <h4 className="text-sky-800 font-medium text-xs uppercase tracking-wider flex items-center">
                <Info size={14} className="mr-1 text-sky-500" />
                Status
              </h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-blue-200 border-l-2 border-l-blue-500 mr-2 shadow-sm"></div>
                  <span className="text-blue-800">Pending</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-green-200 border-l-2 border-l-green-500 mr-2 shadow-sm"></div>
                  <span className="text-green-800">Approved</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-red-200 border-l-2 border-l-red-500 mr-2 shadow-sm"></div>
                  <span className="text-red-800">Rejected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-gray-200 border-l-2 border-l-gray-500 mr-2 shadow-sm"></div>
                  <span className="text-gray-800">Cancelled</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-gray-200 border-l-2 border-l-gray-500 mr-2 shadow-sm"></div>
                  <span className="text-gray-800">Expired</span>
                </div>
              </div>
            </div>
            
            <div className="h-14 w-px bg-sky-100 mx-2"></div>
            
            <div className="flex flex-col items-center gap-4">
              <h4 className="text-sky-800 font-medium text-xs uppercase tracking-wider flex items-center">
                <Filter size={14} className="mr-1 text-sky-500" />
                Resource Type
              </h4>
              <div className="flex gap-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 bg-sky-100 rounded-full border border-sky-300 mr-2">
                    <Building size={12} className="text-sky-600" />
                  </div>
                  <span className="text-sky-700">Room</span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 bg-sky-200 rounded-full border border-sky-400 mr-2">
                    <Car size={12} className="text-sky-700" />
                  </div>
                  <span className="text-sky-900">Transport</span>
                </div>
              </div>
            </div>
            
            <div className="h-14 w-px bg-sky-100 mx-2"></div>
            
            <div className="flex flex-col items-center gap-4">
              <h4 className="text-sky-800 font-medium text-xs uppercase tracking-wider flex items-center">
                <Clock size={14} className="mr-1 text-sky-500" />
                Time Status
              </h4>
              <div className="flex gap-6">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-5 h-5 bg-white rounded-full border border-blue-300 shadow-[0_0_0_2px_rgba(59,130,246,0.5)] mr-2 animate-pulse">
                    <Clock3 size={12} className="text-blue-500" />
                  </div>
                  <span className="text-blue-600">In Use</span>
                </div>
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span className="text-blue-600">Current</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Filter */}
        <div className="mb-6">
          <div className="inline-flex bg-white rounded-md shadow-sm border border-sky-100">
            <button 
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                timeRange === 'week' 
                  ? 'bg-sky-500 text-white' 
                  : 'text-gray-600 hover:bg-sky-50'
              }`}
            >
              Week
            </button>
            <button 
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === 'month' 
                  ? 'bg-sky-500 text-white' 
                  : 'text-gray-600 hover:bg-sky-50'
              }`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeRange('year')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                timeRange === 'year' 
                  ? 'bg-sky-500 text-white' 
                  : 'text-gray-600 hover:bg-sky-50'
              }`}
            >
              Year
            </button>
          </div>
        </div>
        
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Total Resources */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-sky-50 p-3 rounded-md">
                <Layers size={20} className="text-sky-500" />
              </div>
              <div className="text-xs font-medium text-gray-500">
                {timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'This Year'}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Resources</h3>
            <div className="text-2xl font-bold text-sky-800">{stats.rooms.total + stats.transports.total}</div>
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <div className="w-1 h-1 rounded-full bg-sky-300 mr-1"></div>
              <span>Rooms: {stats.rooms.total}</span>
              <div className="w-1 h-1 rounded-full bg-sky-300 ml-2 mr-1"></div>
              <span>Vehicles: {stats.transports.total}</span>
            </div>
          </div>
          
          {/* Total Bookings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-sky-50 p-3 rounded-md">
                <CalendarDays size={20} className="text-sky-500" />
              </div>
              <div className="text-xs font-medium text-gray-500">
                {timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'This Year'}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Bookings</h3>
            <div className="text-2xl font-bold text-sky-800">{stats.roomBookings.total + stats.transportBookings.total}</div>
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <div className="w-1 h-1 rounded-full bg-sky-300 mr-1"></div>
              <span>Rooms: {stats.roomBookings.total}</span>
              <div className="w-1 h-1 rounded-full bg-sky-300 ml-2 mr-1"></div>
              <span>Transports: {stats.transportBookings.total}</span>
            </div>
          </div>
          
          {/* Pending Requests */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-sky-50 p-3 rounded-md">
                <Clock size={20} className="text-sky-500" />
              </div>
              <div className="text-xs font-medium text-gray-500">Requires Action</div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Pending Requests</h3>
            <div className="text-2xl font-bold text-sky-800">{stats.roomBookings.pending + stats.transportBookings.pending}</div>
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <div className="w-1 h-1 rounded-full bg-sky-300 mr-1"></div>
              <span>Rooms: {stats.roomBookings.pending}</span>
              <div className="w-1 h-1 rounded-full bg-sky-300 ml-2 mr-1"></div>
              <span>Transports: {stats.transportBookings.pending}</span>
            </div>
          </div>
        
        </div>
        
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Room Bookings Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sky-800 flex items-center">
                <Building size={18} className="mr-2 text-sky-500" />
                Room Bookings Status
              </h3>
              <div className="text-sm text-gray-500">{stats.roomBookings.total} Total</div>
            </div>
            <div className="space-y-4">
              {/* Pending */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-sky-800 font-medium">{stats.roomBookings.pending}</span>
                </div>
                <div className="w-full bg-sky-50 rounded-full h-2">
                  <div 
                    className="bg-blue-300 h-2 rounded-full" 
                    style={{ width: `${stats.roomBookings.total ? (stats.roomBookings.pending / stats.roomBookings.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Approved */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Approved</span>
                  <span className="text-sky-800 font-medium">{stats.roomBookings.approved}</span>
                </div>
                <div className="w-full bg-sky-50 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full" 
                    style={{ width: `${stats.roomBookings.total ? (stats.roomBookings.approved / stats.roomBookings.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Rejected */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Rejected</span>
                  <span className="text-sky-800 font-medium">{stats.roomBookings.rejected}</span>
                </div>
                <div className="w-full bg-sky-50 rounded-full h-2">
                  <div 
                    className="bg-red-400 h-2 rounded-full" 
                    style={{ width: `${stats.roomBookings.total ? (stats.roomBookings.rejected / stats.roomBookings.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Cancelled */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Cancelled</span>
                  <span className="text-sky-800 font-medium">{stats.roomBookings.cancelled}</span>
                </div>
                <div className="w-full bg-sky-50 rounded-full h-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full" 
                    style={{ width: `${stats.roomBookings.total ? (stats.roomBookings.cancelled / stats.roomBookings.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transport Bookings Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-sky-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sky-800 flex items-center">
                <Car size={18} className="mr-2 text-sky-500" />
                Transport Bookings Status
              </h3>
              <div className="text-sm text-gray-500">{stats.transportBookings.total} Total</div>
            </div>
            <div className="space-y-4">
              {/* Pending */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Pending</span>
                  <span className="text-sky-800 font-medium">{stats.transportBookings.pending}</span>
                </div>
                <div className="w-full bg-sky-50 rounded-full h-2">
                  <div 
                    className="bg-blue-300 h-2 rounded-full" 
                    style={{ width: `${stats.transportBookings.total ? (stats.transportBookings.pending / stats.transportBookings.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Approved */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Approved</span>
                  <span className="text-sky-800 font-medium">{stats.transportBookings.approved}</span>
                </div>
                <div className="w-full bg-sky-50 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full" 
                    style={{ width: `${stats.transportBookings.total ? (stats.transportBookings.approved / stats.transportBookings.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Rejected */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Rejected</span>
                  <span className="text-sky-800 font-medium">{stats.transportBookings.rejected}</span>
                </div>
                <div className="w-full bg-sky-50 rounded-full h-2">
                  <div 
                    className="bg-red-400 h-2 rounded-full" 
                    style={{ width: `${stats.transportBookings.total ? (stats.transportBookings.rejected / stats.transportBookings.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Cancelled */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Cancelled</span>
                  <span className="text-sky-800 font-medium">{stats.transportBookings.cancelled}</span>
                </div>
                <div className="w-full bg-sky-50 rounded-full h-2">
                  <div 
                    className="bg-gray-400 h-2 rounded-full" 
                    style={{ width: `${stats.transportBookings.total ? (stats.transportBookings.cancelled / stats.transportBookings.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Bookings Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Room Bookings */}
            <div className="bg-white rounded-lg shadow-sm border border-sky-100 overflow-hidden">
              <div className="p-6 border-b border-sky-100 flex justify-between items-center">
                <h3 className="font-medium text-sky-800 flex items-center">
                  <Building size={18} className="mr-2 text-sky-500" />
                  Recent Room Bookings
                </h3>
                <a href="/list/room-bookings" className="text-sm text-sky-600 hover:text-sky-800 transition-colors">
                  View All
                </a>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-100">
                  <thead className="bg-sky-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Room</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Date & Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Person</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sky-100">
                    {recentRoomBookings.map((booking) => {
                      const statusStyle = getStatusStyle(booking.status);
                      return (
                        <tr key={booking.booking_id || booking.id} className="hover:bg-sky-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-sky-800">
                              {booking.room_details?.name || `Room #${booking.room_id || booking.room?.id || 'N/A'}`}
                            </div>
                            {booking.room_details?.type && (
                              <div className="text-xs text-gray-500">
                                {booking.room_details.type}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-sky-800">{formatDate(booking.booking_date)}</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-sky-800">{booking.pic || "N/A"}</div>
                            <div className="text-xs text-gray-500">{booking.section || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                              style={{ backgroundColor: statusStyle.color}}>
                              {statusStyle.icon}
                              <span className="ml-1">{booking.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Recent Transport Bookings */}
            <div className="bg-white rounded-lg shadow-sm border border-sky-100 overflow-hidden">
              <div className="p-6 border-b border-sky-100 flex justify-between items-center">
                <h3 className="font-medium text-sky-800 flex items-center">
                  <Car size={18} className="mr-2 text-sky-500" />
                  Recent Transport Bookings
                </h3>
                <a href="/list/transport-bookings" className="text-sm text-sky-600 hover:text-sky-800 transition-colors">
                  View All
                </a>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-sky-100">
                  <thead className="bg-sky-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Vehicle</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Date & Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Destination</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-sky-600 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-sky-100">
                    {recentTransportBookings.map((booking) => {
                      const statusStyle = getStatusStyle(booking.status);
                      return (
                        <tr key={booking.booking_id || booking.id} className="hover:bg-sky-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-sky-800">
                              {booking.transport_details?.name || `Vehicle #${booking.transport_id || booking.transport?.id || 'N/A'}`}
                            </div>
                            {booking.transport_details?.driver && (
                              <div className="text-xs text-gray-500">
                                Driver: {booking.transport_details.driver}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-sky-800">{formatDate(booking.booking_date)}</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-sky-800">{booking.destination || "Not specified"}</div>
                            <div className="text-xs text-gray-500">{booking.section || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                                  style={{ backgroundColor: statusStyle.color }}>
                              {statusStyle.icon}
                              <span className="ml-1">{booking.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Rooms */}
            <div className="bg-white rounded-lg shadow-sm border border-sky-100 overflow-hidden">
              <div className="p-6 border-b border-sky-100 flex justify-between items-center">
                <h3 className="font-medium text-sky-800 flex items-center">
                  <Building size={18} className="mr-2 text-sky-500" />
                  Available Rooms
                </h3>
                <a href="/list/rooms" className="text-sm text-sky-600 hover:text-sky-800 transition-colors">
                  View All
                </a>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-sky-100">
                  {availableRooms.map(room => (
                    <li key={room.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-sky-800">{room.name || `Room ${room.id}`}</p>
                          {room.type && (
                            <p className="text-xs text-gray-500">{room.type}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Users size={12} className="mr-1" />
                          {room.capacity || 'N/A'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {/* Available Transport */}
            <div className="bg-white rounded-lg shadow-sm border border-sky-100 overflow-hidden">
              <div className="p-6 border-b border-sky-100 flex justify-between items-center">
                <h3 className="font-medium text-sky-800 flex items-center">
                  <Car size={18} className="mr-2 text-sky-500" />
                  Available Transport
                </h3>
                <a href="/list/transports" className="text-sm text-sky-600 hover:text-sky-800 transition-colors">
                  View All
                </a>
              </div>
              <div className="p-4">
                <ul className="divide-y divide-sky-100">
                  {availableTransports.map(transport => (
                    <li key={transport.id} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-sky-800">{transport.name || `Vehicle ${transport.id}`}</p>
                          {transport.driver && (
                            <p className="text-xs text-gray-500">Driver: {transport.driver}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Users size={12} className="mr-1" />
                          {transport.capacity || 'N/A'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;