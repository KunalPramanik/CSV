"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Trash2, Search, Users, Sparkles, Building, Landmark, Compass, Award } from 'lucide-react';
import { CRMLead } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function LeadDashboard() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // React Query: Get leads
  const { data: leadsResponse, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['crmLeads'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/import/leads`);
      if (!res.ok) throw new Error('Failed to retrieve CRM leads');
      return res.json() as Promise<{ data: CRMLead[] }>;
    },
  });

  const leads = leadsResponse?.data || [];

  // React Query Mutation: Clear leads
  const clearLeadsMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${apiUrl}/api/import/leads`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear database');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crmLeads'] });
    },
  });

  const filteredLeads = leads.filter((lead) =>
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.mobile.includes(searchTerm) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lead_owner.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'SALE_DONE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'GOOD_LEAD_FOLLOW_UP':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'DID_NOT_CONNECT':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'BAD_LEAD':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-muted/30 text-muted-foreground border-white/5';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'leads_on_demand':
        return <span title="Leads On Demand"><Award className="h-4.5 w-4.5 text-blue-400" /></span>;
      case 'meridian_tower':
        return <span title="Meridian Tower"><Building className="h-4.5 w-4.5 text-purple-400" /></span>;
      case 'eden_park':
        return <span title="Eden Park"><Landmark className="h-4.5 w-4.5 text-yellow-400" /></span>;
      case 'varah_swamy':
        return <span title="Varah Swamy"><Compass className="h-4.5 w-4.5 text-cyan-400" /></span>;
      case 'sarjapur_plots':
        return <span title="Sarjapur Plots"><Compass className="h-4.5 w-4.5 text-orange-400" /></span>;
      default:
        return null;
    }
  };

  return (
    <div className="glass-card rounded-xl border p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            CRM Lead Storage Database
          </h3>
          <p className="text-sm text-muted-foreground">
            Current system records parsed, validated, and saved in-memory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-muted/20 border border-border rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-primary text-foreground"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            title="Refresh Leads"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to clear the entire leads database?')) {
                clearLeadsMutation.mutate();
              }
            }}
            disabled={leads.length === 0 || clearLeadsMutation.isPending}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            Clear CRM
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span>Loading CRM leads...</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 bg-muted/10 rounded-full flex items-center justify-center">
            <Users className="h-8 w-8 opacity-45" />
          </div>
          <div>
            <h4 className="font-semibold text-lg">No leads in CRM database</h4>
            <p className="text-sm max-w-sm mx-auto mt-1">
              Upload and confirm a CSV import above to map leads and write them here.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="border-b border-border">
                <TableHead>Email</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Lead Status</TableHead>
                <TableHead>Executive</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="text-center">Src</TableHead>
                <TableHead className="max-w-[150px]">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-accent border-b border-border">
                    <TableCell className="font-semibold text-sm">{lead.email}</TableCell>
                    <TableCell className="text-sm font-mono">{lead.mobile}</TableCell>
                    <TableCell>
                      <span className={`inline-block border px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeClass(lead.lead_status)}`}>
                        {lead.lead_status.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{lead.lead_owner}</TableCell>
                    <TableCell className="text-sm">{lead.company}</TableCell>
                    <TableCell className="text-center align-middle">
                      <div className="flex justify-center">
                        {getSourceIcon(lead.data_source) || <span className="text-muted-foreground/35 italic text-xs">-</span>}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={lead.crm_note}>
                      {lead.crm_note || <span className="text-muted-foreground/45 italic">none</span>}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No leads matching search query.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
