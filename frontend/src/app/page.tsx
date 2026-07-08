"use client";

import React from 'react';
import { UploadZone } from '@/components/UploadZone';
import { PreviewTable } from '@/components/PreviewTable';
import { ProgressTracker } from '@/components/ProgressTracker';
import { LeadDashboard } from '@/components/LeadDashboard';
import { useImportStore } from '@/store/importStore';
import { useImportStream } from '@/hooks/useImportStream';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Home() {
  const { toast } = useToast();
  const { file, isImporting, reset, importCompleted } = useImportStore();
  const { runImportStream } = useImportStream();

  const handleConfirmImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a CSV file to inspect before confirming.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Import job started",
      description: "Connecting to the mapping engine and streaming batches...",
    });
    
    await runImportStream();
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background text-foreground">
      
      {/* Background Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/75 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-foreground via-foreground/90 to-foreground/75 bg-clip-text text-transparent">
              GrowEasy Importer
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              disabled={isImporting}
              className="border-border hover:bg-accent"
            >
              Reset Space
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <main className="flex-1 container max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 z-10">
        
        {/* Hero Section */}
        <section className="text-center space-y-3 py-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            AI-Powered CSV Import System
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Upload any custom, messy marketing or sales CSV. Our deterministic mapping engine
            uses LLMs to extract, deduplicate, validate, and store leads matching your CRM schema.
          </p>
        </section>

        {/* Upload & Preview Panels */}
        <section className="grid grid-cols-1 gap-8">
          
          {/* Uploader Card */}
          <div className="glass-card rounded-2xl border p-6 space-y-6">
            <div className="text-left">
              <h2 className="text-xl font-bold">1. File Selection</h2>
              <p className="text-sm text-muted-foreground">
                Drop your CSV. We will extract layout metrics instantly.
              </p>
            </div>

            <UploadZone />
          </div>

          {/* Table Preview */}
          <PreviewTable />

          {/* Trigger Import Controls */}
          {file && !importCompleted && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-semibold py-6 px-8 rounded-xl shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.01] transition-all flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    AI Processing...
                  </>
                ) : (
                  <>
                    Confirm & Start AI Import
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Running Progress Monitor */}
          <ProgressTracker />

          {/* CRM Lead Storage Visualizer */}
          <LeadDashboard />

        </section>

      </main>

      {/* footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground mt-auto bg-muted/40">
        <p>© 2026 GrowEasy Assignment. Built with Next.js, Express & Clean Architecture.</p>
      </footer>

    </div>
  );
}
