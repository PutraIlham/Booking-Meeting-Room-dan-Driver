"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, X, Check, ChevronDown } from 'lucide-react';

interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

interface DateRangeFilterProps {
  onDateChange: (dateFilter: DateFilter) => void;
  dateFilter: DateFilter;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateChange,
  dateFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localStartDate, setLocalStartDate] = useState(dateFilter.startDate || '');
  const [localEndDate, setLocalEndDate] = useState(dateFilter.endDate || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalStartDate(dateFilter.startDate || '');
    setLocalEndDate(dateFilter.endDate || '');
  }, [dateFilter]);

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

  const applyFilter = () => {
    onDateChange({
      startDate: localStartDate || null,
      endDate: localEndDate || null
    });
    setIsOpen(false);
  };

  const clearFilter = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onDateChange({
      startDate: null,
      endDate: null
    });
    setIsOpen(false);
  };

  const isFilterActive = dateFilter.startDate || dateFilter.endDate;

  // Helper to format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get button label based on filter state
  const getButtonLabel = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      return `${formatDate(dateFilter.startDate)} - ${formatDate(dateFilter.endDate)}`;
    } else if (dateFilter.startDate) {
      return `From ${formatDate(dateFilter.startDate)}`;
    } else if (dateFilter.endDate) {
      return `Until ${formatDate(dateFilter.endDate)}`;
    }
    return 'Date';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
          isFilterActive 
            ? 'bg-sky-100 text-sky-700' 
            : 'bg-gray-100 text-gray-700'
        } hover:bg-opacity-80 transition-colors`}
      >
        <Calendar size={14} className={`mr-1.5 ${isFilterActive ? 'text-sky-600' : 'text-gray-500'}`} />
        <span className="max-w-[100px] truncate">{getButtonLabel()}</span>
        <ChevronDown size={14} className="ml-1.5" />
      </button>

      {isOpen && (
        <div className="absolute mt-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Filter by date</h3>
            {isFilterActive && (
              <button 
                onClick={clearFilter} 
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          <div className="p-3">
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={localStartDate}
                onChange={(e) => setLocalStartDate(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={localEndDate}
                onChange={(e) => setLocalEndDate(e.target.value)}
                min={localStartDate}
                className="w-full p-2 text-sm border border-gray-300 rounded"
              />
            </div>
            <button
              onClick={applyFilter}
              className="w-full p-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors flex items-center justify-center"
            >
              <Check size={14} className="mr-1.5" />
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;