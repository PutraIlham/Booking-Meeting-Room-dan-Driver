// app/(auth)/sign-in.tsx

import { Link, router } from "expo-router";
import { useState, useContext } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { icons } from "@/constants";
import InputField from "@/components/InputField";
import { AuthContext } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const SignIn = () => {
  const { login } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onSignInPress = async () => {
    const newErrors = {
      email: "",
      password: "",
      general: "",
    };

    if (!form.email) {
      newErrors.email = "Email is required";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }

    if (!form.email || !form.password) {
      newErrors.general = "Please fill in all fields";
      setErrors(newErrors);
      return;
    }
    
    try {
      setIsLoading(true);
      setErrors({...errors, general: ""});
      await login(form.email, form.password);
    } catch (error: any) {
      setErrors({...errors, general: "Invalid email or password. Please try again."});
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
            <View className="w-16 h-16 rounded-full bg-orange-400 justify-center items-center">
              <View className="w-12 h-12 rounded-full bg-white justify-center items-center">
                <View className="w-8 h-8 rounded-full bg-sky-500" />
              </View>
            </View>
          </View>
          
          {/* Welcome text */}
          <Text className="text-sky-950 text-3xl font-bold text-center">Welcome Back</Text>
          <Text className="text-sky-600 text-sm text-center mt-2 mb-4">Sign in to your SISI account</Text>
          
          {/* Decorative line */}
          <View className="flex-row justify-center items-center">
            <View className="h-1 w-12 rounded-full bg-sky-400 mr-1" />
            <View className="h-1 w-6 rounded-full bg-orange-400" />
          </View>
        </View>

        {/* Form container */}
        <View className="px-6">
          <View className="bg-white rounded-3xl shadow-lg p-8 mb-6">
            {/* Form design elements */}
            <View className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-orange-100 opacity-70" />
            <View className="absolute -bottom-4 -left-4 w-12 h-12 rounded-full bg-sky-100 opacity-70" />
            
            {/* Form title */}
            <View className="mb-8">
              <Text className="text-sky-950 text-2xl font-bold text-center">Sign In</Text>
            </View>

            {/* General Error Message - Updated to match sign-up page style */}
            {/* {errors.general !== "" && (
              <View className="bg-red-50 p-4 rounded-xl mb-4 flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text className="text-red-500 text-sm ml-2 flex-1">
                  {errors.general}
                </Text>
              </View>
            )} */}

            {/* Email Input */}
            <InputField
              label="Email"
              icon={icons.email}
              value={form.email}
              onChangeText={(value) => {
                setForm({ ...form, email: value });
                if (errors.email) setErrors({...errors, email: ""});
              }}
              keyboardType="email-address"
              labelStyle={{ color: '#0c4a6e', fontWeight: '600' }}
              containerStyle={{ backgroundColor: '#f0f9ff', borderRadius: 12, paddingVertical: 6 }}
              placeholder="Enter your email"
              error={errors.email}
            />

            {/* Password Input */}
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
              labelStyle={{ color: '#0c4a6e', fontWeight: '600' }}
              containerStyle={{ backgroundColor: '#f0f9ff', borderRadius: 12, paddingVertical: 4 }}
              placeholder="Enter your password"
              error={errors.password}
            />
{/*             
            <TouchableOpacity className="self-end mt-3 mb-2">
              <Text className="text-sm text-sky-600 font-medium">Forgot Password?</Text>
            </TouchableOpacity> */}

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={onSignInPress}
              disabled={isLoading}
              className={`${isLoading ? 'bg-gray-400' : 'bg-sky-600'} py-4 rounded-xl mt-4 mb-4 flex-row justify-center items-center shadow-sm`}
            >
              {isLoading ? (
                <Text className="text-center text-white font-bold">Signing In...</Text>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-center text-white font-bold">Sign In</Text>
                </>
              )}
            </TouchableOpacity>

         

            {/* Sign Up Button */}
            {/* <TouchableOpacity
              onPress={() => router.push("/(auth)/sign-up")}
              className="bg-white border border-orange-400 py-4 rounded-xl flex-row justify-center items-center shadow-sm"
            >
              <Ionicons name="person-add-outline" size={20} color="#f97316" style={{ marginRight: 8 }} />
              <Text className="text-center text-orange-500 font-bold">
                Create New Account
              </Text>
            </TouchableOpacity> */}
          </View>

          {/* Bottom text */}
          <View className="items-center mb-8">
            <Text className="text-center text-gray-500 text-sm">
              By signing in, you agree to our
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
    </KeyboardAvoidingView>
  );
};

export default SignIn;