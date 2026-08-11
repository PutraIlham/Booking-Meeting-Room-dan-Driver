// src/components/NotificationBadge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { tokenCache } from "@/lib/auth";
import { AUTH_TOKEN_KEY } from "@/lib/constants";
import { useRouter } from 'expo-router';

interface NotificationBadgeProps {
  size?: number;
  color?: string;
  backgroundColor?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 24,
  color = 'white',
  backgroundColor = '#0EA5E9'
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const fetchUnreadCount = async () => {
    try {
      const authToken = await tokenCache.getToken(AUTH_TOKEN_KEY);
      if (!authToken) {
        console.error("No auth token available");
        return;
      }

      const response = await axios.get(
        'http://20.251.153.107:3001/api/notifications/unread-count',
        { headers: { 'Authorization': `Bearer ${authToken}` } }
      );

      if (response.data && typeof response.data.count === 'number') {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    // Fetch on mount
    fetchUnreadCount();
    
    // Set up interval to check every minute (adjust as needed)
    const interval = setInterval(fetchUnreadCount, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <TouchableOpacity 
      onPress={() => router.push('/(root)/notifikasi')}
      className="relative"
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      
      {unreadCount > 0 && (
        <View 
          className="absolute -top-1 -right-1 rounded-full px-1.5 min-w-5 h-5 flex items-center justify-center"
          style={{ backgroundColor }}
        >
          <Text className="text-white text-xs font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationBadge;