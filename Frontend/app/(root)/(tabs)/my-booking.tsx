import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, TextInput, SafeAreaView, Modal, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { icons } from "@/constants";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { tokenCache } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

interface IApprovalStatus {
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  feedback?: string;
  approverName?: string;
  approvedAt?: string;
}

interface IBooking {
  id: string;
  type: "ROOM" | "TRANSPORT";
  agenda: string;
  date: string;
  start_time: string;
  end_time: string;
  section: string;
  isOngoing: boolean;
  approval: IApprovalStatus;
  vehicleName?: string;
  driverName?: string;
  capacity?: string;
  imageUrl?: string;
  rawDate?: Date;
}

interface FilterOptions {
  type: "ALL" | "ROOM" | "TRANSPORT";
  timeframe: "ALL" | "RECENT" | "PASSED";
  status: "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";
}
 
const MyBooking = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<"BOOKED" | "HISTORY">("BOOKED");
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning' | 'info'>('error');
  const [alertMessage, setAlertMessage] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    type: "ALL",
    timeframe: "ALL",
    status: "ALL",
  });

  // Default image URLs in case API doesn't provide them
  const defaultRoomImageUrl = "https://images.unsplash.com/photo-1606744824163-985d376605aa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80";
  const defaultTransportImageUrl = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80";

  // Utility function to process image URLs
  const processImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) return defaultRoomImageUrl;
    
    // Handle local filesystem paths
    if (imageUrl.startsWith('E:') || imageUrl.startsWith('C:')) {
      return `http://20.251.153.107:3001/api/image-proxy?path=${encodeURIComponent(imageUrl)}`;
    }
    
    // Fix double slash issue
    if (imageUrl.includes('//uploads')) {
      imageUrl = imageUrl.replace('//uploads', '/uploads');
    }
    
    // Add base URL for relative paths
    if (!imageUrl.startsWith('http')) {
      const cleanPath = imageUrl.replace(/^\/+/, '');
      return `http://20.251.153.107:3001/${cleanPath}`;
    }
    
    return imageUrl;
  };

  // Function to determine if a booking is expired
  const getBookingStatus = (status: string, bookingDate: Date, endTime: string) => {
    // If status is already CANCELLED, preserve it
    if (status.toUpperCase() === "CANCELLED") {
      return "CANCELLED";
    }
    
    // If status is not PENDING, return it as is
    if (status.toUpperCase() !== "PENDING") {
      return status.toUpperCase();
    }
    
    // For PENDING status, check if it's expired
    const now = new Date();
    const bookingDateTime = new Date(bookingDate);
    
    // Parse end time
    const endTimeParts = endTime.split(':');
    if (endTimeParts.length >= 2) {
      bookingDateTime.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]));
    }
    
    // If the booking end time is in the past and status is PENDING, mark as EXPIRED
    return bookingDateTime < now ? "EXPIRED" : "PENDING";
  };

  // Add useEffect to fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const authToken = await tokenCache.getToken(AUTH_TOKEN_KEY);
        if (!authToken) {
          setAlertType('error');
          setAlertMessage('Not authenticated');
          setAlertVisible(true);
          setTimeout(() => {
            router.push('/(auth)/sign-in');
          }, 1500);
          return;
        }

        const response = await fetch(
          "http://20.251.153.107:3001/api/auth/profile",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await response.json();
        setUserId(profileData.user.id);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Modify fetchBookings to handle loading state better
  const fetchBookings = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const authToken = await tokenCache.getToken(AUTH_TOKEN_KEY);
    
      if (!authToken) {
        setAlertType('error');
        setAlertMessage('Not authenticated');
        setAlertVisible(true);
        setTimeout(() => {
          router.push('/(auth)/sign-in');
        }, 1500);
        return;
      }
    
      // Fetch booking data directly
      const roomResponse = await fetch(
        "http://20.251.153.107:3001/api/room-bookings",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    
      const transportResponse = await fetch(
        "http://20.251.153.107:3001/api/transport-bookings",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    
      if (!roomResponse.ok || !transportResponse.ok) {
        if (roomResponse.status === 401 || transportResponse.status === 401) {
          await tokenCache.removeToken(AUTH_TOKEN_KEY);
          router.push("/(auth)/sign-in");
          return;
        }
        throw new Error("Failed to fetch bookings");
      }

      const roomData = await roomResponse.json();
      const transportData = await transportResponse.json();
      
      // Create image mappings from room and transport data
      const roomImages: Record<number, string> = {};
      const transportImages: Record<number, string> = {};
      
      // Fetch rooms and transports for image data
      const roomsResponse = await fetch(
        "http://20.251.153.107:3001/api/rooms",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    
      const transportsResponse = await fetch(
        "http://20.251.153.107:3001/api/transports",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (roomsResponse.ok) {
        const roomsData = await roomsResponse.json();
        roomsData.forEach((room: any) => {
          if (room.room_id && room.image) {
            roomImages[room.room_id] = processImageUrl(room.image);
          }
        });
      }
      
      if (transportsResponse.ok) {
        const transportsData = await transportsResponse.json();
        transportsData.forEach((transport: any) => {
          if (transport.transport_id && transport.image) {
            transportImages[transport.transport_id] = processImageUrl(transport.image);
          }
        });
      }
    
      // Process room bookings with images
      const mappedRoomBookings = roomData 
        .filter((item: any) => item.user_id === userId)
        .map((item: any) => {
          const bookingDate = new Date(item.booking_date);
          const formattedBookingDate = `${bookingDate.getDate()} ${bookingDate.toLocaleString('default', { month: 'short' })} ${bookingDate.getFullYear()}`;
          const start_time = item.start_time ? new Date(`1970-01-01T${item.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Invalid Time";
          const end_time = item.end_time ? new Date(`1970-01-01T${item.end_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Invalid Time";
    
          let imageUrl = item.image_url ? processImageUrl(item.image_url) : 
                        roomImages[item.room_id] || defaultRoomImageUrl;
            
          const status = getBookingStatus(
            item.status, 
            bookingDate, 
            item.end_time
          );
    
          return {
            id: item.booking_id.toString(),
            type: "ROOM",
            agenda: item.agenda || "Meeting Room",
            date: formattedBookingDate,
            start_time: start_time,
            end_time: end_time,
            section: item.section || "Office section",
            isOngoing: false,
            approval: {
              status: status as "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED",
              approverName: item.pic,
              approvedAt: item.approved_at ? new Date(item.approved_at).toISOString() : undefined,
              feedback: item.notes || undefined,
            },
            imageUrl: imageUrl,
            rawDate: bookingDate,
          };
        });
    
      // Process transport bookings with images
      const mappedTransportBookings = transportData
        .filter((item: any) => item.user_id === userId)
        .map((item: any) => {
          const bookingDate = new Date(item.booking_date);
          const formattedBookingDate = `${bookingDate.getDate()} ${bookingDate.toLocaleString('default', { month: 'short' })} ${bookingDate.getFullYear()}`;
          const start_time = item.start_time ? new Date(`1970-01-01T${item.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Invalid Time";
          const end_time = item.end_time ? new Date(`1970-01-01T${item.end_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Invalid Time";
    
          let imageUrl = item.image_url ? processImageUrl(item.image_url) : 
                        transportImages[item.transport_id] || defaultTransportImageUrl;
            
          const status = getBookingStatus(
            item.status, 
            bookingDate, 
            item.end_time
          );
    
          return {
            id: item.booking_id.toString(),
            type: "TRANSPORT",
            agenda: item.agenda || "Transport Service",
            date: formattedBookingDate,
            start_time: start_time,
            end_time: end_time,
            section: item.section || "Transport section",
            isOngoing: false,
            approval: {
              status: status as "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED",
              approverName: item.pic,
              approvedAt: item.approved_at ? new Date(item.approved_at).toISOString() : undefined,
              feedback: item.notes || undefined,
            },
            vehicleName: item.vehicle_name || "No vehicle name",
            driverName: item.driver_name || "No driver name",
            capacity: item.capacity || "Not specified",
            imageUrl: imageUrl,
            rawDate: bookingDate,
          };
        });
    
      const allBookings = [...mappedRoomBookings, ...mappedTransportBookings];
      allBookings.sort((a, b) => (b.rawDate?.getTime() || 0) - (a.rawDate?.getTime() || 0));
    
      setBookings(allBookings);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // Modify onRefresh to handle loading state better
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBookings();
    } catch (error) {
      handleError(error);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const filteredBookings = bookings.filter((booking) => {
    // Text search filter
    const matchesSearch =
      booking.agenda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.section.toLowerCase().includes(searchQuery.toLowerCase());

    // Tab filter (active vs history)
    const matchesTab =
      activeTab === "BOOKED"
        ? (booking.approval.status === "APPROVED" || booking.approval.status === "PENDING")
        : (booking.approval.status === "REJECTED" || booking.approval.status === "EXPIRED" || booking.approval.status === "CANCELLED");

    // Type filter (room vs transport)
    const matchesType =
      filterOptions.type === "ALL" ||
      booking.type === filterOptions.type;

    // Status filter
    const matchesStatus =
      filterOptions.status === "ALL" ||
      booking.approval.status === filterOptions.status;

    // Timeframe filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const bookingDate = booking.rawDate;
    const isPassed = bookingDate && bookingDate < today;
    const isRecent = !isPassed;

    const matchesTimeframe =
      filterOptions.timeframe === "ALL" ||
      (filterOptions.timeframe === "RECENT" && isRecent) ||
      (filterOptions.timeframe === "PASSED" && isPassed);

    return matchesSearch && matchesTab && matchesType && matchesStatus && matchesTimeframe;
  });

  const getStatusColorAndBackground = (status: string) => {
    switch (status) {
      case "APPROVED": 
        return { 
          color: "#10B981", // Green text
          background: "rgba(16, 185, 129, 0.1)" // Light green background
        };
      case "PENDING": 
        return { 
          color: "#F59E0B", // Amber text
          background: "rgba(245, 158, 11, 0.1)" // Light amber background
        };
      case "REJECTED": 
        return { 
          color: "#EF4444", // Red text
          background: "rgba(239, 68, 68, 0.1)" // Light red background
        };
      case "EXPIRED": 
        return { 
          color: "#6B7280", // Gray text
          background: "rgba(107, 114, 128, 0.1)" // Light gray background
        };
      case "CANCELLED": 
        return { 
          color: "#7C3AED", // Purple text
          background: "rgba(124, 58, 237, 0.1)" // Light purple background
        };
      default: 
        return { 
          color: "#9CA3AF", // Gray text
          background: "#F3F4F6" // Light gray background
        };
    }
  };

  // Reset filters to default
  const resetFilters = () => {
    setFilterOptions({
      type: "ALL",
      timeframe: "ALL",
      status: "ALL",
    });
  };

  // Apply filters and close modal
  const applyFilters = () => {
    setFilterModalVisible(false);
  };

  // Filter option button component
  const FilterButton = ({ 
    agenda, 
    isActive, 
    onPress 
  }: { 
    agenda: string; 
    isActive: boolean; 
    onPress: () => void 
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 mb-2 ${
        isActive ? "bg-sky-500" : "bg-gray-100"
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          isActive ? "text-white" : "text-gray-600"
        }`}
      >
        {agenda}
      </Text>
    </TouchableOpacity>
  );

  

  // Filter Modal Component
  const FilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filterModalVisible}
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl px-4 pt-4 pb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Filter Bookings</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Filter by type */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-700 mb-2">Booking Type</Text>
            <View className="flex-row flex-wrap">
              <FilterButton 
                agenda="All Types" 
                isActive={filterOptions.type === "ALL"} 
                onPress={() => setFilterOptions({...filterOptions, type: "ALL"})}
              />
              <FilterButton 
                agenda="Room" 
                isActive={filterOptions.type === "ROOM"} 
                onPress={() => setFilterOptions({...filterOptions, type: "ROOM"})}
              />
              <FilterButton 
                agenda="Transport" 
                isActive={filterOptions.type === "TRANSPORT"} 
                onPress={() => setFilterOptions({...filterOptions, type: "TRANSPORT"})}
              />
            </View>
          </View>

          {/* Filter by timeframe */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-700 mb-2">Time Frame</Text>
            <View className="flex-row flex-wrap">
              <FilterButton 
                agenda="All Time" 
                isActive={filterOptions.timeframe === "ALL"} 
                onPress={() => setFilterOptions({...filterOptions, timeframe: "ALL"})}
              />
              <FilterButton 
                agenda="Recent/Upcoming" 
                isActive={filterOptions.timeframe === "RECENT"} 
                onPress={() => setFilterOptions({...filterOptions, timeframe: "RECENT"})}
              />
              <FilterButton 
                agenda="Passed" 
                isActive={filterOptions.timeframe === "PASSED"} 
                onPress={() => setFilterOptions({...filterOptions, timeframe: "PASSED"})}
              />
            </View>
          </View>

          {/* Filter by status */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 mb-2">Status</Text>
            <View className="flex-row flex-wrap">
              <FilterButton 
                agenda="All Status" 
                isActive={filterOptions.status === "ALL"} 
                onPress={() => setFilterOptions({...filterOptions, status: "ALL"})}
              />
              <FilterButton 
                agenda="Pending" 
                isActive={filterOptions.status === "PENDING"} 
                onPress={() => setFilterOptions({...filterOptions, status: "PENDING"})}
              />
              <FilterButton 
                agenda="Approved" 
                isActive={filterOptions.status === "APPROVED"} 
                onPress={() => setFilterOptions({...filterOptions, status: "APPROVED"})}
              />
              <FilterButton 
                agenda="Rejected" 
                isActive={filterOptions.status === "REJECTED"} 
                onPress={() => setFilterOptions({...filterOptions, status: "REJECTED"})}
              />
              <FilterButton 
                agenda="Expired" 
                isActive={filterOptions.status === "EXPIRED"} 
                onPress={() => setFilterOptions({...filterOptions, status: "EXPIRED"})}
              />
              <FilterButton 
                agenda="Cancelled" 
                isActive={filterOptions.status === "CANCELLED"} 
                onPress={() => setFilterOptions({...filterOptions, status: "CANCELLED"})}
              />
            </View>
          </View>

          {/* Action buttons */}
          <View className="flex-row">
            <TouchableOpacity
              onPress={resetFilters}
              className="flex-1 py-3 mr-2 border border-sky-500 rounded-xl"
            >
              <Text className="text-sky-500 font-semibold text-center">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={applyFilters}
              className="flex-1 py-3 ml-2 bg-sky-500 rounded-xl"
            >
              <Text className="text-white font-semibold text-center">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View> 
    </Modal>
  );

  const BookingCard = ({ booking }: { booking: IBooking }) => {
    const handlePress = () => {
      if (booking.type === "ROOM") {
        router.push(`/detail-bookingRoom?id=${booking.id}`);
      } else if (booking.type === "TRANSPORT") {
        router.push(`/detail-bookingTransport?id=${booking.id}`);
      }
    };
   
    const { color, background } = getStatusColorAndBackground(booking.approval.status);
    const defaultImage = booking.type === "ROOM" ? defaultRoomImageUrl : defaultTransportImageUrl;
  
    return (
      <TouchableOpacity
        className="bg-white mx-4 rounded-2xl mb-4 overflow-hidden shadow-sm border border-sky-50"
        onPress={handlePress}
      >
        <View className="flex-row p-4">
          <Image
            source={{ uri: booking.imageUrl || defaultImage }}
            className="w-24 h-24 rounded-lg"
            resizeMode="cover"
            defaultSource={{ uri: defaultImage }}
          />
          <View className="flex-1 pl-4">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-2">
                <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
                  {booking.agenda}
                </Text>
                <View className="flex-row items-center mb-2">
                  <Text className="text-sm text-gray-500" numberOfLines={1}>
                    {booking.section}
                  </Text>
                </View>
              </View>
              <View 
                style={{ backgroundColor: background, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 }}
              >
                <Text style={{ color, fontSize: 12, fontWeight: '500' }}>
                  {booking.approval.status}
                </Text>
              </View>
            </View>
            <View className="mt-2 space-y-1">
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={13} color="#0EA5E9" />
                <Text className="text-xs text-sky-500 font-medium ml-1.5">
                  {booking.date}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="time" size={13} color="#F97316" />
                <Text className="text-xs text-orange-500 font-medium ml-1.5">
                  {booking.start_time} - {booking.end_time}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons 
                  name={booking.type === "ROOM" ? "business" : "car"} 
                  size={13} 
                  color="#6366F1" 
                />
                <Text className="text-xs text-indigo-500 font-medium ml-1.5">
                  {booking.type}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-12">
      <View className="bg-sky-50 w-16 h-16 rounded-full items-center justify-center mb-4">
        <Ionicons name="calendar-outline" size={28} color="#0ea5e9" />
      </View>
      <Text className="text-gray-800 font-medium text-lg text-center">No bookings found</Text>
      <Text className="text-gray-500 text-center mt-2 text-sm">
        Try changing your search or filters
      </Text>
    </View>
  );

  // Active filters indicator
  const hasActiveFilters = 
    filterOptions.type !== "ALL" || 
    filterOptions.timeframe !== "ALL" || 
    filterOptions.status !== "ALL";

  // Function to handle errors
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

  // Add useEffect to fetch bookings when userId changes
  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [userId]);

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Filter Modal */}
        <FilterModal />
        
        {/* Header */}
        <View className="pt-2 pb-4">
          <Animated.View 
            entering={FadeInDown.delay(50)}
            className="px-4 mt-2 mb-4"
          >
            <Text className="text-2xl font-semibold text-gray-800 mb-1">My Booking</Text>
            <Text className="text-gray-500">Manage your room and transportation bookings</Text>
          </Animated.View>

          {/* Search bar and filter button */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="mx-4 mb-4"
          >
            <View className="flex-row items-center space-x-2">
              <View className="flex-1 bg-white rounded-lg px-3 py-2 items-center border border-gray-100 flex-row">
                <Ionicons name="search-outline" size={18} color="#9ca3af" />
                <TextInput
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-2 text-gray-700"
                  style={{fontSize: 14}}
                  placeholderTextColor="#9ca3af"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                className={`p-2 rounded-lg ${hasActiveFilters ? 'bg-sky-500' : 'bg-white border border-gray-100'}`}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons 
                  name="options-outline" 
                  size={20} 
                  color={hasActiveFilters ? '#ffffff' : '#0EA5E9'} 
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Active filters indicators */}
          {hasActiveFilters && (
            <Animated.View 
              entering={FadeInDown.delay(150)}
              className="mx-4 mb-4"
            >
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
              >
                {filterOptions.type !== "ALL" && (
                  <View className="bg-sky-50 rounded-full px-3 py-1 mr-2 flex-row items-center">
                    <Text className="text-sky-700 text-xs">{filterOptions.type}</Text>
                    <TouchableOpacity 
                      onPress={() => setFilterOptions({...filterOptions, type: "ALL"})}
                      className="ml-1"
                    >
                      <Ionicons name="close-circle" size={16} color="#0284C7" />
                    </TouchableOpacity>
                  </View>
                )}
                {filterOptions.timeframe !== "ALL" && (
                  <View className="bg-sky-50 rounded-full px-3 py-1 mr-2 flex-row items-center">
                    <Text className="text-sky-700 text-xs">{filterOptions.timeframe}</Text>
                    <TouchableOpacity 
                      onPress={() => setFilterOptions({...filterOptions, timeframe: "ALL"})}
                      className="ml-1"
                    >
                      <Ionicons name="close-circle" size={16} color="#0284C7" />
                    </TouchableOpacity>
                  </View>
                )}
                {filterOptions.status !== "ALL" && (
                  <View className="bg-sky-50 rounded-full px-3 py-1 mr-2 flex-row items-center">
                    <Text className="text-sky-700 text-xs">{filterOptions.status}</Text>
                    <TouchableOpacity 
                      onPress={() => setFilterOptions({...filterOptions, status: "ALL"})}
                      className="ml-1"
                    >
                      <Ionicons name="close-circle" size={16} color="#0284C7" />
                    </TouchableOpacity>
                  </View>
                )}
                {hasActiveFilters && (
                  <TouchableOpacity 
                    onPress={resetFilters}
                    className="bg-sky-50 rounded-full px-3 py-1"
                  >
                    <Text className="text-sky-700 text-xs">Clear All</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </Animated.View>
          )}

          {/* Tab Toggle */}
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="flex-row justify-center mx-4"
          >
            <View className="flex-row bg-sky-50 rounded-lg p-1 w-full">
              {['Active Bookings', 'History'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab === 'Active Bookings' ? "BOOKED" : "HISTORY")}
                  className={`flex-1 py-2 ${
                    activeTab === (tab === 'Active Bookings' ? "BOOKED" : "HISTORY") ? 'bg-white rounded-md' : ''
                  }`}
                  style={{
                    shadowColor: activeTab === (tab === 'Active Bookings' ? "BOOKED" : "HISTORY") ? "#0ea5e9" : "transparent",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: activeTab === (tab === 'Active Bookings' ? "BOOKED" : "HISTORY") ? 0.1 : 0,
                    shadowRadius: 2,
                    elevation: activeTab === (tab === 'Active Bookings' ? "BOOKED" : "HISTORY") ? 1 : 0
                  }}
                >
                  <Text
                    className={`text-center text-sm ${
                      activeTab === (tab === 'Active Bookings' ? "BOOKED" : "HISTORY") ? 'text-sky-500 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Bookings List */}
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0EA5E9"]}
              tintColor="#0EA5E9"
            />
          }
        >
          <Animated.View 
            entering={FadeInDown.delay(250)}
            className="px-4 flex-row items-center justify-between mb-2"
          >
            <View className="flex-row items-center">
              <View className="w-1 h-4 bg-sky-500 rounded-full mr-2" />
              <Text className="text-gray-800 font-medium">
                {activeTab === "BOOKED" ? "Your Active Bookings" : "Booking History"}
              </Text>
            </View>
          </Animated.View>

          {loading ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#0EA5E9" />
              <Text className="text-sky-500 mt-4 font-normal text-sm">Loading your bookings...</Text>
            </View>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <EmptyState />
          )}
          
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}; 
 
export default MyBooking;