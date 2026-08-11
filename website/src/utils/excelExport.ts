import * as XLSX from 'xlsx';

interface ExportData {
  [key: string]: any;
}

export const exportToExcel = (data: ExportData[], filename: string) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  
  // Generate Excel file and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Helper function to format date for Excel
export const formatDateForExcel = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format time for Excel
export const formatTimeForExcel = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours));
  date.setMinutes(parseInt(minutes));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}; 