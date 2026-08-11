import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Dimensions } from "react-native";
import { tokenCache } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import { icons } from "@/constants";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const BASE_URL = 'http://20.251.153.107:3001/api';

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

const statusBadge = (status) => {
  let color = "#6B7280", bg = "#F3F4F6", label = status;
  
  switch (status?.toUpperCase()) {
    case "APPROVED":
      color = "#0EA5E9"; // Sky blue
      bg = "#E0F2FE";
      label = "Approved";
      break;
    case "REJECTED":
      color = "#EF4444"; // Red
      bg = "#FEE2E2";
      label = "Rejected";
      break;
    case "CANCELLED":
      color = "#7C3AED"; // Purple
      bg = "#EDE9FE";
      label = "Cancelled";
      break;
    case "EXPIRED":
      color = "#6B7280"; // Gray
      bg = "#F3F4F6";
      label = "Expired";
      break;
    default:
      color = "#6B7280";
      bg = "#F3F4F6";
      label = status;
  }

  return (
    <View style={{ 
      backgroundColor: bg, 
      borderRadius: 12, 
      paddingHorizontal: 10, 
      paddingVertical: 2, 
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: color + '20' // Adding 20% opacity for border
    }}>
      <Text style={{ 
        color, 
        fontWeight: '600', 
        fontSize: 12,
        textTransform: 'capitalize'
      }}>
        {label}
      </Text>
    </View>
  );
};

const getIcon = (type) => {
  if (type?.toUpperCase() === "ROOM") return icons.door;
  if (type?.toUpperCase() === "TRANSPORT") return icons.car;
  return icons.calendar;
};

