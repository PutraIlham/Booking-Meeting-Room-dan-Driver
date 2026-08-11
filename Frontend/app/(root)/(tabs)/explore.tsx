import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import axios from 'axios';
import { images, icons } from "@/constants";
import { Ionicons, Feather } from '@expo/vector-icons';
import { tokenCache } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

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

const Explore = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Rooms" | "Transportation">("Rooms");
  const [rooms, setRooms] = useState<IRoom[]>([]);
  const [transportations, setTransportations] = useState<ITransport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Utility function to fix image URLs
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

  const fetchAuthToken = async () => {
    return await tokenCache.getToken(AUTH_TOKEN_KEY);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const authToken = await fetchAuthToken();

      if (!authToken) {
        Alert.alert('Error', 'Not authenticated');
        router.push('/(auth)/sign-in');
        return;
      }

      await Promise.all([fetchAllRooms(authToken), fetchAllTransportations(authToken)]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRooms = async (authToken: string) => {
    try {
      const response = await axios.get('http://20.251.153.107:3001/api/rooms', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      handleError(error);
    }
  };

  const fetchAllTransportations = async (authToken: string) => {
    try {
      const response = await axios.get('http://20.251.153.107:3001/api/transports', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      setTransportations(response.data);
    } catch (error) {
      console.error("Error fetching transportations:", error);
      handleError(error);
    }
  };

  const handleError = (error: any) => {
    if (error.response?.status === 401) {
      Alert.alert('Session Expired', 'Please log in again to continue.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }
      ]);
    } else {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const RoomCard = ({ room }: { room: IRoom }) => {
    const facilitiesList = room.facilities 
      ? room.facilities.split(',').map(item => item.trim()) 
      : [];
  
    // Menambahkan colorMap untuk fasilitas
    const colorMap = {
      0: { bg: 'bg-sky-50', text: 'text-sky-600' },
      1: { bg: 'bg-sky-100', text: 'text-sky-700' },
      2: { bg: 'bg-orange-50', text: 'text-orange-600' },
      3: { bg: 'bg-orange-100', text: 'text-orange-700' },
    };
  
    // Process the image URL using our utility function
    const imageUrl = fixImageUrl(room.image) || images.smroom;
    
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-sky-50"
        onPress={() => router.push(`/detail?id=${room.room_id}&type=room`)}
      >
        <View className="flex-row p-4">
          <Image
            source={{ uri: imageUrl }}
            className="w-24 h-24 rounded-lg"
            resizeMode="cover"
            defaultSource={images.smroom}
          />
          <View className="flex-1 pl-4 justify-between">
            <View>
              <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
                {room.room_name}
              </Text>
              
              <View className="flex-row items-center mt-1">
                <Ionicons name="pricetag-outline" size={13} color="#0EA5E9" />
                <Text className="text-xs text-sky-500 font-medium ml-1.5">
                  {room.room_type}
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={13} color="#F97316" />
                <Text className="text-xs text-orange-500 font-medium ml-1.5">
                  {room.capacity} persons
                </Text>
              </View>
            </View>
            
            {/* Fasilitas */}
            <View className="flex-row flex-wrap gap-1.5 mt-2">
              {facilitiesList.slice(0, 3).map((facility, index) => (
                <View 
                  key={index} 
                  className={`${colorMap[index % 4].bg} px-2 py-0.5 rounded-full`}
                >
                  <Text className={`${colorMap[index % 4].text} text-xs font-normal`}>
                    {facility}
                  </Text>
                </View>
              ))}
              {facilitiesList.length > 3 && (
                <View className="bg-gray-50 px-2 py-0.5 rounded-full">
                  <Text className="text-gray-500 text-xs font-normal">+{facilitiesList.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const TransportCard = ({ transport }: { transport: ITransport }) => {
    // Process the image URL using our utility function
    const imageUrl = fixImageUrl(transport.image);
    
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm border border-sky-50"
        onPress={() => router.push(`/detail?id=${transport.transport_id}&type=transport`)}
      >
        <View className="flex-row p-4">
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              className="w-24 h-24 rounded-lg"
              resizeMode="cover"
              defaultSource={images.smroom}
            />
          ) : (
            <View className="w-24 h-24 bg-gray-200 rounded-lg items-center justify-center">
              <Ionicons name="car-outline" size={24} color="gray" />
            </View>
          )}
          
          <View className="flex-1 pl-4 justify-between">
            <View>
              <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
                {transport.vehicle_name}
              </Text>
              
              <View className="flex-row items-center mt-1">
                <Ionicons name="person" size={13} color="#0EA5E9" />
                <Text className="text-xs text-sky-500 font-medium ml-1.5">
                  Driver: {transport.driver_name}
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Image
                  source={icons.seat}
                  style={{ width: 13, height: 13, tintColor: "#F97316" }}
                />
                <Text className="text-xs text-orange-500 font-medium ml-1.5">
                  {transport.capacity} seats
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state components with new color scheme
  const EmptyState = ({ type }: { type: "Rooms" | "Transportation" }) => (
    <View className="flex-1 justify-center items-center py-12">
      <View className="bg-sky-50 w-16 h-16 rounded-full items-center justify-center mb-4">
        <Ionicons 
          name={type === "Rooms" ? "bed-outline" : "car-outline"} 
          size={28} 
          color="#0ea5e9" 
        />
      </View>
      <Text className="text-gray-800 font-medium text-lg text-center">
        No {type} Available
      </Text>
      <Text className="text-gray-500 text-center mt-2 text-sm">
        {type === "Rooms" 
          ? "There are no rooms available at the moment. Please check again later." 
          : "There are no vehicles available at the moment. Please check again later."}
      </Text>
    </View>
  );

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="pt-2 pb-4">
          <Animated.View 
            entering={FadeInDown.delay(50)}
            className="px-4 mt-2 mb-4"
          >
            <Text className="text-2xl font-semibold text-gray-800 mb-1">Explore</Text>
            <Text className="text-gray-500">Find rooms and transportation for your needs</Text>
          </Animated.View>

          {/* Search Bar */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="mx-4 mb-4"
          >
            <View className="flex-row bg-white rounded-lg px-3 py-2 items-center border border-gray-100">
              <Ionicons name="search-outline" size={18} color="#9ca3af" />
              <TextInput
                placeholder="Search rooms or transportation..."
                placeholderTextColor="#9ca3af"
                className="flex-1 ml-2 text-gray-700"
                style={{fontSize: 14}}
              />
            </View>
          </Animated.View>

          {/* Tab Toggle */}
          <Animated.View 
            entering={FadeInDown.delay(150)}
            className="flex-row justify-center mx-4"
          >
            <View className="flex-row bg-sky-50 rounded-lg p-1 w-full">
              {['Rooms', 'Transportation'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab as "Rooms" | "Transportation")}
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

        {/* Main Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="px-4 flex-row items-center justify-between mb-2"
          >
            <View className="flex-row items-center">
              <View className="w-1 h-4 bg-sky-500 rounded-full mr-2" />
              <Text className="text-gray-800 font-medium">
                {activeTab === "Rooms" ? "Available Rooms" : "Available Transportation"}
              </Text>
            </View>
          </Animated.View>

          {loading ? (
            <View className="flex-1 justify-center items-center py-32">
              <ActivityIndicator size="large" color="#0EA5E9" />
              <Text className="text-sky-500 mt-4 font-normal text-sm">Loading content...</Text>
            </View>
          ) : (
            <View className="flex-1 px-4 pt-1 pb-24">
              {activeTab === "Rooms" ? (
                rooms.length > 0 ? 
                rooms.map((room) => <RoomCard key={room.room_id} room={room} />) : 
                <EmptyState type="Rooms" />
              ) : (
                transportations.length > 0 ?
                transportations.map((transport) => <TransportCard key={transport.transport_id} transport={transport} />) :
                <EmptyState type="Transportation" />
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default Explore;