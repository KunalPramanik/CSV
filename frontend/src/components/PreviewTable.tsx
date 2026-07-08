"use client";

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useImportStore } from '@/store/importStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export function PreviewTable() {
  const { previewHeaders, previewRows, isImporting } = useImportStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter rows based on search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return previewRows;
    return previewRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [previewRows, searchTerm]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRows, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;

  if (previewRows.length === 0) return null;

  return (
    <div className="glass-card rounded-xl border p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Local Preview</h3>
          <p className="text-sm text-muted-foreground">
            Displaying a sample of the first 10 rows parsed locally.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search preview..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            disabled={isImporting}
            className="w-full bg-muted/20 border border-border rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-primary transition-all text-foreground"
          />
        </div>
      </div>

      <div className="rounded-md border border-border overflow-hidden max-h-[360px] overflow-y-auto">
        <Table>
          <TableHeader className="bg-muted/10 sticky top-0 backdrop-blur-md z-10">
            <TableRow className="border-b border-border">
              {previewHeaders.map((header) => (
                <TableHead key={header} className="font-semibold text-xs uppercase tracking-wider whitespace-nowrap">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-accent border-b border-border">
                  {previewHeaders.map((header) => (
                    <TableCell key={header} className="max-w-[200px] truncate text-sm">
                      {row[header] || <span className="text-muted-foreground/45 italic">empty</span>}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={previewHeaders.length} className="text-center py-8 text-muted-foreground">
                  No matching records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredRows.length)} of{' '}
            {filteredRows.length} sample rows
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || isImporting}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || isImporting}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