const Notifikasi = () => {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const processImageUrl = (imageUrl: string | null | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    if (imageUrl === 'null') return undefined;
    
    if (typeof imageUrl === 'string' && (imageUrl.startsWith('E:') || imageUrl.startsWith('C:'))) {
      return `${BASE_URL}/image-proxy?path=${encodeURIComponent(imageUrl)}`;
    }
    
    if (typeof imageUrl === 'string' && imageUrl.includes('//uploads')) {
      return imageUrl.replace('//uploads', '/uploads');
    }
    
    if (typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
      const cleanPath = imageUrl.replace(/^\/+/, '');
      return `http://20.251.153.107:3001/${cleanPath}`;
    }
    
    if (typeof imageUrl === 'string' && imageUrl.includes('j9d3hc82-3001.asse.devtunnels.ms')) {
      return imageUrl.replace('https://j9d3hc82-3001.asse.devtunnels.ms', 'http://20.251.153.107:3001');
    }
    
    return imageUrl;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const authToken = await tokenCache.getToken(AUTH_TOKEN_KEY);
        if (!authToken) {
          setError("Anda belum login. Silakan login terlebih dahulu.");
          return;
        }

        const headers = { 'Authorization': `Bearer ${authToken}` };

        // Get current user ID from profile
        let currentUserId = null;
        if (user && user.id) {
          currentUserId = user.id;
        } else {
          try {
            const profileRes = await axios.get(`${BASE_URL}/auth/profile`, { headers });
            setUser(profileRes.data.user);
            currentUserId = profileRes.data.user.id;
          } catch (error) {
            console.error('Error fetching profile:', error);
            setError("Gagal memuat profil pengguna.");
            return;
          }
        }

        // Fetch bookings
        try {
          const [roomBookingsRes, transportBookingsRes] = await Promise.all([
            axios.get(`${BASE_URL}/room-bookings`, { headers }),
            axios.get(`${BASE_URL}/transport-bookings`, { headers })
          ]);

          // Fetch all rooms to get their details
          const roomsRes = await axios.get(`${BASE_URL}/rooms`, { headers });
          const roomsMap = new Map(roomsRes.data.map(room => [room.room_id, room]));

          // Filter bookings for current user and status
          const filteredRoomBookings = roomBookingsRes.data
            .filter(booking => 
              booking.user_id === currentUserId && 
              ["APPROVED", "REJECTED", "CANCELLED", "EXPIRED"].includes(booking.status?.toUpperCase())
            )
            .map(booking => {
              const roomDetails = roomsMap.get(booking.room_id);
              return {
                ...booking,
                type: 'ROOM' as const,
                itemName: roomDetails?.room_name || 'Unknown Room',
                image: roomDetails?.image ? processImageUrl(roomDetails.image) : null
              };
            });

          // Fetch all transports to get their details
          const transportsRes = await axios.get(`${BASE_URL}/transports`, { headers });
          const transportsMap = new Map(transportsRes.data.map(transport => [transport.transport_id, transport]));

          const filteredTransportBookings = transportBookingsRes.data
            .filter(booking => 
              booking.user_id === currentUserId && 
              ["APPROVED", "REJECTED", "CANCELLED", "EXPIRED"].includes(booking.status?.toUpperCase())
            )
            .map(booking => {
              const transportDetails = transportsMap.get(booking.transport_id);
              return {
                ...booking,
                type: 'TRANSPORT' as const,
                itemName: transportDetails?.vehicle_name || 'Unknown Vehicle',
                image: transportDetails?.image ? processImageUrl(transportDetails.image) : null
              };
            });

          // Combine and sort bookings
          const allBookings = [...filteredRoomBookings, ...filteredTransportBookings]
            .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());

          console.log('Processed Bookings:', JSON.stringify(allBookings[0], null, 2));
          setBookings(allBookings);
        } catch (error) {
          console.error('Error fetching bookings:', error);
          setError("Gagal memuat data notifikasi.");
          setBookings([]);
        }
      } catch (error) {
        console.error('Error:', error);
        setError("Terjadi kesalahan. Silakan coba lagi nanti.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleBookingPress = (booking: IBooking) => {
    if (booking.type === 'ROOM') {
      router.push(`/detail-bookingRoom?id=${booking.booking_id}`);
    } else {
      router.push(`/detail-bookingTransport?id=${booking.booking_id}`);
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="pt-2 pb-4">
          <Animated.View 
            entering={FadeInDown.delay(50)}
            className="flex-row justify-between items-center px-4 mt-2 mb-4"
          >
            <View className="flex-row items-center">
              <TouchableOpacity 
                onPress={() => router.back()}
                className="mr-3"
              >
                <View className="w-9 h-9 rounded-full bg-sky-50 items-center justify-center">
                  <Ionicons name="arrow-back" size={18} color="#0EA5E9" />
                </View>
              </TouchableOpacity>
              <View>
                <Text className="text-gray-400 text-xs">Notifications</Text>
                <Text className="text-gray-800 text-base font-medium">Booking Status</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center bg-white">
            <View className="items-center">
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text className="text-sky-500 mt-4 text-sm font-medium">Loading your notifications</Text>
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
        ) : error ? (
          <View className="flex-1 items-center justify-center">
            <View className="bg-red-50 rounded-full p-5 mb-4">
              <Ionicons name="warning" size={48} color="#EF4444" />
            </View>
            <Text className="text-lg font-bold text-red-800 mb-1">Terjadi Kesalahan</Text>
            <Text className="text-gray-500 text-center max-w-xs px-4">
              {error}
            </Text>
          </View>
        ) : bookings.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="bg-sky-50 rounded-full p-5 mb-4">
              <Ionicons name="notifications-outline" size={48} color="#0EA5E9" />
            </View>
            <Text className="text-lg font-bold text-sky-800 mb-1">No Notifications Yet</Text>
            <Text className="text-gray-500 text-center max-w-xs">
              Semua notifikasi booking yang sudah dikonfirmasi, ditolak, dibatalkan, atau expired akan muncul di sini.
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <Animated.View 
              entering={FadeInDown.delay(200)}
              className="px-4 flex-row items-center justify-between mb-2"
            >
              <View className="flex-row items-center">
                <View className="w-1 h-4 bg-sky-500 rounded-full mr-2" />
                <Text className="text-gray-800 font-medium">Your Notifications</Text>
              </View>
            </Animated.View>

            {bookings.map((booking, index) => (
              <Animated.View
                key={`${booking.type}-${booking.booking_id}`}
                entering={FadeInDown.delay(index * 50)}
                className="mb-3"
              >
                <TouchableOpacity
                  onPress={() => handleBookingPress(booking)}
                  className="flex-row items-center px-4 py-3 bg-white rounded-xl mx-4"
                >
                  {/* Left Icon/Image */}
                  <View className="w-12 h-12 rounded-lg overflow-hidden mr-3">
                    {booking.image ? (
                      <Image
                        source={{ uri: booking.image }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full bg-sky-50 items-center justify-center">
                        <Ionicons 
                          name={booking.type === 'ROOM' ? 'business-outline' : 'car-outline'} 
                          size={24} 
                          color="#0EA5E9" 
                        />
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1 mr-3">
                    {/* Title and Status Row */}
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-gray-800 font-semibold text-sm flex-1 mr-2" numberOfLines={1}>
                        {booking.agenda || (booking.type === 'ROOM' ? 'Room Booking' : 'Transport Booking')}
                      </Text>
                      {statusBadge(booking.status)}
                    </View>

                    {/* Room/Vehicle Name */}
                    <View className="flex-row items-center mb-1">
                      <Ionicons 
                        name={booking.type === 'ROOM' ? 'business-outline' : 'car-outline'} 
                        size={14} 
                        color="#6B7280" 
                      />
                      <Text className="text-gray-600 text-xs ml-1 flex-1" numberOfLines={1}>
                        {booking.itemName}
                      </Text>
                    </View>

                    {/* Date and Time Row */}
                    <View className="flex-row items-center">
                      <View className="flex-row items-center mr-3">
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">
                          {new Date(booking.booking_date).toLocaleDateString('id-ID', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">
                          {booking.start_time} - {booking.end_time}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Right Arrow */}
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
};

export default Notifikasi;