"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Check, ChevronDown } from 'lucide-react';

interface StatusFilterProps {
  onStatusChange: (statuses: string[]) => void;
  selectedStatuses: string[];
}

const BookingStatusFilter: React.FC<StatusFilterProps> = ({ 
  onStatusChange, 
  selectedStatuses = [] // Provide default empty array
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleStatus = (status: string) => {
    const currentStatuses = selectedStatuses || [];
    if (currentStatuses.includes(status)) {
      onStatusChange(currentStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...currentStatuses, status]);
    }
  };

  // Get the appropriate icon and color for the status button
  const getStatusIcon = () => {
    const currentStatuses = selectedStatuses || [];
    if (currentStatuses.length === 0) {
      // No status selected - default state
      return <Clock size={14} className="mr-1.5 text-gray-500" />;
    } 
    if (currentStatuses.length === 3) {
      // All statuses selected
      return <Check size={14} className="mr-1.5 text-sky-600" />;
    }
    // Some statuses selected - custom icon
    return <Clock size={14} className="mr-1.5 text-sky-600" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
          (selectedStatuses || []).length > 0 
            ? 'bg-sky-100 text-sky-700' 
            : 'bg-gray-100 text-gray-700'
        } hover:bg-opacity-80 transition-colors`}
      >
        {getStatusIcon()}
        <span>Status</span>
        {(selectedStatuses || []).length > 0 && (
          <span className="ml-1.5 bg-sky-200 text-sky-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {(selectedStatuses || []).length}
          </span>
        )}
        <ChevronDown size={14} className="ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute mt-2 right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Filter by status</h3>
          </div>
          <div className="p-1">
            <div 
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
              onClick={() => toggleStatus('approved')}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center mr-2 border ${
                (selectedStatuses || []).includes('approved')
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300'
              }`}>
                {(selectedStatuses || []).includes('approved') && (
                  <Check size={12} className="text-white" />
                )}
              </div>
              <div className="flex items-center">
                <CheckCircle size={14} className="text-green-500 mr-2" />
                <span className="text-sm">Approved</span>
              </div>
            </div>
            
            <div 
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
              onClick={() => toggleStatus('pending')}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center mr-2 border ${
                (selectedStatuses || []).includes('pending')
                  ? 'bg-yellow-500 border-yellow-500'
                  : 'border-gray-300'
              }`}>
                {(selectedStatuses || []).includes('pending') && (
                  <Check size={12} className="text-white" />
                )}
              </div>
              <div className="flex items-center">
                <Clock size={14} className="text-yellow-500 mr-2" />
                <span className="text-sm">Pending</span>
              </div>
            </div>
            
            <div 
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded-md"
              onClick={() => toggleStatus('rejected')}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center mr-2 border ${
                (selectedStatuses || []).includes('rejected')
                  ? 'bg-red-500 border-red-500'
                  : 'border-gray-300'
              }`}>
                {(selectedStatuses || []).includes('rejected') && (
                  <Check size={12} className="text-white" />
                )}
              </div>
              <div className="flex items-center">
                <XCircle size={14} className="text-red-500 mr-2" />
                <span className="text-sm">Rejected</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingStatusFilter;