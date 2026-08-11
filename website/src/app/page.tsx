"use client";

import { useRouter } from "next/navigation";
import { LockIcon } from "lucide-react";

const Homepage = () => {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center min-h-screen bg-sky-50">
      <div className="w-full max-w-md p-2">
        <div className="bg-white p-8 rounded-xl shadow-md border border-sky-100">
          {/* Logo/Brand Element */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-sky-500 rounded-full flex items-center justify-center">
              <LockIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-light text-gray-800">Welcome to <span className="font-bold">Admin Panel</span></h1>
            <p className="text-sky-600 text-sm mt-1">Please login to access the admin dashboard</p>
          </div>

          {/* Login Button */}
          <button
            onClick={() => router.push("/sign-in")}
            className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg shadow-sm transition duration-150 hover:shadow focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50"
          >
            Login as Admin
          </button>

          {/* Security indicator */}
          <div className="flex items-center justify-center mt-5 text-xs text-gray-400">
            <LockIcon className="h-3 w-3 mr-1" />
            <span>Secure connection</span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Need help? <a href="#" className="font-medium text-sky-600 hover:text-sky-700">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Homepage;