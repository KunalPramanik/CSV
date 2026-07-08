import { create } from 'zustand';
import { ValidationError, ImportResultSummary, ImportBatchProgress } from '@/types';

interface ImportState {
  // File metadata
  file: File | null;
  fileName: string;
  fileSize: number;
  rowsCount: number;
  columnsCount: number;
  
  // Preview
  previewHeaders: string[];
  previewRows: Record<string, any>[];
  
  // Streaming Progress
  isImporting: boolean;
  importCompleted: boolean;
  importError: string | null;
  currentBatch: number;
  successCount: number;
  failureCount: number;
  totalProcessedCount: number;
  errorsList: ValidationError[];
  jobSummary: ImportResultSummary | null;

  // Actions
  setFile: (file: File, name: string, size: number, rowsCount: number, columnsCount: number) => void;
  setPreviewData: (headers: string[], rows: Record<string, any>[]) => void;
  startImport: () => void;
  updateProgress: (progress: ImportBatchProgress) => void;
  finishImport: (summary: ImportResultSummary) => void;
  failImport: (error: string) => void;
  reset: () => void;
}

export const useImportStore = create<ImportState>((set) => ({
  file: null,
  fileName: '',
  fileSize: 0,
  rowsCount: 0,
  columnsCount: 0,
  
  previewHeaders: [],
  previewRows: [],
  
  isImporting: false,
  importCompleted: false,
  importError: null,
  currentBatch: 0,
  successCount: 0,
  failureCount: 0,
  totalProcessedCount: 0,
  errorsList: [],
  jobSummary: null,

  setFile: (file, name, size, rowsCount, columnsCount) => set({
    file,
    fileName: name,
    fileSize: size,
    rowsCount,
    columnsCount,
    importCompleted: false,
    importError: null,
    jobSummary: null
  }),

  setPreviewData: (headers, rows) => set({
    previewHeaders: headers,
    previewRows: rows
  }),

  startImport: () => set({
    isImporting: true,
    importCompleted: false,
    importError: null,
    currentBatch: 0,
    successCount: 0,
    failureCount: 0,
    totalProcessedCount: 0,
    errorsList: [],
    jobSummary: null
  }),

  updateProgress: (progress) => set((state) => ({
    currentBatch: progress.batchIndex,
    successCount: state.successCount + progress.successCount,
    failureCount: state.failureCount + progress.failureCount,
    totalProcessedCount: state.totalProcessedCount + progress.totalProcessed,
    errorsList: [...state.errorsList, ...progress.errors]
  })),

  finishImport: (summary) => set({
    isImporting: false,
    importCompleted: true,
    jobSummary: summary
  }),

  failImport: (error) => set({
    isImporting: false,
    importError: error
  }),

  reset: () => set({
    file: null,
    fileName: '',
    fileSize: 0,
    rowsCount: 0,
    columnsCount: 0,
    previewHeaders: [],
    previewRows: [],
    isImporting: false,
    importCompleted: false,
    importError: null,
    currentBatch: 0,
    successCount: 0,
    failureCount: 0,
    totalProcessedCount: 0,
    errorsList: [],
    jobSummary: null
  })
}));
