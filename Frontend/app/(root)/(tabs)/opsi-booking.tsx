import React, { useState } from "react";
import { View, Text, TouchableOpacity, SafeAreaView, Image } from "react-native";
import { useRouter } from "expo-router";
import { images } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

const OpsiBooking = () => {
  const router = useRouter();

  const handleBooking = (type: "Room" | "Transportation") => {
    if (type === "Room") {
      router.push('/(root)/booking-room');
    } else if (type === "Transportation") {
      router.push('/(root)/booking-transport');
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
            className="px-4 mt-2 mb-4"
          >
            <Text className="text-2xl font-semibold text-gray-800 mb-1">Choose Service</Text>
            <Text className="text-gray-500">Select the service you want to book</Text>
          </Animated.View>
        </View>

        {/* Cards Container */}
        <View className="flex-1 px-4 pt-2">
          <View className="flex-row justify-between px-2 gap-4">
            {/* Room Card */}
            <Animated.View
              entering={FadeInDown.delay(100)}
              className="flex-1"
            >
              <TouchableOpacity
                onPress={() => handleBooking("Room")}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sky-50"
                style={{
                  shadowColor: "#0ea5e9",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <View className="relative">
                  <Image 
                    source={images.smroom} 
                    className="w-full h-40"
                    resizeMode="cover"
                  />
                  <View className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
                  <View className="absolute top-4 right-4">
                    <View className="bg-white/30 backdrop-blur-lg rounded-full p-2">
                      <Ionicons name="business" size={24} color="white" />
                    </View>
                  </View>
                </View>
                
                <View className="p-4">
                  <View className="mb-2">
                    <Text className="text-xl font-semibold text-gray-800 mb-1">
                      Room
                    </Text>
                    <Text className="text-sm text-gray-500 leading-tight">
                      Book meeting rooms and workspaces for your team
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-3">
                    <View className="flex-row items-center bg-sky-50 px-3 py-1 rounded-full">
                      <Ionicons name="people" size={14} color="#0EA5E9" />
                      <Text className="text-sky-500 text-xs ml-1 font-medium">
                        For teams
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Transport Card */}
            <Animated.View
              entering={FadeInDown.delay(150)}
              className="flex-1"
            >
              <TouchableOpacity
                onPress={() => handleBooking("Transportation")}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-sky-50"
                style={{
                  shadowColor: "#0ea5e9",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <View className="relative">
                  <Image 
                    source={images.car1} 
                    className="w-full h-40"
                    resizeMode="cover"
                  />
                  <View className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
                  <View className="absolute top-4 right-4">
                    <View className="bg-white/30 backdrop-blur-lg rounded-full p-2">
                      <Ionicons name="car" size={24} color="white" />
                    </View>
                  </View>
                </View>
                
                <View className="p-4">
                  <View className="mb-2">
                    <Text className="text-xl font-semibold text-gray-800 mb-1">
                      Transport
                    </Text>
                    <Text className="text-sm text-gray-500 leading-tight">
                      Book vehicles and transportation services
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-3">
                    <View className="flex-row items-center bg-sky-50 px-3 py-1 rounded-full">
                      <Ionicons name="time" size={14} color="#0EA5E9" />
                      <Text className="text-sky-500 text-xs ml-1 font-medium">
                        24/7 Available
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

export default OpsiBooking;
