import { useContext, useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons } from "@/constants";
import api from "@/lib/api";
import { AuthContext } from "../../context/AuthContext";
import { router } from "expo-router";
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';

const Profile = () => {
  const { logout } = useContext(AuthContext);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State untuk mode edit
  const [updatedUser, setUpdatedUser] = useState<any>({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setUser(response.data.user);
        setUpdatedUser({
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone,
        });
      } catch (error) {
        console.error('Gagal mengambil profil:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSignOut = async () => {
    await logout();
    // Navigasi kembali ke layar login sudah di-handle oleh context
  };

  const handleEditProfile = async () => {
    try {
      const response = await api.put('http://20.251.153.107:3001/api/auth/edit-profile', {
        id: user.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
      });
      // Mengupdate state 'user' dengan data yang baru
      setUser(response.data.data);
      setIsEditing(false); // Menyembunyikan mode edit setelah berhasil disubmit
    } catch (error) {
      console.error('Gagal mengedit profil:', error);
    }
  };

  // Fungsi untuk mendapatkan inisial dari email
  const getInitialFromEmail = (email: string) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  // Fungsi untuk mendapatkan warna background avatar berdasarkan inisial
  const getAvatarBackgroundColor = (initial: string) => {
    const colors = [
      "bg-sky-500", "bg-orange-500", "bg-emerald-500", 
      "bg-violet-500", "bg-rose-500", "bg-amber-500"
    ];
    // Hash inisial ke salah satu warna
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-white flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </SafeAreaView>
    );
  }

  const userInitial = getInitialFromEmail(user?.email || "user@example.com");
  const avatarBgColor = getAvatarBackgroundColor(userInitial);

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="bg-gray-50 flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View 
            entering={FadeInDown.delay(50)}
            className="pt-8 pb-6 px-4"
          >
            <View className="flex-row items-center">
              {/* Avatar with initial */}
              <View className={`w-16 h-16 rounded-full ${avatarBgColor} items-center justify-center shadow-sm`}>
                <Text className="text-white text-2xl font-semibold">{userInitial}</Text>
              </View>
              <View className="ml-4">
                <Text className="text-gray-800 text-xl font-medium">
                  {user?.name || "User Example"}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {user?.email || "user@example.com"}
                </Text>
              </View>
            </View>
          </Animated.View>
          
          {/* Divider */}
          <View className="h-px bg-gray-100 mx-4" />
          
          {/* Edit Profile Section */}
          {isEditing ? (
            <Animated.View 
              entering={FadeInDown.delay(100)}
              className="px-4 pt-8"
            >
              <Text className="text-sm font-medium text-gray-500 mb-3">EDIT PROFILE</Text>

              <TextInput
                value={updatedUser.name}
                onChangeText={(text) => setUpdatedUser({ ...updatedUser, name: text })}
                placeholder="Name"
                className="py-3 px-4 mb-4 bg-white border border-gray-100 rounded-xl shadow-sm"
              />
              <TextInput
                value={updatedUser.email}
                onChangeText={(text) => setUpdatedUser({ ...updatedUser, email: text })}
                placeholder="Email"
                className="py-3 px-4 mb-4 bg-white border border-gray-100 rounded-xl shadow-sm"
                keyboardType="email-address"
              />
              <TextInput
                value={updatedUser.phone}
                onChangeText={(text) => setUpdatedUser({ ...updatedUser, phone: text })}
                placeholder="Phone"
                className="py-3 px-4 mb-4 bg-white border border-gray-100 rounded-xl shadow-sm"
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                onPress={handleEditProfile}
                className="bg-sky-500 py-3 rounded-xl mb-4 shadow-sm"
                style={{
                  shadowColor: "#0ea5e9",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <Text className="text-white text-center font-medium">Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="bg-gray-200 py-3 rounded-xl shadow-sm"
                style={{
                  shadowColor: "#9ca3af",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <Text className="text-center text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            // Account Settings Section
            <Animated.View 
              entering={FadeInDown.delay(100)}
              className="px-4 pt-8"
            >
              <Text className="text-sm font-medium text-gray-500 mb-3">ACCOUNT</Text>
              <TouchableOpacity
                onPress={() => router.push('/(root)/change-password')}
                className="flex-row items-center justify-between py-4 bg-white rounded-xl px-4 mb-2 shadow-sm"
                style={{
                  shadowColor: "#0ea5e9",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-sky-50 items-center justify-center mr-3">
                    <Image source={icons.password} className="w-4 h-4" style={{ tintColor: '#0ea5e9' }} />
                  </View>
                  <Text className="text-gray-800 font-medium">Change Password</Text>
                </View>
                <Image
                  source={icons.arrowUp}
                  className="w-4 h-4"
                  style={{ transform: [{ rotate: '90deg' }], tintColor: '#94a3b8' }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/(root)/faq')}
                className="flex-row items-center justify-between py-4 bg-white rounded-xl px-4 mb-2 shadow-sm"
                style={{
                  shadowColor: "#0ea5e9",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-sky-50 items-center justify-center mr-3">
                    <Image source={icons.faq} className="w-4 h-4" style={{ tintColor: '#0ea5e9' }} />
                  </View>
                  <Text className="text-gray-800 font-medium">FAQ</Text>
                </View>
                <Image
                  source={icons.arrowUp}
                  className="w-4 h-4"
                  style={{ transform: [{ rotate: '90deg' }], tintColor: '#94a3b8' }}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setIsEditing(true)}
                className="flex-row items-center justify-between py-4 bg-white rounded-xl px-4 shadow-sm"
                style={{
                  shadowColor: "#0ea5e9",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-orange-50 items-center justify-center mr-3">
                    <Image source={icons.person} className="w-4 h-4" style={{ tintColor: '#f97316' }} />
                  </View>
                  <Text className="text-gray-800 font-medium">Edit Profile</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Sign Out Button */}
          <Animated.View 
            entering={FadeInDown.delay(150)}
            className="px-4 mt-10"
          >
            <TouchableOpacity 
              onPress={handleSignOut}  
              className="bg-white border border-gray-100 py-4 rounded-xl shadow-sm"
              style={{
                shadowColor: "#0ea5e9",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2
              }}
            >
              <Text className="text-center text-sky-500 font-medium">Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default Profile;
