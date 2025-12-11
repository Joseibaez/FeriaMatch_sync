/**
 * CSV Export Utility
 * Handles proper UTF-8 encoding for Spanish characters
 */

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export function generateCSV<T>(data: T[], columns: CSVColumn<T>[]): string {
  // Header row
  const headers = columns.map(col => escapeCSVField(col.header)).join(',');
  
  // Data rows
  const rows = data.map(row => 
    columns.map(col => escapeCSVField(String(col.accessor(row) ?? ''))).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

function escapeCSVField(field: string): string {
  // If field contains comma, newline, or double quote, wrap in quotes
  if (field.includes(',') || field.includes('\n') || field.includes('"')) {
    // Escape double quotes by doubling them
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for UTF-8 encoding (helps Excel recognize Spanish characters)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function formatDateForFilename(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
