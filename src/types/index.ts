import { z } from 'zod';

export interface TableColumn {
  id: string;
  header: string;
  type: 'text' | 'number' | 'email' | 'date' | 'select' | 'boolean';
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  required?: boolean;
  aiEnabled?: boolean;
  options?: string[]; // for select type
  validation?: z.ZodSchema;
}

export interface TableRow {
  id: string;
  [key: string]: any;
  _isEditing?: boolean;
  _isNew?: boolean;
  _aiSuggestions?: Record<string, string>;
}

export interface AIConfig {
  apiKey: string;
  provider: 'openai' | 'gemini';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  enabled?: boolean;
}

export interface ValidationSchema {
  [columnId: string]: z.ZodSchema;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  filename?: string;
  includeHeaders?: boolean;
  selectedOnly?: boolean;
}

export interface SmartTableProps {
  columns: TableColumn[];
  data: TableRow[];
  onDataChange?: (data: TableRow[]) => void;
  aiConfig?: AIConfig;
  validationSchema?: ValidationSchema;
  className?: string;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableExport?: boolean;
  enableAdd?: boolean;
  enableDelete?: boolean;
  pageSize?: number;
  realTimeSync?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  animations?: boolean;
}

export interface UseSmartTableOptions {
  initialData: TableRow[];
  columns: TableColumn[];
  onDataChange?: (data: TableRow[]) => void;
  validationSchema?: ValidationSchema;
  aiConfig?: AIConfig;
}

export interface FilterState {
  [columnId: string]: string | number | boolean | null;
}

export interface SortState {
  columnId: string;
  direction: 'asc' | 'desc';
}
