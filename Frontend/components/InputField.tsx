// components/InputField.tsx

import React from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  KeyboardTypeOptions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputFieldProps {
  label: string;
  icon: any;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  rightIcon?: any;
  onRightIconPress?: () => void;
  labelStyle?: TextStyle;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  value,
  onChangeText,
  placeholder = "",
  secureTextEntry = false,
  keyboardType = "default",
  rightIcon,
  onRightIconPress,
  labelStyle,
  containerStyle,
  inputStyle,
  error,
}) => {
  return (
    <View className="mb-4">
      <Text className="text-sm mb-2" style={labelStyle}>
        {label}
      </Text>
      <View
        className={`flex-row items-center border ${
          error ? "border-red-400" : "border-transparent"
        } rounded-xl px-4 py-2 mb-1`}
        style={containerStyle}
      >
        {icon && (
          <Image
            source={icon}
            className="w-5 h-5 mr-3"
            style={{ tintColor: error ? "#f87171" : "#0284c7" }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          className="flex-1 text-base text-sky-800"
          style={inputStyle}
          placeholderTextColor="#94a3b8"
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <Image
              source={rightIcon}
              className="w-5 h-5"
              style={{ tintColor: "#64748b" }}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View className="flex-row items-center px-1">
          <Ionicons name="alert-circle-outline" size={14} color="#f87171" />
          <Text className="text-xs text-red-400 ml-1">{error}</Text>
        </View>
      )}
    </View>
  );
};

export default InputField;