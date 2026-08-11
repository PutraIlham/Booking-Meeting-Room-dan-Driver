"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Check } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterComponentProps {
  title: string;
  options: FilterOption[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
}

const FilterDropdown: React.FC<FilterComponentProps> = ({
  title,
  options,
  selectedOptions,
  onChange
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

  const toggleOption = (optionId: string) => {
    if (selectedOptions.includes(optionId)) {
      onChange(selectedOptions.filter(id => id !== optionId));
    } else {
      onChange([...selectedOptions, optionId]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-3 py-1.5 text-sm rounded-full ${
          selectedOptions.length > 0 
            ? 'bg-sky-100 text-sky-700' 
            : 'bg-gray-100 text-gray-700'
        } hover:bg-opacity-80 transition-colors`}
      >
        <Filter size={14} className="mr-1" />
        <span>{title}</span>
        {selectedOptions.length > 0 && (
          <span className="ml-1 bg-sky-200 text-sky-800 rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {selectedOptions.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute mt-2 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-2 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            {selectedOptions.length > 0 && (
              <button 
                onClick={clearAll}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map(option => (
              <div 
                key={option.id} 
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleOption(option.id)}
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center mr-2 border ${
                  selectedOptions.includes(option.id) 
                    ? 'bg-sky-500 border-sky-500' 
                    : 'border-gray-300'
                }`}>
                  {selectedOptions.includes(option.id) && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <span className="text-sm text-gray-700">{option.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;