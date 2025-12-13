import React from "react";

export interface Column{
    header: string;
    accessor: string;
    render?: (row: Record<string, unknown>) => React.ReactNode;
    className?: string;
    cellClassName?: string;
}

interface DataTableProps{
    columns: Column[];
    data: Record<string, unknown>[];
    className?: string;
}

export default function DataTable({ columns, data, className = '' }: DataTableProps) {

     // Helper function to get nested values for complex accessors
    const getValue = (row: Record<string, unknown>, accessor: string): React.ReactNode => {
      if (accessor.includes('.')) {
        const parts = accessor.split('.');
        let value: unknown = row;
        for (const part of parts) {
          if (typeof value === 'object' && value !== null && part in value) {
            value = (value as Record<string, unknown>)[part];
          } else {
            return '-';
          }
        }
        return value as React.ReactNode;
      }

      return row[accessor] as React.ReactNode;
    };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${column.cellClassName || ''}`}
                  >
                    {column.render ? column.render(row) : getValue(row, column.accessor)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
