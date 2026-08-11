import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Animated } from "react-native";
import { useRouter } from "expo-router";
import { INotification, notifications as dummyNotifications } from "@/lib/dummyData";
import { icons, images } from "@/constants";
import { LinearGradient } from 'expo-linear-gradient';

const Header = () => {
  const router = useRouter();
  const [notifications] = useState<INotification[]>(dummyNotifications);
  const [scale] = useState(new Animated.Value(1));

  const notificationCount = notifications.length;

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (notificationCount > 0) {
        setTimeout(pulseAnimation, 3000);
      }
    });
  };

  React.useEffect(() => {
    if (notificationCount > 0) {
      pulseAnimation();
    }
  }, [notificationCount]);

  const userAvatar = "https://via.placeholder.com/150/003580/ffffff?text=User";

  const timeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 19) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <View className="bg-white">
      <LinearGradient
        colors={['rgba(255,255,255,0.9)', 'rgba(240,244,248,0.9)']}
        className="pt-4 pb-6 px-5 shadow-sm"
      >
        <View className="flex-row justify-between items-center">
          {/* Left Section: Greetings & Profile */}
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity 
              onPress={() => router.push("/(root)/profile")}
              className="shadow-sm"
            >
              <Image
                source={images.profile1}
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
            </TouchableOpacity>
            
            <View>
              <Text className="text-slate-500 text-sm font-medium">
                {timeOfDay()}
                <Text className="text-slate-400">
                  {[..."..."].map((dot, i) => (
                    <Text key={i} style={{ opacity: 1 - i * 0.2 }}>{dot}</Text>
                  ))}
                </Text>
              </Text>
              <Text className="text-slate-800 text-lg font-bold">
                John Doe
              </Text>
            </View>
          </View>

          {/* Right Section: Notification */}
          <TouchableOpacity
            onPress={() => router.push("/(root)/notifikasi")}
            className="bg-white p-3 rounded-full shadow-md border border-slate-100 active:scale-95 transition-transform"
          >
            <View className="relative">
              <Animated.Image
                source={icons.bell}
                className="w-6 h-6 opacity-80"
                style={{ transform: [{ scale }] }}
              />
              {notificationCount > 0 && (
                <View className="absolute -top-2 -right-2 bg-blue-600 rounded-full min-w-[20px] h-[20px] flex justify-center items-center border-2 border-white">
                  <Text className="text-white text-xs font-bold px-1">
                    {notificationCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

export default Header;