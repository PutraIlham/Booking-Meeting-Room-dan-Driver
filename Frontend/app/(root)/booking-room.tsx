import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  Modal,
  FlatList,
  TextInput
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { tokenCache } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";

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
  duration = 3000
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
  
  const colors = type === 'success' 
    ? SUCCESS_COLORS 
    : type === 'error' 
      ? ERROR_COLORS 
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

// ==================
// Helper Functions
// ==================
const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatApiDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const isDateInPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const isTimeInPast = (date, timeString) => {
  const now = new Date();
  const selectedDate = new Date(date);
  if (
    selectedDate.getDate() > now.getDate() ||
    selectedDate.getMonth() > now.getMonth() ||
    selectedDate.getFullYear() > now.getFullYear()
  ) {
    return false;
  }
  if (
    selectedDate.getDate() === now.getDate() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getFullYear() === now.getFullYear()
  ) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const selectedTime = new Date();
    selectedTime.setHours(hours, minutes, 0, 0);
    return selectedTime < now;
  }
  return false;
};

const isValidTimeRange = (start, end) => {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  if (startHour > endHour) return false;
  if (startHour === endHour && startMinute >= endMinute) return false;
  return true;
};

// Untuk transport atau room, cek apakah tanggal sudah penuh
const isDateFullyBooked = (date, formRoomOrTransportId, bookedDates) => {
  if (!formRoomOrTransportId) return false;
  const formattedDate = formatApiDate(date);
  return bookedDates[formattedDate] && bookedDates[formattedDate].length >= 3;
};

// Cek apakah tanggal sudah ter-booking sebagian
const isDatePartiallyBooked = (date, formRoomOrTransportId, bookedDates) => {
  if (!formRoomOrTransportId) return false;
  const formattedDate = formatApiDate(date);
  return bookedDates[formattedDate] && bookedDates[formattedDate].length > 0;
};

// Cek apakah slot waktu sudah ter-booking
const isTimeSlotBooked = (date, time, formRoomOrTransportId, bookedTimes) => {
  if (!formRoomOrTransportId) return false;
  const formattedDate = formatApiDate(date);
  if (!bookedTimes[formattedDate]) return false;
  const [hour, minute] = time.split(':').map(Number);
  const timeValue = hour * 60 + minute;
  return bookedTimes[formattedDate].some(slot => {
    const [slotStartHour, slotStartMinute] = slot.start.split(':').map(Number);
    const [slotEndHour, slotEndMinute] = slot.end.split(':').map(Number);
    const slotStartValue = slotStartHour * 60 + slotStartMinute;
    const slotEndValue = slotEndHour * 60 + slotEndMinute;
    return timeValue >= slotStartValue && timeValue < slotEndValue;
  });
};

// ----- Fetch Auth Token -----
const fetchAuthToken = async () => {
  return await tokenCache.getToken(AUTH_TOKEN_KEY);
};

