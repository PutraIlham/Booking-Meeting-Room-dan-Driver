import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Modal, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { images } from "@/constants";
import { tokenCache } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import { LinearGradient } from 'expo-linear-gradient';

// ==================
// Custom Alert Component
// ==================
const CustomAlert = ({ 
  visible, 
  type = 'success',
  title = '', 
  message = '', 
  onClose = () => {},
  autoClose = true,
  duration = 3000,
  bookingType = 'TRANSPORT'
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

interface IApprovalStatus {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  feedback?: string;
  approverName?: string;
  approvedAt?: string;
}

interface IBooking {
  id: string;
  type: 'ROOM' | 'TRANSPORT';
  pic: string;
  section: string;
  agenda: string;
  roomName?: string;
  vehicleName?: string;
  driverName?: string;
  capacity?: string;
  image?: string;
  destination?: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  isOngoing: boolean;
  approval: IApprovalStatus;
  transportId?: number; 
}

const DetailBookingTransport = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookingDetail, setBookingDetail] = useState<IBooking | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('success');
  const [alertMessage, setAlertMessage] = useState('');
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  
  const showCancellationAlert = () => {
    setAlertType('success');
    setAlertMessage('Your booking has been cancelled successfully');
    setAlertVisible(true);
    
    // Use router.redirect to refresh the page after cancellation
    setTimeout(() => {
      router.replace('/(root)/(tabs)/my-booking'); // Adjust this path to your actual bookings list page
    }, 2000);
  };
  
  const processImageUrl = (imageUrl: string | null | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    
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
    
    console.log("Processed image URL:", imageUrl);
    return imageUrl;
  };
  
  useEffect(() => {
    const fetchBookingDetail = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
    
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
    
        const axiosInstance = axios.create({
          baseURL: 'http://20.251.153.107:3001/api',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
    
        // Handle axios errors globally
        axiosInstance.interceptors.response.use(
          response => response,
          error => {
            if (error.response?.status === 401) {
              tokenCache.removeToken(AUTH_TOKEN_KEY);
              router.push('/(auth)/sign-in');
            }
            return Promise.reject(error);
          }
        );
    
        // Get transport booking details
        const bookingResponse = await axiosInstance.get(`/transport-bookings/${id}`);
        const bookingData = bookingResponse.data;
    
        // Get transport details
        const transportResponse = await axiosInstance.get(`/transports/${bookingData.transport_id}`);
        const transportData = transportResponse.data;
        
        // Process the transport image URL using our utility function
        let processedImageUrl;
        if (transportData.image) {
          processedImageUrl = processImageUrl(transportData.image);
          console.log("Transport image found:", transportData.image);
          console.log("Processed to:", processedImageUrl);
        } else {
          console.log("No image found in transport data");
        }
    
        // Get approver details if exists
        let approverName;
        if (bookingData.approved_by) {
          const approverResponse = await axiosInstance.get(`/users/${bookingData.approved_by}`);
          approverName = `${approverResponse.data.first_name} ${approverResponse.data.last_name}`;
        }
    
        // Check if the booking is expired (for PENDING bookings)
        let bookingStatus = bookingData.status.toUpperCase();
        if (bookingStatus === 'PENDING') {
          const now = new Date();
          const bookingDate = new Date(bookingData.booking_date);
          
          // Parse end time
          const endTimeParts = bookingData.end_time.split(':');
          if (endTimeParts.length >= 2) {
            bookingDate.setHours(parseInt(endTimeParts[0]), parseInt(endTimeParts[1]));
          }
          
          // If the booking end time is in the past and status is PENDING, mark as EXPIRED
          if (bookingDate < now) {
            bookingStatus = 'EXPIRED';
          }
        }
    
        const mappedBooking: IBooking = {
          id: bookingData.booking_id.toString(),
          type: 'TRANSPORT',
          pic: bookingData.pic || "Not assigned",
          section: bookingData.section || "No section",
          agenda: bookingData.agenda || "No agenda",
          vehicleName: transportData.vehicle_name || "Unknown Vehicle",
          driverName: transportData.driver_name || "Unknown Driver",
          capacity: transportData.capacity.toString() || "Unknown Capacity",
          image: processedImageUrl, // Use the processed image URL
          destination: bookingData.destination || "No destination",
          date: bookingData.booking_date,
          startTime: bookingData.start_time,
          endTime: bookingData.end_time,
          description: bookingData.description,
          isOngoing: false,
          transportId: bookingData.transport_id, 
          approval: {
            status: bookingStatus as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED',
            approverName: approverName,
            approvedAt: bookingData.approved_at ? new Date(bookingData.approved_at).toISOString() : undefined,
            feedback: bookingData.notes || undefined,
          },
        };
    
        setBookingDetail(mappedBooking);
      } catch (error) {
        console.error("Error fetching booking details: ", error);
        setAlertType('error');
        setAlertMessage('Failed to fetch booking details. Please try again later.');
        setAlertVisible(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetail();
  }, [id]);

  const DetailRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row py-3 border-b border-gray-100">
      <View className="w-1/3">
        <Text className="text-gray-500 text-base">{label}</Text>
      </View>
      <View className="w-2/3">
        <Text className="text-gray-800 text-base font-medium">{value}</Text>
      </View>
    </View>
  );

  const getStatusTheme = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          gradientColors: ['#FFFFFFFF', '#FFFFFFFF'],
          headerGradient: ['#10B981', '#059669'],
          iconBg: 'bg-green-50',
          iconColor: '#10B981',
          textColor: 'text-green-800',
          cardBg: 'bg-green-50',
          buttonBg: 'bg-emerald-600',
          secondaryButtonBg: 'bg-emerald-50',
          secondaryButtonText: 'text-emerald-700',
          icon: 'checkmark-circle',
          illustration: images.success || images.profile1,
          message: "Your transport is confirmed and ready to go!",
          statusText: "Confirmed",
          statusBadgeBg: 'bg-green-100',
          iconSize: 24
        };
      case 'REJECTED':
        return {
          gradientColors: ['#FFFFFFFF', '#FFFFFFFF'],
          headerGradient: ['#EF4444', '#DC2626'],
          iconBg: 'bg-red-50',
          iconColor: '#EF4444',
          textColor: 'text-red-800',
          cardBg: 'bg-red-50',
          buttonBg: 'bg-red-600',
          secondaryButtonBg: 'bg-red-50',
          secondaryButtonText: 'text-red-700',
          icon: 'close-circle',
          illustration: images.rejected || images.profile1,
          message: "Unfortunately, your booking couldn't be processed.",
          statusText: "Rejected",
          statusBadgeBg: 'bg-red-100',
          iconSize: 24
        };
      case 'EXPIRED':
        return {
          gradientColors: ['#FFFFFFFF', '#FFFFFFFF'],
          headerGradient: ['#6B7280', '#4B5563'],
          iconBg: 'bg-gray-50',
          iconColor: '#6B7280',
          textColor: 'text-gray-800',
          cardBg: 'bg-gray-50',
          buttonBg: 'bg-gray-600',
          secondaryButtonBg: 'bg-gray-50',
          secondaryButtonText: 'text-gray-700',
          icon: 'time-outline',
          illustration: images.expired || images.profile1,
          message: "This booking has expired and is no longer valid.",
          statusText: "Expired",
          statusBadgeBg: 'bg-gray-100',
          iconSize: 24
        };
      case 'CANCELLED':
        return {
          gradientColors: ['#FFFFFFFF', '#FFFFFFFF'],
          headerGradient: ['#7C3AED', '#6D28D9'], // Purple gradient for cancelled
          iconBg: 'bg-purple-50',
          iconColor: '#7C3AED',
          textColor: 'text-purple-800',
          cardBg: 'bg-purple-50',
          buttonBg: 'bg-purple-600',
          secondaryButtonBg: 'bg-purple-50',
          secondaryButtonText: 'text-purple-700',
          icon: 'close-circle-outline',
          illustration: images.cancelled || images.profile1,
          message: "This booking has been cancelled by you or admin.",
          statusText: "Cancelled",
          statusBadgeBg: 'bg-purple-100',
          iconSize: 24
        };
      default:
        return {
          gradientColors: ['#FFFFFFFF', '#FFFFFFFF'],
          headerGradient: ['#F59E0B', '#D97706'],
          iconBg: 'bg-yellow-50',
          iconColor: '#F59E0B',
          textColor: 'text-yellow-800',
          cardBg: 'bg-yellow-50',
          buttonBg: 'bg-amber-500',
          secondaryButtonBg: 'bg-amber-50',
          secondaryButtonText: 'text-amber-700',
          icon: 'time',
          illustration: images.pending || images.profile1,
          message: "Your booking is being reviewed. We'll update you soon.",
          statusText: "Pending",
          statusBadgeBg: 'bg-yellow-100',
          iconSize: 24
        };
    }
  };

  const handleReschedule = () => {
    if (bookingDetail) {
      router.push(`/reschedule-booking?id=${bookingDetail.id}`);
    }
  };

  const handleBookAgain = () => {
    if (bookingDetail) {
      // Navigate to booking page with existing data - use the correct property name
      const transportData = {
        pathname: '/booking-transport',
        params: { 
          // Use transportId instead of transport_id
          selectedTransportId: bookingDetail.transportId?.toString() || '',
          selectedTransportName: bookingDetail.vehicleName || '',
          pic: bookingDetail.pic || '',
          section: bookingDetail.section || '',
          agenda: bookingDetail.agenda || '',
          description: bookingDetail.description || '',
          destination: bookingDetail.destination || '',
          bookAgain: 'true' // Flag to show alert on booking page
        }
      };
      
      // For debugging
      console.log('Transport booking params:', transportData);
      
      router.push(transportData);
    }
  };

  // Show custom confirmation dialog instead of native Alert
  const handleCancel = () => {
    setShowConfirmAlert(true);
  };

  // Handle the actual cancellation after confirmation
  const handleConfirmCancel = async () => {
    setShowConfirmAlert(false);
    
    try {
      if (!id) return;
      
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

      // Show loading indicator
      setLoading(true);

      const axiosInstance = axios.create({
        baseURL: 'http://20.251.153.107:3001/api',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Update the booking status to CANCELLED
      await axiosInstance.put(`/transport-bookings/${id}`, {
        status: 'CANCELLED'
      });

      // Hide loading indicator
      setLoading(false);
      
      // Show success message
      showCancellationAlert();
      
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setLoading(false);
      setAlertType('error');
      setAlertMessage('Failed to cancel booking. Please try again.');
      setAlertVisible(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (!bookingDetail) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text className="text-gray-500 text-lg">Booking not found</Text>
      </SafeAreaView>
    );
  }

  const theme = getStatusTheme(bookingDetail.approval.status);
  const isPendingStatus = bookingDetail.approval.status === 'PENDING';
  const isApprovedStatus = bookingDetail.approval.status === 'APPROVED';
  const isExpiredStatus = bookingDetail.approval.status === 'EXPIRED';
  const isCancelledStatus = bookingDetail.approval.status === 'CANCELLED';

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.gradientColors[1] }}>
      {/* Regular alert for messages */}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        bookingType={bookingDetail?.type || 'TRANSPORT'}
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
      
      {/* Themed Header */}
      <LinearGradient
        colors={theme.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="shadow-lg rounded-b-3xl"
      >
        <View className="px-4 pt-4 pb-8">
          {/* Back button & status text */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center bg-white/20 rounded-full"
            >
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              Transport Booking
            </Text>
            <View style={{ width: 40 }} />
          </View>
          
          {/* Status banner */}
          <View className="mt-6 items-center">
            <View className={`${theme.iconBg} p-4 rounded-full mb-3`}>
              <Ionicons name={theme.icon} size={36} color={theme.iconColor} />
            </View>
            <Text className="text-white text-xl font-bold mb-1">
              {bookingDetail.approval.status === 'APPROVED' ? 'Booking Confirmed!' : 
               bookingDetail.approval.status === 'REJECTED' ? 'Booking Rejected' : 
               bookingDetail.approval.status === 'EXPIRED' ? 'Booking Expired' :
               bookingDetail.approval.status === 'CANCELLED' ? 'Booking Cancelled' : 'Booking Pending'}
            </Text>
            <Text className="text-white/90 text-center max-w-xs">
              {theme.message}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Booking ID Card */}
        <View className={`${theme.cardBg} rounded-xl p-4 shadow-sm mb-4`}>
          <View className="flex-row items-center justify-between mb-2">
            <Text className={`${theme.textColor} font-semibold`}>Booking Status</Text>
            <View className={`px-3 py-1 rounded-full ${theme.statusBadgeBg} flex-row items-center`}>
              <Ionicons name={theme.icon} size={14} color={theme.iconColor} />
              <Text className={`${theme.textColor} ml-1 font-medium text-sm`}>
                {theme.statusText}
              </Text>
            </View>
          </View>
          <View className="flex-row justify-between border-t border-gray-200/50 pt-2 mt-1">
            <Text className="text-gray-500">Booking ID</Text>
            <Text className="font-medium">#{bookingDetail.id}</Text>
          </View>
          <View className="flex-row justify-between pt-2">
            <Text className="text-gray-500">Booked On</Text>
            <Text className="font-medium">{bookingDetail.date}</Text>
          </View>
        </View>

        {/* Vehicle details card */}
        <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <View className="border-b border-gray-100 p-4">
            <Text className="text-gray-800 font-semibold text-lg">Vehicle Details</Text>
          </View>
          
          {/* Vehicle image */}
          <View className="w-full h-48 bg-gray-100">
          <Image
          source={bookingDetail.image ? { uri: bookingDetail.image } : images.profile1}
          className="w-full h-full"
          resizeMode="cover"
          defaultSource={images.profile1}
          onError={(e) => {
            console.log(`Transport image loading error for ID ${bookingDetail.id}:`, e.nativeEvent.error);
            console.log(`Attempted to load image URL: ${bookingDetail.image}`);
          }}
        />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              className="absolute bottom-0 left-0 right-0 p-4"
            >
              <Text className="text-white font-bold text-lg">{bookingDetail.vehicleName}</Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="car" size={14} color="#F59E0B" />
                <Text className="text-white text-xs ml-1">Transport</Text>
              </View>
            </LinearGradient>
          </View>
          
          {/* Info rows with icons */}
          <View className="p-4">
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className={`w-10 h-10 ${theme.iconBg} rounded-full items-center justify-center`}>
                <Ionicons name="information-outline" size={20} color={theme.iconColor} />
              </View>
              <View className="ml-3">
                <Text className="text-gray-500 text-sm">Agenda</Text>
                <Text className="text-gray-800 font-medium">{bookingDetail.agenda}</Text>
              </View>
            </View> 

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className={`w-10 h-10 ${theme.iconBg} rounded-full items-center justify-center`}>
                <Ionicons name="person-outline" size={20} color={theme.iconColor} />
              </View>
              <View className="ml-3">
                <Text className="text-gray-500 text-sm">Driver</Text>
                <Text className="text-gray-800 font-medium">{bookingDetail.driverName}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className={`w-10 h-10 ${theme.iconBg} rounded-full items-center justify-center`}>
                <Ionicons name="people-outline" size={20} color={theme.iconColor} />
              </View>
              <View className="ml-3">
                <Text className="text-gray-500 text-sm">Capacity</Text>
                <Text className="text-gray-800 font-medium">{bookingDetail.capacity} passengers</Text>
              </View>
            </View>
            
            <View className="flex-row items-center py-3">
              <View className={`w-10 h-10 ${theme.iconBg} rounded-full items-center justify-center`}>
                <Ionicons name="location-outline" size={20} color={theme.iconColor} />
              </View>
              <View className="ml-3">
                <Text className="text-gray-500 text-sm">Destination</Text>
                <Text className="text-gray-800 font-medium">{bookingDetail.destination}</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Trip information with timeline */}
        <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <View className="border-b border-gray-100 p-4 flex-row justify-between items-center">
            <Text className="text-gray-800 font-semibold text-lg">Trip Schedule</Text>
            {/* Only show "Change" button if status is PENDING */}
            {isPendingStatus && (
              <TouchableOpacity 
                onPress={handleReschedule}
                className={`py-1 px-3 rounded-full ${theme.secondaryButtonBg}`}
              >
                <Text className={theme.secondaryButtonText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View className="p-4">
          <View className="flex-row items-center mb-4">
              <View className={`w-10 h-10 ${theme.iconBg} rounded-full items-center justify-center`}>
                <Ionicons name="calendar-outline" size={20} color={theme.iconColor} />
              </View>
              <View className="ml-3">
                <Text className="text-gray-500 text-sm">Date</Text>
                <Text className="text-gray-800 font-medium">{bookingDetail.date}</Text>
              </View>
            </View>
            
            {/* Timeline visualization */}
            <View className="flex-row justify-between px-4 py-6">
              <View className="items-center">
                <Text className="text-gray-500 text-xs mb-1">Departure</Text>
                <Text className="text-gray-800 font-bold text-lg">{bookingDetail.startTime}</Text>
              </View>
              
              <View className="flex-row items-center px-4 flex-1 mx-2">
                <View className={`h-3 w-3 rounded-full ${theme.iconColor}`}></View>
                <View className={`h-0.5 flex-1 ${theme.cardBg}`}></View>
                <View className={`h-3 w-3 rounded-full ${theme.iconColor}`}></View>
              </View>
              
              <View className="items-center">
                <Text className="text-gray-500 text-xs mb-1">Arrival</Text>
                <Text className="text-gray-800 font-bold text-lg">{bookingDetail.endTime}</Text>
              </View>
            </View>

            {/* Trip status */}
            <View className={`${theme.cardBg} rounded-lg p-3 my-2 flex-row items-center`}>
              <Ionicons name="information-circle-outline" size={18} color={theme.iconColor} />
              <Text className={`${theme.textColor} ml-2 text-sm`}>
                {bookingDetail.isOngoing ? 'This trip is currently ongoing' : 'This trip is scheduled'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Booking details */}
        <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
          <View className="border-b border-gray-100 p-4">
            <Text className="text-gray-800 font-semibold text-lg">Booking Information</Text>
          </View>
          
          <View className="p-4">
            <DetailRow label="Section" value={bookingDetail.section} />
            <DetailRow label="PIC" value={bookingDetail.pic} />
            <View className="py-3 border-b border-gray-100">
              <Text className="text-gray-500 mb-1">Description</Text>
              <Text className="text-gray-800">{bookingDetail.description}</Text>
            </View>
            <View className="py-3">
              <Text className="text-gray-500 mb-1">Transport Type</Text>
              <Text className="text-gray-800">{bookingDetail.vehicleName}</Text>
            </View>
          </View>
        </View>
        
        {/* Approval Information */}
        {bookingDetail.approval.approverName && (
          <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
            <View className="border-b border-gray-100 p-4">
              <Text className="text-gray-800 font-semibold text-lg">Approval Information</Text>
            </View>
            
            <View className="p-4">
              <DetailRow label="Approved By" value={bookingDetail.approval.approverName} />
              {bookingDetail.approval.approvedAt && (
                <DetailRow 
                  label="Approved At" 
                  value={new Date(bookingDetail.approval.approvedAt).toLocaleString()} 
                />
              )}
              {/* Status badge */}
              <View className="flex-row justify-end mt-2">
                <View className={`px-3 py-1 rounded-full ${theme.statusBadgeBg} flex-row items-center`}>
                  <Ionicons name={theme.icon} size={14} color={theme.iconColor} />
                  <Text className={`${theme.textColor} ml-1 font-medium text-sm`}>
                    {bookingDetail.approval.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Feedback with styled card */}
        {bookingDetail.approval.feedback && (
          <View className={`${theme.cardBg} rounded-xl shadow-sm mb-4 p-4`}>
            <View className="flex-row items-center mb-3">
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.iconColor} />
              <Text className={`${theme.textColor} font-semibold ml-2`}>Feedback</Text>
            </View>
            <View className="bg-white p-3 rounded-lg">
              <Text className="text-gray-700 italic">"{bookingDetail.approval.feedback}"</Text>
            </View>
          </View>
        )}

        {/* Cancelled booking notice */}
        {isCancelledStatus && (
          <View className={`${theme.cardBg} rounded-xl shadow-sm mb-4 p-4`}>
            <View className="flex-row items-start">
              <Ionicons name="close-circle-outline" size={24} color={theme.iconColor} />
              <View className="ml-3 flex-1">
                <Text className={`${theme.textColor} font-semibold`}>Booking Cancelled</Text>
                <Text className="text-gray-600 mt-1">
                  This booking has been cancelled. You can book this transport again if you still need it.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Expired notice (only shown for expired bookings) */}
        {isExpiredStatus && (
          <View className={`${theme.cardBg} rounded-xl shadow-sm mb-4 p-4`}>
            <View className="flex-row items-start">
              <Ionicons name="alert-circle-outline" size={24} color={theme.iconColor} />
              <View className="ml-3 flex-1">
                <Text className={`${theme.textColor} font-semibold`}>Expired Booking</Text>
                <Text className="text-gray-600 mt-1">
                  This booking has expired because the scheduled time has passed. You can book this transport again if you still need it.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons - Only show if status is PENDING */}
        {isPendingStatus && (
          <View className="flex-row mb-4">
            <TouchableOpacity 
              onPress={handleReschedule}
              className={`flex-1 py-4 rounded-xl mr-2 items-center shadow-sm ${theme.buttonBg}`}
            >
              <Text className="text-white font-semibold">Reschedule</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleCancel}
              className="flex-1 bg-white py-4 rounded-xl ml-2 items-center shadow-sm border border-gray-200"
            >
              <Text className="text-red-500 font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Book Again button for APPROVED bookings */}
        {isApprovedStatus && (
          <TouchableOpacity 
            onPress={handleBookAgain}
            className={`mb-4 py-4 rounded-xl items-center shadow-sm ${theme.buttonBg}`}
          >
            <Text className="text-white font-semibold">Book Again</Text>
          </TouchableOpacity>
        )}

        {/* Book Again button for CANCELLED bookings */}
        {isCancelledStatus && (
          <TouchableOpacity 
            onPress={handleBookAgain}
            className={`mb-4 py-4 rounded-xl items-center shadow-sm ${theme.buttonBg}`}
          >
            <Text className="text-white font-semibold">Book Again</Text>
          </TouchableOpacity>
        )}

        {/* Book Again button for EXPIRED bookings */}
        {isExpiredStatus && (
          <TouchableOpacity 
            onPress={handleBookAgain}
            className={`mb-4 py-4 rounded-xl items-center shadow-sm ${theme.buttonBg}`}
          >
            <Text className="text-white font-semibold">Book Again</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default DetailBookingTransport;