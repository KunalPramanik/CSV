import OpenAI from 'openai';
import { env } from '../../config/env.config.js';
import { ILLMProvider } from './provider.interface.js';
import { logger } from '../../config/logger.js';

export class OpenAIProvider implements ILLMProvider {
  private openai: OpenAI;
  private model: string;
  private isGroq: boolean;

  constructor() {
    const apiKey = env.OPENAI_API_KEY;
    // Auto-detect Groq keys which typically start with 'gsk_'
    this.isGroq = apiKey.startsWith('gsk_');
    
    const baseURL = this.isGroq 
      ? 'https://api.groq.com/openai/v1' 
      : undefined;
      
    this.model = this.isGroq 
      ? 'llama-3.1-8b-instant' 
      : 'gpt-4o-mini';

    logger.info(
      { isGroq: this.isGroq, model: this.model, baseURL: baseURL || 'OpenAI Default' },
      'Initializing LLM Provider'
    );

    this.openai = new OpenAI({
      apiKey,
      baseURL,
    });
  }

  async mapBatch(rows: Record<string, any>[], systemPrompt: string): Promise<Record<string, any>[]> {
    logger.info({ rowCount: rows.length, model: this.model }, 'Sending batch to LLM');
    
    // Groq supports JSON mode (json_object) but not OpenAI's strict json_schema format.
    const responseFormat: any = this.isGroq
      ? { type: 'json_object' }
      : {
          type: 'json_schema',
          json_schema: {
            name: 'crm_leads_mapping',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                leads: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      email: { type: 'string', description: 'Primary email address extracted from inputs' },
                      mobile: { type: 'string', description: 'Primary cleaned mobile or phone number' },
                      crm_note: { type: 'string', description: 'Remarks, observation, description, or fallback emails/phones' },
                      lead_owner: { type: 'string', description: 'Assigned executive, owner, or Unassigned' },
                      company: { type: 'string', description: 'Company name, organization, or Unknown' },
                      lead_status: { 
                        type: 'string', 
                        enum: ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'],
                        description: 'Inferred lead status'
                      },
                      data_source: { 
                        type: 'string', 
                        enum: ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', ''],
                        description: 'Inferred data source'
                      }
                    },
                    required: ['email', 'mobile', 'crm_note', 'lead_owner', 'company', 'lead_status', 'data_source'],
                    additionalProperties: false
                  }
                }
              },
              required: ['leads'],
              additionalProperties: false
            }
          }
        };

    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(rows) },
      ],
      temperature: 0,
      response_format: responseFormat,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    try {
      const parsed = JSON.parse(content);
      // Case 1: Standard structured response matching our schema
      if (parsed && Array.isArray(parsed.leads)) {
        logger.info({ successCount: parsed.leads.length }, 'Successfully mapped batch');
        return parsed.leads;
      }
      // Case 2: LLM returned the array directly (common in standard JSON mode)
      if (Array.isArray(parsed)) {
        logger.info({ successCount: parsed.length }, 'Successfully mapped batch (direct array)');
        return parsed;
      }
      // Case 3: LLM wrapped the array in another key
      if (parsed && typeof parsed === 'object') {
        for (const key of Object.keys(parsed)) {
          if (Array.isArray(parsed[key])) {
            logger.info({ successCount: parsed[key].length }, `Successfully mapped batch (key: ${key})`);
            return parsed[key];
          }
        }
      }
      throw new Error('LLM response missing leads array structure');
    } catch (e: any) {
      logger.error({ content, error: e.message }, 'Failed to parse LLM response');
      throw new Error(`Failed to parse AI output: ${e.message}`);
    }
  }
}
