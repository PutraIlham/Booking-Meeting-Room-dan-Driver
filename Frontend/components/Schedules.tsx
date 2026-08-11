// Schedules.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DatePicker from "react-native-date-picker";

import { icons } from "@/constants";
import Header from "@/components/Header";

// === Import dari dummyData baru ===
import {
  IMeeting,
  ITransportBooking,
  meetings as dummyMeetings,
  transportBookings as dummyTransportBookings,
  rooms,           // untuk lookup room name
  transportList,   // untuk lookup transport name
  monthNames,
  dayNames,
} from "@/lib/dummyData";

// ----------------------------------------------------
// Helper: Ambil nama room berdasarkan roomId
// ----------------------------------------------------
function getRoomName(roomId: string): string {
  const found = rooms.find((r) => r.roomId === roomId);
  // Apabila tak ditemukan, balikin roomId aja
  return found ? `${found.sizeName} meeting room - ${found.roomName}` : roomId;
}

// ----------------------------------------------------
// Helper: Ambil nama transport berdasarkan transportId
// ----------------------------------------------------
function getTransportName(transportId: string): string {
  const found = transportList.find((t) => t.transportId === transportId);
  return found ? found.transportName : transportId;
}

// Warna acak untuk border kiri jadwal
const colorPalette = [
  "#1E3A8A", // blue-900
  "#5C6AC4", // indigo-600
  "#15803D", // green-700
  "#B91C1C", // red-700
  "#3B82F6", // blue-500
  "#C026D3", // fuchsia-600
  "#DB2777", // pink-600
  "#EA580C", // orange-600
];

// Fungsi random color
const getRandomColor = (): string => {
  const randomIndex = Math.floor(Math.random() * colorPalette.length);
  return colorPalette[randomIndex];
};

