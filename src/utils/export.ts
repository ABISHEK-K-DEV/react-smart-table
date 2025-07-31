import Papa from 'papaparse';
import { TableColumn, TableRow } from '../types';

export const exportToCSV = (
  data: TableRow[],
  columns: TableColumn[],
  filename: string = 'export.csv'
) => {
  const cleanData = data.map(row => {
    const cleanRow: Record<string, any> = {};
    columns.forEach(col => {
      cleanRow[col.header] = row[col.id];
    });
    return cleanRow;
  });

  const csv = Papa.unparse(cleanData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToJSON = (
  data: TableRow[],
  filename: string = 'export.json'
) => {
  const cleanData = data.map(row => {
    const cleanRow: Record<string, any> = {};
    Object.keys(row).forEach(key => {
      if (!key.startsWith('_')) {
        cleanRow[key] = row[key];
      }
    });
    return cleanRow;
  });

  const json = JSON.stringify(cleanData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const importFromCSV = (
  file: File,
  columns: TableColumn[]
): Promise<TableRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as Record<string, any>[];
        const tableRows: TableRow[] = data.map((row, index) => {
          const tableRow: TableRow = {
            id: `imported_${Date.now()}_${index}`,
          };
          
          columns.forEach(col => {
            const value = row[col.header] || row[col.id];
            tableRow[col.id] = value || '';
          });
          
          return tableRow;
        });
        
        resolve(tableRows);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};
