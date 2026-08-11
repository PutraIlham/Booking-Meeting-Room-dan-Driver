import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Modal,
  FlatList,
  Image
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { tokenCache } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import { images } from "@/constants";

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
  
  const colors = type === 'success' ? SUCCESS_COLORS : type === 'error' ? ERROR_COLORS : INFO_COLORS;


  // Move this function outside of CustomAlert component


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
                {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Information')}
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


const getBookedDates = (existingBookings: any[] = []) => {
  if (!existingBookings || existingBookings.length === 0) return {};
  
  const bookedDatesMap: Record<string, boolean> = {};
  
  existingBookings.forEach(booking => {
    if (booking.booking_date) {
      const date = booking.booking_date;
      bookedDatesMap[date] = true;
    }
  });
  
  return bookedDatesMap;
};
const timeToMinutes = (timeString: string) => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const validateBookingAvailability = async () => {
  // Basic validations first
  if (!newDate || !newStartTime || !newEndTime) {
    showAlert("error", "Please select date and time for your booking");
    return false;
  }
  
  if (isDateInPast(newDate)) {
    showAlert("error", "Please select a date that is not in the past");
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(newDate);
  selectedDate.setHours(0, 0, 0, 0);
  
  if (selectedDate.getTime() === today.getTime() && isTimeInPast(newDate, newStartTime)) {
    showAlert("error", "Please select a start time that is not in the past");
    return false;
  }
  
  // Validate time formats and sequence
  const [startHours, startMinutes] = newStartTime.split(":").map(Number);
  const [endHours, endMinutes] = newEndTime.split(":").map(Number);
  
  if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
    showAlert("error", "End time must be after start time");
    return false;
  }
  
  // Only check for conflicts with existing bookings
  console.log(`Checking conflicts for booking on ${newDate} from ${newStartTime} to ${newEndTime}`);
  console.log(`We have ${existingBookings.length} existing bookings to check against`);
  
  // Only check for conflicts if we actually found existing bookings
  if (existingBookings.length > 0) {
    if (hasTimeConflict(newDate, newStartTime, newEndTime, existingBookings, id)) {
      const conflict = getConflictDetails(newDate, newStartTime, newEndTime, existingBookings, id);
      let errorMessage =
        bookingType === "ROOM"
          ? "Booking time conflicts with another reservation for this room"
          : "Booking time conflicts with another transport reservation";
        
      if (conflict) {
        errorMessage += ` (${conflict.startTime} - ${conflict.endTime})`;
        
        // Add details about who booked the conflicting slot if available
        if (conflict.pic) {
          errorMessage += `, booked by ${conflict.pic}`;
        }
        
        if (conflict.section) {
          errorMessage += ` from ${conflict.section}`;
        }
      }
      
      showAlert("error", errorMessage);
      return false;
    }
  } else {
    console.log("No existing bookings to check for conflicts");
  }
  
  // Additional validations (unchanged)
  // Calculate duration in minutes
  const startTimeMinutes = timeToMinutes(newStartTime);
  const endTimeMinutes = timeToMinutes(newEndTime);
  const durationMinutes = endTimeMinutes - startTimeMinutes;
  
  // Check if booking duration is reasonable
  if (durationMinutes > 8 * 60) { // 8 hours
    showAlert("warning", "Your booking is quite long (over 8 hours). Please confirm this is correct.");
    // Not blocking, just warning
  }
  
  // Check if the booking is outside business hours (but don't block it)
  const businessStartTime = "08:00";
  const businessEndTime = "17:00";
  
  if (newStartTime < businessStartTime || newEndTime > businessEndTime) {
    showAlert("warning", "This booking is outside standard business hours (8:00 - 17:00)");
    // Allow to continue - not a blocker
  }
  
  return true;
};

const hasBookingsOnDate = (date: string, existingBookings: any[] = []) => {
  if (!date || existingBookings.length === 0) return false;
  const formattedDate = formatApiDate(new Date(date));
  return existingBookings.some(booking => booking.booking_date === formattedDate);
};

// Function to get all bookings for a specific date
const getBookingsForDate = (date: string, existingBookings: any[] = [], currentBookingId: any = null) => {
  if (!date || existingBookings.length === 0) return [];
  const formattedDate = formatApiDate(new Date(date));
  return existingBookings.filter(b => 
    b.booking_date === formattedDate && (currentBookingId === null || b.id !== currentBookingId)
  );
};

const hasTimeConflict = (
  bookingDate: string,
  startTime: string,
  endTime: string,
  existingBookings: any[] = [],
  currentBookingId: any = null
) => {
  if (!bookingDate || !startTime || !endTime || existingBookings.length === 0) return false;
  
  // Properly format the date for comparison
  const formattedDate = formatApiDate(new Date(bookingDate));
  
  // Convert start and end times to minutes
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Filter to only include bookings on the selected date and exclude the current booking
  const bookingsOnDate = existingBookings.filter(b => 
    b.booking_date === formattedDate && b.id !== Number(currentBookingId)
  );
  
  console.log(`Checking for conflicts among ${bookingsOnDate.length} bookings on ${formattedDate}`);

  // Log all bookings for debugging
  if (bookingsOnDate.length > 0) {
    console.log('Bookings to check:', bookingsOnDate.map(b => 
      `ID:${b.id}, Date:${b.booking_date}, Time:${b.start_time}-${b.end_time}`
    ));
  }
  
  // Return true if there's any time conflict with existing bookings
  return bookingsOnDate.some(booking => {
    // Convert booking times to minutes for comparison
    const bookingStart = timeToMinutes(booking.start_time);
    const bookingEnd = timeToMinutes(booking.end_time);
    
    // Check for any overlap in time ranges
    const hasOverlap = (
      // New booking starts during existing booking
      (startMinutes >= bookingStart && startMinutes < bookingEnd) ||
      // New booking ends during existing booking
      (endMinutes > bookingStart && endMinutes <= bookingEnd) ||
      // New booking completely contains existing booking
      (startMinutes <= bookingStart && endMinutes >= bookingEnd)
    );
    
    if (hasOverlap) {
      console.log(`Conflict found with booking ID:${booking.id}, Time:${booking.start_time}-${booking.end_time}`);
    }
    
    return hasOverlap;
  }); 
};

const getConflictDetails = (
  bookingDate: string,
  startTime: string,
  endTime: string,
  existingBookings: any[] = [],
  currentBookingId: any = null
) => {
  if (!bookingDate || !startTime || !endTime || existingBookings.length === 0) return null;
  
  const formattedDate = formatApiDate(new Date(bookingDate));
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  // Filter to only include bookings on the selected date and exclude the current booking
  const bookingsOnDate = existingBookings.filter(b => 
    b.booking_date === formattedDate && b.id !== Number(currentBookingId)
  );
  
  // Find the conflicting booking
  const conflictingBooking = bookingsOnDate.find(booking => {
    const bookingStart = timeToMinutes(booking.start_time);
    const bookingEnd = timeToMinutes(booking.end_time);
    
    return (
      (startMinutes >= bookingStart && startMinutes < bookingEnd) ||
      (endMinutes > bookingStart && endMinutes <= bookingEnd) ||
      (startMinutes <= bookingStart && endMinutes >= bookingEnd)
    );
  });
  
  if (conflictingBooking) {
    return {
      bookingId: conflictingBooking.id,
      startTime: conflictingBooking.start_time,
      endTime: conflictingBooking.end_time,
      pic: conflictingBooking.pic || "Unknown",
      section: conflictingBooking.section || "Unknown department",
      bookingDate: conflictingBooking.booking_date,
      // Add more detailed information
      overlapType: 
        (startMinutes <= timeToMinutes(conflictingBooking.start_time) && 
         endMinutes >= timeToMinutes(conflictingBooking.end_time)) 
         ? "complete" : "partial"
    };
  }
  
  return null;
};

const processImageUrl = (imageUrl) => {
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
  
  return imageUrl;
};

const isDateInPast = (date: string | Date) => {
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate < today;
};

const isTimeInPast = (date: string | Date, timeString: string) => {
  if (!date || !timeString) return false;
  const [hours, minutes] = timeString.split(":").map(Number);
  const selectedDateTime = new Date(date);
  selectedDateTime.setHours(hours, minutes, 0, 0);
  const now = new Date();
  return selectedDateTime < now;
};

const formatApiDate = (date: Date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isValidTimeRange = (start: string, end: string) => {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  if (startHour > endHour) return false;
  if (startHour === endHour && startMinute >= endMinute) return false;
  return true;
};


const DatePickerModal = ({ 
  visible, 
  onClose, 
  date, 
  onDateChange, 
  existingBookings = [] 
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [bookedDates, setBookedDates] = useState({});

  // Set up selected date when component mounts or date changes
  useEffect(() => {
    if (date && visible) {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        if (isDateInPast(dateObj)) {
          setSelectedYear(today.getFullYear());
          setSelectedMonth(today.getMonth());
          setSelectedDay(today.getDate());
        } else {
          setSelectedYear(dateObj.getFullYear());
          setSelectedMonth(dateObj.getMonth());
          setSelectedDay(dateObj.getDate());
        }
      }
    }
  }, [date, visible]);

// Process existingBookings to identify booked dates with improved handling
useEffect(() => {
  if (!visible) return; // Only process when modal is visible
  
  // Log the incoming data to verify what we're working with
  console.log(`DatePickerModal: Processing ${existingBookings.length} bookings to mark dates`);
  
  // Create a map of dates that have bookings
  const bookedDatesMap = {};
  
  if (existingBookings && existingBookings.length > 0) {
    // Log first few bookings for debugging
    console.log("Sample bookings:", existingBookings.slice(0, 3).map(b => ({
      id: b.id,
      date: b.booking_date,
      time: `${b.start_time}-${b.end_time}`
    })));
    
    existingBookings.forEach(booking => {
      if (booking.booking_date) {
        const dateKey = booking.booking_date;
        bookedDatesMap[dateKey] = true;
        console.log(`Marking date as booked: ${dateKey}`);
      }
    });
  }
  
  console.log(`DatePickerModal: Marked ${Object.keys(bookedDatesMap).length} dates as booked`, bookedDatesMap);
  setBookedDates(bookedDatesMap);
}, [existingBookings, visible]);

// Function to check if a specific date has any bookings - with enhanced logging
const isDateBooked = (year, month, day) => {
  const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isBooked = bookedDates[formattedDate] === true;
  
  if (isBooked) {
    console.log(`Date is booked: ${formattedDate}`);
  }
  
  return isBooked;
};

// Render with more visual emphasis on booked dates
const renderCalendarGrid = () => {
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
  const days = [];

  // Empty cells for days of the week before the 1st of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<View key={`empty-${i}`} className="w-10 h-10 m-1" />);
  }

  // Render each day of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(selectedYear, selectedMonth, i);
    const isPastDate = isDateInPast(currentDate);
    const hasBookings = isDateBooked(selectedYear, selectedMonth, i);
    
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";
    
    if (selectedDay === i) {
      bgColor = "bg-orange-500";
      textColor = "text-white";
    } else if (isPastDate) {
      bgColor = "bg-gray-200";
      textColor = "text-gray-400";
    } else if (hasBookings) {
      // Highlight dates with existing bookings - make more prominent
      bgColor = "bg-red-200";
      textColor = "text-red-900";
    }
    
    days.push(
      <TouchableOpacity
        key={i}
        className={`w-10 h-10 items-center justify-center rounded-full m-1 ${bgColor}`}
        onPress={() => {
          if (!isPastDate) {
            setSelectedDay(i);
          }
        }}
        disabled={isPastDate}
      >
        <Text className={`${textColor} ${hasBookings ? 'font-bold' : ''}`}>{i}</Text>
        {hasBookings && (
          <View className="absolute bottom-0.5 w-2 h-2 bg-red-600 rounded-full" />
        )}
      </TouchableOpacity>
    );
  }
  return days;
};

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleConfirm = () => {
    const formattedDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    
    if (isDateInPast(new Date(selectedYear, selectedMonth, selectedDay))) {
      onClose();
      return;
    }
    
    onDateChange(formattedDate);
    onClose();
  };

  // Function to check if a specific date has any bookings


  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];


  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white w-11/12 rounded-2xl p-5 shadow-xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-800 font-bold text-lg">Select Date</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          {/* Date selection status */}
          <View className="bg-sky-50 p-3 rounded-xl mb-4">
            <Text className="text-center text-sky-800 font-medium text-lg">
              {months[selectedMonth]} {selectedDay}, {selectedYear}
            </Text>
          </View>
          
          {/* Legend for booked dates - make it more prominent */}
          <View className="flex-row justify-center items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <View className="flex-row items-center mr-4">
              <View className="w-4 h-4 bg-red-100 rounded-full mr-2 border border-red-400" />
              <Text className="text-gray-700 text-sm font-medium">Booked dates</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-4 h-4 bg-orange-500 rounded-full mr-2" />
              <Text className="text-gray-700 text-sm font-medium">Selected date</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between items-center mb-4">
            <TouchableOpacity
              onPress={() => {
                if (selectedMonth === 0) {
                  setSelectedMonth(11);
                  setSelectedYear(selectedYear - 1);
                } else {
                  setSelectedMonth(selectedMonth - 1);
                }
              }}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="chevron-back" size={24} color="#64748B" />
            </TouchableOpacity>
            <Text className="text-gray-800 font-medium text-lg">
              {months[selectedMonth]} {selectedYear}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (selectedMonth === 11) {
                  setSelectedMonth(0);
                  setSelectedYear(selectedYear + 1);
                } else {
                  setSelectedMonth(selectedMonth + 1);
                }
              }}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
            >
              <Ionicons name="chevron-forward" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View className="flex-row justify-around mb-2">
            {weekDays.map(day => (
              <Text key={day} className="w-10 text-center font-medium text-gray-500">
                {day}
              </Text>
            ))}
          </View>
          <View className="flex-row flex-wrap justify-around">
            {renderCalendarGrid()}
          </View>
          
          {/* Debug info - can be removed in production */}
          {Object.keys(bookedDates).length > 0 && (
            <View className="mt-2 p-2 bg-gray-50 rounded-lg">
              <Text className="text-xs text-gray-500">
                {Object.keys(bookedDates).length} date(s) have existing bookings
              </Text>
            </View>
          )}
          
          <View className="mt-4 flex-row">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-3 bg-gray-200 rounded-lg items-center mr-2"
            >
              <Text className="text-gray-800 font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-3 bg-orange-500 rounded-lg items-center ml-2"
            >
              <Text className="text-white font-medium">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==================
