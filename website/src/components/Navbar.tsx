"use client"; // Add this line to mark this component as a Client Component

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

// Define user type
type User = {
  username: string;
  email: string;
  [key: string]: any;
};

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Fetch user info from localStorage
    try {
      const storedUserStr = localStorage.getItem('adminInfo');
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr) as User;
        setUser(storedUser);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    
    // Fetch notification count immediately
    fetchNotificationCount();
    
    // Set up interval to refresh notification count every 30 seconds
    const intervalId = setInterval(fetchNotificationCount, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Also refresh notification count when the component gains focus or when a notification is read
  useEffect(() => {
    const handleFocus = () => {
      fetchNotificationCount();
    };
    
    const handleNotificationRead = () => {
      console.log('Notification read event detected, refreshing count');
      fetchNotificationCount();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('notificationRead', handleNotificationRead);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notificationRead', handleNotificationRead);
    };
  }, []);
  
  // Function to fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      
      // Fetch notifications from our API endpoint
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Add cache busting to prevent caching
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching notifications: ${response.status}`);
      }
      
      const data = await response.json();
      const unreadCount = data.filter((n: any) => !n.read).length;
      console.log(`Unread notifications: ${unreadCount}`);
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      // Don't set a fallback count to avoid showing incorrect badges
    }
  };

  return (
    <div className='bg-white flex items-center justify-between p-4 mb-4'>
      {/* SEARCH BAR */}
 
      {/* ICONS AND USER */}
      <div className='flex items-center gap-6 justify-end w-full'>
        <div className='bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer'>
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <Link href="/notifications" className="relative">
          <div className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Bell size={24} className="text-gray-700" />
            {notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold animate-pulse">
                {notificationCount}
              </div>
            )}
          </div>
        </Link>
        <div className='flex flex-col'>
          {user ? (
            <>
              <span className="text-xs leading-3 font-medium">{user.username}</span>
              <span className="text-[10px] text-gray-500 text-right">{user.email}</span>
            </>
          ) : (
            <span className="text-xs leading-3 font-medium">Loading...</span>
          )}
        </div>
        <Image src="/admin.png" alt="" width={36} height={36} className="rounded-full" />
      </div>
    </div>
  );
};

export default Navbar;
