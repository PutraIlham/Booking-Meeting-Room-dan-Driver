// app/(auth)/sign-up.tsx

import { Link, router } from "expo-router";
import { useState, useContext } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import ReactNativeModal from "react-native-modal";
import { icons } from "@/constants";
import InputField from "@/components/InputField";
import { AuthContext } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const SignUp = () => {
  const { register } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State untuk verifikasi
  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    general: "",
  });

  const validate = () => {
    let isValid = true;
    const newErrors = {
      name: "",
      email: "",
      password: "",
      phone: "",
      general: "",
    };

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const onSignUpPress = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);
      await register(form.name, form.email, form.password, form.phone);
      // Show verification modal instead of navigating directly
      setVerification({ ...verification, state: "pending" });
    } catch (err: any) {
      setErrors({...errors, general: err.message || "Registration failed. Please try again."});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 60 }}>
        {/* Elegant header without gradient */}
        <View className="px-8 mb-6">
          {/* Logo and decorative elements */}
          <View className="flex-row justify-center mb-6">
            <View className="w-16 h-16 rounded-full bg-sky-500 justify-center items-center">
              <View className="w-12 h-12 rounded-full bg-white justify-center items-center">
                <View className="w-8 h-8 rounded-full bg-orange-400" />
              </View>
            </View>
          </View>
          
          {/* Welcome text */}
          <Text className="text-sky-950 text-3xl font-bold text-center">Create Account</Text>
          <Text className="text-sky-600 text-sm text-center mt-2 mb-4">Join SISI and get started</Text>
          
          {/* Decorative line */}
          <View className="flex-row justify-center items-center">
            <View className="h-1 w-6 rounded-full bg-orange-400 mr-1" />
            <View className="h-1 w-12 rounded-full bg-sky-400" />
          </View>
        </View>

        {/* Form container */}
        <View className="px-6">
          <View className="bg-white rounded-3xl shadow-lg p-8 mb-6">
            {/* Form design elements */}
            <View className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-sky-100 opacity-70" />
            <View className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-orange-100 opacity-70" />
            
            {/* Form title */}
            <View className="mb-8">
              <Text className="text-sky-950 text-2xl font-bold text-center">Sign Up</Text>
            </View>

            {/* General Error Message */}
            {errors.general !== "" && (
              <View className="bg-red-50 p-4 rounded-xl mb-4 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-red-500 text-sm ml-2 flex-1">
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Full Name */}
            <InputField
              label="Full Name"
              icon={icons.user}
              value={form.name}
              onChangeText={(value) => {
                setForm({ ...form, name: value });
                if (errors.name) setErrors({...errors, name: ""});
              }}
              placeholder="Enter your full name"
              labelStyle={{ color: '#0c4a6e', fontWeight: '600' }}
              containerStyle={{ backgroundColor: '#f0f9ff', borderRadius: 12, paddingVertical: 6 }}
              error={errors.name}
            />

            {/* Phone Number */}
            <InputField
              label="Phone Number"
              icon={icons.telephone}
              value={form.phone}
              onChangeText={(value) => {
                setForm({ ...form, phone: value });
                if (errors.phone) setErrors({...errors, phone: ""});
              }}
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
              labelStyle={{ color: '#0c4a6e', fontWeight: '600' }}
              containerStyle={{ backgroundColor: '#f0f9ff', borderRadius: 12, paddingVertical: 4 }}
              error={errors.phone}
            />

            {/* Email */}
            <InputField
              label="Email"
              icon={icons.email}
              value={form.email}
              onChangeText={(value) => {
                setForm({ ...form, email: value });
                if (errors.email) setErrors({...errors, email: ""});
              }}
              keyboardType="email-address"
              placeholder="Enter your email address"
              labelStyle={{ color: '#0c4a6e', fontWeight: '600' }}
              containerStyle={{ backgroundColor: '#f0f9ff', borderRadius: 12, paddingVertical: 4 }}
              error={errors.email}
            />

            {/* Password */}
            <InputField
              label="Password"
              icon={icons.lock}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(value) => {
                setForm({ ...form, password: value });
                if (errors.password) setErrors({...errors, password: ""});
              }}
              rightIcon={showPassword ? icons.eye : icons.eyecross}
              onRightIconPress={() => setShowPassword(!showPassword)}
              placeholder="Create a password"
              labelStyle={{ color: '#0c4a6e', fontWeight: '600' }}
              containerStyle={{ backgroundColor: '#f0f9ff', borderRadius: 12, paddingVertical: 4 }}
              error={errors.password}
            />

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={isLoading}
              className={`${isLoading ? 'bg-gray-400' : 'bg-orange-500'} py-4 rounded-xl mt-4 mb-4 flex-row justify-center items-center shadow-sm`}
            >
              {isLoading ? (
                <Text className="text-center text-white font-bold">Registering...</Text>
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-center text-white font-bold">Create Account</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-0.5 bg-gray-200" />
              <Text className="text-gray-400 px-4">or</Text>
              <View className="flex-1 h-0.5 bg-gray-200" />
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-in")}
              className="bg-white border border-sky-400 py-4 rounded-xl flex-row justify-center items-center shadow-sm"
            >
              <Ionicons name="log-in-outline" size={20} color="#0284c7" style={{ marginRight: 8 }} />
              <Text className="text-center text-sky-500 font-bold">
                Sign In Instead
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom text */}
          <View className="items-center mb-8">
            <Text className="text-center text-gray-500 text-sm">
              By registering, you agree to our
            </Text>
            <View className="flex-row mt-1">
              <TouchableOpacity>
                <Text className="text-sky-600 text-sm font-medium">Terms of Service</Text>
              </TouchableOpacity>
              <Text className="text-gray-500 text-sm"> and </Text>
              <TouchableOpacity>
                <Text className="text-sky-600 text-sm font-medium">Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal Verifikasi */}
      <ReactNativeModal 
        isVisible={verification.state === "pending"}
        animationIn="slideInUp"
        backdropOpacity={0.5}
      >
        <View className="bg-white px-6 py-8 rounded-3xl">
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-full bg-sky-100 justify-center items-center mb-4">
              <Ionicons name="mail-outline" size={32} color="#0284c7" />
            </View>
            <Text className="font-bold text-2xl text-sky-900 mb-1">Verification</Text>
            <Text className="text-gray-500 text-center">
              We've sent a verification code to 
            </Text>
            <Text className="text-sky-700 font-medium mb-2">{form.email}</Text>
          </View>
          
          <View className="bg-sky-50 rounded-xl px-4 py-3 mb-4">
            <TextInput
              placeholder="Enter 6-digit code"
              keyboardType="numeric"
              value={verification.code}
              onChangeText={(code) => setVerification({ ...verification, code })}
              className="text-base text-sky-700 text-center"
              maxLength={6}
            />
          </View>
          
          {verification.error && (
            <Text className="text-red-500 text-sm mb-3 text-center">
              {verification.error}
            </Text>
          )}
          
          <TouchableOpacity
            onPress={() => {
              // Implementation for verification
              setVerification({ ...verification, state: "default" });
              router.push("/(auth)/sign-in");
            }}
            className="bg-sky-600 rounded-xl py-4 mt-2"
          >
            <Text className="text-white text-center font-bold">
              Verify Email
            </Text>
          </TouchableOpacity>
          
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-500">Didn't receive the code? </Text>
            <TouchableOpacity>
              <Text className="text-orange-500 font-medium">Resend</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ReactNativeModal>
    </KeyboardAvoidingView>
  );
};

export default SignUp;