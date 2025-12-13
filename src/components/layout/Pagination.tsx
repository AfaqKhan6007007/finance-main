'use client'

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
  showCount?: boolean;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
  showCount = true
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage + 1;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      for (let i = 1; i <= maxVisiblePages; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {showCount && (
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{indexOfFirstItem}</span> to{' '}
          <span className="font-medium">{indexOfLastItem}</span>{' '}
          of <span className="font-medium">{totalItems}</span> entries
        </div>
      )}
      
      <div className="flex space-x-2">
        <button 
          className="p-2 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-primary-medium/60 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            className={`w-10 h-10 rounded-md ${
              pageNum === currentPage
                ? 'bg-primary-medium text-white'
                : 'bg-white text-gray-600 hover:bg-primary-medium/60'
            }`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        ))}
        
        <button 
          className="p-2 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-primary-medium/60"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}