import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomAlert = ({ 
  visible, 
  type = 'success', // 'success', 'error', 'info'
  title = '', 
  message = '', 
  onClose = () => {},
  autoClose = true,
  duration = 3000, // Auto close duration in ms
  bookingType = 'ROOM' // 'ROOM' or 'TRANSPORT'
}) => {
  const [animation] = useState(new Animated.Value(0));
  const [isVisible, setIsVisible] = useState(visible);

  // Default colors
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
  
  // Theme-based info colors
  const INFO_COLORS = bookingType === 'TRANSPORT' 
    ? {
        bg: 'bg-sky-500',
        bgLight: 'bg-sky-50',
        text: 'text-sky-800',
        border: 'border-sky-200',
        icon: 'information-circle'
      }
    : {
        bg: 'bg-sky-500',
        bgLight: 'bg-sky-50',
        text: 'text-sky-800',
        border: 'border-sky-200',
        icon: 'information-circle'
      };
  
  // Select the color scheme based on alert type
  const colors = type === 'success' 
    ? SUCCESS_COLORS 
    : type === 'error' 
      ? ERROR_COLORS 
      : INFO_COLORS;

  // Effect to handle animations and visibility
  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start();
      
      // Auto close timer
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  // Handle closing the alert with animation
  const handleClose = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease)
    }).start(() => {
      setIsVisible(false);
      onClose();
    });
  };

  // Don't render anything if not visible
  if (!isVisible) return null;

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-20">
        <Animated.View 
          className={`w-11/12 rounded-xl p-5 ${colors.bgLight} ${colors.border} border shadow-lg`}
          style={{
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })
              }
            ]
          }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <View className={`w-8 h-8 ${colors.bg} rounded-full items-center justify-center mr-3`}>
                <Ionicons name={colors.icon} size={18} color="white" />
              </View>
              <Text className={`${colors.text} font-bold text-lg`}>
                {title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Information')}
              </Text>
            </View>
          </View>
          
          {/* Message */}
          <Text className="text-gray-700 mb-4 pl-11">{message}</Text>
          
          {/* Action Button */}
          <TouchableOpacity
            onPress={handleClose}
            className={`py-3 ${colors.bg} rounded-lg items-center mt-2`}
          >
            <Text className="text-white font-medium">
              {type === 'error' ? 'Try Again' : 'Got It'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomAlert;