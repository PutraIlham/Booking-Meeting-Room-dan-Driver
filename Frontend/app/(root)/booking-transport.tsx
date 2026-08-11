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

// Jakarta Location Data
const JAKARTA_LOCATIONS = [
  // Kabupaten Kepulauan Seribu
  { label: "Kepulauan Seribu Utara, Kabupaten Kepulauan Seribu", value: "Kepulauan Seribu Utara, Kabupaten Kepulauan Seribu" },
  { label: "Kepulauan Seribu Selatan, Kabupaten Kepulauan Seribu", value: "Kepulauan Seribu Selatan, Kabupaten Kepulauan Seribu" },
  
  // Kota Jakarta Pusat
  { label: "Cempaka Putih, Jakarta Pusat", value: "Cempaka Putih, Jakarta Pusat" },
  { label: "Gambir, Jakarta Pusat", value: "Gambir, Jakarta Pusat" },
  { label: "Johar Baru, Jakarta Pusat", value: "Johar Baru, Jakarta Pusat" },
  { label: "Kemayoran, Jakarta Pusat", value: "Kemayoran, Jakarta Pusat" },
  { label: "Menteng, Jakarta Pusat", value: "Menteng, Jakarta Pusat" },
  { label: "Sawah Besar, Jakarta Pusat", value: "Sawah Besar, Jakarta Pusat" },
  { label: "Senen, Jakarta Pusat", value: "Senen, Jakarta Pusat" },
  { label: "Tanah Abang, Jakarta Pusat", value: "Tanah Abang, Jakarta Pusat" },
  
  // Kota Jakarta Utara
  { label: "Cilincing, Jakarta Utara", value: "Cilincing, Jakarta Utara" },
  { label: "Kelapa Gading, Jakarta Utara", value: "Kelapa Gading, Jakarta Utara" },
  { label: "Koja, Jakarta Utara", value: "Koja, Jakarta Utara" },
  { label: "Pademangan, Jakarta Utara", value: "Pademangan, Jakarta Utara" },
  { label: "Penjaringan, Jakarta Utara", value: "Penjaringan, Jakarta Utara" },
  { label: "Tanjung Priok, Jakarta Utara", value: "Tanjung Priok, Jakarta Utara" },
  
  // Kota Jakarta Barat
  { label: "Cengkareng, Jakarta Barat", value: "Cengkareng, Jakarta Barat" },
  { label: "Grogol Petamburan, Jakarta Barat", value: "Grogol Petamburan, Jakarta Barat" },
  { label: "Taman Sari, Jakarta Barat", value: "Taman Sari, Jakarta Barat" },
  { label: "Tambora, Jakarta Barat", value: "Tambora, Jakarta Barat" },
  { label: "Kebon Jeruk, Jakarta Barat", value: "Kebon Jeruk, Jakarta Barat" },
  { label: "Kalideres, Jakarta Barat", value: "Kalideres, Jakarta Barat" },
  { label: "Palmerah, Jakarta Barat", value: "Palmerah, Jakarta Barat" },
  { label: "Kembangan, Jakarta Barat", value: "Kembangan, Jakarta Barat" },
  
  // Kota Jakarta Selatan
  { label: "Cilandak, Jakarta Selatan", value: "Cilandak, Jakarta Selatan" },
  { label: "Jagakarsa, Jakarta Selatan", value: "Jagakarsa, Jakarta Selatan" },
  { label: "Kebayoran Baru, Jakarta Selatan", value: "Kebayoran Baru, Jakarta Selatan" },
  { label: "Kebayoran Lama, Jakarta Selatan", value: "Kebayoran Lama, Jakarta Selatan" },
  { label: "Mampang Prapatan, Jakarta Selatan", value: "Mampang Prapatan, Jakarta Selatan" },
  { label: "Pancoran, Jakarta Selatan", value: "Pancoran, Jakarta Selatan" },
  { label: "Pasar Minggu, Jakarta Selatan", value: "Pasar Minggu, Jakarta Selatan" },
  { label: "Pesanggrahan, Jakarta Selatan", value: "Pesanggrahan, Jakarta Selatan" },
  { label: "Setiabudi, Jakarta Selatan", value: "Setiabudi, Jakarta Selatan" },
  { label: "Tebet, Jakarta Selatan", value: "Tebet, Jakarta Selatan" },
  
  // Kota Jakarta Timur
  { label: "Cakung, Jakarta Timur", value: "Cakung, Jakarta Timur" },
  { label: "Cipayung, Jakarta Timur", value: "Cipayung, Jakarta Timur" },
  { label: "Ciracas, Jakarta Timur", value: "Ciracas, Jakarta Timur" },
  { label: "Duren Sawit, Jakarta Timur", value: "Duren Sawit, Jakarta Timur" },
  { label: "Jatinegara, Jakarta Timur", value: "Jatinegara, Jakarta Timur" },
  { label: "Kramat Jati, Jakarta Timur", value: "Kramat Jati, Jakarta Timur" },
  { label: "Makasar, Jakarta Timur", value: "Makasar, Jakarta Timur" },
  { label: "Matraman, Jakarta Timur", value: "Matraman, Jakarta Timur" },
  { label: "Pasar Rebo, Jakarta Timur", value: "Pasar Rebo, Jakarta Timur" },
  { label: "Pulo Gadung, Jakarta Timur", value: "Pulo Gadung, Jakarta Timur" }
];

