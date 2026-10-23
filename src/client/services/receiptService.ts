// src/services/receiptService.ts

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface ExtractedReceipt {
  vendor: string | null;
  date: string | null;
  items: ReceiptItem[];
  total: number | null;
  category: "Food" | "Transport" | "Office Supplies" | "Utilities" | "Other" | string | null;
  unclear_fields: string[];
}

/**
 * Uploads a receipt image to the existing backend endpoint
 */
export async function uploadReceiptImage(file: File): Promise<ExtractedReceipt> {
  const formData = new FormData();
  // Using the standard field name 'file' (or 'receipt' if your backend expects it)
  formData.append("file", file);

  const response = await fetch("/api/v1/receipts/upload", {
    method: "POST",
    body: formData,
    // Do not set Content-Type header manually; browser automatically sets multipart boundary
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to process receipt (Status ${response.status})`);
  }

  return response.json();
}