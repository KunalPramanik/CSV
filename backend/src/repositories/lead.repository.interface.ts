import { CRMLead, CRMLeadInput } from '../types/index.js';

export interface ILeadRepository {
  create(lead: CRMLeadInput): Promise<CRMLead>;
  createMany(leads: CRMLeadInput[]): Promise<CRMLead[]>;
  findAll(): Promise<CRMLead[]>;
  clear(): Promise<void>;
}