// ==================
// Main Component: BookingRoom
// ==================
const BookingRoom = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { 
    selectedRoomId, 
    selectedRoomName, 
    pic, 
    section, 
    agenda,
    description, 
    bookAgain  
  } = params;
  
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    room_id: selectedRoomId ? Number(selectedRoomId) : null,
    booking_date: new Date(),
    start_time: '',
    end_time: '',
    pic: pic || '',
    section: section || '',
    agenda: agenda || '',
    description: description || '',
  });
  const [rooms, setRooms] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Modal visibility states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('success');
  const [alertMessage, setAlertMessage] = useState('');
  
  // Data untuk booking room
  const [bookings, setBookings] = useState([]);
  const [bookedDates, setBookedDates] = useState({});
  const [bookedTimes, setBookedTimes] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  const showAlert = (type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const fetchAuthToken = async () => {
    return await tokenCache.getToken(AUTH_TOKEN_KEY);
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    const monthsArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = monthsArr[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const showSequentialAlerts = () => {
    if (selectedRoomId) {
      showAlert('info', `Room "${selectedRoomName}" telah dipilih untuk booking Anda.`);
      if (bookAgain === 'true') {
        setTimeout(() => {
          showAlert(
            'info', 
            'Silakan perbarui tanggal dan waktu untuk booking baru Anda. Detail lainnya telah terisi.'
          );
        }, 3000);
      }
    } else if (bookAgain === 'true') {
      showAlert('info', 'Silakan perbarui tanggal dan waktu untuk booking baru Anda. Detail lainnya telah terisi.');
    }
  };

  const fetchRoomBookings = async (roomId) => {
    if (!roomId) return;
    setLoadingBookings(true);
  
    try {
      const authToken = await fetchAuthToken();
      if (!authToken) {
        console.error("No auth token available");
        return;
      }
  
      // Daftar endpoint booking room (cari yang sesuai di backend)
      const possibleEndpoints = [
        `http://20.251.153.107:3001/api/room-bookings/room/${roomId}`,
        `http://20.251.153.107:3001/api/room-bookings/by-room/${roomId}`,
        `http://20.251.153.107:3001/api/room-bookings?room_id=${roomId}`,
      ];
  
      let response;
      let success = false;
  
      for (const endpoint of possibleEndpoints) {
        try {
          response = await axios.get(endpoint, {
            headers: { 'Authorization': `Bearer ${authToken}` },
          });
          if (response.status >= 200 && response.status < 300) {
            success = true;
            break; 
          }
        } catch (err) {
          console.log(`Failed to fetch booking data at endpoint: ${endpoint}`, err.message);
        }
      }
  
      if (!success) {
        console.log("All endpoints failed");
        showAlert('error', 'Failed to retrieve room booking data');
        return;
      }
  
      if (response && response.data) {
        const bookingsData = Array.isArray(response.data)
          ? response.data
          : (response.data.bookings ? response.data.bookings : []);
  
        // Filter bookings that are relevant to the selected room
        const filteredBookings = bookingsData.filter(booking =>
          booking.room_id === roomId
        );
        setBookings(filteredBookings);
  
        // Create date and time mapping
        const dates = {};
        const times = {};
  
        filteredBookings.forEach(booking => {
          if (!booking.booking_date || !booking.start_time || !booking.end_time) {
            console.log("Invalid booking data:", booking);
            return;
          }
          if (!dates[booking.booking_date]) {
            dates[booking.booking_date] = [];
          }
          dates[booking.booking_date].push({
            start: booking.start_time,
            end: booking.end_time
          });
  
          const formattedDate = booking.booking_date;
          if (!times[formattedDate]) {
            times[formattedDate] = [];
          }
          times[formattedDate].push({
            start: booking.start_time,
            end: booking.end_time
          });
        });
  
        setBookedDates(dates);
        setBookedTimes(times);
  
        console.log(`Loaded ${filteredBookings.length} bookings for room ${roomId}`);
      }
    } catch (error) {
      console.error("Error fetching room bookings:", error);
      showAlert('error', 'Failed to load room booking data');
      setBookings([]);
      setBookedDates({});
      setBookedTimes({});
    } finally {
      setLoadingBookings(false);
    }
  };
  

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const authToken = await fetchAuthToken();
        if (!authToken) {
          showAlert('error', 'Not authenticated');
          router.push('/(auth)/sign-in');
          return;
        }
        const response = await axios.get('http://20.251.153.107:3001/api/rooms', {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });
        if (response.data && Array.isArray(response.data)) {
          setRooms(response.data);
          showSequentialAlerts();
        } else {
          showAlert('error', 'Invalid room data received.');
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        showAlert('error', 'Failed to fetch room data.');
      }
    };
    fetchRooms();
  }, []);

  const handleDateChange = (date) => {
    setForm({ ...form, booking_date: date });
    if (errors.booking_date) {
      setErrors(prev => ({ ...prev, booking_date: null }));
    }
    if (isDateInPast(date)) {
      showAlert('error', 'Tidak dapat memilih tanggal yang sudah lewat');
      return;
    }
  };

  const handleStartTimeChange = (time) => {
    if (isTimeInPast(form.booking_date, time)) {
      showAlert('error', 'Tidak dapat memilih waktu yang sudah lewat');
      return;
    }
    if (form.room_id && isTimeSlotBooked(form.booking_date, time, form.room_id, bookedTimes)) {
      const roomName = rooms.find(r => r.room_id === form.room_id)?.room_name || `Room ${form.room_id}`;
      showAlert('error', `Slot waktu ini sudah dibooking untuk ${roomName}. Silakan pilih waktu lain.`);
      return;
    }
    setForm(prev => ({ ...prev, start_time: time }));
    if (errors.start_time) {
      setErrors(prev => ({ ...prev, start_time: null }));
    }
    if (form.end_time && !isValidTimeRange(time, form.end_time)) {
      setForm(prev => ({ ...prev, end_time: '' }));
      showAlert('info', 'End time dikosongkan karena harus setelah start time baru');
    }
  };

  const handleEndTimeChange = (time) => {
    if (!form.start_time) {
      showAlert('error', 'Pilih start time terlebih dahulu');
      return;
    }
    if (!isValidTimeRange(form.start_time, time)) {
      showAlert('error', 'End time harus setelah start time');
      return;
    }
    if (form.room_id) {
      const formattedDate = formatApiDate(form.booking_date);
      if (bookedTimes[formattedDate]) {
        const [sh, sm] = form.start_time.split(':').map(Number);
        const [eh, em] = time.split(':').map(Number);
        const newStartValue = sh * 60 + sm;
        const newEndValue = eh * 60 + em;
        const hasOverlap = bookedTimes[formattedDate].some(slot => {
          const [slotSh, slotSm] = slot.start.split(':').map(Number);
          const [slotEh, slotEm] = slot.end.split(':').map(Number);
          const slotStartValue = slotSh * 60 + slotSm;
          const slotEndValue = slotEh * 60 + slotEm;
          return (
            (newStartValue >= slotStartValue && newStartValue < slotEndValue) ||
            (newEndValue > slotStartValue && newEndValue <= slotEndValue) ||
            (newStartValue <= slotStartValue && newEndValue >= slotEndValue)
          );
        });
        if (hasOverlap) {
          showAlert('error', 'Rentang waktu ini tumpang tindih dengan booking yang sudah ada. Pilih slot lain.');
          return;
        }
      }
    }
    setForm(prev => ({ ...prev, end_time: time }));
    if (errors.end_time) {
      setErrors(prev => ({ ...prev, end_time: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.pic.trim()) {
      newErrors.pic = 'PIC name is required';
    }
    if (!form.section.trim()) {
      newErrors.section = 'Section is required';
    }
    if (!form.agenda.trim()) {
      newErrors.agenda = 'Agenda is required';
    }
    if (isDateInPast(form.booking_date)) {
      newErrors.booking_date = 'Cannot book for a past date';
    }
    if (!form.start_time) {
      newErrors.start_time = 'Start time is required';
    } else if (isTimeInPast(form.booking_date, form.start_time)) {
      newErrors.start_time = 'Cannot book for a time that has already passed';
    }
    if (!form.end_time) {
      newErrors.end_time = 'End time is required';
    } else if (form.start_time && !isValidTimeRange(form.start_time, form.end_time)) {
      newErrors.end_time = 'End time must be after start time';
    }
    if (form.room_id === null) {
      newErrors.room_id = 'Please select a room';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) showAlert('error', firstError);
      return;
    }
    setLoading(true);
    try {
      const authToken = await fetchAuthToken();
      if (!authToken) {
        showAlert('error', 'Not authenticated');
        return;
      }
      const formattedDate = formatApiDate(form.booking_date);
      const bookingData = { ...form, booking_date: formattedDate };
      const response = await axios.post('http://20.251.153.107:3001/api/room-bookings', bookingData, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.status === 201) {
        showAlert('success', 'Booking submitted successfully');
        setTimeout(() => {
          router.replace('/(root)/(tabs)/my-booking');
        }, 2000);
      } else {
        showAlert('error', 'Unexpected response from server');
      }
    } catch (error) {
      console.error('Booking error:', error);
      if (error.response) {
        showAlert('error', error.response.data.message || 'Failed to submit booking. Please try again.');
      } else {
        showAlert('error', 'Failed to submit booking. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelection = (roomId) => {
    setBookings([]);
    setBookedDates({});
    setBookedTimes({});
    setForm(prev => ({ ...prev, room_id: roomId }));
    if (errors.room_id) {
      setErrors(prev => ({ ...prev, room_id: null }));
    }
    fetchRoomBookings(roomId);
  };

  // ----- DatePicker Modal Component dengan Legend -----
  const DatePickerModalComponent = ({ visible, onClose, date, onDateChange }) => {
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedDay, setSelectedDay] = useState(today.getDate());

    useEffect(() => {
      if (date) {
        try {
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
        } catch (error) {
          console.error("Error parsing date:", error);
        }
      }
    }, [date, visible]);

    const monthsArr = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

    const handleConfirm = () => {
      const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
      onDateChange(selectedDate);
      onClose();
    };

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const renderCalendarGrid = () => {
      const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
      const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
      const days = [];
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<View key={`empty-${i}`} className="w-10 h-10 m-1" />);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        const currentDate = new Date(selectedYear, selectedMonth, i);
        const isPastDate = isDateInPast(currentDate);
        const fullyBooked = isDateFullyBooked(currentDate, form.room_id, bookedDates);
        const partiallyBooked = isDatePartiallyBooked(currentDate, form.room_id, bookedDates);
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        if (selectedDay === i) {
          bgColor = 'bg-orange-500';
          textColor = 'text-white';
        } else if (isPastDate) {
          bgColor = 'bg-gray-200';
          textColor = 'text-gray-400';
        } else if (fullyBooked) {
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
        } else if (partiallyBooked) {
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
        }
        days.push(
          <TouchableOpacity 
            key={i}
            className={`w-10 h-10 items-center justify-center rounded-full m-1 ${bgColor}`}
            onPress={() => {
              if (!isPastDate && !fullyBooked) {
                setSelectedDay(i);
              } else if (isPastDate) {
                showAlert('error', 'Tidak dapat memilih tanggal yang sudah lewat');
              } else if (fullyBooked) {
                showAlert('error', 'Tanggal ini sudah penuh ter-booking');
              }
            }}
            disabled={isPastDate || fullyBooked}
          >
            <Text className={textColor}>{i}</Text>
            {partiallyBooked && !fullyBooked && (
              <View className="absolute bottom-0 w-1.5 h-1.5 bg-yellow-500 rounded-full" />
            )}
          </TouchableOpacity>
        );
      }
      return days;
    };

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
            {/* Legend: Sinkronisasi dengan warna pada modal select date */}
            <View className="flex-row justify-center items-center mb-4 bg-gray-50 p-2 rounded-lg">
              <View className="flex-row items-center mr-4">
                <View className="w-3 h-3 bg-red-100 rounded-full mr-2" />
                <Text className="text-gray-600 text-xs">Fully Booked</Text>
              </View>
              <View className="flex-row items-center mr-4">
                <View className="w-3 h-3 bg-yellow-100 rounded-full mr-2" />
                <Text className="text-gray-600 text-xs">Partially Booked</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-orange-500 rounded-full mr-2" />
                <Text className="text-gray-600 text-xs">Selected Date</Text>
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
                {monthsArr[selectedMonth]} {selectedYear}
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

  // ----- TimePicker Modal Component -----
  const TimePickerModalComponent = ({ visible, onClose, time, onTimeChange, title }) => {
    const now = new Date();
    const [hours, setHours] = useState('09');
    const [minutes, setMinutes] = useState('00');
    const [showHours, setShowHours] = useState(true);
    
    const isToday = () => {
      const today = new Date();
      const bookingDate = form.booking_date;
      return (
        today.getDate() === bookingDate.getDate() &&
        today.getMonth() === bookingDate.getMonth() &&
        today.getFullYear() === bookingDate.getFullYear()
      );
    };
    
    useEffect(() => {
      if (time) {
        const [h, m] = time.split(':');
        setHours(h || '09');
        setMinutes(m || '00');
      } else {
        const defaultHour = (now.getHours() + 1).toString().padStart(2, '0');
        setHours(defaultHour);
        setMinutes('00');
      }
    }, [time, visible]);
    
    const handleConfirm = () => {
      const newTime = `${hours}:${minutes}`;
      if (isToday()) {
        const selectedTime = new Date();
        selectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        if (selectedTime < now) {
          showAlert('error', 'Cannot select a time that has already passed');
          return;
        }
      }
      onTimeChange(newTime);
      onClose();
    };
    
    const renderTimeGrid = (isHours) => {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const items = isHours 
        ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
        : Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
      const selectedValue = isHours ? hours : minutes;
      
      return (
        <FlatList
          data={items}
          numColumns={6}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            let isBooked = false;
            if (isHours && form.booking_date) {
              isBooked = isTimeSlotBooked(form.booking_date, `${item}:00`, form.room_id, bookedTimes);
            }
            const isPastTime = isToday() && (
              (isHours && parseInt(item) < currentHour) || 
              (!isHours && parseInt(hours) === currentHour && parseInt(item) < currentMinute)
            );
            let bgColor = 'bg-gray-100';
            let textColor = 'text-gray-800';
            if (selectedValue === item) {
              bgColor = 'bg-orange-500';
              textColor = 'text-white';
            } else if (isPastTime) {
              bgColor = 'bg-gray-200';
              textColor = 'text-gray-400';
            } else if (isBooked) {
              bgColor = 'bg-red-100';
              textColor = 'text-red-800';
            }
            return (
              <TouchableOpacity
                className={`w-10 h-10 items-center justify-center m-1 rounded-lg ${bgColor}`}
                onPress={() => {
                  if (!isPastTime) {
                    if (isHours) {
                      setHours(item);
                      if (isToday() && parseInt(item) === currentHour) {
                        const newMins = Math.max(currentMinute, parseInt(minutes)).toString().padStart(2, '0');
                        setMinutes(newMins);
                      }
                    } else {
                      setMinutes(item);
                    }
                  } else {
                    showAlert('error', 'Cannot select a time that has already passed');
                  }
                }}
                disabled={isPastTime}
              >
                <Text className={`${textColor} font-medium text-lg`}>{item}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      );
    };
    
    return (
      <Modal
        animationType="fade"
        transparent
        visible={visible}
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
                  Booking hari ini - waktu yang sudah lewat nonaktif
                </Text>
              </View>
            )}
            <View className="flex-row justify-center items-center py-3 mb-2">
              <TouchableOpacity
                onPress={() => setShowHours(true)}
                className={`px-5 py-2 rounded-lg mr-2 ${showHours ? 'bg-sky-500' : 'bg-gray-200'}`}
              >
                <Text className={showHours ? 'text-white font-medium' : 'text-gray-700'}>Hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowHours(false)}
                className={`px-5 py-2 rounded-lg ml-2 ${!showHours ? 'bg-sky-500' : 'bg-gray-200'}`}
              >
                <Text className={!showHours ? 'text-white font-medium' : 'text-gray-700'}>Minutes</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row justify-center items-center mb-3">
              <TouchableOpacity onPress={() => setShowHours(true)} className="items-center">
                <Text className={`text-2xl font-medium ${showHours ? 'text-sky-500' : 'text-gray-800'}`}>{hours}</Text>
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-800 mx-2">:</Text>
              <TouchableOpacity onPress={() => setShowHours(false)} className="items-center">
                <Text className={`text-2xl font-medium ${!showHours ? 'text-sky-500' : 'text-gray-800'}`}>{minutes}</Text>
              </TouchableOpacity>
            </View>
            <View className="border border-gray-200 rounded-lg p-2 bg-white max-h-56">
              {renderTimeGrid(showHours)}
            </View>
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

  const SectionHeader = ({ title, icon }) => (
    <View className="flex-row items-center mb-4 mt-4">
      <View className="w-8 h-8 bg-orange-500 rounded-full items-center justify-center">
        <Ionicons name={icon} size={18} color="white" />
      </View>
      <Text className="text-gray-800 font-bold text-lg ml-3">{title}</Text>
    </View>
  );

  const fixImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
  
    // Handle local filesystem paths
    if (typeof imageUrl === 'string' && imageUrl.startsWith('E:')) {
      return `http://20.251.153.107:3001/api/image-proxy?path=${encodeURIComponent(imageUrl)}`;
    }
  
    // Fix double slash issue in URLs
    if (typeof imageUrl === 'string' && imageUrl.includes('//uploads')) {
      return imageUrl.replace('//uploads', '/uploads');
    }
  
    // Add base URL if the image path is relative
    if (typeof imageUrl === 'string' && !imageUrl.startsWith('http')) {
      // Remove any leading slashes to avoid double slashes
      const cleanPath = imageUrl.replace(/^\/+/, '');
      return `http://20.251.153.107:3001/${cleanPath}`;
    }
  
    return imageUrl;
  };

  // ----- BookingLegend: Legend disinkronkan dengan warna di modal select date & time -----
  const BookingLegend = () => (
    <View className="mb-5 px-3 py-4 bg-gray-50 rounded-xl">
      <Text className="text-gray-800 font-medium mb-3">Status Ketersediaan:</Text>
      <View className="flex-row flex-wrap">
        <View className="flex-row items-center mr-4 mb-2">
          <View className="w-4 h-4 bg-orange-500 rounded-full mr-1" />
          <Text className="text-gray-700 text-xs">Selected Date</Text>
        </View>
        <View className="flex-row items-center mr-4 mb-2">
          <View className="w-4 h-4 bg-red-100 rounded-full mr-1" />
          <Text className="text-gray-700 text-xs">Fully Booked</Text>
        </View>
        <View className="flex-row items-center mr-4 mb-2">
          <View className="w-4 h-4 bg-yellow-100 rounded-full mr-1" />
          <Text className="text-gray-700 text-xs">Partially Booked</Text>
        </View>
        <View className="flex-row items-center mr-4 mb-2">
          <View className="w-4 h-4 bg-gray-200 rounded-full mr-1" />
          <Text className="text-gray-700 text-xs">Past Date</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="bg-sky-500 shadow-md rounded-b-3xl">
        <View className="flex-row items-center space-x-3 px-6 pt-6 pb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 justify-center items-center bg-white/20 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-2xl font-bold">Book a Room</Text>
            <Text className="text-white text-opacity-90 mt-1">Reserve a meeting space</Text>
          </View>
        </View>
      </View>

      {loadingBookings && (
        <View className="absolute inset-0 bg-black bg-opacity-30 z-10 flex items-center justify-center">
          <View className="bg-white p-5 rounded-xl shadow-lg items-center">
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text className="text-gray-700 mt-3 font-medium">Loading availability data...</Text>
          </View>
        </View>
      )}

      <ScrollView className="flex-1 px-5">
        <View className="mt-6">
          <SectionHeader title="Basic Information" icon="person-outline" />
          <View className="mb-4">
            <View className={`flex-row items-center bg-white border ${errors.pic ? 'border-red-500' : 'border-gray-200'} rounded-xl py-0 px-3 shadow-sm`}>
              <MaterialIcons name="person" size={22} color="#94A3B8" />
              <TextInput
                className="flex-1 ml-3 text-gray-700 h-12 text-base"
                placeholder="Enter person in charge"
                placeholderTextColor="#94A3B8"
                defaultValue={pic || ''}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, pic: text }));
                  if (errors.pic) setErrors(prev => ({ ...prev, pic: null }));
                }}
                style={{ height: 48 }}
              />
              {errors.pic && (
                <Ionicons name="alert-circle" size={22} color="#EF4444" />
              )}
            </View>
            {errors.pic && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.pic}</Text>}
          </View>

          <View className="mb-4">
            <View className={`flex-row items-center bg-white border ${errors.section ? 'border-red-500' : 'border-gray-200'} rounded-xl py-0 px-3 shadow-sm`}>
              <MaterialIcons name="business" size={22} color="#94A3B8" />
              <TextInput
                className="flex-1 ml-3 text-gray-700 h-12 text-base"
                placeholder="Enter section name"
                placeholderTextColor="#94A3B8"
                defaultValue={section || ''}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, section: text }));
                  if (errors.section) setErrors(prev => ({ ...prev, section: null }));
                }}
                style={{ height: 48 }}
              />
              {errors.section && (
                <Ionicons name="alert-circle" size={22} color="#EF4444" />
              )}
            </View>
            {errors.section && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.section}</Text>}
          </View>

          <View className="mb-4">
            <View className={`flex-row items-center bg-white border ${errors.agenda ? 'border-red-500' : 'border-gray-200'} rounded-xl py-0 px-3 shadow-sm`}>
              <MaterialIcons name="info" size={22} color="#94A3B8" />
              <TextInput
                className="flex-1 ml-3 text-gray-700 h-12 text-base"
                placeholder="Enter agenda"
                placeholderTextColor="#94A3B8"
                defaultValue={form.agenda}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, agenda: text }));
                  if (errors.agenda) setErrors(prev => ({ ...prev, agenda: null }));
                }}
                style={{ height: 48 }}
              />
              {errors.agenda && (
                <Ionicons name="alert-circle" size={22} color="#EF4444" />
              )}
            </View>
            {errors.agenda && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.agenda}</Text>}
          </View>


          <SectionHeader title="Room Selection" icon="business-outline" />
          {errors.room_id && <Text className="text-red-500 text-xs mb-2">{errors.room_id}</Text>}
          <View className="mb-6">
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.room_id}
              onPress={() => handleRoomSelection(room.room_id)}
              className={`p-4 mb-4 rounded-xl border ${
                room.room_id === form.room_id
                  ? 'bg-sky-50 border-sky-500'
                  : 'bg-white border-gray-200'
              } shadow-sm`}
            >
              <View className="flex-row items-center">
                <Image
                  source={{ uri: fixImageUrl(room.image) }}
                  style={{ width: 60, height: 60, borderRadius: 10 }}
                  className="mr-4"
                />
                <View className="flex-1">
                  <Text className={`text-base ${room.room_id === form.room_id ? 'text-sky-900 font-medium' : 'text-gray-700'}`}>
                    {room.room_name}
                  </Text>
                  <Text className={`text-sm ${room.room_id === form.room_id ? 'text-sky-700' : 'text-gray-500'}`}>
                    Type: {room.room_type} | Capacity: {room.capacity}
                  </Text>
                </View>
                {room.room_id === form.room_id && (
                  <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          </View>

          <SectionHeader title="Date & Time" icon="calendar-outline" />

          {form.room_id ? (
            <BookingLegend />
          ) : (
            <View className="mb-3 bg-yellow-50 p-3 rounded-xl">
              <Text className="text-yellow-700 text-sm text-center">
                Please select a room to view availability information
              </Text>
            </View>
          )}
          
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">Booking Date *</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <MaterialIcons name="calendar-today" size={22} color="#0EA5E9" />
              <Text className="ml-3 text-gray-700 font-medium">{formatDateDisplay(form.booking_date)}</Text>
              <View className="ml-auto">
                <MaterialIcons name="arrow-drop-down" size={24} color="#0EA5E9" />
              </View>
            </TouchableOpacity>
            {errors.booking_date && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.booking_date}</Text>}
          </View>

          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">Start Time *</Text>
            <TouchableOpacity
              onPress={() => setShowStartTimePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <MaterialIcons name="access-time" size={22} color="#0EA5E9" />
              <Text className="ml-3 text-gray-700 font-medium">{form.start_time || 'Select start time'}</Text>
              <View className="ml-auto">
                <MaterialIcons name="arrow-drop-down" size={24} color="#0EA5E9" />
              </View>
            </TouchableOpacity>
            {errors.start_time && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.start_time}</Text>}
          </View>

          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">End Time *</Text>
            <TouchableOpacity
              onPress={() => setShowEndTimePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <MaterialIcons name="access-time" size={22} color="#0EA5E9" />
              <Text className="ml-3 text-gray-700 font-medium">{form.end_time || 'Select end time'}</Text>
              <View className="ml-auto">
                <MaterialIcons name="arrow-drop-down" size={24} color="#0EA5E9" />
              </View>
            </TouchableOpacity>
            {errors.end_time && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.end_time}</Text>}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`mt-6 py-4 ${loading ? 'bg-sky-400' : 'bg-sky-500'} rounded-xl items-center shadow-md mb-8`}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-semibold text-lg">Submit Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      <DatePickerModalComponent
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        date={form.booking_date}
        onDateChange={handleDateChange}
      />

      <TimePickerModalComponent
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        time={form.start_time}
        onTimeChange={handleStartTimeChange}
        title="Select Start Time"
      />

      <TimePickerModalComponent
        visible={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        time={form.end_time}
        onTimeChange={handleEndTimeChange}
        title="Select End Time"
      />
    </SafeAreaView>
  );
};

const BookingLegend = () => (
  <View className="mb-5 px-3 py-4 bg-gray-50 rounded-xl">
    <Text className="text-gray-800 font-medium mb-3">Status Ketersediaan:</Text>
    <View className="flex-row flex-wrap">
      <View className="flex-row items-center mr-4 mb-2">
        <View className="w-4 h-4 bg-orange-500 rounded-full mr-1" />
        <Text className="text-gray-700 text-xs">Selected Date</Text>
      </View>
      <View className="flex-row items-center mr-4 mb-2">
        <View className="w-4 h-4 bg-red-100 rounded-full mr-1" />
        <Text className="text-gray-700 text-xs">Fully Booked</Text>
      </View>
      <View className="flex-row items-center mr-4 mb-2">
        <View className="w-4 h-4 bg-yellow-100 rounded-full mr-1" />
        <Text className="text-gray-700 text-xs">Partially Booked</Text>
      </View>
      <View className="flex-row items-center mr-4 mb-2">
        <View className="w-4 h-4 bg-gray-200 rounded-full mr-1" />
        <Text className="text-gray-700 text-xs">Past Date</Text>
      </View>
    </View>
  </View>
);

export default BookingRoom;
