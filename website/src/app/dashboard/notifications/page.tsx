"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Bell, Car, Calendar, Clock, 
  CheckCircle, XCircle, AlertCircle, RefreshCw,
  Eye, ArrowRight, Building
} from "lucide-react";

// Base API URL configuration
const API_BASE_URL = "http://20.251.153.107:3001";
const API_ENDPOINT = `${API_BASE_URL}/api`;

// Define types for our notifications
type Notification = {
  id: string | number;
  type: 'room_booking' | 'transport_booking';
  action: 'new' | 'rescheduled' | 'canceled';
  booking_id: number;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  data: any; // This will hold the booking data
};

const NotificationsPage = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'room' | 'transport'>('all');

  // Create a custom axios instance with auth
  const createApiClient = () => {
    // Get token from localStorage
    const token = localStorage.getItem("adminToken");
    
    if (!token) {
      console.log("No admin token found, redirecting to login");
      router.push("/sign-in");
      return null;
    }
    
    // Create axios instance with auth header
    const apiClient = axios.create({
      baseURL: API_ENDPOINT,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    return apiClient;
  };

  // Fetch notifications data from the API
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        console.log("No admin token found, redirecting to login");
        router.push("/sign-in");
        return;
      }
      
      // Fetch notifications from our API endpoint
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching notifications: ${response.status}`);
      }
      
      const data = await response.json();
      setNotifications(data);
      
      // Update notification count in navbar (this would be handled by a global state in a real app)
      const unreadCount = data.filter((n: Notification) => !n.read).length;
      // In a real app, you would update a global state or context here
      // For now, we'll just log it
      console.log(`Unread notifications: ${unreadCount}`);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load notifications. Please try again later.");
      
      // Fallback to mock data if API fails
      const mockNotifications = await generateMockNotifications();
      setNotifications(mockNotifications as Notification[]);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock notifications for demonstration
  const generateMockNotifications = async () => {
    // In a real app, this would be an API call
    const apiClient = createApiClient();
    if (!apiClient) return [];
    
    // Try to fetch some real data to mix with our mock notifications
    try {
      // Fetch recent room bookings
      const roomResponse = await apiClient.get("/room-bookings");
      const roomBookings = roomResponse.data.slice(0, 3); // Get the 3 most recent
      
      // Fetch recent transport bookings
      const transportResponse = await apiClient.get("/transport-bookings");
      const transportBookings = transportResponse.data.slice(0, 3); // Get the 3 most recent
      
      // Fetch all rooms to get their names
      const roomsResponse = await apiClient.get("/rooms");
      const rooms = roomsResponse.data;
      
      // Fetch all transports to get their names
      const transportsResponse = await apiClient.get("/transports");
      const transports = transportsResponse.data;
      
      // Create mock notifications from room bookings
      const roomNotifications = roomBookings.map((booking: any, index: number) => {
        // Find the room in the rooms data
        const room = rooms.find((r: any) => r.room_id === booking.room_id);
        const roomName = room ? room.room_name : `Room ${booking.room_id}`;
        
        // Determine if this notification should be read or unread
        const isRead = index % 2 === 0; // Every other notification is read
        
        return {
          id: `room_${booking.booking_id}`,
          type: 'room_booking' as const,
          action: index % 3 === 0 ? 'new' : index % 3 === 1 ? 'rescheduled' : 'canceled',
          booking_id: booking.booking_id,
          title: `Room Booking: ${roomName}`,
          description: `${booking.pic} booked ${roomName} for ${booking.agenda}`,
          timestamp: new Date(booking.createdAt || new Date()).toISOString(),
          read: isRead,
          data: {
            ...booking,
            room_name: roomName,
            room: room || { room_name: roomName }
          }
        };
      });
      
      // Create mock notifications from transport bookings
      const transportNotifications = transportBookings.map((booking: any, index: number) => {
        // Find the transport in the transports data
        const transport = transports.find((t: any) => t.transport_id === booking.transport_id);
        const vehicleName = transport ? transport.vehicle_name : `Vehicle ${booking.transport_id}`;
        
        // Determine if this notification should be read or unread
        const isRead = index % 2 === 1; // Every other notification is read
        
        return {
          id: `transport_${booking.booking_id}`,
          type: 'transport_booking' as const,
          action: index % 3 === 0 ? 'new' : index % 3 === 1 ? 'rescheduled' : 'canceled',
          booking_id: booking.booking_id,
          title: `Transport Booking: ${vehicleName}`,
          description: `${booking.pic} booked ${vehicleName} for ${booking.agenda}`,
          timestamp: new Date(booking.createdAt || new Date()).toISOString(),
          read: isRead,
          data: {
            ...booking,
            vehicle_name: vehicleName,
            transport: transport || { vehicle_name: vehicleName }
          }
        };
      });
      
      // Combine and sort all notifications by timestamp (most recent first)
      const allNotifications = [...roomNotifications, ...transportNotifications].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      return allNotifications;
    } catch (error) {
      console.error("Error generating mock notifications:", error);
      
      // Fallback to completely mock data
      return [
        {
          id: 'room_1',
          type: 'room_booking' as const,
          action: 'new' as const,
          booking_id: 1,
          title: 'New Room Booking: Conference Room A',
          description: 'John Doe booked Conference Room A for Team Meeting',
          timestamp: new Date().toISOString(),
          read: false,
          data: {
            booking_id: 1,
            room_id: 1,
            room_name: 'Conference Room A',
            pic: 'John Doe',
            agenda: 'Team Meeting',
            booking_date: new Date().toISOString(),
            start_time: '09:00',
            end_time: '10:00',
            room: { room_name: 'Conference Room A' }
          }
        },
        {
          id: 'transport_1',
          type: 'transport_booking' as const,
          action: 'rescheduled' as const,
          booking_id: 1,
          title: 'Transport Booking Rescheduled: Toyota Avanza',
          description: 'Jane Smith rescheduled booking for Toyota Avanza',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          read: true,
          data: {
            booking_id: 1,
            transport_id: 1,
            vehicle_name: 'Toyota Avanza',
            pic: 'Jane Smith',
            agenda: 'Client Visit',
            booking_date: new Date().toISOString(),
            start_time: '13:00',
            end_time: '15:00',
            destination: 'Client Office',
            transport: { vehicle_name: 'Toyota Avanza' }
          }
        },
        {
          id: 'room_2',
          type: 'room_booking' as const,
          action: 'canceled' as const,
          booking_id: 2,
          title: 'Room Booking Canceled: Meeting Room B',
          description: 'Mike Johnson canceled booking for Meeting Room B',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          read: false,
          data: {
            booking_id: 2,
            room_id: 2,
            room_name: 'Meeting Room B',
            pic: 'Mike Johnson',
            agenda: 'Interview',
            booking_date: new Date().toISOString(),
            start_time: '11:00',
            end_time: '12:00',
            room: { room_name: 'Meeting Room B' }
          }
        }
      ];
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string | number) => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        console.log("No admin token found, redirecting to login");
        router.push("/sign-in");
        return;
      }
      
      // Find the notification to get its type
      const notification = notifications.find(n => n.id === id);
      if (!notification) return;
      
      // Update UI immediately for better user experience
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
      
      // Call the API to mark the notification as read
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: id,
          type: notification.type
        }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Error marking notification as read: ${response.status}`);
      }
      
      // Update notification count in navbar
      const unreadCount = notifications.filter(n => !n.read && n.id !== id).length;
      console.log(`Unread notifications: ${unreadCount}`);
      
      // Trigger a custom event to notify the navbar to refresh notification count
      const event = new CustomEvent('notificationRead');
      window.dispatchEvent(event);
      
    } catch (err) {
      console.error("Error marking notification as read:", err);
      // Revert UI change if API call fails
      fetchNotifications();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        console.log("No admin token found, redirecting to login");
        router.push("/sign-in");
        return;
      }
      
      // Update UI immediately for better user experience
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      // Call the API to mark all notifications as read
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          all: true
        }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Error marking all notifications as read: ${response.status}`);
      }
      
      // Update notification count in navbar
      console.log('Unread notifications: 0');
      
      // Trigger a custom event to notify the navbar to refresh notification count
      const event = new CustomEvent('notificationRead');
      window.dispatchEvent(event);
      
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
      // Revert UI change if API call fails
      fetchNotifications();
    }
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'room') return notification.type === 'room_booking';
    if (activeTab === 'transport') return notification.type === 'transport_booking';
    return true;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    
    // If timeString is already in HH:MM format, we'll just convert it to 12-hour format
    const [hours, minutes] = timeString.split(':').map(Number);
    
    const hours12 = hours % 12 || 12;
    const period = hours >= 12 ? 'PM' : 'AM';
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Get icon based on notification type and action
  const getNotificationIcon = (notification: Notification) => {
    const { type, action } = notification;
    
    if (type === 'room_booking') {
      if (action === 'new') return <Building className="text-blue-500" />;
      if (action === 'rescheduled') return <RefreshCw className="text-amber-500" />;
      if (action === 'canceled') return <XCircle className="text-red-500" />;
    }
    
    if (type === 'transport_booking') {
      if (action === 'new') return <Car className="text-green-500" />;
      if (action === 'rescheduled') return <RefreshCw className="text-amber-500" />;
      if (action === 'canceled') return <XCircle className="text-red-500" />;
    }
    
    return <Bell className="text-gray-500" />;
  };

  // Get badge color based on notification action
  const getActionBadgeColor = (action: string) => {
    if (action === 'new') return 'bg-blue-100 text-blue-800';
    if (action === 'rescheduled') return 'bg-amber-100 text-amber-800';
    if (action === 'canceled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Get detail link based on notification type
  const getDetailLink = (notification: Notification) => {
    const { type, booking_id } = notification;
    
    if (type === 'room_booking') {
      return `/list/room-bookings?id=${booking_id}`;
    }
    
    if (type === 'transport_booking') {
      return `/list/transport-bookings?id=${booking_id}`;
    }
    
    return '#';
  };

  // Load notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Bell className="mr-2" />
            Notifications
          </h1>
          
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors text-sm font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                {notifications.length}
              </span>
            </button>

            
            <button
              onClick={() => setActiveTab('room')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'room'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Room Bookings
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                {notifications.filter(n => n.type === 'room_booking').length}
              </span>
            </button>
            
            <button
              onClick={() => setActiveTab('transport')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transport'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transport Bookings
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                {notifications.filter(n => n.type === 'transport_booking').length}
              </span>
            </button>
          </nav>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500"></div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all' 
                ? "You don't have any notifications yet." 
                : `You don't have any ${activeTab} notifications.`}
            </p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && !error && filteredNotifications.length > 0 && (
          <div className="bg-white shadow overflow-hidden rounded-lg divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-6 ${!notification.read ? 'bg-sky-50' : ''} cursor-pointer hover:bg-gray-50 transition-colors`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  {/* Icon */}
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {getNotificationIcon(notification)}
                  </div>
                  
                  {/* Content */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(notification.timestamp)}
                      </p>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-sm text-gray-600">
                        {notification.description}
                      </p>
                    </div>
                    
                    {/* Additional booking details */}
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>
                          {notification.data.booking_date 
                            ? new Date(notification.data.booking_date).toLocaleDateString() 
                            : 'Date not available'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {formatTime(notification.data.start_time)} - {formatTime(notification.data.end_time)}
                        </span>
                      </div>
                      
                      {notification.type === 'transport_booking' && notification.data.destination && (
                        <div className="flex items-center">
                          <ArrowRight className="h-3 w-3 mr-1" />
                          <span>{notification.data.destination}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action and View Details */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadgeColor(notification.action)}`}>
                        {notification.action === 'new' && 'New Booking'}
                        {notification.action === 'rescheduled' && 'Rescheduled'}
                        {notification.action === 'canceled' && 'Canceled'}
                      </span>
                      
                      <Link 
                        href={getDetailLink(notification)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                  
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-sky-500"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
