"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

type AlertType = 'success' | 'error';

interface AlertMessageProps {
  type: AlertType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({
  type,
  message,
  duration = 5000, // Default 5 seconds
  onClose
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
      <div 
        className={`w-96 rounded-lg shadow-lg p-4 flex items-start ${
          type === 'success' 
            ? 'bg-green-50 border-l-4 border-green-500' 
            : 'bg-red-50 border-l-4 border-red-500'
        }`}
      >
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${
            type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {type === 'success' ? 'Success' : 'Error'}
          </h3>
          <div className={`mt-1 text-sm ${
            type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {message}
          </div>
        </div>
        <button
          type="button"
          className={`ml-4 flex-shrink-0 inline-flex ${
            type === 'success' 
              ? 'text-green-500 hover:text-green-600' 
              : 'text-red-500 hover:text-red-600'
          }`}
          onClick={handleClose}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default AlertMessage;
