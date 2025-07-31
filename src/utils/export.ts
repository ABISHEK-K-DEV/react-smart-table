import Papa from 'papaparse';
import { TableColumn, TableRow } from '../types';

// Security: Input sanitization for export data
export const sanitizeForExport = (value: any): string => {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  // Prevent CSV injection attacks
  if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
    return `'${str}`;
  }
  
  // Remove potentially dangerous characters
  return str.replace(/[\r\n\t]/g, ' ').substring(0, 32767); // Excel cell limit
};

// Security: Validate file size and type
export const validateFile = (file: File): boolean => {
  const maxSize = 50 * 1024 * 1024; // 50MB limit
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  
  if (file.size > maxSize) {
    throw new Error('File size exceeds 50MB limit');
  }
  
  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
    throw new Error('Invalid file type. Only CSV files are allowed.');
  }
  
  return true;
};

export const exportToCSV = (
  data: TableRow[],
  columns: TableColumn[],
  filename: string = 'export.csv'
) => {
  // Security: Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
  
  // Security: Limit export size
  const maxRows = 100000;
  const limitedData = data.slice(0, maxRows);
  
  if (data.length > maxRows) {
    console.warn(`Export limited to ${maxRows} rows for security reasons`);
  }

  const cleanData = limitedData.map(row => {
    const cleanRow: Record<string, any> = {};
    columns.forEach(col => {
      cleanRow[col.header] = sanitizeForExport(row[col.id]);
    });
    return cleanRow;
  });

  try {
    const csv = Papa.unparse(cleanData, {
      quotes: true, // Always quote fields for security
      quoteChar: '"',
      escapeChar: '"'
    });
    
    // Security: Validate CSV size
    const csvSize = new Blob([csv]).size;
    if (csvSize > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('Export file too large');
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', sanitizedFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Export failed due to security restrictions');
  }
};

export const exportToJSON = (
  data: TableRow[],
  filename: string = 'export.json'
) => {
  // Security: Sanitize filename
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
  
  // Security: Limit export size
  const maxRows = 50000;
  const limitedData = data.slice(0, maxRows);
  
  const cleanData = limitedData.map(row => {
    const cleanRow: Record<string, any> = {};
    Object.keys(row).forEach(key => {
      if (!key.startsWith('_')) {
        cleanRow[key] = sanitizeForExport(row[key]);
      }
    });
    return cleanRow;
  });

  try {
    const json = JSON.stringify(cleanData, null, 2);
    
    // Security: Validate JSON size
    const jsonSize = new Blob([json]).size;
    if (jsonSize > 100 * 1024 * 1024) { // 100MB limit
      throw new Error('Export file too large');
    }
    
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', sanitizedFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Clean up
    }
  } catch (error) {
    console.error('JSON export failed:', error);
    throw new Error('Export failed due to security restrictions');
  }
};

export const importFromCSV = (
  file: File,
  columns: TableColumn[]
): Promise<TableRow[]> => {
  return new Promise((resolve, reject) => {
    try {
      // Security: Validate file
      validateFile(file);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => sanitizeForExport(header),
        transform: (value) => sanitizeForExport(value),
        complete: (results) => {
          try {
            // Security: Limit imported rows
            const maxImportRows = 10000;
            const data = (results.data as Record<string, any>[]).slice(0, maxImportRows);
            
            if (results.data.length > maxImportRows) {
              console.warn(`Import limited to ${maxImportRows} rows for security`);
            }
            
            const tableRows: TableRow[] = data.map((row, index) => {
              const tableRow: TableRow = {
                id: `imported_${Date.now()}_${index}`,
              };
              
              columns.forEach(col => {
                const value = row[col.header] || row[col.id] || '';
                // Security: Type validation based on column type
                switch (col.type) {
                  case 'number':
                    {
                      const formattedValue = Number(value).toLocaleString();
                      tableRow[col.id] = formattedValue;
                    }
                    break;
                  case 'boolean':
                    {
                      tableRow[col.id] = ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
                    }
                    break;
                  case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    tableRow[col.id] = emailRegex.test(String(value)) ? String(value) : '';
                    break;
                  case 'date':
                    {
                      const date = new Date(value);
                      tableRow[col.id] = date.toLocaleDateString();
                    }
                    break;
                  case 'select':
                    tableRow[col.id] = col.options?.includes(String(value)) ? String(value) : '';
                    break;
                  default:
                    tableRow[col.id] = String(value).substring(0, 1000); // Limit text length
                }
              });
              
              return tableRow;
            });
            
            resolve(tableRows);
          } catch (error) {
            reject(new Error('Failed to process imported data'));
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};
