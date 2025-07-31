import React, { useState, useRef, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { TableColumn } from '../types';
import { cn } from '../utils/cn';

interface FilterDropdownProps {
  column: TableColumn;
  value: string | number | boolean | null;
  onChange: (value: string | number | boolean | null) => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  column,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleApply = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempValue(null);
    onChange(null);
    setIsOpen(false);
  };

  const renderFilterInput = () => {
    switch (column.type) {
      case 'boolean':
        return (
          <select
            value={tempValue === null ? '' : tempValue.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setTempValue(val === '' ? null : val === 'true');
            }}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );

      case 'select':
        return (
          <select
            value={tempValue?.toString() || ''}
            onChange={(e) => setTempValue(e.target.value || null)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="">All</option>
            {column.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={tempValue?.toString() || ''}
            onChange={(e) => setTempValue(e.target.value ? Number(e.target.value) : null)}
            placeholder="Filter by number..."
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={tempValue?.toString() || ''}
            onChange={(e) => setTempValue(e.target.value || null)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        );

      default:
        return (
          <input
            type="text"
            value={tempValue?.toString() || ''}
            onChange={(e) => setTempValue(e.target.value || null)}
            placeholder="Filter by text..."
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700",
          value !== null && "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
        )}
        title="Filter column"
      >
        <Filter className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[200px]">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Filter {column.header}
          </div>
          
          <div className="mb-3">
            {renderFilterInput()}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleApply}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
