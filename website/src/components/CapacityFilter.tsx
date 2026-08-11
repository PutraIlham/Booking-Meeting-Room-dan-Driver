"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Users, X } from 'lucide-react';

interface CapacityFilterProps {
  minValue: number;
  maxValue: number;
  onFilter: (min: number, max: number) => void;
  isActive: boolean;
  onClear: () => void;
}

const CapacityFilter: React.FC<CapacityFilterProps> = ({
  minValue,
  maxValue,
  onFilter,
  isActive,
  onClear
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [min, setMin] = useState(minValue);
  const [max, setMax] = useState(maxValue);
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

  const handleApply = () => {
    onFilter(min, max);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-3 py-1.5 text-sm rounded-full ${
          isActive 
            ? 'bg-sky-100 text-sky-700' 
            : 'bg-gray-100 text-gray-700'
        } hover:bg-opacity-80 transition-colors`}
      >
        <Users size={14} className="mr-1" />
        <span>Capacity</span>
        {isActive && (
          <span className="ml-1 bg-sky-200 text-sky-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            ✓
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute mt-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Capacity Range</h3>
            {isActive && (
              <button 
                onClick={handleClear}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Min</label>
                <input
                  type="number"
                  min="1"
                  value={min}
                  onChange={(e) => setMin(parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-gray-200 rounded text-sm"
                />
              </div>
              <div className="text-gray-300 pt-5">-</div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Max</label>
                <input
                  type="number"
                  min={min}
                  value={max}
                  onChange={(e) => setMax(parseInt(e.target.value) || min)}
                  className="w-full p-2 border border-gray-200 rounded text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleApply}
              className="w-full p-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapacityFilter;