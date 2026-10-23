import {
  ReceiptDTO,
  ReceiptFilterSchema,
  AnalyticsSummaryDTO,
  CategoryDTO,
  NaturalLanguageQueryResultDTO,
} from '../../shared/types/receipt.js';
import { UpdateReceiptInput } from '../../shared/schemas/receipt.js';

const API_BASE = '/api/v1';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = `API request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Analytics
  getSummary: async (params?: { preset?: string; startDate?: string; endDate?: string }): Promise<AnalyticsSummaryDTO> => {
    const q = new URLSearchParams();
    if (params?.preset) q.set('preset', params.preset);
    if (params?.startDate) q.set('startDate', params.startDate);
    if (params?.endDate) q.set('endDate', params.endDate);
    return fetchApi<AnalyticsSummaryDTO>(`/analytics/summary?${q.toString()}`);
  },

  askQuery: async (question: string, startDate?: string, endDate?: string): Promise<NaturalLanguageQueryResultDTO> => {
    return fetchApi<NaturalLanguageQueryResultDTO>('/analytics/query', {
      method: 'POST',
      body: JSON.stringify({ question, startDate, endDate }),
    });
  },

  // Receipts
  getReceipts: async (filters: Record<string, any> = {}): Promise<{ total: number; page: number; limit: number; totalPages: number; items: ReceiptDTO[] }> => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '' && v !== 'all') {
        q.set(k, String(v));
      }
    }
    return fetchApi(`/receipts?${q.toString()}`);
  },

  getReceiptById: async (id: string): Promise<ReceiptDTO> => {
    return fetchApi<ReceiptDTO>(`/receipts/${id}`);
  },

  uploadReceipt: async (file: File): Promise<{ message: string; receipt: ReceiptDTO; warning?: string }> => {
    const formData = new FormData();
    formData.append('receipt', file);

    const response = await fetch(`${API_BASE}/receipts/upload`, {
      method: 'POST',
      body: formData, // No Content-Type header so browser sets multipart boundary
    });

    if (!response.ok) {
      let errorMsg = `Upload failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson.error) errorMsg = errJson.error;
      } catch {}
      throw new Error(errorMsg);
    }

    return response.json();
  },

  updateReceipt: async (id: string, data: UpdateReceiptInput): Promise<{ message: string; receipt: ReceiptDTO }> => {
    return fetchApi<{ message: string; receipt: ReceiptDTO }>(`/receipts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  confirmReceipt: async (id: string): Promise<{ message: string; receipt: ReceiptDTO }> => {
    return fetchApi<{ message: string; receipt: ReceiptDTO }>(`/receipts/${id}/confirm`, {
      method: 'POST',
    });
  },

  deleteReceipt: async (id: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/receipts/${id}`, {
      method: 'DELETE',
    });
  },

  dismissDuplicate: async (receiptId: string, candidateId: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/receipts/${receiptId}/duplicates/${candidateId}/dismiss`, {
      method: 'POST',
    });
  },

  // Categories
  getCategories: async (): Promise<CategoryDTO[]> => {
    return fetchApi<CategoryDTO[]>('/categories');
  },

  // Export
  getExportCsvUrl: (startDate?: string, endDate?: string): string => {
    const q = new URLSearchParams();
    if (startDate) q.set('startDate', startDate);
    if (endDate) q.set('endDate', endDate);
    return `${API_BASE}/export/receipts.csv?${q.toString()}`;
  },

  getReceiptFileUrl: (id: string): string => {
    return `${API_BASE}/receipts/${id}/file`;
  },
};
