"use client";

import React from 'react';
import { Search } from 'lucide-react';

interface TableSearchProps {
  onSearch: (value: string) => void;
  placeholder?: string;
  value: string;
}

const TableSearch: React.FC<TableSearchProps> = ({ 
  onSearch, 
  placeholder = "Search...",
  value
}) => {
  return (
    <div className="relative w-full md:w-64">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={16} className="text-gray-400" />
      </div>
      <input
        type="text"
        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
};

export default TableSearch;