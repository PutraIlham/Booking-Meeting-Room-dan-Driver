import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Base API URL configuration
const API_BASE_URL = "http://20.251.153.107:3001";
const API_ENDPOINT = `${API_BASE_URL}/api`;

// GET handler for fetching notifications
export async function GET(req: NextRequest) {
  try {
    // Extract token from request headers
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create API client with authentication
    const apiClient = axios.create({
      baseURL: API_ENDPOINT,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Fetch recent room bookings with unread status
    const roomBookingsResponse = await apiClient.get("/room-bookings?unread=true");
    const roomBookings = roomBookingsResponse.data;
    console.log('Room bookings:', roomBookings);
    
    // Fetch recent transport bookings with unread status
    const transportBookingsResponse = await apiClient.get("/transport-bookings?unread=true");
    const transportBookings = transportBookingsResponse.data;
    console.log('Transport bookings:', transportBookings);
    
    // Fetch all rooms to get their names
    const roomsResponse = await apiClient.get("/rooms");
    const rooms = roomsResponse.data;
    
    // Fetch all transports to get their names
    const transportsResponse = await apiClient.get("/transports");
    const transports = transportsResponse.data;
    
    // Process room bookings into notifications
    const roomNotifications = roomBookings.map((booking: any) => {
      // Find the room in the rooms data
      const room = rooms.find((r: any) => r.room_id === booking.room_id);
      
      // Get room name from the rooms table or fallback
      const roomName = room ? room.room_name : 
                     booking.room_name || 
                     (booking.room && booking.room.room_name) || 
                     `Room ${booking.room_id}`;
      
      // Determine action type based on status or other fields
      let action = 'new';
      let title = `New Room Booking: ${roomName}`;
      let description = `${booking.pic} booked ${roomName} for ${booking.agenda}`;
      
      // Check if booking was rescheduled (based on updatedAt vs createdAt)
      if (booking.status === 'rescheduled' || 
          (booking.updatedAt && booking.createdAt && 
           new Date(booking.updatedAt).getTime() - new Date(booking.createdAt).getTime() > 60000)) {
        action = 'rescheduled';
        title = `Room Booking Rescheduled: ${roomName}`;
        description = `${booking.pic} rescheduled booking for ${roomName}`;
      }
      
      // Check if booking was canceled
      if (booking.status === 'canceled' || booking.status === 'cancelled') {
        action = 'canceled';
        title = `Room Booking Canceled: ${roomName}`;
        description = `${booking.pic} canceled booking for ${roomName}`;
      }
      
      return {
        id: `room_${booking.booking_id}`,
        type: 'room_booking',
        action,
        booking_id: booking.booking_id,
        title,
        description,
        timestamp: booking.updatedAt || booking.createdAt || new Date().toISOString(),
        read: booking.read_at !== null && booking.read_at !== false,
        data: {
          ...booking,
          room_name: roomName,
          room: room || booking.room || { room_name: roomName }
        }
      };
    });
    
    // Process transport bookings into notifications
    const transportNotifications = transportBookings.map((booking: any) => {
      // Find the transport in the transports data
      const transport = transports.find((t: any) => t.transport_id === booking.transport_id);
      
      // Get vehicle name from the transports table or fallback
      const vehicleName = transport ? transport.vehicle_name : 
                         booking.vehicle_name || 
                         (booking.transport && booking.transport.vehicle_name) || 
                         `Vehicle ${booking.transport_id}`;
      
      // Determine action type based on status or other fields
      let action = 'new';
      let title = `New Transport Booking: ${vehicleName}`;
      let description = `${booking.pic} booked ${vehicleName} for ${booking.agenda}`;
      
      // Check if booking was rescheduled (based on updatedAt vs createdAt)
      if (booking.status === 'rescheduled' || 
          (booking.updatedAt && booking.createdAt && 
           new Date(booking.updatedAt).getTime() - new Date(booking.createdAt).getTime() > 60000)) {
        action = 'rescheduled';
        title = `Transport Booking Rescheduled: ${vehicleName}`;
        description = `${booking.pic} rescheduled booking for ${vehicleName}`;
      }
      
      // Check if booking was canceled
      if (booking.status === 'canceled' || booking.status === 'cancelled') {
        action = 'canceled';
        title = `Transport Booking Canceled: ${vehicleName}`;
        description = `${booking.pic} canceled booking for ${vehicleName}`;
      }
      
      return {
        id: `transport_${booking.booking_id}`,
        type: 'transport_booking',
        action,
        booking_id: booking.booking_id,
        title,
        description,
        timestamp: booking.updatedAt || booking.createdAt || new Date().toISOString(),
        read: booking.read_at !== null && booking.read_at !== false,
        data: {
          ...booking,
          vehicle_name: vehicleName,
          transport: transport || booking.transport || { vehicle_name: vehicleName }
        }
      };
    });
    
    // Combine and sort all notifications by timestamp (most recent first)
    const allNotifications = [...roomNotifications, ...transportNotifications].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json(allNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST method to mark notifications as read
export async function POST(req: NextRequest) {
  try {
    // Extract token from request headers
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create API client with authentication
    const apiClient = axios.create({
      baseURL: API_ENDPOINT,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Parse request body
    const body = await req.json();
    
    // Mark all notifications as read
    if (body.all === true) {
      // Update room bookings
      await apiClient.put('/room-bookings/mark-all-read', {
        read_at: new Date().toISOString()
      });
      
      // Update transport bookings
      await apiClient.put('/transport-bookings/mark-all-read', {
        read_at: new Date().toISOString()
      });
      
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }
    
    // Mark a single notification as read
    if (body.id && body.type) {
      const id = body.id.toString();
      const type = body.type;
      
      // Extract the actual booking ID from the notification ID
      const bookingId = id.includes('_') ? id.split('_')[1] : id;
      
      if (type === 'room_booking') {
        await apiClient.put(`/room-bookings/${bookingId}/mark-read`, {
          read_at: new Date().toISOString()
        });
      } else if (type === 'transport_booking') {
        await apiClient.put(`/transport-bookings/${bookingId}/mark-read`, {
          read_at: new Date().toISOString()
        });
      } else {
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
      }
      
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }
    
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
