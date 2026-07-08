"use client";

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Sparkles } from 'lucide-react';
import { useImportStore } from '@/store/importStore';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export function ProgressTracker() {
  const {
    isImporting,
    importCompleted,
    importError,
    successCount,
    failureCount,
    totalProcessedCount,
    rowsCount,
    errorsList,
    jobSummary,
  } = useImportStore();

  const [showErrorLog, setShowErrorLog] = useState(false);

  if (!isImporting && !importCompleted && !importError) return null;

  const progressPercent = rowsCount ? Math.min(Math.round((totalProcessedCount / rowsCount) * 100), 100) : 0;

  return (
    <div className="glass-card rounded-xl border p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {isImporting && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                AI Mapping & Ingestion Pipeline
              </>
            )}
            {importCompleted && (
              <>
                <Sparkles className="h-5 w-5 text-yellow-400" />
                Import Complete
              </>
            )}
            {importError && (
              <>
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Import Failed
              </>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isImporting && `Processing batch-by-batch concurrently using gpt-4o-mini...`}
            {importCompleted && `Successfully mapped and imported CRM leads.`}
            {importError && `Execution aborted due to a network or configuration issue.`}
          </p>
        </div>
        
        {isImporting && (
          <span className="text-sm font-semibold bg-primary/10 text-primary rounded-full px-3 py-1 border border-primary/20">
            {progressPercent}%
          </span>
        )}
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Processed {totalProcessedCount.toLocaleString()} / {rowsCount.toLocaleString()} rows</span>
            <span>Est. progress: {progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-muted/10 rounded-lg p-4 border border-border flex items-center justify-between">
          <div>
            <span className="block text-xs text-muted-foreground uppercase tracking-wider">
              Total Mapped
            </span>
            <span className="text-2xl font-bold">
              {totalProcessedCount.toLocaleString()}
            </span>
          </div>
          <CheckCircle className="h-8 w-8 text-muted-foreground/35" />
        </div>

        <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/25 flex items-center justify-between">
          <div>
            <span className="block text-xs text-emerald-400/85 uppercase tracking-wider">
              Valid Leads
            </span>
            <span className="text-2xl font-bold text-emerald-400">
              {successCount.toLocaleString()}
            </span>
          </div>
          <CheckCircle className="h-8 w-8 text-emerald-500/40" />
        </div>

        <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/25 flex items-center justify-between">
          <div>
            <span className="block text-xs text-destructive-foreground uppercase tracking-wider">
              Rejected Rows
            </span>
            <span className="text-2xl font-bold text-destructive-foreground">
              {failureCount.toLocaleString()}
            </span>
          </div>
          <AlertTriangle className="h-8 w-8 text-destructive/40" />
        </div>
      </div>

      {/* Completion Summary Card */}
      {importCompleted && jobSummary && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-5 space-y-2 text-left">
          <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Import Details</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Job Correlation ID: <code className="text-xs bg-muted/30 px-1 py-0.5 rounded">{jobSummary.jobId}</code></li>
            <li>• Elapsed Time: {(jobSummary.processingTimeMs / 1000).toFixed(2)} seconds</li>
            <li>• Success Rate: {((successCount / (rowsCount || 1)) * 100).toFixed(1)}%</li>
          </ul>
        </div>
      )}

      {/* Error / Validation Warnings Log */}
      {errorsList.length > 0 && (
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-1.5 text-yellow-500">
              <AlertTriangle className="h-4 w-4" />
              Validation Warnings ({errorsList.length})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowErrorLog(!showErrorLog)}
            >
              {showErrorLog ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {showErrorLog && (
            <div className="rounded-lg border border-border bg-black/35 p-4 max-h-[220px] overflow-y-auto space-y-2 font-mono text-xs text-muted-foreground">
              {errorsList.map((err, idx) => (
                <div key={idx} className="border-b border-border pb-2 last:border-0 last:pb-0">
                  <span className="text-yellow-500 font-semibold">[Row {err.rowNumber}]</span>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-destructive-foreground">
                    {err.errors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {importError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive-foreground text-left">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>Error details: {importError}</span>
        </div>
      )}
    </div>
  );
}
