import { useState, useCallback } from 'react';
import { AIConfig, TableColumn, TableRow } from '../types';

// Security: Remove direct OpenAI browser usage
// OpenAI keys should never be exposed in the browser
export const useAIAutofill = (config?: AIConfig) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Record<string, string>>({});
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  // Rate limiting: Max 10 requests per minute
  const isRateLimited = useCallback(() => {
    const now = Date.now();
    const oneMinute = 60 * 1000;
    
    if (now - lastRequestTime > oneMinute) {
      setRequestCount(0);
      setLastRequestTime(now);
    }
    
    return requestCount >= 10;
  }, [requestCount, lastRequestTime]);

  // Input sanitization function
  const sanitizeInput = useCallback((input: string): string => {
    return input
      .replace(/[<>\"']/g, '') // Basic XSS prevention
      .substring(0, 1000) // Limit input length
      .trim();
  }, []);

  const generateSuggestions = useCallback(async (
    column: TableColumn,
    context: string,
    currentRow: TableRow
  ): Promise<Record<string, string>> => {
    if (!config?.enabled || !config?.apiEndpoint) {
      console.warn('AI configuration missing or disabled');
      return {};
    }

    if (isRateLimited()) {
      console.warn('Rate limit exceeded. Please wait before making more requests.');
      return {};
    }

    setIsGenerating(true);
    setRequestCount(prev => prev + 1);

    try {
      // Sanitize all inputs
      const sanitizedContext = sanitizeInput(context);
      const sanitizedHeader = sanitizeInput(column.header);
      
      const requestPayload = {
        column: {
          id: column.id,
          header: sanitizedHeader,
          type: column.type,
          options: column.options?.map(opt => sanitizeInput(opt))
        },
        context: sanitizedContext,
        currentRow: Object.fromEntries(
          Object.entries(currentRow)
            .filter(([key]) => !key.startsWith('_'))
            .map(([key, value]) => [key, sanitizeInput(String(value || ''))])
        )
      };

      // Use secure API endpoint instead of direct OpenAI
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const suggestion = sanitizeInput(data.suggestion || '');
      const suggestions = { [column.id]: suggestion };
      
      setLastGenerated(suggestions);
      return suggestions;
    } catch (error) {
      console.error('AI generation failed:', error);
      return {};
    } finally {
      setIsGenerating(false);
    }
  }, [config, isRateLimited, sanitizeInput]);

  const generateBulkSuggestions = useCallback(async (
    rows: TableRow[],
    columns: TableColumn[]
  ): Promise<Record<string, Record<string, string>>> => {
    if (!config?.enabled || !config?.apiEndpoint) {
      return {};
    }

    if (isRateLimited()) {
      console.warn('Rate limit exceeded for bulk operations.');
      return {};
    }

    // Limit bulk operations to prevent abuse
    const maxBulkSize = 50;
    const limitedRows = rows.slice(0, maxBulkSize);

    setIsGenerating(true);
    setRequestCount(prev => prev + Math.min(rows.length, maxBulkSize));

    try {
      const sanitizedRows = limitedRows.map(row => 
        Object.fromEntries(
          Object.entries(row)
            .filter(([key]) => !key.startsWith('_'))
            .map(([key, value]) => [key, sanitizeInput(String(value || ''))])
        )
      );

      const requestPayload = {
        rows: sanitizedRows,
        columns: columns
          .filter(col => col.aiEnabled)
          .map(col => ({
            id: col.id,
            header: sanitizeInput(col.header),
            type: col.type,
            options: col.options?.map(opt => sanitizeInput(opt))
          }))
      };

      const response = await fetch(`${config.apiEndpoint}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`Bulk API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Sanitize response data
      const sanitizedResults: Record<string, Record<string, string>> = {};
      Object.entries(data.results || {}).forEach(([rowId, suggestions]) => {
        const sanitizedSuggestions: Record<string, string> = {};
        Object.entries(suggestions as Record<string, string>).forEach(([colId, suggestion]) => {
          sanitizedSuggestions[colId] = sanitizeInput(String(suggestion));
        });
        sanitizedResults[rowId] = sanitizedSuggestions;
      });

      return sanitizedResults;
    } catch (error) {
      console.error('Bulk AI generation failed:', error);
      return {};
    } finally {
      setIsGenerating(false);
    }
  }, [config, isRateLimited, sanitizeInput]);

  return {
    generateSuggestions,
    generateBulkSuggestions,
    isGenerating,
    lastGenerated,
    isEnabled: !!config?.enabled && !!config?.apiEndpoint,
    requestCount,
    isRateLimited: isRateLimited(),
  };
};
