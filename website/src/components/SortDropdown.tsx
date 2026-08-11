"use client";

import React, { useState, useRef, useEffect } from 'react';
import { SortAsc, SortDesc, ArrowUpDown, Check } from 'lucide-react';

interface SortOption {
  id: string;
  label: string;
}

export type SortDirection = 'asc' | 'desc';

interface SortComponentProps {
  options: SortOption[];
  currentSort: { field: string; direction: SortDirection } | null;
  onSort: (field: string, direction: SortDirection) => void;
}

const SortDropdown: React.FC<SortComponentProps> = ({
  options,
  currentSort,
  onSort
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

  const handleSort = (field: string, direction: SortDirection) => {
    onSort(field, direction);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center px-3 py-1.5 text-sm rounded-full ${
          currentSort 
            ? 'bg-sky-100 text-sky-700' 
            : 'bg-gray-100 text-gray-700'
        } hover:bg-opacity-80 transition-colors`}
      >
        {currentSort ? (
          currentSort.direction === 'asc' ? (
            <SortAsc size={14} className="mr-1" />
          ) : (
            <SortDesc size={14} className="mr-1" />
          )
        ) : (
          <ArrowUpDown size={14} className="mr-1" />
        )}
        <span>Sort</span>
      </button>

      {isOpen && (
        <div className="absolute mt-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-2 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">Sort by</h3>
          </div>
          <div className="py-1">
            {options.map(option => (
              <React.Fragment key={option.id}>
                <div className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                     onClick={() => handleSort(option.id, 'asc')}>
                  <SortAsc size={14} className="mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">{option.label} (A-Z)</span>
                  {currentSort && currentSort.field === option.id && currentSort.direction === 'asc' && (
                    <Check size={14} className="ml-auto text-sky-500" />
                  )}
                </div>
                <div className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                     onClick={() => handleSort(option.id, 'desc')}>
                  <SortDesc size={14} className="mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">{option.label} (Z-A)</span>
                  {currentSort && currentSort.field === option.id && currentSort.direction === 'desc' && (
                    <Check size={14} className="ml-auto text-sky-500" />
                  )}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;