import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  Animated,
  Platform,
  Image,
} from 'react-native';

interface BookInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: any;
  rightIcon?: any;
  onRightIconPress?: () => void;
  containerStyle?: any;
  required?: boolean;
  helperText?: string;
}

const BookInput: React.FC<BookInputProps> = ({
  label,
  error,
  placeholder,
  value,
  onChangeText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required = false,
  helperText,
  multiline = false,
  numberOfLines = 1,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

  const handleFocus = () => {
    setIsFocused(true);
    animatePlaceholder(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      animatePlaceholder(0);
    }
  };

  const animatePlaceholder = (toValue: number) => {
    Animated.timing(animatedValue, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const labelStyle = {
    position: 'absolute',
    left: leftIcon ? 46 : 16,
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [multiline ? 16 : 14, -8],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#6B7280', '#2563EB'],
    }),
    backgroundColor: isFocused || value ? '#FFFFFF' : 'transparent',
    paddingHorizontal: isFocused || value ? 4 : 0,
    zIndex: 1,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Animated.Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Animated.Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.error,
          multiline && styles.multiline,
        ]}
      >
        {/* Left Icon */}
        {leftIcon && (
          <View style={styles.leftIcon}>
            <Image source={leftIcon} style={styles.icon} />
          </View>
        )}

        {/* TextInput */}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.multilineInput,
          ]}
          placeholder={isFocused ? placeholder : ''}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor="#9CA3AF"
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Image source={rightIcon} style={styles.icon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text */}
      {helperText && !error && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}

      {/* Error Message */}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    minHeight: 48,
    paddingHorizontal: 12,
    position: 'relative',
  },
  focused: {
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  error: {
    borderColor: '#EF4444',
  },
  multiline: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: 4,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: '#6B7280',
  },
  label: {
    fontWeight: '500',
  },
  required: {
    color: '#EF4444',
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#EF4444',
  },
});

export default BookInput;