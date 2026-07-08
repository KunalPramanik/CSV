"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileSpreadsheet, Upload, AlertCircle } from 'lucide-react';
import { useLocalCsv } from '@/hooks/useLocalCsv';
import { useImportStore } from '@/store/importStore';
import { cn } from '@/lib/utils';

export function UploadZone() {
  const { parseCsvLocally } = useLocalCsv();
  const { fileName, fileSize, rowsCount, columnsCount, isImporting } = useImportStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        parseCsvLocally(acceptedFiles[0]);
      }
    },
    [parseCsvLocally]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled: isImporting,
  });

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer",
          isDragActive 
            ? "border-primary bg-primary/5 scale-[1.01]" 
            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5",
          isImporting && "opacity-55 cursor-not-allowed pointer-events-none"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/10 text-muted-foreground mb-4">
          <Upload className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Upload your CSV</h3>
        <p className="text-sm text-muted-foreground max-w-xs mb-2">
          Drag and drop your file here, or click to browse.
        </p>
        <span className="text-xs text-muted-foreground/60">
          Supports .csv files up to 10MB
        </span>
      </div>

      {fileRejections.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive-foreground">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Only CSV files are accepted.</span>
        </div>
      )}

      {fileName && (
        <div className="glass-card rounded-xl p-6 flex flex-col md:flex-row items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-base line-clamp-1 max-w-[280px]">
                {fileName}
              </h4>
              <p className="text-sm text-muted-foreground">
                Size: {formatBytes(fileSize)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center md:text-left">
            <div className="bg-muted/10 rounded-lg px-4 py-2 border border-border">
              <span className="block text-xs text-muted-foreground uppercase tracking-wider">
                Rows Detected
              </span>
              <span className="text-lg font-bold">
                {rowsCount.toLocaleString()}
              </span>
            </div>
            <div className="bg-muted/10 rounded-lg px-4 py-2 border border-border">
              <span className="block text-xs text-muted-foreground uppercase tracking-wider">
                Columns Detected
              </span>
              <span className="text-lg font-bold">
                {columnsCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
