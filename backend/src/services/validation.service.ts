import { z } from 'zod';
import { CRMLeadInput } from '../types/index.js';

export const LeadValidationSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: 'Invalid email address format' })
    .transform(val => val.toLowerCase()),
  mobile: z.string()
    .trim()
    .transform(val => {
      // Keep only digits and '+'
      return val.replace(/[^0-9+]/g, '');
    })
    .refine(val => val.replace(/[^0-9]/g, '').length >= 7, { 
      message: 'Mobile number must contain at least 7 digits' 
    }),
  crm_note: z.string().trim().default(''),
  lead_owner: z.string().trim().default('Unassigned'),
  company: z.string().trim().default('Unknown'),
  lead_status: z.enum(['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'])
    .default('GOOD_LEAD_FOLLOW_UP'),
  data_source: z.enum(['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', ''])
    .default(''),
});

export class ValidationService {
  /**
   * Validates a single mapped CRM lead input.
   * @param data Mapped record object.
   * @returns Parsed and normalized lead or throws ZodError.
   */
  validateLead(data: Record<string, any>): CRMLeadInput {
    // Normalizations before Zod schema processing
    const normalized = { ...data };
    
    // Normalize N/A or undefined values to standard formats
    if (typeof normalized.email === 'string' && normalized.email.toUpperCase() === 'N/A') {
      normalized.email = '';
    }
    
    return LeadValidationSchema.parse(normalized);
  }
}
export const validationService = new ValidationService();
