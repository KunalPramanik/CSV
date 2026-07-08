import Papa from 'papaparse';
import { useImportStore } from '@/store/importStore';

export function useLocalCsv() {
  const { setFile, setPreviewData } = useImportStore();

  /**
   * Parses the file locally on the client.
   * Extracts total dimensions and grabs the top 10 records for immediate previewing.
   */
  const parseCsvLocally = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, any>[];
        const rowsCount = rows.length;
        const columnsCount = headers.length;

        // Store file details
        setFile(file, file.name, file.size, rowsCount, columnsCount);

        // Preview top 10 lines
        const previewRows = rows.slice(0, 10);
        setPreviewData(headers, previewRows);
      },
      error: (err) => {
        console.error('Local CSV parsing error:', err.message);
      }
    });
  };

  return { parseCsvLocally };
}