// ----- ALERT KOMPONEN SAMA SEPERTI SEBELUMNYA -----
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
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoClose, duration, onClose]);

  if (!isVisible) return null;

  return (
    <Modal
      transparent={true}
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


const DestinationSearchDropdown = ({ 
  value, 
  onSelect, 
  error = null,
  clearError = () => {}
}) => {
  const [searchText, setSearchText] = useState(value || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Function to search locations
  const searchLocations = (query) => {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const lowercaseQuery = query.toLowerCase();
    return JAKARTA_LOCATIONS.filter(location => 
      location.label.toLowerCase().includes(lowercaseQuery)
    ).slice(0, 5); // Limit to first 5 results
  };

  // Update search results when text changes
  useEffect(() => {
    if (searchText.length > 1) {
      setSearchResults(searchLocations(searchText));
      setShowDropdown(true);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  }, [searchText]);

  // Handle selection
  const handleSelectLocation = (location) => {
    setSearchText(location.label);
    onSelect(location.value);
    setShowDropdown(false);
    if (error) clearError();
  };

  return (
    <View className="mb-4">
      <View className={`bg-white border ${error ? 'border-red-500' : 'border-gray-200'} 
        rounded-xl shadow-sm overflow-visible z-10`}>
        {/* Input Field */}
        <View className="flex-row items-center py-0 px-3">
          <MaterialIcons name="place" size={22} color="#94A3B8" />
          <TextInput
            className="flex-1 ml-3 text-gray-700 h-12 text-base"
            placeholder="Search destination"
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={(text) => {
              setSearchText(text);
              if (error) clearError();
            }}
            onFocus={() => {
              if (searchText.length > 1) {
                setShowDropdown(true);
              }
            }}
            editable={true}
            autoCapitalize="none"
            autoCorrect={false}
            style={{ height: 48 }}
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchText('');
                onSelect('');
                setShowDropdown(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
          {error && (
            <Ionicons name="alert-circle" size={22} color="#EF4444" className="ml-2" />
          )}
        </View>
        
        {/* Dropdown Results - Perbaikan: Gunakan ScrollView biasa dengan map daripada FlatList */}
        {showDropdown && searchResults.length > 0 && (
          <View className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-lg z-20">
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled={true}>
              {searchResults.map(item => (
                <TouchableOpacity
                  key={item.value}
                  className="px-4 py-3 border-b border-gray-100"
                  onPress={() => handleSelectLocation(item)}
                >
                  <Text className="text-gray-800">{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      {error && <Text className="text-red-500 text-xs ml-1 mt-1">{error}</Text>}
    </View>
  );
};

// ---- FUNGSI UNTUK MENGAMBIL TOKEN AUTH ----
const fetchAuthToken = async () => {
  return await tokenCache.getToken(AUTH_TOKEN_KEY);
};

const BookingTransport = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { 
    selectedTransportId, 
    selectedTransportName,
    pic, 
    section, 
    agenda,
    description, 
    destination,
    bookAgain 
  } = params;
  
  // STATE FORM
  const [form, setForm] = useState({
    transport_id: selectedTransportId ? Number(selectedTransportId) : null,
    booking_date: new Date(),
    start_time: '',
    end_time: '',
    pic: pic || '',
    section: section || '',
    agenda: agenda || '',
    description: description || '',
    destination: destination || '',
  });

  const [transports, setTransports] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // STATE UNTUK MENYIMPAN BOOKING YANG SUDAH ADA (VALIDASI KONFLIK)
  const [bookings, setBookings] = useState([]);
  const [bookedDates, setBookedDates] = useState({});
  const [bookedTimes, setBookedTimes] = useState({});
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // STATE & HANDLER MODAL
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // STATE ALERT
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('success');
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // ---------------------------
  // 1) LOGIKA VALIDASI WAKTU
  // ---------------------------
  const isDateInPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isTimeInPast = (date, timeString) => {
    const now = new Date();
    const selectedDate = new Date(date);
    
    // Jika booking date lebih besar dari hari ini, tidak dianggap "past"
    if (selectedDate.getDate() > now.getDate() ||
        selectedDate.getMonth() > now.getMonth() ||
        selectedDate.getFullYear() > now.getFullYear()) {
      return false;
    }
    // Kalau booking date = hari ini, cek jam
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

  // -------------------------------------------------
  // 2) LOGIKA PENGAMBILAN DATA BOOKING TRANSPORT (fetchTransportBookings)
  // -------------------------------------------------
  const fetchTransportBookings = async (transportId) => {
    if (!transportId) return;
    setLoadingBookings(true);
  
    try {
      const authToken = await fetchAuthToken();
      if (!authToken) {
        console.error("No auth token available");
        return;
      }
  
      // Daftar endpoint transport booking (cari yang sesuai di backend)
      // Contoh saja, silakan disesuaikan:
      const possibleEndpoints = [
        `http://20.251.153.107:3001/api/transport-bookings/transport/${transportId}`,
        `http://20.251.153.107:3001/api/transport-bookings/by-transport/${transportId}`,
        `http://20.251.153.107:3001/api/transport-bookings?transport_id=${transportId}`,
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
          console.log(`Gagal ambil data booking di endpoint: ${endpoint}`, err.message);
        }
      }
  
      if (!success) {
        console.log("Semua endpoint gagal");
        showAlert('error', 'Gagal mengambil data booking transport');
        return;
      }
  
      if (response && response.data) {
        const bookingsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.bookings ? response.data.bookings : []);
          
        // Filter booking yang memang milik transport ini
        const filteredBookings = bookingsData.filter(booking => 
          booking.transport_id === transportId
        );
        setBookings(filteredBookings);
  
        // Buat peta date & time
        const dates = {};
        const times = {};
  
        filteredBookings.forEach(booking => {
          if (!booking.booking_date || !booking.start_time || !booking.end_time) {
            console.log("Data booking invalid:", booking);
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
  
        console.log(`Loaded ${filteredBookings.length} bookings for transport ${transportId}`);
      }
    } catch (error) {
      console.error("Error fetching transport bookings:", error);
      showAlert('error', 'Gagal memuat data booking transport');
      setBookings([]);
      setBookedDates({});
      setBookedTimes({});
    } finally {
      setLoadingBookings(false);
    }
  };
  

  // -------------------------------------------------
  // 3) FUNGSI CEK TANGGAL/WAKTU PENUH ATAU KONFLIK
  // -------------------------------------------------
  const isDateFullyBooked = (date) => {
    if (!form.transport_id) return false;
    const formattedDate = formatApiDate(date);
    return bookedDates[formattedDate] && bookedDates[formattedDate].length >= 3;
  };

  const isDatePartiallyBooked = (date) => {
    if (!form.transport_id) return false;
    const formattedDate = formatApiDate(date);
    return bookedDates[formattedDate] && bookedDates[formattedDate].length > 0;
  };

  const isTimeSlotBooked = (date, time) => {
    if (!form.transport_id) return false;
    const formattedDate = formatApiDate(date);
    if (!bookedTimes[formattedDate]) return false; // tidak ada booking di date tsb

    const [hour, minute] = time.split(':').map(Number);
    const timeValue = hour * 60 + minute;

    return bookedTimes[formattedDate].some(slot => {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      const slotStart = sh * 60 + sm;
      const slotEnd   = eh * 60 + em;

      // Apakah timeValue berada di dalam range slot?
      return timeValue >= slotStart && timeValue < slotEnd;
    });
  };

  // -------------------------------------------------
  // 4) USEEFFECT MEMUAT DATA TRANSPORT + ALERT
  // -------------------------------------------------
  useEffect(() => {
    const fetchTransports = async () => {
      try {
        const authToken = await fetchAuthToken();
        if (!authToken) {
          showAlert('error', 'Not authenticated');
          router.push('/(auth)/sign-in');
          return;
        }
        const response = await axios.get('http://20.251.153.107:3001/api/transports', {
          headers: { 'Authorization': `Bearer ${authToken}` },
        });

        if (response.data && Array.isArray(response.data)) {
          setTransports(response.data);
          // Tampilkan sequential alert kalau ada param preselected
          showSequentialAlerts();
        } else {
          showAlert('error', 'Invalid transport data received.');
        }
      } catch (error) {
        console.error('Error fetching transports:', error);
        showAlert('error', 'Failed to load transports. Please try again.');
      }
    };
    fetchTransports();
  }, []);

  // ---------------------------
  // 5) SEQUENTIAL ALERT
  // ---------------------------
  const showSequentialAlerts = () => {
    // Jika ada transport terpilih
    if (selectedTransportId) {
      showAlert('info', `Transport "${selectedTransportName}" sudah dipilih.`);
      // Jika bookAgain pun bernilai true
      if (bookAgain === 'true') {
        setTimeout(() => {
          showAlert(
            'info', 
            'Silakan ubah tanggal dan waktu booking. Detail lain sudah terisi.'
          );
        }, 3000);
      }
    }
    else if (bookAgain === 'true') {
      showAlert('info', 'Silakan ubah tanggal dan waktu booking. Detail lain sudah terisi.');
    }
  };

  // ---------------------------
  // 6) HANDLE PILIH TRANSPORT
  // ---------------------------
  const handleTransportSelection = (transportId) => {
    // Reset data booking lama
    setBookings([]);
    setBookedDates({});
    setBookedTimes({});
    
    // Update form
    setForm(prev => ({ ...prev, transport_id: transportId }));
    
    // Clear error
    if (errors.transport_id) {
      setErrors(prev => ({ ...prev, transport_id: null }));
    }

    // Fetch booking khusus transport ini
    fetchTransportBookings(transportId);
  };

  // ---------------------------
  // 7) HANDLE DATE & TIME CHANGE
  // ---------------------------
  const handleDateChange = (date) => {
    setForm({ ...form, booking_date: date });
    if (errors.booking_date) {
      setErrors(prev => ({ ...prev, booking_date: null }));
    }

    if (isDateInPast(date)) {
      showAlert('error', 'Tidak bisa booking untuk tanggal yang sudah lewat');
      return;
    }

    // Jika user ganti date => pastikan start_time & end_time valid
    const today = new Date();
    const isToday = 
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    // Jika masih set jam untuk hari ini tapi sudah lewat, reset jam
    if (isToday && form.start_time) {
      if (isTimeInPast(date, form.start_time)) {
        setForm(prev => ({ ...prev, start_time: '', end_time: '' }));
        showAlert('info', 'Start time & end time direset karena sudah lewat');
      } else if (
        form.end_time && 
        !isValidTimeRange(form.start_time, form.end_time)
      ) {
        setForm(prev => ({ ...prev, end_time: '' }));
      }
    }
  };

  const handleStartTimeChange = (time) => {
    // Cek time di hari ini
    if (isTimeInPast(form.booking_date, time)) {
      showAlert('error', 'Tidak bisa memilih jam yang sudah lewat');
      return;
    }
    // Cek konflik slot
    if (form.transport_id && isTimeSlotBooked(form.booking_date, time)) {
      const transportName = transports.find(t => t.transport_id === form.transport_id)?.vehicle_name || `Transport ${form.transport_id}`;
      showAlert('error', `This time slot is already booked for  ${transportName}. Please select another time.`);
      return;
    }

    setForm(prev => ({ ...prev, start_time: time }));
    if (errors.start_time) {
      setErrors(prev => ({ ...prev, start_time: null }));
    }

    // Kalau end_time sudah ada tetapi invalid, reset
    if (form.end_time && !isValidTimeRange(time, form.end_time)) {
      setForm(prev => ({ ...prev, end_time: '' }));
      showAlert('info', 'End time has been cleared as it must be after the new start time');
    }
  };

  const handleEndTimeChange = (time) => {
    if (!form.start_time) {
      showAlert('error', 'Please select a start time first');
      return;
    }
    if (!isValidTimeRange(form.start_time, time)) {
      showAlert('error', 'End time must be after start time');
      return;
    }

    // Pastikan tidak overlap
    if (form.transport_id) {
      const formattedDate = formatApiDate(form.booking_date);
      if (bookedTimes[formattedDate]) {
        const [sh, sm] = form.start_time.split(':').map(Number);
        const [eh, em] = time.split(':').map(Number);
        const newStartVal = sh * 60 + sm;
        const newEndVal   = eh * 60 + em;

        const hasOverlap = bookedTimes[formattedDate].some(slot => {
          const [slotSh, slotSm] = slot.start.split(':').map(Number);
          const [slotEh, slotEm] = slot.end.split(':').map(Number);
          const slotStartVal = slotSh * 60 + slotSm;
          const slotEndVal   = slotEh * 60 + slotEm;
          
          // Cek overlap
          const overlap = (
            (newStartVal >= slotStartVal && newStartVal < slotEndVal) ||
            (newEndVal > slotStartVal && newEndVal <= slotEndVal) ||
            (newStartVal <= slotStartVal && newEndVal >= slotEndVal)
          );
          return overlap;
        });

        if (hasOverlap) {
          showAlert('error', 'Waktu yang dipilih bentrok dengan jadwal booking lain. Pilih slot lain.');
          return;
        }
      }
    }

    setForm(prev => ({ ...prev, end_time: time }));
    if (errors.end_time) {
      setErrors(prev => ({ ...prev, end_time: null }));
    }
  };

  // Handle destination selection
  const handleDestinationChange = (destination) => {
    setForm(prev => ({ ...prev, destination }));
    if (errors.destination) {
      setErrors(prev => ({ ...prev, destination: null }));
    }
  };

  // ---------------------------
  // 8) VALIDASI FORM
  // ---------------------------
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.pic.trim()) {
      newErrors.pic = 'PIC name is required';
    }
    if (!form.section.trim()) {
      newErrors.section = 'Section is required';
    }
    if (!form.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    if (!form.agenda.trim()) {
      newErrors.agenda = 'Agenda is required';
    }
    if (isDateInPast(form.booking_date)) {
      newErrors.booking_date = 'Cannot book for a time that has already passed';
    }
    if (!form.start_time) {
      newErrors.start_time = 'Start time is required';
    } else if (isTimeInPast(form.booking_date, form.start_time)) {
      newErrors.start_time = 'End time must be after start time';
    }
    if (!form.end_time) {
      newErrors.end_time = 'End time is required';
    } else if (
      form.start_time && 
      !isValidTimeRange(form.start_time, form.end_time)
    ) {
      newErrors.end_time = 'End time must be after start time';
    }
    if (form.transport_id === null) {
      newErrors.transport_id = 'Please select a transport';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------
  // 9) HANDLE SUBMIT
  // ---------------------------
  const handleSubmit = async () => {
    if (!validateForm()) {
      // Ambil salah satu error untuk alert
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
      // Panggil API pembuatan booking transport
      const response = await axios.post(
        'http://20.251.153.107:3001/api/transport-bookings', 
        bookingData, 
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );

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

  // ---------------------------
  // 10) FORMAT TANGGAL
  // ---------------------------
  const formatApiDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateDisplay = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // -------------------------------------------------
  // 11) KOMPONEN DATEPICKER DAN TIMEPICKER
  // -------------------------------------------------
  const DatePickerModal = ({ visible, onClose, date, onDateChange }) => {
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
        } catch {}
      }
    }, [date, visible]);

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const getDaysInMonth = (year, month) => {
      return new Date(year, month + 1, 0).getDate();
    };

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

        // Cek fully booked / partially booked
        const fullyBooked = isDateFullyBooked(currentDate);
        const partiallyBooked = isDatePartiallyBooked(currentDate);

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
        transparent={true}
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

            {/* Bulan dan Tahun */}
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

            {/* Header hari */}
            <View className="flex-row justify-around mb-2">
              {weekDays.map(day => (
                <Text key={day} className="w-10 text-center font-medium text-gray-500">
                  {day}
                </Text>
              ))}
            </View>
            
            {/* Grid kalender */}
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

  const TimePickerModal = ({ visible, onClose, time, onTimeChange, title }) => {
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
          showAlert('error', 'Tidak bisa pilih waktu yang sudah lewat');
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
            const isPastTime = isToday() && (
              (isHours && parseInt(item) < currentHour) || 
              (isHours && parseInt(item) === currentHour && !showHours && parseInt(minutes) < currentMinute) ||
              (!isHours && parseInt(hours) === currentHour && parseInt(item) < currentMinute)
            );
            
            return (
              <TouchableOpacity
                className={`w-10 h-10 items-center justify-center m-1 rounded-lg ${
                  selectedValue === item 
                    ? 'bg-orange-500' 
                    : isPastTime
                      ? 'bg-gray-200'
                      : 'bg-gray-100'
                }`}
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
                    showAlert('error', 'Tidak bisa memilih waktu yang sudah lewat');
                  }
                }}
                disabled={isPastTime}
              >
                <Text className={`${
                  selectedValue === item 
                    ? 'text-white' 
                    : isPastTime
                      ? 'text-gray-400'
                      : 'text-gray-800'
                } font-medium text-lg`}>{item}</Text>
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
        transparent={true}
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
              <TouchableOpacity
                onPress={() => setShowHours(true)}
                className="items-center"
              >
                <Text className={`text-2xl font-medium ${showHours ? 'text-sky-500' : 'text-gray-800'}`}>{hours}</Text>
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-gray-800 mx-2">:</Text>
              <TouchableOpacity
                onPress={() => setShowHours(false)}
                className="items-center"
              >
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

  // -------------------------------------------------
  // 12) UI BAGIAN ATAS
  // -------------------------------------------------
  const SectionHeader = ({ title, icon }) => (
    <View className="flex-row items-center mb-4 mt-4">
      <View className="w-8 h-8 bg-orange-500 rounded-full items-center justify-center">
        <Ionicons name={icon} size={18} color="white" />
      </View>
      <Text className="text-gray-800 font-bold text-lg ml-3">{title}</Text>
    </View>
  );

  const BookingLegend = () => (
    <View className="mb-5 px-3 py-4 bg-gray-50 rounded-xl">
      <Text className="text-gray-800 font-medium mb-3">Status Ketersediaan:</Text>
      <View className="flex-row flex-wrap">
        <View className="flex-row items-center mr-4 mb-2">
          <View className="w-4 h-4 bg-yellow-500 rounded mr-1" />
          <Text className="text-gray-700 text-xs">Partially Booked</Text>
        </View>
        <View className="flex-row items-center mr-4 mb-2">
          <View className="w-4 h-4 bg-red-100 rounded mr-1" />
          <Text className="text-gray-700 text-xs">Fully Booked</Text>
        </View>
        <View className="flex-row items-center mr-4 mb-2">
          <View className="w-4 h-4 bg-gray-200 rounded mr-1" />
          <Text className="text-gray-700 text-xs">Past Date</Text>
        </View>
        <View className="flex-row items-center mr-4 mb-2">
          <View className="w-4 h-4 bg-orange-500 rounded mr-1" />
          <Text className="text-gray-700 text-xs">Selected Date</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* HEADER */}
      <View className="bg-sky-500 shadow-md rounded-b-3xl">
        <View className="flex-row items-center space-x-3 px-6 pt-6 pb-8">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 justify-center items-center bg-white/20 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View>
            <Text className="text-white text-2xl font-bold">Book a Transport</Text>
            <Text className="text-white text-opacity-90 mt-1">Reserve your transportation</Text>
          </View>
        </View>
      </View>

      {/* LOADING UNTUK FETCH BOOKINGS */}
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
          {/* PIC */}
          <View className="mb-4">
            <View className={`flex-row items-center bg-white border ${errors.pic ? 'border-red-500' : 'border-gray-200'} 
              rounded-xl py-0 px-3 shadow-sm`}>
              <MaterialIcons name="person" size={22} color="#94A3B8" />
              <TextInput
                className="flex-1 ml-3 text-gray-700 h-12 text-base"
                placeholder="Enter person in charge"
                placeholderTextColor="#94A3B8"
                defaultValue={form.pic}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, pic: text }));
                  if (errors.pic) setErrors(prev => ({ ...prev, pic: null }));
                }}
                editable={true}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                style={{ height: 48 }}
              />
              {errors.pic && (
                <Ionicons name="alert-circle" size={22} color="#EF4444" />
              )}
            </View>
            {errors.pic && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.pic}</Text>}
          </View>

          {/* SECTION */}
          <View className="mb-4">
            <View className={`flex-row items-center bg-white border ${errors.section ? 'border-red-500' : 'border-gray-200'} 
              rounded-xl py-0 px-3 shadow-sm`}>
              <MaterialIcons name="business" size={22} color="#94A3B8" />
              <TextInput
                className="flex-1 ml-3 text-gray-700 h-12 text-base"
                placeholder="Enter section name"
                placeholderTextColor="#94A3B8"
                defaultValue={form.section}
                onChangeText={(text) => {
                  setForm(prev => ({ ...prev, section: text }));
                  if (errors.section) setErrors(prev => ({ ...prev, section: null }));
                }}
                editable={true}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                style={{ height: 48 }}
              />
              {errors.section && (
                <Ionicons name="alert-circle" size={22} color="#EF4444" />
              )}
            </View>
            {errors.section && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.section}</Text>}
          </View>

          {/* agenda */}
          <View className="mb-4">
            <View className={`flex-row items-center bg-white border ${errors.agenda ? 'border-red-500' : 'border-gray-200'} 
              rounded-xl py-0 px-3 shadow-sm`}>
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
                editable={true}
                autoCapitalize="none"
                autoCorrect={false}
                blurOnSubmit={false}
                style={{ height: 48 }}
              />
              {errors.agenda && (
                <Ionicons name="alert-circle" size={22} color="#EF4444" />
              )}
            </View>
            {errors.agenda && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.agenda}</Text>}
          </View>
          
          {/* DESTINATION - REPLACED WITH SEARCH DROPDOWN */}
          <View className="mb-1">
            <Text className="text-gray-700 mb-2 font-medium">Destination *</Text>
            <DestinationSearchDropdown
              value={form.destination}
              onSelect={handleDestinationChange}
              error={errors.destination}
              clearError={() => setErrors(prev => ({ ...prev, destination: null }))}
            />
          </View>

          {/* DESCRIPTION (OPSIONAL) */}
          <View className="mb-4">
            <View className="flex-row items-start bg-white border border-gray-200 rounded-xl py-3 px-3 shadow-sm">
              <MaterialIcons name="description" size={22} color="#94A3B8" style={{ marginTop: 8 }} />
              <TextInput
                className="flex-1 ml-3 text-gray-700 text-base py-1"
                placeholder="Enter description (optional)"
                placeholderTextColor="#94A3B8"
                defaultValue={form.description}
                onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
                editable={true}
                autoCapitalize="sentences"
                autoCorrect={false}
                multiline={true}
                blurOnSubmit={false}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
          </View>

          {/* TRANSPORT SELECTION */}
          <SectionHeader title="Transport Selection" icon="car" />
          {errors.transport_id && <Text className="text-red-500 text-xs mb-2">{errors.transport_id}</Text>}
          <View className="mb-6">
            {transports.map((transport) => {
              const isSelected = Number(transport.transport_id) === Number(form.transport_id);
              return (
                <TouchableOpacity
                  key={transport.transport_id}
                  onPress={() => handleTransportSelection(transport.transport_id)}
                  className={`p-4 mb-4 rounded-xl border ${
                    isSelected ? 'bg-sky-50 border-sky-500' : 'bg-white border-gray-200'
                  } shadow-sm`}
                >
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: fixImageUrl(transport.image) }}
                      style={{ width: 60, height: 60, borderRadius: 10 }}
                      className="mr-4"
                    />
                    <View className="flex-1">
                      <Text className={`text-base ${isSelected ? 'text-sky-900 font-medium' : 'text-gray-700'}`}>
                        {transport.vehicle_name}
                      </Text>
                      <Text className={`text-sm ${isSelected ? 'text-sky-700' : 'text-gray-500'}`}>
                        Capacity: {transport.capacity}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* DATE & TIME */}
          <SectionHeader title="Date & Time" icon="calendar-outline" />

          {form.transport_id ? (
            <BookingLegend />
          ) : (
            <View className="mb-3 bg-yellow-50 p-3 rounded-xl">
              <Text className="text-yellow-700 text-sm text-center">
                Pilih transport untuk melihat ketersediaan
              </Text>
            </View>
          )}

          {/* DATE */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">Booking Date *</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <MaterialIcons name="calendar-today" size={22} color="#0EA5E9" />
              <Text className="ml-3 text-gray-700 font-medium">{formatDateDisplay(form.booking_date)}</Text>
            </TouchableOpacity>
            {errors.booking_date && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.booking_date}</Text>}
          </View>

          {/* START TIME */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">Start Time *</Text>
            <TouchableOpacity
              onPress={() => setShowStartTimePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <MaterialIcons name="access-time" size={22} color="#0EA5E9" />
              <Text className="ml-3 text-gray-700 font-medium">{form.start_time || 'Select start time'}</Text>
            </TouchableOpacity>
            {errors.start_time && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.start_time}</Text>}
          </View>

          {/* END TIME */}
          <View className="mb-5">
            <Text className="text-gray-700 mb-2 font-medium">End Time *</Text>
            <TouchableOpacity
              onPress={() => setShowEndTimePicker(true)}
              className="flex-row items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
            >
              <MaterialIcons name="access-time" size={22} color="#0EA5E9" />
              <Text className="ml-3 text-gray-700 font-medium">{form.end_time || 'Select end time'}</Text>
            </TouchableOpacity>
            {errors.end_time && <Text className="text-red-500 text-xs ml-1 mt-1">{errors.end_time}</Text>}
          </View>

          {/* SUBMIT BUTTON */}
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

      {/* ALERT COMPONENT */}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {/* DATE & TIME PICKERS MODALS */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        date={form.booking_date}
        onDateChange={handleDateChange}
      />

      <TimePickerModal
        visible={showStartTimePicker}
        onClose={() => setShowStartTimePicker(false)}
        time={form.start_time}
        onTimeChange={handleStartTimeChange}
        title="Select Start Time"
      />

      <TimePickerModal
        visible={showEndTimePicker}
        onClose={() => setShowEndTimePicker(false)}
        time={form.end_time}
        onTimeChange={handleEndTimeChange}
        title="Select End Time"
      />
    </SafeAreaView>
  );
};

export default BookingTransport; 