// TimePickerModal Component
// ==================
// ==================
// TimePickerModal Component - Enhanced
// ==================
const TimePickerModal = ({ 
  visible, 
  onClose, 
  time, 
  onTimeChange, 
  title, 
  dateString,
  existingBookings = [],
  currentBookingId = null,
  onAlert = () => {} // Add a prop for alert function with default empty function
}) => {
  const now = new Date();
  const [hours, setHours] = useState("09");
  const [minutes, setMinutes] = useState("00");
  const [showHours, setShowHours] = useState(true);
  const [conflictingSlots, setConflictingSlots] = useState({});

  const isToday = () => {
    if (!dateString) return false;
    const today = new Date();
    const bookingDate = new Date(dateString);
    return (
      today.getDate() === bookingDate.getDate() &&
      today.getMonth() === bookingDate.getMonth() &&
      today.getFullYear() === bookingDate.getFullYear()
    );
  };

  useEffect(() => {
    if (time && visible) {
      const [h, m] = time.split(":");
      setHours(h || "09");
      setMinutes(m || "00");
    } else if (visible) {
      const defaultHour = (now.getHours() + 1).toString().padStart(2, "0");
      setHours(defaultHour);
      setMinutes("00");
    }
  }, [time, visible]);

  // Calculate conflicting time slots based on existing bookings
  useEffect(() => {
    if (!dateString || !visible) {
      setConflictingSlots({});
      return;
    }

    console.log(`Analyzing time conflicts for ${dateString} with ${existingBookings.length} bookings`);
    
    const formattedDate = formatApiDate(new Date(dateString));
    const bookingsOnDate = existingBookings.filter(b => 
      b.booking_date === formattedDate && (currentBookingId === null || b.id !== Number(currentBookingId))
    );

    console.log(`Found ${bookingsOnDate.length} bookings on the selected date`);

    // Generate detailed map of conflicting hours with booking info
    const conflicts = {};
    
    // Mark each hour that has a booking
    bookingsOnDate.forEach(booking => {
      const startTime = booking.start_time;
      const endTime = booking.end_time;
      
      if (startTime && endTime) {
        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Mark each hour in the range as conflicting
        for (let h = startHour; h <= endHour; h++) {
          const hourKey = h.toString().padStart(2, '0');
          
          // Add conflict information to the hour
          if (!conflicts[hourKey]) {
            conflicts[hourKey] = [];
          }
          
          // Store detailed booking info for tooltip/display
          conflicts[hourKey].push({
            id: booking.id,
            startTime,
            endTime,
            pic: booking.pic || 'Unknown',
            section: booking.section || '',
            hourCoverage: h === startHour && h === endHour ? 'partial' : 
                        h === startHour ? 'start' :
                        h === endHour ? 'end' : 'full'
          });
        }
      }
    });
    
    console.log(`Marked ${Object.keys(conflicts).length} hours with conflicts`);
    console.log("Conflicts map:", conflicts);
    
    setConflictingSlots(conflicts);
  }, [dateString, existingBookings, currentBookingId, visible]);

  const handleConfirm = () => {
    const newTime = `${hours}:${minutes}`;
    
    if (isToday()) {
      const selectedTime = new Date();
      selectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      if (selectedTime < now) {
        onAlert("error", "Cannot select a time that has already passed");
        return;
      }
    }
    
    // Warn user if selecting a potentially conflicting time slot
    const hourKey = hours;
    if (conflictingSlots[hourKey] && conflictingSlots[hourKey].length > 0) {
      const conflictsInThisHour = conflictingSlots[hourKey];
      const conflictDetails = conflictsInThisHour[0]; // Use first conflict for warning
      
      onAlert("warning", 
        `This hour already has a booking (${conflictDetails.startTime} - ${conflictDetails.endTime})` +
        (conflictDetails.pic ? ` by ${conflictDetails.pic}` : '') +
        `. Please verify your time doesn't conflict.`
      );
    }
    
    onTimeChange(newTime);
    onClose();
  };

  const renderTimeGrid = (isHours) => {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const items = isHours
      ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
      : Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));
    const selectedValue = isHours ? hours : minutes;
    
    return (
      <FlatList
        data={items}
        numColumns={6}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isPastTime = isToday() && (
            (isHours && parseInt(item) < currentHour) ||
            (!isHours && parseInt(hours) === currentHour && parseInt(item) < currentMinute)
          );
          
          // Check if this hour/minute has potential conflicts
          const hasConflict = isHours && conflictingSlots[item] && conflictingSlots[item].length > 0;
          const conflictSeverity = hasConflict ? 
            conflictingSlots[item].length > 1 ? 'high' : 'medium' : 'none';
          
          let bgColor = "bg-gray-100";
          let textColor = "text-gray-800";
          
          if (selectedValue === item) {
            bgColor = "bg-orange-500";
            textColor = "text-white";
          } else if (isPastTime) {
            bgColor = "bg-gray-200";
            textColor = "text-gray-400";
          } else if (hasConflict) {
            // Highlight hours with existing bookings based on severity
            bgColor = conflictSeverity === 'high' ? "bg-red-200" : "bg-red-100";
            textColor = "text-red-800";
          }
          
          return (
            <TouchableOpacity
              className={`w-10 h-10 items-center justify-center m-1 rounded-lg ${bgColor}`}
              onPress={() => {
                if (!isPastTime) {
                  if (isHours) {
                    setHours(item);
                    if (isToday() && parseInt(item) === currentHour) {
                      const newMinutes = Math.max(currentMinute, parseInt(minutes))
                        .toString()
                        .padStart(2, "0");
                      setMinutes(newMinutes);
                    }
                  } else {
                    setMinutes(item);
                  }
                }
              }}
              disabled={isPastTime}
            >
              <Text
                className={`${textColor} font-medium text-lg`}
              >
                {item}
              </Text>
              {hasConflict && (
                <View className={`absolute bottom-0.5 w-2 h-2 ${
                  conflictSeverity === 'high' ? 'bg-red-600' : 'bg-red-500'
                } rounded-full`} />
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ paddingBottom: 10 }}
      />
    );
  };

  // Don't render anything if not visible
  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white w-11/12 rounded-2xl p-5 shadow-xl">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-800 font-bold text-lg">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          
          {isToday() && (
            <View className="mb-2 bg-sky-50 p-2 rounded-lg">
              <Text className="text-sky-700 text-sm text-center">
                Booking for today - past times are disabled
              </Text>
            </View>
          )}
          
          {/* Legend for conflicting time slots - made more prominent */}
          <View className="mb-2 bg-red-50 p-3 rounded-lg border border-red-100">
            <Text className="text-red-700 text-sm text-center font-medium">
              Hours marked in red have existing bookings
            </Text>
            <Text className="text-red-600 text-xs text-center mt-1">
              Tap to select anyway, but watch for time conflicts
            </Text>
          </View>
          
          <View className="flex-row justify-center items-center py-3 mb-2">
            <TouchableOpacity
              onPress={() => setShowHours(true)}
              className={`px-5 py-2 rounded-lg mr-2 ${showHours ? "bg-sky-500" : "bg-gray-200"}`}
            >
              <Text className={showHours ? "text-white font-medium" : "text-gray-700"}>
                Hours
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowHours(false)}
              className={`px-5 py-2 rounded-lg ml-2 ${!showHours ? "bg-sky-500" : "bg-gray-200"}`}
            >
              <Text className={!showHours ? "text-white font-medium" : "text-gray-700"}>
                Minutes
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row justify-center items-center mb-3">
            <TouchableOpacity onPress={() => setShowHours(true)} className="items-center">
              <Text className={`text-2xl font-medium ${showHours ? "text-sky-500" : "text-gray-800"}`}>{hours}</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-800 mx-2">:</Text>
            <TouchableOpacity onPress={() => setShowHours(false)} className="items-center">
              <Text className={`text-2xl font-medium ${!showHours ? "text-sky-500" : "text-gray-800"}`}>{minutes}</Text>
            </TouchableOpacity>
          </View>
          <View className="border border-gray-200 rounded-lg p-2 bg-white max-h-56">
            {renderTimeGrid(showHours)}
          </View>
          
          {/* Debug info - can be removed in production */}
          {Object.keys(conflictingSlots).length > 0 && (
            <View className="mt-2 p-2 bg-gray-50 rounded-lg">
              <Text className="text-xs text-gray-500">
                {Object.keys(conflictingSlots).length} hour(s) have existing bookings on this date
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            onPress={handleConfirm}
            className="mt-4 py-3 bg-orange-500 rounded-xl items-center"
          >
            <Text className="text-white font-semibold">Confirm Time</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ==================
// RescheduleBooking Component
// ==================
const RescheduleBooking = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true); // Start with loading true
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [bookingType, setBookingType] = useState<string | null>(null); // "ROOM" or "TRANSPORT"
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [destination, setDestination] = useState("");
  const [resourceDetails, setResourceDetails] = useState<any>(null);
  const [bookedDates, setBookedDates] = useState<Record<string, boolean>>({});
  const [timeSlotConflicts, setTimeSlotConflicts] = useState<Record<string, any[]>>({});

  
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (type: string, message: string) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Add useEffect to fetch booking details on component mount
  useEffect(() => {
    if (id) {
      fetchBookingDetails();
    } else {
      setLoading(false);
      showAlert("error", "Booking ID not found");
    }
  }, [id]);

  const fetchBookingDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const authToken = await tokenCache.getToken(AUTH_TOKEN_KEY);
      if (!authToken) {
        showAlert("error", "Not authenticated");
        router.push("/(auth)/sign-in");
        return;
      }
      
      const axiosInstance = axios.create({
        baseURL: "http://20.251.153.107:3001/api",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      
      try {
        // Try to fetch as room booking first
        const roomBookingResponse = await axiosInstance.get(`/room-bookings/${id}`);
        setBookingDetails(roomBookingResponse.data);
        setBookingType("ROOM");
        setNewDate(roomBookingResponse.data.booking_date);
        setNewStartTime(roomBookingResponse.data.start_time);
        setNewEndTime(roomBookingResponse.data.end_time);
        
        // Fetch room details
        if (roomBookingResponse.data.room_id) {
          try {
            const roomResponse = await axiosInstance.get(`/rooms/${roomBookingResponse.data.room_id}`);
            if (roomResponse.data) {
              // Process image URL if it exists
              let roomImageUrl;
              if (roomResponse.data.image) {
                roomImageUrl = processImageUrl(roomResponse.data.image);
                console.log("Processed room image URL:", roomImageUrl);
              }
              
              // Update booking details with room info and processed image
              setBookingDetails(prevDetails => ({
                ...prevDetails,
                room_details: roomResponse.data,
                room_name: roomResponse.data.room_name,
                image: roomImageUrl // Add the processed image URL
              }));
            }
          } catch (roomDetailError) {
            console.error("Error fetching room details:", roomDetailError);
          }
        }
        
        // Fetch all bookings for this room
        await fetchExistingBookings(roomBookingResponse.data.room_id, true);
      } catch (roomError) {
        console.log("Not a room booking, trying transport booking...");
        
        try {
          // If not room booking, try as transport booking
          const transportBookingResponse = await axiosInstance.get(`/transport-bookings/${id}`);
          console.log("Found transport booking:", transportBookingResponse.data);
          
          const transportData = transportBookingResponse.data;
          setBookingDetails(transportData);
          setBookingType("TRANSPORT");
          setNewDate(transportData.booking_date);
          setNewStartTime(transportData.start_time);
          setNewEndTime(transportData.end_time);
          setDestination(transportData.destination || "");
          
          // Find the correct resource ID
          const transportResourceId = transportData.vehicle_id || 
                                    transportData.transport_id || 
                                    transportData.id || 
                                    transportData.booking_id;
          
          console.log("Transport Resource ID candidates:", {
            vehicle_id: transportData.vehicle_id,
            transport_id: transportData.transport_id,
            id: transportData.id,
            booking_id: transportData.booking_id,
            selected: transportResourceId
          });
          
          if (transportResourceId) {
            console.log("Using transportResourceId:", transportResourceId);
            
            try {
              // Try different endpoints for vehicle details
              const endpoints = [
                `/vehicles/${transportResourceId}`,
                `/transports/${transportResourceId}`
              ];
              
              let vehicleDetails = null;
              
              for (const endpoint of endpoints) {
                try {
                  console.log(`Trying to fetch vehicle details from: ${endpoint}`);
                  const vehicleResponse = await axiosInstance.get(endpoint);
                  
                  if (vehicleResponse.data) {
                    vehicleDetails = vehicleResponse.data;
                    console.log(`Successfully retrieved vehicle details from ${endpoint}:`, vehicleDetails);
                    
                    // Process image URL if it exists
                    let vehicleImageUrl;
                    if (vehicleDetails.image) {
                      vehicleImageUrl = processImageUrl(vehicleDetails.image);
                      console.log("Processed vehicle image URL:", vehicleImageUrl);
                    }
                    
                    // Update booking details with vehicle info and processed image
                    setBookingDetails(prevDetails => ({
                      ...prevDetails,
                      vehicle_details: vehicleDetails,
                      vehicle_id: transportResourceId,
                      vehicle_name: vehicleDetails.vehicle_name,
                      image: vehicleImageUrl // Add the processed image URL
                    }));
                    
                    break;
                  }
                } catch (endpointError) {
                  console.log(`Endpoint ${endpoint} failed:`, endpointError.message);
                }
              }
            } catch (vehicleDetailError) {
              console.error("Error fetching vehicle details:", vehicleDetailError);
            }
            
            // Fetch existing transport bookings
            await fetchExistingBookings(transportResourceId, false);
          }
        } catch (transportError) {
          console.error("Error fetching transport booking details:", transportError);
          showAlert("error", "Failed to fetch booking details. Please try again later.");
        }
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      showAlert("error", "Failed to fetch booking details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };


  // Update the fetchExistingBookings function to accommodate transport_id

const fetchExistingBookings = async (resourceId: any, isRoom: boolean = true) => {
  if (!resourceId) {
    console.log("No resourceId provided, cannot fetch bookings");
    return;
  }
  
  try {
    setLoadingBookings(true);
    const authToken = await tokenCache.getToken(AUTH_TOKEN_KEY);
    if (!authToken) {
      showAlert("error", "Not authenticated");
      return;
    }
    
    const axiosInstance = axios.create({
      baseURL: "http://20.251.153.107:3001/api",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
    
    // Convert IDs to numbers for consistent comparison
    const currentBookingId = typeof id === 'string' ? parseInt(id, 10) : id;
    const numericResourceId = typeof resourceId === 'string' ? parseInt(resourceId, 10) : resourceId;
    
    console.log(`Fetching ${isRoom ? 'room' : 'transport'} bookings for resourceId: ${numericResourceId}`);
    
    try {
      const allBookingsEndpoint = isRoom
        ? `/room-bookings`
        : `/transport-bookings`;
      
      console.log(`Using endpoint: ${allBookingsEndpoint}`);
      const response = await axiosInstance.get(allBookingsEndpoint);
      
      let allBookings = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          allBookings = response.data;
        } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
          allBookings = response.data.bookings;
        } else {
          console.log("Unexpected response format:", response.data);
          allBookings = [];
        }
      }
      
      console.log(`Received ${allBookings.length} total bookings`);
      
      // Filter bookings with consistent ID comparison
      const relevantBookings = allBookings.filter(booking => {
        const bookingResourceId = isRoom 
          ? (typeof booking.room_id === 'string' ? parseInt(booking.room_id, 10) : booking.room_id)
          : (typeof (booking.vehicle_id || booking.transport_id) === 'string' 
             ? parseInt(booking.vehicle_id || booking.transport_id, 10) 
             : (booking.vehicle_id || booking.transport_id));
        
        const bookingId = typeof booking.id === 'string' ? parseInt(booking.id, 10) : booking.id;
        
        const isForThisResource = bookingResourceId === numericResourceId;
        const isNotCurrentBooking = bookingId !== currentBookingId;
        
        if (isForThisResource) {
          console.log(`Found booking ${bookingId} for ${isRoom ? 'room' : 'vehicle/transport'} ${numericResourceId}`);
        }
        
        return isForThisResource && isNotCurrentBooking;
      });
      
      console.log(`Filtered to ${relevantBookings.length} bookings for this ${isRoom ? 'room' : 'vehicle/transport'}`);
      
      setExistingBookings(relevantBookings);
      
      // Process booked dates
      const datesMap = {};
      relevantBookings.forEach(booking => {
        if (booking.booking_date) {
          datesMap[booking.booking_date] = true;
        }
      });
      
      setBookedDates(datesMap);
      
      // Process time conflicts
      const conflictsMap = {};
      relevantBookings.forEach(booking => {
        if (booking.booking_date) {
          if (!conflictsMap[booking.booking_date]) {
            conflictsMap[booking.booking_date] = [];
          }
          conflictsMap[booking.booking_date].push(booking);
        }
      });
      
      setTimeSlotConflicts(conflictsMap);
      
    } catch (error) {
      console.error(`Error fetching ${isRoom ? 'room' : 'transport'} bookings:`, error);
      setExistingBookings([]);
      setBookedDates({});
      setTimeSlotConflicts({});
    }
  } catch (error) {
    console.error("Error in fetchExistingBookings:", error);
    setExistingBookings([]);
    setBookedDates({});
    setTimeSlotConflicts({});
  } finally {
    setLoadingBookings(false);
  }
};

  const formatDateForAPI = (date: string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const validateBookingAvailability = async () => {
    // Basic validations first
    if (!newDate || !newStartTime || !newEndTime) {
      showAlert("error", "Please select date and time for your booking");
      return false;
    }
    
    if (isDateInPast(newDate)) {
      showAlert("error", "Please select a date that is not in the past");
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(newDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate.getTime() === today.getTime() && isTimeInPast(newDate, newStartTime)) {
      showAlert("error", "Please select a start time that is not in the past");
      return false;
    }
    
    // Validate time formats and sequence
    const [startHours, startMinutes] = newStartTime.split(":").map(Number);
    const [endHours, endMinutes] = newEndTime.split(":").map(Number);
    
    if (startHours > endHours || (startHours === endHours && startMinutes >= endMinutes)) {
      showAlert("error", "End time must be after start time");
      return false;
    }
    
    // Check for conflicts with existing bookings
    console.log(`Checking conflicts for booking on ${newDate} from ${newStartTime} to ${newEndTime}`);
    console.log(`We have ${existingBookings.length} existing bookings to check against`);
    
    // Only check for conflicts if we actually found existing bookings
    if (existingBookings.length > 0) {
      if (hasTimeConflict(newDate, newStartTime, newEndTime, existingBookings, id)) {
        const conflict = getConflictDetails(newDate, newStartTime, newEndTime, existingBookings, id);
        let errorMessage =
          bookingType === "ROOM"
            ? "Booking time conflicts with another reservation for this room"
            : "Booking time conflicts with another transport reservation";
        
        if (conflict) {
          errorMessage += ` (${conflict.startTime} - ${conflict.endTime})`;
          
          // Add details about who booked the conflicting slot if available
          if (conflict.pic) {
            errorMessage += `, booked by ${conflict.pic}`;
          }
          
          if (conflict.section) {
            errorMessage += ` from ${conflict.section}`;
          }
        }
        
        showAlert("error", errorMessage);
        return false;
      }
    } else {
      console.log("No existing bookings to check for conflicts");
    }
    
    // Additional validations (unchanged)
    // Calculate duration in minutes
    const startTimeMinutes = timeToMinutes(newStartTime);
    const endTimeMinutes = timeToMinutes(newEndTime);
    const durationMinutes = endTimeMinutes - startTimeMinutes;
    
    // Check if booking duration is reasonable
    if (durationMinutes > 8 * 60) { // 8 hours
      showAlert("warning", "Your booking is quite long (over 8 hours). Please confirm this is correct.");
      // Not blocking, just warning
    }
    
    // Check if the booking is outside business hours (but don't block it)
    const businessStartTime = "08:00";
    const businessEndTime = "17:00";
    
    if (newStartTime < businessStartTime || newEndTime > businessEndTime) {
      showAlert("warning", "This booking is outside standard business hours (8:00 - 17:00)");
      // Allow to continue - not a blocker
    }
    
    return true;
  };
  
  // Update DatePickerModal call to pass bookedDates
  {showDatePicker && (
    <DatePickerModal
      visible={showDatePicker}
      onClose={() => setShowDatePicker(false)}
      date={newDate}
      onDateChange={(date) => setNewDate(date)}
      existingBookings={existingBookings} // This passes all the booking data
    />
  )}
  
  // Replace the TimePickerModal components with:
  {showStartTimePicker && (
    <TimePickerModal
      visible={showStartTimePicker}
      onClose={() => setShowStartTimePicker(false)}
      time={newStartTime}
      onTimeChange={(time) => setNewStartTime(time)}
      title="Select Start Time"
      dateString={newDate}
      existingBookings={existingBookings} // Pass all bookings
      currentBookingId={id}
      onAlert={showAlert}
    />
  )}
  
  {showEndTimePicker && (
    <TimePickerModal
      visible={showEndTimePicker}
      onClose={() => setShowEndTimePicker(false)}
      time={newEndTime}
      onTimeChange={(time) => setNewEndTime(time)}
      title="Select End Time"
      dateString={newDate}
      existingBookings={existingBookings} // Pass all bookings
      currentBookingId={id}
      onAlert={showAlert}
    />
  )}

  const handleReschedule = async () => {
    if (!id) {
      showAlert("error", "Booking ID not found");
      return;
    }
    
    // First validate the booking
    const isValid = await validateBookingAvailability();
    if (!isValid) return;
    
    try {
      setLoading(true);
      const authToken = await tokenCache.getToken(AUTH_TOKEN_KEY);
      if (!authToken) {
        showAlert("error", "Not authenticated");
        router.push("/(auth)/sign-in");
        return;
      }
      
      const axiosInstance = axios.create({
        baseURL: "http://20.251.153.107:3001/api",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      
      // Format the date properly
      const formattedDate = formatApiDate(new Date(newDate));
      
      // Validate and format time strings
      const formatTime = (time: string) => {
        if (!time) return null;
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          return null;
        }
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      };

      const formattedStartTime = formatTime(newStartTime);
      const formattedEndTime = formatTime(newEndTime);

      if (!formattedStartTime || !formattedEndTime) {
        showAlert("error", "Invalid time format");
        return;
      }
      
      // Prepare the updated booking data with proper formatting
      const updatedBooking: any = {
        booking_date: formattedDate,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
      };
      
      if (bookingType === "TRANSPORT") {
        if (!destination) {
          showAlert("error", "Destination is required for transport bookings");
          return;
        }
        updatedBooking.destination = destination;
      }
      
      // Validate all required fields
      if (!updatedBooking.booking_date || !updatedBooking.start_time || !updatedBooking.end_time) {
        showAlert("error", "Missing required booking data");
        return;
      }
      
      // Determine the correct endpoint and ID
      const bookingId = typeof id === 'string' ? parseInt(id, 10) : id;
      const endpoint = bookingType === "ROOM" 
        ? `/room-bookings/${bookingId}`
        : `/transport-bookings/${bookingId}`;
      
      const response = await axiosInstance.put(endpoint, updatedBooking);
      
      // Show success message and redirect
      showAlert("success", "Booking rescheduled successfully");
      setTimeout(() => {
        router.replace("/(root)/(tabs)/my-booking");
      }, 1500);
      
    } catch (error: any) {
      // Handle error cases with custom alerts
      if (error.response) {
        if (error.response.status === 500) {
          // If we get a 500 error but the booking was actually updated
          showAlert("success", "Booking rescheduled successfully");
          setTimeout(() => {
            router.replace("/(root)/(tabs)/my-booking");
          }, 1500);
          return;
        }
        
        let errorMessage = "Failed to reschedule booking. Please try again later.";
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 400) {
          errorMessage = "Invalid booking data. Please check your inputs.";
        } else if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please login again.";
          setTimeout(() => {
            router.push("/(auth)/sign-in");
          }, 1500);
        } else if (error.response.status === 409) {
          errorMessage = "This time slot is no longer available. Please select another time.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to reschedule this booking.";
        } else if (error.response.status === 404) {
          errorMessage = "Booking not found. It may have been deleted.";
        }
        
        showAlert("error", errorMessage);
      } else if (error.request) {
        showAlert("error", "No response from server. Please check your internet connection.");
      } else {
        showAlert("error", error.message || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text className="text-sky-700 mt-4 font-medium">Loading booking details...</Text>
      </View>
    );
  }
  
  if (!bookingDetails) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="alert-circle" size={32} color="#EF4444" />
        </View>
        <Text className="text-gray-800 text-xl font-bold mb-2">Booking Not Found</Text>
        <Text className="text-gray-500 text-center mb-6 px-8">
          We couldn't find the booking details. It may have been deleted or the ID is incorrect.
        </Text>
        <TouchableOpacity
          onPress={() => router.replace("/(root)/(tabs)/my-booking")}
          className="mt-2 px-6 py-3 bg-sky-500 rounded-xl"
        >
          <Text className="text-white font-medium">Go back to My Bookings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDateDisplay = (date: string) => {
    const d = new Date(date);
    const day = d.getDate();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getThemeColors = () => {
    return bookingType === "TRANSPORT"
      ? {
          primary: "bg-sky-500",
          secondary: "bg-sky-100",
          text: "text-sky-800",
          icon: "car-outline",
        }
      : {
          primary: "bg-sky-500",
          secondary: "bg-sky-100",
          text: "text-sky-800",
          icon: "business-outline",
        };
  };

  const theme = getThemeColors();

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className={`flex-row items-center space-x-3 ${theme.primary} px-6 pt-12 pb-8 rounded-b-3xl shadow-lg`}>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 justify-center items-center bg-white/20 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-2xl font-bold">
              Reschedule {bookingType === "TRANSPORT" ? "Transport" : "Room"}
            </Text>
            <Text className="text-white text-opacity-90 mt-1">
              Update your {bookingType === "TRANSPORT" ? "transport" : "room"} reservation
            </Text>
          </View>
        </View>

        {/* Current Reservation Card */}
        <View className="mx-5 -mt-5 bg-white p-5 rounded-2xl border border-sky-100 shadow-lg">
          <Text className={`${theme.text} font-bold mb-3 text-lg`}>Current Reservation</Text>
          {bookingType === "TRANSPORT" ? (
  <View className="mb-4">
    <View className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-4">
      <Image
        source={bookingDetails.image ? { uri: bookingDetails.image } : images.profile1}
        className="w-full h-full"
        resizeMode="cover"
        onError={(e) => {
          console.log(`Transport image loading error:`, e.nativeEvent.error);
          console.log(`Attempted to load image: ${bookingDetails.image}`);
        }}
      />
    </View>
    <View className="flex-row items-center mb-4">
      <View className={`w-12 h-12 ${theme.secondary} rounded-full items-center justify-center mr-4`}>
        <Ionicons name="car-outline" size={22} color="#0EA5E9" />
      </View>
      <View>
        <Text className="text-gray-500 text-xs">Vehicle</Text>
        <Text className="text-gray-800 font-medium text-base">
          {bookingDetails.vehicle_name || "N/A"}
        </Text>
      </View>
    </View>
    <View className="flex-row items-center mb-4">
      <View className={`w-12 h-12 ${theme.secondary} rounded-full items-center justify-center mr-4`}>
        <Ionicons name="navigate-outline" size={22} color="#0EA5E9" />
      </View>
      <View>
        <Text className="text-gray-500 text-xs">Destination</Text>
        <Text className="text-gray-800 font-medium text-base">
          {bookingDetails.destination}
        </Text>
      </View>
    </View>
  </View>
) : (
  <View className="mb-4">
    {/* Add room image for room bookings */}
    <View className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden mb-4">
      <Image
        source={bookingDetails.image ? { uri: bookingDetails.image } : (images.roomImage || images.profile1)}
        className="w-full h-full"
        resizeMode="cover"
        onError={(e) => {
          console.log(`Room image loading error:`, e.nativeEvent.error);
          console.log(`Attempted to load image: ${bookingDetails.image}`);
        }}
      />
    </View>
    <View className="flex-row items-center mb-4">
      <View className={`w-12 h-12 ${theme.secondary} rounded-full items-center justify-center mr-4`}>
        <Ionicons name="business-outline" size={22} color="#0EA5E9" />
      </View>
      <View>
        <Text className="text-gray-500 text-xs">Room</Text>
        <Text className="text-gray-800 font-medium text-base">
          {bookingDetails.room_name || "N/A"}
        </Text>
      </View>
    </View>
  </View>
)}
          <View className="flex-row items-center mb-4">
            <View className={`w-12 h-12 ${theme.secondary} rounded-full items-center justify-center mr-4`}>
              <Ionicons name="calendar-outline" size={22} color="#0EA5E9" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs">Date</Text>
              <Text className="text-gray-800 font-medium text-base">
                {formatDateDisplay(bookingDetails.booking_date)}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center mb-4">
            <View className={`w-12 h-12 ${theme.secondary} rounded-full items-center justify-center mr-4`}>
              <Ionicons name="time-outline" size={22} color="#0EA5E9" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs">Start Time</Text>
              <Text className="text-gray-800 font-medium text-base">
                {bookingDetails.start_time}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <View className={`w-12 h-12 ${theme.secondary} rounded-full items-center justify-center mr-4`}>
              <Ionicons name="time-outline" size={22} color="#0EA5E9" />
            </View>
            <View>
              <Text className="text-gray-500 text-xs">End Time</Text>
              <Text className="text-gray-800 font-medium text-base">
                {bookingDetails.end_time}
              </Text>
            </View>
          </View>
        </View>

        {/* New Booking Form */}
        <View className="mx-5 mt-6 mb-6">
          <Text className="text-gray-800 font-bold text-lg mb-3">New Details</Text>
        
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">New Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm"
            >
              <MaterialIcons name="event" size={22} color="#F97316" />
              <Text className="ml-3 text-gray-700 font-medium">
                {newDate ? formatDateDisplay(newDate) : "Select date"}
              </Text>
              <View className="ml-auto">
                <MaterialIcons name="arrow-drop-down" size={24} color="#F97316" />
              </View>
            </TouchableOpacity>
          </View>
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">New Start Time</Text>
            <TouchableOpacity
              onPress={() => setShowStartTimePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm"
            >
              <MaterialIcons name="access-time" size={22} color="#F97316" />
              <Text className="ml-3 text-gray-700 font-medium">
                {newStartTime || "Select start time"}
              </Text>
              <View className="ml-auto">
                <MaterialIcons name="arrow-drop-down" size={24} color="#F97316" />
              </View>
            </TouchableOpacity>
          </View>
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">New End Time</Text>
            <TouchableOpacity
              onPress={() => setShowEndTimePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 p-4 rounded-xl shadow-sm"
            >
              <MaterialIcons name="access-time" size={22} color="#F97316" />
              <Text className="ml-3 text-gray-700 font-medium">
                {newEndTime || "Select end time"}
              </Text>
              <View className="ml-auto">
                <MaterialIcons name="arrow-drop-down" size={24} color="#F97316" />
              </View>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleReschedule}
            className="bg-orange-500 py-3 rounded-xl items-center"
          >
            <Text className="text-white font-semibold text-lg">Confirm Reschedule</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Pickers */}
      {showDatePicker && (
      <DatePickerModal
      visible={showDatePicker}
      onClose={() => setShowDatePicker(false)}
      date={newDate}
      onDateChange={(date) => setNewDate(date)}
      existingBookings={existingBookings}
    />
      )}
      {showStartTimePicker && (
        <TimePickerModal
          visible={showStartTimePicker}
          onClose={() => setShowStartTimePicker(false)}
          time={newStartTime}
          onTimeChange={(time) => setNewStartTime(time)}
          title="Select Start Time"
          dateString={newDate}
          existingBookings={existingBookings}
          currentBookingId={id}
          onAlert={showAlert}
        />
      )}
      {showEndTimePicker && (
        <TimePickerModal
          visible={showEndTimePicker}
          onClose={() => setShowEndTimePicker(false)}
          time={newEndTime}
          onTimeChange={(time) => setNewEndTime(time)}
          title="Select End Time"
          dateString={newDate}
          existingBookings={existingBookings}
          currentBookingId={id}
          onAlert={showAlert}
        />
      )}

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        bookingType={bookingType || "ROOM"}
      />
    </View>
  );
};

export default RescheduleBooking; 
 