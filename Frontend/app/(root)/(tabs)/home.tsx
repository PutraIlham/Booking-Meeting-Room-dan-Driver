import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from '@expo/vector-icons';
import axios from 'axios';
import api from "@/lib/api";
import { tokenCache } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

interface IRoom {
  room_id: number;
  room_name: string;
  room_type: string;
  capacity: string;
  facilities: string;
  image?: string;
}

interface ITransport {
  transport_id: number;
  vehicle_name: string;
  driver_name: string;
  capacity: number;
  image?: string;
}

interface IBooking {
  booking_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  section: string;
  agenda: string;
  description: string;
  type: 'ROOM' | 'TRANSPORT';
  itemName: string;
  user_id: number;
  pic: string;
  room_id?: number;
  transport_id?: number;
  room_image?: string;
  transport_image?: string;
  image?: string;
}

const BASE_URL = 'http://20.251.153.107:3001/api';

// Custom Alert Component - Similar to the one used in detail page
const CustomAlert = ({ 
  visible, 
  type = 'success',
  title = '', 
  message = '', 
  onClose = () => {},
  autoClose = true,
  duration = 3000,
  bookingType = 'ROOM'
}) => {
  const [isVisible, setIsVisible] = useState(visible);

  const SUCCESS_COLORS = {
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: 'checkmark-circle'
  };
  
  const ERROR_COLORS = {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    icon: 'close-circle'
  };
  
  const INFO_COLORS = {
    bg: 'bg-sky-500',
    bgLight: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    icon: 'information-circle'
  };
  
  const WARNING_COLORS = {
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
    icon: 'warning'
  };
  
  const colors = type === 'success' 
    ? SUCCESS_COLORS 
    : type === 'error' 
      ? ERROR_COLORS 
      : type === 'warning'
        ? WARNING_COLORS
        : INFO_COLORS;

  useEffect(() => {
    setIsVisible(visible);
    if (visible && autoClose) {
      const timer = setTimeout(() => onClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-20">
        <View className={`w-11/12 rounded-xl p-5 ${colors.bgLight} ${colors.border} border shadow-lg`}>
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <View className={`w-8 h-8 ${colors.bg} rounded-full items-center justify-center mr-3`}>
                <Ionicons name={colors.icon} size={18} color="white" />
              </View>
              <Text className={`${colors.text} font-bold text-lg`}>
                {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <Text className="text-gray-700 mb-4 pl-11">{message}</Text>
          <TouchableOpacity
            onPress={onClose}
            className={`py-3 ${colors.bg} rounded-lg items-center mt-2`}
          >
            <Text className="text-white font-medium">
              {type === 'error' ? 'Try Again' : 'Got It'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const Home = () => {
  // State declarations
  const [activeTab, setActiveTab] = useState<"Recent" | "Past">("Recent");
  const [notifications, setNotifications] = useState(3);
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [user, setUser] = useState<any>(null);
  const [transports, setTransports] = useState<ITransport[]>([]);
  const [recentBookings, setRecentBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastApprovedBookings, setPastApprovedBookings] = useState<IBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // States for cancellation
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<IBooking | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('success');
  const [alertMessage, setAlertMessage] = useState('');
  
  const router = useRouter();

  // Helper functions
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    const initials = name.split('.').map((part: string) => part.charAt(0).toUpperCase()).join('');
    return initials;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const fetchAuthToken = async () => {
    return await tokenCache.getToken(AUTH_TOKEN_KEY);
  };

  const handleError = (error: any) => {
    if (error.response?.status === 401) {
      setAlertType('error');
      setAlertMessage('Your session has expired. Please login again.');
      setAlertVisible(true);
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 1500);
    } else {
      setAlertType('error');
      setAlertMessage('Something went wrong. Please try again later.');
      setAlertVisible(true);
    }
  };

  // Utility function to process image URLs
  const processImageUrl = (imageUrl: string | null | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    if (imageUrl === 'null') return undefined;
    
    if (typeof imageUrl === 'string' && (imageUrl.startsWith('E:') || imageUrl.startsWith('C:'))) {
      return `http://20.251.153.107:3001/api/image-proxy?path=${encodeURIComponent(imageUrl)}`;
    }
    
    if (typeof imageUrl === 'string' && imageUrl.includes('//uploads')) {
      return imageUrl.replace('//uploads', '/uploads');
    }
    
    if (typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
      const cleanPath = imageUrl.replace(/^\/+/, '');
      return `http://20.251.153.107:3001/${cleanPath}`;
    }
    
    return imageUrl;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const authToken = await fetchAuthToken();
      if (!authToken) {
        setAlertType('error');
        setAlertMessage('Not authenticated');
        setAlertVisible(true);
        setTimeout(() => {
          router.push('/(auth)/sign-in');
        }, 1500);
        return;
      }

      const headers = { 'Authorization': `Bearer ${authToken}` };

      // Get current user ID from profile
      let currentUserId = null;
      if (user && user.id) {
        currentUserId = user.id;
      } else {
        try {
          const profileRes = await api.get('/auth/profile');
          setUser(profileRes.data.user);
          currentUserId = profileRes.data.user.id;
        } catch (error) {
          handleError(error);
          return;
        }
      }

      // Fetch room data
      try {
        const roomsRes = await axios.get(`${BASE_URL}/rooms`, { headers });
        setRooms(roomsRes.data);
      } catch (error) {
        handleError(error);
        return;
      }

      // Fetch transport data
      try {
        const transportsRes = await axios.get(`${BASE_URL}/transports`, { headers });
        setTransports(transportsRes.data);
      } catch (error) {
        handleError(error);
        return;
      }

      // Fetch bookings after we have rooms and transports
      try {
        const [roomBookingsRes, transportBookingsRes] = await Promise.all([
          axios.get(`${BASE_URL}/room-bookings`, { headers }),
          axios.get(`${BASE_URL}/transport-bookings`, { headers })
        ]);

        // Filter bookings for current user
        const filteredRoomBookings = roomBookingsRes.data.filter(booking =>
          booking.user_id === currentUserId
        );
        const filteredTransportBookings = transportBookingsRes.data.filter(booking =>
          booking.user_id === currentUserId
        );

        // Now we can add images to each booking from our already loaded rooms and transports data
        const allBookings = [
          ...filteredRoomBookings.map((booking: any) => {
            const room = rooms.find((r) => r.room_id === booking.room_id);
            return {
              ...booking,
              type: 'ROOM' as const,
              itemName: room?.room_name || 'Unknown Room',
              image: room?.image ? processImageUrl(room.image) : null
            };
          }),
          ...filteredTransportBookings.map((booking: any) => {
            const transport = transports.find((t) => t.transport_id === booking.transport_id);
            return {
              ...booking,
              type: 'TRANSPORT' as const,
              itemName: transport?.vehicle_name || 'Unknown Vehicle',
              image: transport?.image ? processImageUrl(transport.image) : null
            };
          })
        ].sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
        setRecentBookings(allBookings.slice(0, 10));

        // Past Approved
        const currentDate = new Date();
        const pastApproved = allBookings.filter(booking => {
          const bookingDate = new Date(booking.booking_date);
          return (
            booking.status.toLowerCase() === 'approved' &&
            bookingDate < currentDate
          );
        });

        setPastApprovedBookings(pastApproved);
      } catch (error) {
        handleError(error);
        setRecentBookings([]);
        setPastApprovedBookings([]);
      }

    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Show cancellation confirmation dialog
  const handleCancel = (booking: IBooking) => {
    setBookingToCancel(booking);
    setShowConfirmAlert(true);
  };

  // Handle the actual cancellation after confirmation
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    
    setShowConfirmAlert(false);
    
    try {
      const authToken = await fetchAuthToken();
      
      if (!authToken) {
        setAlertType('error');
        setAlertMessage('Not authenticated');
        setAlertVisible(true);
        setTimeout(() => {
          router.push('/(auth)/sign-in');
        }, 1500);
        return;
      }

      // Show loading indicator
      setLoading(true);

      const axiosInstance = axios.create({
        baseURL: BASE_URL,
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Update the booking status to CANCELLED based on booking type
      if (bookingToCancel.type === 'ROOM') {
        await axiosInstance.put(`/room-bookings/${bookingToCancel.booking_id}`, {
          status: 'CANCELLED'
        });
      } else if (bookingToCancel.type === 'TRANSPORT') {
        await axiosInstance.put(`/transport-bookings/${bookingToCancel.booking_id}`, {
          status: 'CANCELLED'
        });
      }

      // Hide loading indicator
      setLoading(false);
      
      // Show success message
      setAlertType('success');
      setAlertMessage('Your booking has been cancelled successfully');
      setAlertVisible(true);
      
      // Refresh data after cancellation
      setTimeout(() => {
        fetchData();
      }, 2000);
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setLoading(false);
      setAlertType('error');
      setAlertMessage('Failed to cancel booking. Please try again.');
      setAlertVisible(true);
    }
  };

  // Filter bookings based on search query
  const filteredBookings = activeTab === "Recent" 
    ? recentBookings.filter(booking => 
        booking.agenda?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        booking.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.pic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.section?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pastApprovedBookings.filter(booking => 
        booking.agenda?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        booking.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.pic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.section?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Minimalist Booking Card with Image
  const BookingCard = ({ booking, index }: { booking: IBooking, index: number }) => {
    const handlePress = () => {
      if (booking.type.toUpperCase() === "ROOM") {
        router.push(`/detail-bookingRoom?id=${booking.booking_id}`);
      } else if (booking.type.toUpperCase() === "TRANSPORT") {
        router.push(`/detail-bookingTransport?id=${booking.booking_id}`);
      }
    };

    const getStatusStyle = (status: string) => {
      switch (status.toLowerCase()) {
        case 'approved':
          return {
            bg: 'bg-sky-500',
            text: 'text-white',
            label: 'Approved'
          };
        case 'pending':
          return {
            bg: 'bg-orange-400',
            text: 'text-white',
            label: 'Pending'
          };
        case 'rejected':
          return {
            bg: 'bg-gray-400',
            text: 'text-white',
            label: 'Rejected'
          };
        case 'cancelled':
          return {
            bg: 'bg-purple-400',
            text: 'text-white',
            label: 'Cancelled'
          };
        default:
          return {
            bg: 'bg-gray-300',
            text: 'text-gray-700',
            label: status
          };
      }
    };

    const statusStyle = getStatusStyle(booking.status);
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = bookingDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    // Only show cancel button for PENDING or APPROVED bookings
    const showCancelButton = activeTab === "Recent" && 
      (booking.status.toLowerCase() === 'pending' || booking.status.toLowerCase() === 'approved');

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50)}
        className="mx-4 mb-4"
      >
        <TouchableOpacity
          onPress={handlePress}
          className="overflow-hidden rounded-lg bg-white"
          style={{
            shadowColor: "#0ea5e9",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2
          }}
        >
          {/* Card Image */}
          <View className="relative">
            <Image
              source={{ uri: booking.image || 'https://via.placeholder.com/500x200/f1f5f9/94a3b8?text=No+Image' }}
              className="w-full h-36"
              resizeMode="cover"
            />
            
            {/* Status badge overlay */}
            <View className={`absolute top-3 right-3 ${statusStyle.bg} px-2 py-1 rounded-md`}>
              <Text className={`${statusStyle.text} text-xs font-medium`}>
                {statusStyle.label}
              </Text>
            </View>
            
            {/* Type badge overlay */}
            <View className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <Text className="text-xs font-medium text-sky-500">
                {booking.type === 'ROOM' ? 'Room' : 'Transport'}
              </Text>
            </View>
          </View>
          
          <View className="p-4">
            {/* Card Header */}
            <View className="mb-3">
              <Text className="text-gray-800 text-lg font-medium" numberOfLines={1}>
                {booking.agenda || 'Unnamed Booking'}
              </Text>
              <Text className="text-gray-500 text-sm" numberOfLines={1}>
                {booking.itemName || (booking.type === 'ROOM' ? 'Unnamed Room' : 'Unnamed Vehicle')}
              </Text>
            </View>
            
            {/* Booking Info - Two columns */}
            <View className="flex-row mb-3">
              <View className="flex-1 border-r border-gray-100 pr-3">
                <Text className="text-sky-500 text-xs mb-1">Date & Time</Text>
                <Text className="text-gray-700">{formattedDate}</Text>
                <Text className="text-gray-500 text-xs">
                  {booking.start_time} - {booking.end_time}
                </Text>
              </View>
              
              <View className="flex-1 pl-3">
                <Text className="text-orange-400 text-xs mb-1">Section</Text>
                <Text className="text-gray-700">{booking.section || 'Not specified'}</Text>
                <Text className="text-gray-500 text-xs">
                  PIC: {booking.pic || 'Not specified'}
                </Text>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View className="flex-row mt-3 pt-3 border-t border-gray-100">
              <TouchableOpacity
                onPress={handlePress}
                className="flex-1 bg-sky-500 py-2.5 rounded-md mr-2 items-center"
              >
                <Text className="text-white text-sm font-medium">Details</Text>
              </TouchableOpacity>

              {showCancelButton ? (
                <TouchableOpacity
                  onPress={() => handleCancel(booking)}
                  className="flex-1 bg-gray-100 py-2.5 rounded-md ml-2 items-center"
                >
                  <Text className="text-gray-600 text-sm font-medium">Cancel</Text>
                </TouchableOpacity>
              ) : activeTab === "Past" ? (
                <TouchableOpacity
                  onPress={() => {
                    // Navigate booking creation (Book Again)
                    if (booking.type.toUpperCase() === "ROOM") {
                      router.push({
                        pathname: '/booking-room',
                        params: {
                          selectedRoomId: booking.room_id,
                          selectedRoomName: booking.itemName,
                          pic: booking.pic,
                          section: booking.section,
                          description: booking.description,
                          bookAgain: 'true'
                        }
                      });
                    } else if (booking.type.toUpperCase() === "TRANSPORT") {
                      router.push({
                        pathname: '/booking-transport',
                        params: {
                          selectedTransportId: booking.transport_id,
                          selectedTransportName: booking.itemName,
                          pic: booking.pic,
                          section: booking.section,
                          description: booking.description,
                          bookAgain: 'true'
                        }
                      });
                    }
                  }}
                  className="flex-1 bg-orange-400 py-2.5 rounded-md ml-2 items-center"
                >
                  <Text className="text-white text-sm font-medium">Book Again</Text>
                </TouchableOpacity>
              ) : (
                <View className="flex-1 ml-2" />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Empty State component
  const EmptyState = ({ icon, title, message }) => (
    <Animated.View 
      entering={FadeInDown.delay(200)}
      className="mx-6 my-8 bg-white p-6 rounded-lg items-center"
      style={{
        shadowColor: "#0ea5e9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 1
      }}
    >
      <View className="bg-sky-50 w-16 h-16 rounded-full items-center justify-center mb-4">
        <Ionicons name={icon} size={28} color="#0ea5e9" />
      </View>
      <Text className="text-gray-800 font-medium text-lg text-center">{title}</Text>
      <Text className="text-gray-500 text-center mt-2 text-sm">{message}</Text>
      
      <TouchableOpacity 
        className="mt-6 bg-orange-400 px-6 py-3 rounded-md"
        onPress={() => router.push('/(root)/(tabs)')}
      >
        <Text className="text-white font-medium text-sm">Browse Available Items</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Loading indicator with minimalist design
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <View className="items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="text-sky-500 mt-4 text-sm font-medium">Loading your bookings</Text>
          <View className="h-1 w-32 mt-4 bg-gray-100 rounded-full overflow-hidden">
            <Animated.View 
              className="h-full bg-orange-400"
              entering={FadeInRight}
              style={{
                width: '70%',
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Success/Error Alert */}
        <CustomAlert
          visible={alertVisible}
          type={alertType}
          message={alertMessage}
          onClose={() => setAlertVisible(false)}
          bookingType={bookingToCancel?.type || 'ROOM'}
        />

        {/* Confirmation alert with Yes/No buttons */}
        <Modal
          transparent
          visible={showConfirmAlert}
          animationType="fade"
          onRequestClose={() => setShowConfirmAlert(false)}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-20">
            <View className="w-11/12 rounded-xl p-5 bg-yellow-50 border border-yellow-200 shadow-lg">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 bg-yellow-500 rounded-full items-center justify-center mr-3">
                    <Ionicons name="warning" size={18} color="white" />
                  </View>
                  <Text className="text-yellow-800 font-bold text-lg">
                    Confirm Cancellation
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowConfirmAlert(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-700 mb-4 pl-11">
                Are you sure you want to cancel this booking?
              </Text>
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setShowConfirmAlert(false)}
                  className="flex-1 py-3 bg-gray-200 rounded-lg items-center"
                >
                  <Text className="text-gray-700 font-medium">No, Keep</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmCancel}
                  className="flex-1 py-3 bg-red-500 rounded-lg items-center"
                >
                  <Text className="text-white font-medium">Yes, Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Minimalist Header */}
        <View className="pt-2 pb-4">
          {/* Profile and action buttons */}
          <Animated.View 
            entering={FadeInDown.delay(50)}
            className="flex-row justify-between items-center px-4 mt-2 mb-4"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full overflow-hidden bg-sky-50 items-center justify-center border border-sky-100">
                <Text className="text-sky-500 font-medium">
                  {user?.email ? getInitials(user.email) : 'U'}
                </Text>
              </View>
              <View className="ml-3">
                <Text className="text-gray-400 text-xs">{getGreeting()}</Text>
                <Text className="text-gray-800 text-base font-medium">{user?.name || 'User'}</Text>
              </View>
            </View>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => router.push('/(root)/settings')}
                className="mr-3"
              >
                <View className="w-9 h-9 rounded-full bg-sky-50 items-center justify-center">
                  <Ionicons name="settings-outline" size={18} color="#0ea5e9" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.push('/(root)/notifikasi')}
                className="relative"
              >
                <View className="w-9 h-9 rounded-full bg-sky-50 items-center justify-center">
                  <Ionicons name="notifications-outline" size={18} color="#0ea5e9" />
                </View>
                {notifications > 0 && (
                  <View className="absolute -top-1 -right-1 bg-orange-400 w-5 h-5 rounded-full items-center justify-center border border-white">
                    <Text className="text-white text-xs font-bold">
                      {notifications}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Search Bar with minimalist design */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="mx-4 mb-4"
          >
            <View className="flex-row bg-white rounded-lg px-3 py-2 items-center border border-gray-100">
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                placeholder="Search your bookings..."
                placeholderTextColor="#9ca3af"
                className="flex-1 ml-2 text-gray-700"
                onChangeText={(text) => setSearchQuery(text)}
                value={searchQuery}
                style={{fontSize: 14}}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
          </Animated.View>

          {/* Tab Toggle with minimalist design */}
          <Animated.View 
            entering={FadeInDown.delay(150)}
            className="flex-row justify-center mx-4"
          >
            <View 
              className="flex-row bg-sky-50 rounded-lg p-1 w-full"
            >
              {['Recent', 'Past'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab as "Recent" | "Past")}
                  className={`flex-1 py-2 ${
                    activeTab === tab ? 'bg-white rounded-md' : ''
                  }`}
                  style={{
                    shadowColor: activeTab === tab ? "#0ea5e9" : "transparent",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: activeTab === tab ? 0.1 : 0,
                    shadowRadius: 2,
                    elevation: activeTab === tab ? 1 : 0
                  }}
                >
                  <Text
                    className={`text-center text-sm ${
                      activeTab === tab ? 'text-sky-500 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
          </View>

        {/* Main Content Area with Refresh Control */}
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0ea5e9"]}
              tintColor="#0ea5e9"
            />
          }
        >
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="px-4 flex-row items-center justify-between mb-2"
          >
            <View className="flex-row items-center">
              <View className="w-1 h-4 bg-sky-500 rounded-full mr-2" />
              <Text className="text-gray-800 font-medium">
                {activeTab === "Recent" ? "Your Bookings" : "Past Bookings"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(root)/(tabs)/my-booking')}
              className="flex-row items-center"
            >
              <Text className="text-sky-500 text-sm mr-1">View All</Text>
              <Feather name="chevron-right" size={14} color="#0ea5e9" />
            </TouchableOpacity>
          </Animated.View>

          {/* Bookings List */}
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking, index) => (
              <BookingCard 
                key={`${booking.type}-${booking.booking_id}`} 
                booking={booking}
                index={index}
              />
            ))
          ) : ( 
            <EmptyState
              icon={activeTab === "Recent" ? "calendar-outline" : "checkmark-done-circle-outline"}
              title={`No ${activeTab} Bookings`}
              message={activeTab === "Recent" 
                ? "You don't have any recent bookings. Create a new booking to get started."
                : "You don't have any past bookings yet."
              }
            />
          )} 

          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default Home;