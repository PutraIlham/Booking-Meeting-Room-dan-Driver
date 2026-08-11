"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NotificationsPage = () => {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new notifications page in the dashboard layout
    router.replace('/dashboard/notifications');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p>Please wait while we redirect you to the notifications page.</p>
      </div>
    </div>
  );
};

export default NotificationsPage;
