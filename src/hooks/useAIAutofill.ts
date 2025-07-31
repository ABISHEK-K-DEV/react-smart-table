import { useState, useCallback } from 'react';
import OpenAI from 'openai';
import { AIConfig, TableColumn, TableRow } from '../types';

export const useAIAutofill = (config?: AIConfig) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Record<string, string>>({});

  const openai = config?.apiKey ? new OpenAI({
    apiKey: config.apiKey,
    dangerouslyAllowBrowser: true,
  }) : null;

  const generateSuggestions = useCallback(async (
    column: TableColumn,
    context: string,
    currentRow: TableRow
  ): Promise<Record<string, string>> => {
    if (!config?.enabled || !openai) {
      return {};
    }

    setIsGenerating(true);

    try {
      const prompt = createPrompt(column, context, currentRow);
      
      const response = await openai.chat.completions.create({
        model: config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant helping to autofill table data. Provide accurate, relevant suggestions based on the context. Return only the suggested value, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature || 0.3,
        max_tokens: config.maxTokens || 100,
      });

      const suggestion = response.choices[0]?.message?.content?.trim() || '';
      const suggestions = { [column.id]: suggestion };
      
      setLastGenerated(suggestions);
      return suggestions;
    } catch (error) {
      console.error('AI generation failed:', error);
      return {};
    } finally {
      setIsGenerating(false);
    }
  }, [config, openai]);

  const generateBulkSuggestions = useCallback(async (
    rows: TableRow[],
    columns: TableColumn[]
  ): Promise<Record<string, Record<string, string>>> => {
    if (!config?.enabled || !openai) {
      return {};
    }

    setIsGenerating(true);
    const results: Record<string, Record<string, string>> = {};

    try {
      for (const row of rows) {
        const rowSuggestions: Record<string, string> = {};
        
        for (const column of columns.filter(col => col.aiEnabled)) {
          const prompt = createBulkPrompt(column, row, rows);
          
          const response = await openai.chat.completions.create({
            model: config.model || 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an AI assistant helping to autofill table data. Analyze patterns in existing data and provide accurate suggestions.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: config.temperature || 0.3,
            max_tokens: config.maxTokens || 50,
          });

          const suggestion = response.choices[0]?.message?.content?.trim() || '';
          if (suggestion) {
            rowSuggestions[column.id] = suggestion;
          }
        }
        
        if (Object.keys(rowSuggestions).length > 0) {
          results[row.id] = rowSuggestions;
        }
      }

      return results;
    } catch (error) {
      console.error('Bulk AI generation failed:', error);
      return {};
    } finally {
      setIsGenerating(false);
    }
  }, [config, openai]);

  return {
    generateSuggestions,
    generateBulkSuggestions,
    isGenerating,
    lastGenerated,
    isEnabled: !!config?.enabled && !!openai,
  };
};

function createPrompt(column: TableColumn, context: string, currentRow: TableRow): string {
  const existingData = Object.entries(currentRow)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return `
Column: ${column.header} (${column.type})
Context: ${context}
Existing row data: ${existingData}
${column.options ? `Valid options: ${column.options.join(', ')}` : ''}

Suggest an appropriate value for the ${column.header} field:`;
}

function createBulkPrompt(column: TableColumn, targetRow: TableRow, allRows: TableRow[]): string {
  const sampleData = allRows
    .slice(0, 5)
    .map(row => Object.entries(row)
      .filter(([key]) => !key.startsWith('_'))
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
    )
    .join('\n');

  const targetData = Object.entries(targetRow)
    .filter(([key]) => !key.startsWith('_') && key !== column.id)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return `
Analyze this data pattern and suggest a value for ${column.header}:

Sample existing rows:
${sampleData}

Target row data: ${targetData}
${column.options ? `Valid options: ${column.options.join(', ')}` : ''}

Suggest value for ${column.header}:`;
}
