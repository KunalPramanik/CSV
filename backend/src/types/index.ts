export type LeadStatus = 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE';

export type DataSource = 'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | '';

export interface CRMLead {
  id: string;
  email: string;
  mobile: string;
  crm_note: string;
  lead_owner: string;
  company: string;
  lead_status: LeadStatus;
  data_source: DataSource;
  createdAt: string;
}

export interface CRMLeadInput {
  email: string;
  mobile: string;
  crm_note?: string;
  lead_owner?: string;
  company?: string;
  lead_status?: LeadStatus;
  data_source?: DataSource;
}

export interface ValidationError {
  rowNumber: number;
  errors: string[];
  rowData: Record<string, any>;
}

export interface ImportBatchProgress {
  batchIndex: number;
  successCount: number;
  failureCount: number;
  totalProcessed: number;
  errors: ValidationError[];
}

export interface ImportResultSummary {
  jobId: string;
  totalProcessed: number;
  totalSuccess: number;
  totalFailed: number;
  processingTimeMs: number;
}
