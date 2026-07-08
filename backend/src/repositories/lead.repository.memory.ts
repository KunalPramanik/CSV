import { v4 as uuidv4 } from 'uuid';
import { CRMLead, CRMLeadInput } from '../types/index.js';
import { ILeadRepository } from './lead.repository.interface.js';

export class LeadRepositoryMemory implements ILeadRepository {
  private leads: CRMLead[] = [];

  async create(lead: CRMLeadInput): Promise<CRMLead> {
    const newLead: CRMLead = {
      id: uuidv4(),
      email: lead.email.toLowerCase().trim(),
      mobile: lead.mobile.trim(),
      crm_note: lead.crm_note || '',
      lead_owner: lead.lead_owner || 'Unassigned',
      company: lead.company || 'Unknown',
      lead_status: lead.lead_status || 'GOOD_LEAD_FOLLOW_UP',
      data_source: lead.data_source || '',
      createdAt: new Date().toISOString(),
    };
    this.leads.push(newLead);
    return newLead;
  }

  async createMany(leads: CRMLeadInput[]): Promise<CRMLead[]> {
    const createdLeads: CRMLead[] = [];
    for (const lead of leads) {
      const created = await this.create(lead);
      createdLeads.push(created);
    }
    return createdLeads;
  }

  async findAll(): Promise<CRMLead[]> {
    // Return a copy to avoid external mutation
    return [...this.leads];
  }

  async clear(): Promise<void> {
    this.leads = [];
  }
}

// Export a single instance to be shared across the backend
export const leadRepository = new LeadRepositoryMemory();
