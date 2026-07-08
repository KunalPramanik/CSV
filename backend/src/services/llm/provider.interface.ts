export interface ILLMProvider {
  /**
   * Maps a batch of raw records to the target CRM schema using the LLM.
   * @param rows Array of raw key-value records from the CSV.
   * @param systemPrompt The instruction set for mapping.
   * @returns Mapped record objects from the LLM.
   */
  mapBatch(rows: Record<string, any>[], systemPrompt: string): Promise<Record<string, any>[]>;
}
