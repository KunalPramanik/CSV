import { describe, it, expect } from 'vitest';
import { validationService } from '../services/validation.service.js';

describe('Validation Service', () => {
  it('should parse and normalize a valid lead input', () => {
    const input = {
      email: '  Alex.Smith@GMAIL.COM  ',
      mobile: '+1 (234) 567-8901',
      crm_note: '   Interested in plot purchase.  ',
      lead_owner: 'Sarah Connor',
      company: 'Smith Enterprises',
      lead_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'meridian_tower',
    };

    const validated = validationService.validateLead(input);

    expect(validated.email).toBe('alex.smith@gmail.com');
    expect(validated.mobile).toBe('+12345678901');
    expect(validated.crm_note).toBe('Interested in plot purchase.');
    expect(validated.lead_owner).toBe('Sarah Connor');
    expect(validated.company).toBe('Smith Enterprises');
    expect(validated.lead_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(validated.data_source).toBe('meridian_tower');
  });

  it('should apply fallback default values for missing optional fields', () => {
    const input = {
      email: 'test@example.com',
      mobile: '123456789',
    };

    const validated = validationService.validateLead(input);

    expect(validated.crm_note).toBe('');
    expect(validated.lead_owner).toBe('Unassigned');
    expect(validated.company).toBe('Unknown');
    expect(validated.lead_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(validated.data_source).toBe('');
  });

  it('should throw validation error on invalid emails', () => {
    const input = {
      email: 'not-an-email',
      mobile: '123456789',
    };

    expect(() => validationService.validateLead(input)).toThrow();
  });

  it('should throw validation error on phone numbers with insufficient digits', () => {
    const input = {
      email: 'test@example.com',
      mobile: '123',
    };

    expect(() => validationService.validateLead(input)).toThrow();
  });

  it('should throw validation error on invalid enums', () => {
    const input = {
      email: 'test@example.com',
      mobile: '123456789',
      lead_status: 'INVALID_STATUS',
    };

    expect(() => validationService.validateLead(input)).toThrow();
  });
});
