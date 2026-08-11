import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TextInputProps, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Easing
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  containerStyle?: any;
  style?: any;
  errorMessage?: string | null;
  helperText?: string;
  variant?: 'outlined' | 'filled' | 'underlined';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  onIconPress?: () => void;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  required = false,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry: initialSecureTextEntry = false,
  containerStyle,
  style,
  errorMessage,
  helperText,
  variant = 'outlined',
  colorScheme = 'primary',
  onIconPress,
  ...props
}) => {
  const [secureTextEntry, setSecureTextEntry] = useState(initialSecureTextEntry);
  const [isFocused, setIsFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(multiline ? 100 : 56);
  const animatedLabelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;
  const animatedScale = useRef(new Animated.Value(value ? 1 : 0)).current;
  
  const displayError = error || errorMessage;
  
  // Color mappings
  const colorMap = {
    primary: {
      main: '#0EA5E9', // sky-500
      light: '#BAE6FD', // sky-200
      dark: '#0369A1', // sky-700
      contrast: '#FFFFFF',
      bg: '#F0F9FF' // sky-50
    },
    secondary: {
      main: '#8B5CF6', // violet-500
      light: '#DDD6FE', // violet-200
      dark: '#6D28D9', // violet-700
      contrast: '#FFFFFF',
      bg: '#F5F3FF' // violet-50
    },
    success: {
      main: '#10B981', // emerald-500
      light: '#A7F3D0', // emerald-200
      dark: '#047857', // emerald-700
      contrast: '#FFFFFF',
      bg: '#ECFDF5' // emerald-50
    },
    error: {
      main: '#EF4444', // red-500
      light: '#FECACA', // red-200
      dark: '#B91C1C', // red-700
      contrast: '#FFFFFF',
      bg: '#FEF2F2' // red-50
    },
    warning: {
      main: '#F59E0B', // amber-500
      light: '#FDE68A', // amber-200
      dark: '#B45309', // amber-700
      contrast: '#FFFFFF',
      bg: '#FFFBEB' // amber-50
    },
    info: {
      main: '#3B82F6', // blue-500
      light: '#BFDBFE', // blue-200
      dark: '#1D4ED8', // blue-700
      contrast: '#FFFFFF',
      bg: '#EFF6FF' // blue-50
    }
  };
  
  const selectedColor = colorMap[displayError ? 'error' : colorScheme];
  
  // Animation for floating label
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedLabelPosition, {
        toValue: (isFocused || value) ? 1 : 0,
        duration: 150,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      }),
      Animated.timing(animatedScale, {
        toValue: (isFocused || value) ? 1 : 0,
        duration: 150,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: false,
      })
    ]).start();
  }, [isFocused, value]);
  
  const labelStyle = {
    position: 'absolute',
    left: variant === 'underlined' ? 0 : (leftIcon ? 46 : 16),
    top: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [variant === 'filled' ? 18 : 16, -10]
    }),
    fontSize: animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12]
    }),
    color: isFocused
      ? selectedColor.main
      : displayError
        ? colorMap.error.main
        : '#64748B',
    backgroundColor: variant === 'outlined' && (isFocused || value) ? '#FFFFFF' : 'transparent',
    paddingHorizontal: variant === 'outlined' && (isFocused || value) ? 4 : 0,
    zIndex: 10,
  };
  
  // Get container style based on variant
  const getVariantContainerStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: isFocused ? '#FFFFFF' : selectedColor.bg,
          borderWidth: isFocused ? 2 : 1,
          borderColor: isFocused ? selectedColor.main : 'transparent',
          borderRadius: 12,
        };
      case 'underlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderBottomWidth: isFocused ? 2 : 1,
          borderColor: isFocused ? selectedColor.main : '#E2E8F0',
          borderRadius: 0,
          height: 56,
          paddingHorizontal: 0,
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        };
      case 'outlined':
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderWidth: isFocused ? 2 : 1,
          borderColor: isFocused ? selectedColor.main : (displayError ? colorMap.error.main : '#E2E8F0'),
          borderRadius: 12,
        };
    }
  };
  
  const inputContainerStyle = [
    styles.inputContainer,
    getVariantContainerStyle(),
    multiline && {
      minHeight: inputHeight,
      alignItems: 'flex-start',
      paddingTop: variant === 'underlined' ? 20 : 12,
      paddingBottom: 12,
    },
    displayError && {
      borderColor: colorMap.error.main,
      borderWidth: variant === 'underlined' ? 2 : (isFocused ? 2 : 1.5),
    },
  ];
  
  // Handle floating placeholder visibility
  const showPlaceholder = !label || (!isFocused && !value);
  
  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label for non-floating variants */}
      {label && variant === 'underlined' && !isFocused && !value && (
        <View style={styles.labelContainer}>
          <Text style={[
            styles.labelText,
            {color: displayError ? colorMap.error.main : '#334155'}
          ]}>
            {label}
          </Text>
          {required && <Text style={styles.requiredAsterisk}> *</Text>}
        </View>
      )}

      <View style={inputContainerStyle}>
        {/* Floating Label */}
        {label && (variant !== 'underlined' || isFocused || value) && (
          <Animated.Text style={[labelStyle]}>
            {label}{required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Animated.Text>
        )}
        
        {leftIcon && (
          <TouchableOpacity 
            style={[
              styles.iconContainer, 
              variant === 'underlined' && { paddingLeft: 0 }
            ]} 
            onPress={onIconPress} 
            disabled={!onIconPress}
          >
            {typeof leftIcon === 'string' ? (
              <Ionicons name={leftIcon} size={20} color={isFocused ? selectedColor.main : '#64748B'} />
            ) : (
              leftIcon
            )}
          </TouchableOpacity>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInputText,
            variant === 'underlined' && { paddingLeft: leftIcon ? 8 : 0 },
            {
              paddingTop: variant === 'filled' || (label && (isFocused || value)) ? 24 : 0,
              color: displayError ? colorMap.error.dark : '#1F2937',
            },
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={showPlaceholder ? placeholder : ''}
          placeholderTextColor="#94A3B8"
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onContentSizeChange={multiline ? (e) => {
            const height = e.nativeEvent.contentSize.height;
            setInputHeight(Math.max(100, height + 24)); // 24 for padding
          } : undefined}
          {...props}
        />

        {initialSecureTextEntry && (
          <TouchableOpacity
            style={styles.eyeIconContainer}
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Ionicons
              name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? selectedColor.main : '#64748B'}
            />
          </TouchableOpacity>
        )}

        {rightIcon && (
          <TouchableOpacity 
            style={styles.iconContainer} 
            onPress={onIconPress} 
            disabled={!onIconPress}
          >
            {typeof rightIcon === 'string' ? (
              <Ionicons name={rightIcon} size={20} color={isFocused ? selectedColor.main : '#64748B'} />
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
        
        {/* Visual indicator for focus state */}
        {isFocused && variant !== 'underlined' && (
          <Animated.View 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: 3,
              backgroundColor: selectedColor.main,
              borderBottomLeftRadius: 12,
              borderBottomRightRadius: 12,
              transform: [{ scaleX: animatedScale }]
            }} 
          />
        )}
      </View>

      {/* Error or Helper Text */}
      {(displayError || helperText) && (
        <View style={styles.messageContainer}>
          {displayError ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colorMap.error.main} />
              <Text style={[styles.messageText, { color: colorMap.error.main }]}>
                {displayError}
              </Text>
            </View>
          ) : helperText ? (
            <Text style={[styles.messageText, { color: '#64748B' }]}>
              {helperText}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    color: '#334155',
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  requiredAsterisk: {
    color: '#EF4444',
    fontWeight: '400',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 56,
    paddingHorizontal: 4,
    shadowColor: '#0000000A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    height: '100%',
    fontWeight: '400',
  },
  multilineInputText: {
    textAlignVertical: 'top',
  },
  eyeIconContainer: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  messageContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: '400',
    lineHeight: 18,
  }
});

export default InputField;