const Schedules = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to check if a date has any schedules
  const hasSchedulesOnDate = (checkDate: Date): boolean => {
    const dateStr = formatDateToString(checkDate);
    
    if (selectedScheduleType === "ROOM") {
      return roomsData.some(meeting => meeting.meetingDate === dateStr);
    } else {
      return transportData.some(booking => booking.bookingDate === dateStr);
    }
  };

  // Toggle jadwal "ROOM" vs "TRANSPORT"
  const [selectedScheduleType, setSelectedScheduleType] =
    useState<"ROOM" | "TRANSPORT">("ROOM");

  // State item detail (IMeeting / ITransportBooking)
  const [selectedItem, setSelectedItem] = useState<IMeeting | ITransportBooking | null>(null);

  // Data Meetings & TransportBook
  const roomsData: IMeeting[] = dummyMeetings;
  const transportData: ITransportBooking[] = dummyTransportBookings;

  // Menyimpan warna border item
  const colorMapRef = useRef<Record<string, string>>({});

  // Dapatkan warna per item agar tidak berubah-ubah
  const getItemColor = (item: IMeeting | ITransportBooking, idx: number) => {
    const dateStr = "meetingId" in item ? item.meetingDate : item.bookingDate;
    const key = `${selectedScheduleType}_${dateStr}_${item.startTime}_${item.endTime}_${item.title}_${idx}`;
    if (!colorMapRef.current[key]) {
      colorMapRef.current[key] = getRandomColor();
    }
    return colorMapRef.current[key];
  };

  // Handler DatePicker
  const handleDateSelection = (date: Date) => {
    setSelectedDate(date);
    setIsDatePickerOpen(false);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  // Info date
  const day = selectedDate.getDate();
  const month = monthNames[selectedDate.getMonth()];
  const year = selectedDate.getFullYear();
  const dayName = dayNames[selectedDate.getDay()];

  // Convert "HH:mm" → total menit
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  // Posisi di timeline (jam 9 = 540 menit)
  const calculatePosition = (startTime: string, endTime: string, hourHeight: number = 95) => {
    const startOffset = timeToMinutes(startTime) - 540;
    const duration = timeToMinutes(endTime) - timeToMinutes(startTime);

    return {
      top: (startOffset / 60) * hourHeight,
      height: (duration / 60) * hourHeight,
    };
  };

  // Status: Past, Now, Today, Upcoming
  const getItemStatus = (item: IMeeting | ITransportBooking) => {
    const itemDateStr = "meetingId" in item ? item.meetingDate : item.bookingDate;
    const itemDate = new Date(itemDateStr);

    const currentDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    if (itemDateOnly < currentDateOnly) return "Past";
    if (itemDateOnly > currentDateOnly) return "Upcoming";
    return item.isOngoing ? "Now" : "Today";
  };

  // Filter data
  const selectedDateStr = selectedDate.toISOString().split("T")[0];

  const filteredMeetings = roomsData.filter((m) => m.meetingDate === selectedDateStr);
  const filteredTransportBookings = transportData.filter((t) => t.bookingDate === selectedDateStr);

  const dataToRender =
    selectedScheduleType === "ROOM" ? filteredMeetings : filteredTransportBookings;

  return (
    <SafeAreaView className="bg-slate-100 flex-1">


      {/* ======= FILTER SECTION ======= */}
      <View className=" px-4">
        <View className="bg-white rounded-2xl shadow-md px-4 py-5 relative overflow-hidden">
          {/* Ornament bulat (opsional) */}
          <View
            style={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 120,
              height: 120,
              backgroundColor: "#dbeafe",
              borderRadius: 60,
              opacity: 0.4,
              transform: [{ scale: 1.5 }],
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -70,
              left: -50,
              width: 200,
              height: 200,
              backgroundColor: "#e0f2fe",
              borderRadius: 100,
              opacity: 0.4,
              transform: [{ scale: 1.2 }],
            }}
          />

          {/* Filter Title & Toggle */}
          <View className="flex-row items-center justify-between mb-3 z-10">
            <View>
              <Text className="text-xl font-extrabold text-blue-900">Hi!</Text>
              {isToday(selectedDate) && (
                <Text className="text-xs font-semibold text-green-600">It’s Today!</Text>
              )}
            </View>

            {/* Toggle ROOM vs TRANSPORT */}
            <View className="flex-row">
              <TouchableOpacity
                className={`rounded-full px-3 py-2 mr-1 flex-row items-center ${
                  selectedScheduleType === "ROOM"
                    ? "bg-blue-900"
                    : "border border-blue-900 bg-white"
                }`}
                onPress={() => setSelectedScheduleType("ROOM")}
              >
                <Image
                  source={icons.door}
                  className="w-4 h-4 mr-1"
                  resizeMode="contain"
                  style={{
                    tintColor: selectedScheduleType === "ROOM" ? "#fff" : "#1E3A8A",
                  }}
                />
                <Text
                  className={`text-xs font-semibold ${
                    selectedScheduleType === "ROOM" ? "text-white" : "text-blue-900"
                  }`}
                >
                  Rooms
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`rounded-full px-3 py-2 flex-row items-center ${
                  selectedScheduleType === "TRANSPORT"
                    ? "bg-blue-900"
                    : "border border-blue-900 bg-white"
                }`}
                onPress={() => setSelectedScheduleType("TRANSPORT")}
              >
                <Image
                  source={icons.car}
                  className="w-4 h-4 mr-1"
                  resizeMode="contain"
                  style={{
                    tintColor: selectedScheduleType === "TRANSPORT" ? "#fff" : "#1E3A8A",
                  }}
                />
                <Text
                  className={`text-xs font-semibold ${
                    selectedScheduleType === "TRANSPORT"
                      ? "text-white"
                      : "text-blue-900"
                  }`}
                >
                  Transport
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Info */}
          <View className="z-10">
            <Text className="text-sm font-bold text-blue-900">
              {month} {day}, {year}
            </Text>
            <Text className="text-xs text-blue-700 italic mb-2">{dayName}</Text>
          </View>

          {/* ScrollView: Bulan */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2 z-10"
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
            {monthNames.map((mn, index) => {
              const isActive = index === selectedDate.getMonth();
              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(index);
                    setSelectedDate(newDate);
                  }}
                  className={`px-3 py-1 rounded-full mr-1 mb-1 ${
                    isActive ? "bg-blue-800" : "border border-blue-700 bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isActive ? "text-white" : "text-blue-900/80"
                    }`}
                  >
                    {mn.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ScrollView: Hari */}
          <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    className="mt-1 z-10"
    contentContainerStyle={{ paddingHorizontal: 2 }}
  >
    {Array.from(
      {
        length: new Date(year, selectedDate.getMonth() + 1, 0).getDate(),
      },
      (_, idx) => {
        const tempDay = idx + 1;
        const isSelected = tempDay === selectedDate.getDate();
        const dateToCheck = new Date(year, selectedDate.getMonth(), tempDay);
        const hasSchedules = hasSchedulesOnDate(dateToCheck);
        const shortDayName = dayNames[dateToCheck.getDay()].substring(0, 3);

        // Debug logs (you can remove these later)
        // console.log(`Date: ${formatDateToString(dateToCheck)}, Has Schedules: ${hasSchedules}`);

        return (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(tempDay);
              setSelectedDate(newDate);
            }}
            className="items-center mr-2 mb-1"
          >
            <Text
              className={`text-[10px] font-medium ${
                isSelected ? "text-blue-900" : "text-blue-900/60"
              }`}
            >
              {shortDayName}
            </Text>
            <View
              className={`mt-1 rounded-full w-7 h-7 items-center justify-center ${
                isSelected 
                  ? "bg-blue-800" 
                  : hasSchedules 
                    ? "bg-blue-200 border border-blue-400" 
                    : "bg-white border border-blue-700"
              }`}
            >
              <Text
                className={`text-[12px] font-bold ${
                  isSelected 
                    ? "text-white" 
                    : hasSchedules 
                      ? "text-blue-800"
                      : "text-blue-900"
                }`}
              >
                {tempDay}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }
    )}
          </ScrollView>


          {/* ScrollView: Tahun */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-2 z-10"
            contentContainerStyle={{ paddingHorizontal: 2 }}
          >
            {Array.from({ length: 10 }, (_, idx) => {
              const tempYear = today.getFullYear() - 5 + idx;
              const isActive = tempYear === selectedDate.getFullYear();
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(tempYear);
                    setSelectedDate(newDate);
                  }}
                  className={`px-3 py-1 rounded-full mr-1 mb-1 ${
                    isActive ? "bg-blue-800" : "border border-blue-700 bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isActive ? "text-white" : "text-blue-900/80"
                    }`}
                  >
                    {tempYear}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ======= TIMELINE SECTION ======= */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        className="px-4 pt-3 mt-2"
      >
        <View className="relative" style={{ height: 1400 }}>
          {/* Garis waktu jam 9 - 23 (9 + 14 = 23) */}
          {Array.from({ length: 15 }, (_, idx) => {
            const hour = 9 + idx;
            return (
              <View
                key={idx}
                className="absolute left-0 right-0 flex-row items-start"
                style={{ top: idx * 90 }}
              >
                <View className="w-12">
                  <Text className="text-blue-300 text-[11px] font-semibold">{`${hour}:00`}</Text>
                </View>
                <View className="flex-1 relative">
                  <View className="absolute left-3 top-0 w-full h-[1px] bg-blue-100" />
                </View>
              </View>
            );
          })}

          {/* Render Jadwal */}
          {dataToRender.map((item, idx) => {
            const { startTime, endTime, title, isOngoing } = item;
            const dateStr = "meetingId" in item ? item.meetingDate : item.bookingDate;
            const { top } = calculatePosition(startTime, endTime, 90);
            const borderColor = getItemColor(item, idx);

            // ROOM vs TRANSPORT name
            const locationLabel =
              "roomId" in item
                ? getRoomName(item.roomId)
                : getTransportName(item.transportId);

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.9}
                className="absolute left-14 right-3 bg-white shadow rounded-xl"
                style={{
                  top,
                  height: 130,
                  borderLeftWidth: 5,
                  borderLeftColor: borderColor,
                  paddingBottom: 3,
                }}
                onPress={() => setSelectedItem(item)}
              >
                <View className="p-3 pt-2">
                  {/* Title & Badge NOW */}
                  <View className="flex-row items-start justify-between">
                    <Text
                      numberOfLines={1}
                      className="flex-1 pr-2 text-sm font-bold text-blue-900"
                    >
                      {title}
                    </Text>
                    {isOngoing && (
                      <Text className="px-2 text-[10px] font-bold text-blue-700 bg-blue-100 rounded-full">
                        NOW
                      </Text>
                    )}
                  </View>

                  {/* ROOM / VEHICLE */}
                  <Text className="text-[11px] mt-1 text-gray-600 font-medium">
                    {locationLabel}
                  </Text>

                  {/* Time range */}
                  <View className="mt-3 flex-row items-center justify-between">
                    <Text className="text-[11px] text-gray-500 font-semibold">
                      {startTime} – {endTime}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ======= MODAL DETAIL ======= */}
      <Modal
        visible={!!selectedItem}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedItem(null)}
      >
        <View className="flex-1 bg-black/40">
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl p-5 shadow-2xl">
              {selectedItem && (
                <>
                  {/* Title */}
                  <View className="-m-5 mb-2 p-5 rounded-t-3xl">
                    <Text numberOfLines={2} className="text-xl font-extrabold text-blue-900">
                      {selectedItem.title}
                    </Text>
                  </View>

                  <View className="space-y-3">
                    {/* DATE & TIME Card */}
                    <View className="bg-blue-50 p-3 rounded-xl flex-row items-center">
                      <View className="bg-blue-500 p-2 rounded-lg mr-3">
                        <Image
                          source={icons.calendar}
                          className="w-4 h-4"
                          resizeMode="contain"
                          tintColor="white"
                        />
                      </View>
                      <View>
                        <Text className="text-[10px] text-blue-500 font-semibold">
                          DATE & TIME
                        </Text>
                        <Text className="text-[13px] text-gray-800 font-bold">
                          {"meetingId" in selectedItem
                            ? selectedItem.meetingDate
                            : selectedItem.bookingDate}
                          , {selectedItem.startTime} – {selectedItem.endTime}
                        </Text>
                      </View>
                    </View>

                    {/* ROOM / VEHICLE Card */}
                    {"roomId" in selectedItem ? (
                      <View className="bg-purple-50 p-3 rounded-xl flex-row items-center">
                        <View className="bg-purple-500 p-2 rounded-lg mr-3">
                          <Image
                            source={icons.wide}
                            className="w-4 h-4"
                            resizeMode="contain"
                            tintColor="white"
                          />
                        </View>
                        <View>
                          <Text className="text-[10px] text-purple-500 font-semibold">ROOM</Text>
                          <Text className="text-[13px] text-gray-800 font-bold">
                            {getRoomName(selectedItem.roomId)}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View className="bg-purple-50 p-3 rounded-xl flex-row items-center">
                        <View className="bg-purple-500 p-2 rounded-lg mr-3">
                          <Image
                            source={icons.wide}
                            className="w-4 h-4"
                            resizeMode="contain"
                            tintColor="white"
                          />
                        </View>
                        <View>
                          <Text className="text-[10px] text-purple-500 font-semibold">
                            VEHICLE
                          </Text>
                          <Text className="text-[13px] text-gray-800 font-bold">
                            {getTransportName(selectedItem.transportId)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* STATUS Card */}
                    <View className="bg-orange-50 p-3 rounded-xl flex-row items-center">
                      <View className="bg-orange-400 p-2 rounded-lg mr-3">
                        <Image
                          source={icons.clock}
                          className="w-4 h-4"
                          resizeMode="contain"
                          tintColor="white"
                        />
                      </View>
                      <View>
                        <Text className="text-[10px] text-orange-500 font-semibold">STATUS</Text>
                        <Text className="text-[13px] text-gray-800 font-bold">
                          {getItemStatus(selectedItem)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text className="mt-4 text-[10px] text-center text-gray-400">
                    We adhere entirely to the data security standards
                    of the booking system.
                  </Text>

                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={() => setSelectedItem(null)}
                    className="bg-blue-900 mt-3 rounded-xl py-3"
                  >
                    <Text className="text-center text-white font-bold text-sm">
                      Close
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* DatePicker (opsional) */}
      <DatePicker
        modal
        open={isDatePickerOpen}
        date={selectedDate}
        onConfirm={handleDateSelection}
        onCancel={() => setIsDatePickerOpen(false)}
        mode="date"
        title="Select a Date"
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
};

export default Schedules;
