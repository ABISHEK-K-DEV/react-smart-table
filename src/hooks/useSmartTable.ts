import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { UseSmartTableOptions, TableRow, ValidationSchema } from '../types';

export const useSmartTable = ({
  initialData,
  columns,
  onDataChange,
  validationSchema,
  aiConfig,
}: UseSmartTableOptions) => {
  const [data, setData] = useState<TableRow[]>(initialData);
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>({});
  const [isValidating, setIsValidating] = useState(false);

  // Sync external data changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Notify parent of data changes
  useEffect(() => {
    onDataChange?.(data);
  }, [data, onDataChange]);

  const validateRow = useCallback(async (row: TableRow): Promise<Record<string, string>> => {
    if (!validationSchema) return {};

    const rowErrors: Record<string, string> = {};
    
    for (const [columnId, schema] of Object.entries(validationSchema)) {
      try {
        await schema.parseAsync(row[columnId]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          rowErrors[columnId] = error.errors[0]?.message || 'Validation failed';
        }
      }
    }

    return rowErrors;
  }, [validationSchema]);

  const addRow = useCallback(() => {
    const newRow: TableRow = {
      id: `row_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      _isNew: true,
      _isEditing: true,
    };

    // Initialize with default values
    columns.forEach(column => {
      switch (column.type) {
        case 'boolean':
          newRow[column.id] = false;
          break;
        case 'number':
          newRow[column.id] = 0;
          break;
        case 'date':
          newRow[column.id] = new Date().toISOString().split('T')[0];
          break;
        default:
          newRow[column.id] = '';
      }
    });

    setData(prev => [newRow, ...prev]);
    return newRow;
  }, [columns]);

  const updateRow = useCallback(async (id: string, updates: Partial<TableRow>) => {
    setData(prev => prev.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, ...updates };
        
        // Validate row in background
        validateRow(updatedRow).then(rowErrors => {
          setErrors(prev => ({
            ...prev,
            [id]: rowErrors
          }));
        });

        return updatedRow;
      }
      return row;
    }));
  }, [validateRow]);

  const deleteRow = useCallback((id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  }, []);

  const bulkUpdate = useCallback((updates: Record<string, Partial<TableRow>>) => {
    setData(prev => prev.map(row => {
      const update = updates[row.id];
      return update ? { ...row, ...update } : row;
    }));
  }, []);

  const validateAllRows = useCallback(async () => {
    setIsValidating(true);
    const allErrors: Record<string, Record<string, string>> = {};

    for (const row of data) {
      const rowErrors = await validateRow(row);
      if (Object.keys(rowErrors).length > 0) {
        allErrors[row.id] = rowErrors;
      }
    }

    setErrors(allErrors);
    setIsValidating(false);
    return Object.keys(allErrors).length === 0;
  }, [data, validateRow]);

  return {
    data,
    setData,
    addRow,
    updateRow,
    deleteRow,
    bulkUpdate,
    validateRow,
    validateAllRows,
    isValidating,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
};
