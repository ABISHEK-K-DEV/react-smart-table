import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, X } from 'lucide-react';
import { TableColumn, TableRow } from '../types';
import { cn } from '../utils/cn';

interface EditableCellProps {
  value: any;
  row: TableRow;
  column: TableColumn;
  onUpdate: (value: any) => void;
  onAIGenerate?: (context: string) => Promise<string>;
  error?: string;
  isGenerating?: boolean;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  value,
  row,
  column,
  onUpdate,
  onAIGenerate,
  error,
  isGenerating = false,
}) => {
  const [isEditing, setIsEditing] = useState(row._isEditing || row._isNew);
  const [editValue, setEditValue] = useState(value);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiSuggestion, setAISuggestion] = useState('');

  // Security: Input sanitization
  const sanitizeInput = useCallback((input: any): any => {
    if (input === null || input === undefined) return input;
    
    if (typeof input === 'string') {
      // Basic XSS prevention
      return input
        .replace(/[<>]/g, '') // Remove < and >
        .substring(0, column.type === 'text' ? 1000 : 255) // Limit length
        .trim();
    }
    
    return input;
  }, [column.type]);

  // Security: Validate input based on column type
  const validateInput = useCallback((input: any): boolean => {
    switch (column.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return typeof input === 'string' && (input === '' || emailRegex.test(input));
      case 'number':
        return typeof input === 'number' || (typeof input === 'string' && !isNaN(Number(input)));
      case 'date':
        return input === '' || !isNaN(Date.parse(input));
      case 'select':
        return !column.options || column.options.includes(input) || input === '';
      default:
        return true;
    }
  }, [column.type, column.options]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    const sanitizedValue = sanitizeInput(editValue);
    
    if (!validateInput(sanitizedValue)) {
      console.warn('Invalid input detected');
      return;
    }
    
    onUpdate(sanitizedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setShowAISuggestion(false);
  };

  const handleAIGenerate = async () => {
    if (!onAIGenerate) return;
    
    // Security: Limit context size and sanitize
    const context = Object.entries(row)
      .filter(([key]) => !key.startsWith('_') && key !== column.id)
      .map(([key, val]) => `${key}: ${String(val || '').substring(0, 100)}`)
      .join(', ')
      .substring(0, 500); // Limit total context
    
    try {
      const suggestion = await onAIGenerate(context);
      const sanitizedSuggestion = sanitizeInput(suggestion);
      
      if (validateInput(sanitizedSuggestion)) {
        setAISuggestion(sanitizedSuggestion);
        setShowAISuggestion(true);
      } else {
        console.warn('AI suggestion failed validation');
      }
    } catch (error) {
      console.error('AI generation failed:', error);
    }
  };

  const acceptAISuggestion = () => {
    setEditValue(aiSuggestion);
    setShowAISuggestion(false);
  };

  // Security: Escape HTML for display
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const renderInput = () => {
    const baseClass = cn(
      "w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      error ? "border-red-500" : "border-gray-300",
      "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
    );

    const handleInputChange = (newValue: any) => {
      const sanitized = sanitizeInput(newValue);
      setEditValue(sanitized);
    };

    switch (column.type) {
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={editValue || false}
            onChange={(e) => handleInputChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={editValue || ''}
            onChange={(e) => handleInputChange(Number(e.target.value))}
            className={baseClass}
            min={column.type === 'number' ? -999999999 : undefined}
            max={column.type === 'number' ? 999999999 : undefined}
          />
        );
      
      case 'date':
        return (
          <input
            type="date"
            value={editValue || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className={baseClass}
            min="1900-01-01"
            max="2100-12-31"
          />
        );
      
      case 'email':
        return (
          <input
            type="email"
            value={editValue || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className={baseClass}
            maxLength={255}
          />
        );
      
      case 'select':
        return (
          <select
            value={editValue || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className={baseClass}
          >
            <option value="">Select...</option>
            {column.options?.map((option) => (
              <option key={option} value={option}>
                {escapeHtml(option)}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={editValue || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            className={baseClass}
            maxLength={column.type === 'text' ? 1000 : 255}
          />
        );
    }
  };

  if (!isEditing) {
    const displayValue = column.type === 'boolean' 
      ? (value ? '✓' : '✗') 
      : escapeHtml(String(value || ''));

    return (
      <div
        onClick={() => column.editable && setIsEditing(true)}
        className={cn(
          "min-h-[32px] flex items-center",
          column.editable && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded px-2 py-1"
        )}
        dangerouslySetInnerHTML={{ __html: displayValue }}
      />
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1">
        {renderInput()}
        
        <div className="flex items-center gap-1">
          {onAIGenerate && (
            <button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="Generate with AI"
            >
              <Sparkles className={cn("h-4 w-4", isGenerating && "animate-spin")} />
            </button>
          )}
          
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
            title="Save"
          >
            <Check className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleCancel}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showAISuggestion && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-lg z-10 min-w-[200px]">
          <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">AI Suggestion:</div>
          <div 
            className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2"
            dangerouslySetInnerHTML={{ __html: escapeHtml(aiSuggestion) }}
          />
          <div className="flex gap-1">
            <button
              onClick={acceptAISuggestion}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Accept
            </button>
            <button
              onClick={() => setShowAISuggestion(false)}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-xs text-red-700 dark:text-red-300">
          {escapeHtml(error)}
        </div>
      )}
    </div>
  );
};
