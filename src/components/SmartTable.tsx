import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { 
  Search, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Save, 
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Sparkles,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';
import { useSmartTable } from '../hooks/useSmartTable';
import { useAIAutofill } from '../hooks/useAIAutofill';
import { exportToCSV, exportToJSON } from '../utils/export';
import { SmartTableProps, TableRow, FilterState } from '../types';
import { EditableCell } from './EditableCell';
import { FilterDropdown } from './FilterDropdown';

export const SmartTable: React.FC<SmartTableProps> = ({
  columns,
  data: initialData,
  onDataChange,
  aiConfig,
  validationSchema,
  className = '',
  enableSearch = true,
  enableFilters = true,
  enableExport = true,
  enableAdd = true,
  enableDelete = true,
  pageSize = 10,
  realTimeSync = false,
  theme = 'auto',
  animations = true,
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<FilterState>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const {
    data,
    addRow,
    updateRow,
    deleteRow,
    validateRow,
    isValidating,
    errors,
  } = useSmartTable({
    initialData,
    columns,
    onDataChange,
    validationSchema,
    aiConfig,
  });

  const { generateSuggestions, isGenerating } = useAIAutofill(aiConfig);

  const columnHelper = createColumnHelper<TableRow>();

  const tableColumns = useMemo(() => [
    // Selection column
    columnHelper.display({
      id: 'select',
      size: 50,
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedRows.has(row.original.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedRows);
            if (e.target.checked) {
              newSelected.add(row.original.id);
            } else {
              newSelected.delete(row.original.id);
            }
            setSelectedRows(newSelected);
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    }),

    // Data columns
    ...columns.map((column) =>
      columnHelper.accessor(column.id, {
        header: ({ column: tableColumn }) => (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {column.header}
            </span>
            {column.sortable && (
              <button
                onClick={tableColumn.getToggleSortingHandler()}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
              </button>
            )}
            {column.filterable && enableFilters && (
              <FilterDropdown
                column={column}
                value={columnFilters[column.id]}
                onChange={(value) =>
                  setColumnFilters(prev => ({ ...prev, [column.id]: value }))
                }
              />
            )}
          </div>
        ),
        cell: ({ row, getValue, column: tableColumn }) => (
          <EditableCell
            value={getValue()}
            row={row.original}
            column={column}
            onUpdate={(value) => updateRow(row.original.id, { [column.id]: value })}
            onAIGenerate={
              column.aiEnabled && aiConfig?.enabled
                ? async (context) => {
                    const suggestions = await generateSuggestions(
                      column,
                      context,
                      row.original
                    );
                    return suggestions[column.id] || '';
                  }
                : undefined
            }
            error={errors[row.original.id]?.[column.id]}
            isGenerating={isGenerating}
          />
        ),
        size: column.width,
      })
    ),

    // Actions column
    columnHelper.display({
      id: 'actions',
      size: 80,
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {enableDelete && (
            <button
              onClick={() => {
                deleteRow(row.original.id);
                toast.success('Row deleted');
              }}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Delete row"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    }),
  ], [columns, selectedRows, columnFilters, errors, isGenerating]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
      pagination: { pageIndex: 0, pageSize },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const handleExport = (format: 'csv' | 'json') => {
    const selectedData = selectedRows.size > 0 
      ? data.filter(row => selectedRows.has(row.id))
      : data;

    if (format === 'csv') {
      exportToCSV(selectedData, columns, 'smart-table-export.csv');
    } else {
      exportToJSON(selectedData, 'smart-table-export.json');
    }
    
    toast.success(`Exported ${selectedData.length} rows to ${format.toUpperCase()}`);
  };

  const handleAddRow = () => {
    const newRow = addRow();
    toast.success('New row added');
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700',
      className
    )}>
      {/* Header Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            {enableSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search table..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
            
            {aiConfig?.enabled && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Sparkles className="h-4 w-4 text-blue-500" />
                AI Enabled
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {enableAdd && (
              <button
                onClick={handleAddRow}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Row
              </button>
            )}

            {enableExport && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={animations ? { opacity: 0, y: 20 } : {}}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {table.getState().pagination.pageIndex * pageSize + 1} to{' '}
          {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)} of{' '}
          {data.length} results
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
