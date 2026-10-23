import React, { useState, useEffect } from 'react';
import {
  ReceiptDTO,
  CategoryDTO,
  ReceiptLineItemDTO,
} from '../../shared/types/receipt.js';
import { api } from '../services/api.js';
import { formatINR, formatDate } from '../utils/formatters.js';
import { StatusBadge } from './StatusBadge.js';
import {
  X,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Plus,
  Save,
  FileText,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  receiptId: string | null;
  onClose: () => void;
  onReceiptUpdated: () => void;
  categories: CategoryDTO[];
}

export const ReceiptDetailModal: React.FC<Props> = ({
  receiptId,
  onClose,
  onReceiptUpdated,
  categories,
}) => {
  const [receipt, setReceipt] = useState<ReceiptDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [vendorName, setVendorName] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [totalAmountInr, setTotalAmountInr] = useState('');
  const [subtotalInr, setSubtotalInr] = useState('');
  const [taxAmountInr, setTaxAmountInr] = useState('');
  const [lineItems, setLineItems] = useState<ReceiptLineItemDTO[]>([]);

  useEffect(() => {
    if (!receiptId) return;
    loadReceipt(receiptId);
  }, [receiptId]);

  const loadReceipt = async (id: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getReceiptById(id);
      setReceipt(data);
      setVendorName(data.vendorName || '');
      setReceiptDate(data.receiptDate || '');
      setTotalAmountInr(
        data.totalAmountPaise !== null ? (data.totalAmountPaise / 100).toFixed(2) : ''
      );
      setSubtotalInr(
        data.subtotalPaise !== null ? (data.subtotalPaise / 100).toFixed(2) : ''
      );
      setTaxAmountInr(
        data.taxAmountPaise !== null ? (data.taxAmountPaise / 100).toFixed(2) : ''
      );
      setLineItems(data.lineItems || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  if (!receiptId) return null;

  // Line item helpers
  const handleItemChange = (index: number, field: keyof ReceiptLineItemDTO, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      {
        itemName: 'New Item',
        quantity: 1,
        unit: 'pcs',
        unitPricePaise: 0,
        lineTotalPaise: 0,
        categoryId: categories.find((c) => c.name === 'Inventory / Stock')?.id || null,
      },
    ]);
  };

  const handleDeleteItem = (index: number) => {
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // Convert float INR to integer paise
  const toPaise = (val: string): number | null => {
    const trimmed = val.trim();
    if (!trimmed) return null;
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : Math.round(num * 100);
  };

  const handleSave = async () => {
    if (!receipt) return;
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload = {
        vendorName: vendorName.trim() || null,
        receiptDate: receiptDate.trim() || null,
        totalAmountPaise: toPaise(totalAmountInr),
        subtotalPaise: toPaise(subtotalInr),
        taxAmountPaise: toPaise(taxAmountInr),
        lineItems: lineItems.map((item) => ({
          id: item.id,
          itemName: item.itemName,
          quantity: item.quantity ? Number(item.quantity) : null,
          unit: item.unit || null,
          unitPricePaise: item.unitPricePaise !== null && item.unitPricePaise !== undefined ? Number(item.unitPricePaise) : null,
          lineTotalPaise: item.lineTotalPaise !== null && item.lineTotalPaise !== undefined ? Number(item.lineTotalPaise) : null,
          categoryId: item.categoryId || null,
        })),
      };

      const res = await api.updateReceipt(receipt.id, payload);
      setReceipt(res.receipt);
      setSuccessMsg('Changes saved successfully. Bookkeeping validation updated.');
      onReceiptUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!receipt) return;
    setConfirming(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // First save current inputs
      await handleSave();
      // Then explicitly confirm
      const res = await api.confirmReceipt(receipt.id);
      setReceipt(res.receipt);
      setSuccessMsg('Receipt successfully confirmed and added to official accounts!');
      onReceiptUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to confirm receipt');
    } finally {
      setConfirming(false);
    }
  };

  const handleDelete = async () => {
    if (!receipt || !window.confirm('Are you sure you want to delete this receipt? It will be removed from all accounting summaries.')) return;
    try {
      await api.deleteReceipt(receipt.id);
      onReceiptUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete receipt');
    }
  };

  const handleDismissDuplicate = async (candidateId: string) => {
    if (!receipt) return;
    try {
      await api.dismissDuplicate(receipt.id, candidateId);
      await loadReceipt(receipt.id);
      onReceiptUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dismiss duplicate');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#fcfcf9] rounded-2xl shadow-2xl border border-[#dedad0] max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#f8f6f0] border-b border-[#e4dfd3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#e2efe8] text-[#1b4d3e]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#14372c]">
                  {vendorName || 'Review Receipt'}
                </h3>
                {receipt && (
                  <StatusBadge
                    status={receipt.status}
                    duplicateStatus={receipt.duplicateStatus}
                  />
                )}
              </div>
              <p className="text-xs text-[#707c74]">
                ID: {receipt?.id} • File: {receipt?.originalFilename}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#66756c] hover:bg-[#eae5d8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts / Success / Error feedback */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Action Blocked</p>
              <p className="text-xs text-red-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="font-medium text-xs sm:text-sm">{successMsg}</p>
          </div>
        )}

        {/* Duplicate Warning Banner */}
        {receipt && receipt.duplicateCandidates && receipt.duplicateCandidates.length > 0 && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300">
            <div className="flex items-start gap-3">
              <Copy className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">
                  Possible Duplicate Receipt Detected
                </h4>
                <p className="text-xs text-amber-800 mt-1">
                  Our duplicate detection engine matched this receipt against previously uploaded records.
                </p>
                <div className="mt-2.5 space-y-2">
                  {receipt.duplicateCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="p-2.5 bg-white/80 rounded-lg border border-amber-200 text-xs flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-semibold text-[#18392e]">
                          Matched Receipt: {candidate.candidateReceipt?.vendorName || candidate.candidateReceiptId}
                        </span>{' '}
                        • {formatDate(candidate.candidateReceipt?.receiptDate)} •{' '}
                        <span className="font-bold text-[#1b4d3e]">
                          {formatINR(candidate.candidateReceipt?.totalAmountPaise)}
                        </span>
                        <div className="text-[11px] text-[#716955] mt-0.5">
                          Reasons: {candidate.matchReasons.join(', ')} (Status: {candidate.reviewStatus})
                        </div>
                      </div>
                      {candidate.reviewStatus === 'pending' && (
                        <button
                          onClick={() => handleDismissDuplicate(candidate.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#f2eee3] hover:bg-[#e4ddcc] text-[#33463b] border border-[#d3c9b4]"
                        >
                          Dismiss False Positive
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Flags Banner */}
        {receipt && receipt.reviewFlags && receipt.reviewFlags.length > 0 && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="text-xs font-bold text-orange-900 uppercase tracking-wide">
                  Items Requiring Your Review
                </h5>
                <ul className="mt-1 space-y-1 text-xs text-orange-800">
                  {receipt.reviewFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span>{flag.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content Body: Side-by-Side (Image + Form) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Original Receipt Document Preview */}
          <div className="lg:col-span-5 bg-[#f0ede6] rounded-xl p-3 border border-[#dedad0] flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#dedad0] text-xs font-semibold text-[#5c6860]">
              <span>Original Receipt Source</span>
              <a
                href={api.getReceiptFileUrl(receipt.id)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[#256d53] hover:underline"
              >
                Open full <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg p-2 overflow-auto max-h-[500px] border border-[#e2ded5] shadow-inner">
              <img
                src={api.getReceiptFileUrl(receipt.id)}
                alt="Original Receipt Document"
                className="max-w-full max-h-[480px] object-contain"
              />
            </div>
          </div>

          {/* Right Column: Editable Bookkeeping Data */}
          <div className="lg:col-span-7 space-y-5">
            {/* Top fields: Vendor, Date, Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#32453b] mb-1">
                  Vendor / Supplier Name *
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Amul Dairy Wholesaler"
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-[#cfc9bc] focus:outline-none focus:border-[#256d53] focus:ring-1 focus:ring-[#256d53]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#32453b] mb-1">
                  Receipt Date (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white rounded-lg border border-[#cfc9bc] focus:outline-none focus:border-[#256d53] focus:ring-1 focus:ring-[#256d53]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#32453b] mb-1">
                  Printed Grand Total (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmountInr}
                  onChange={(e) => setTotalAmountInr(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm font-semibold bg-white rounded-lg border border-[#cfc9bc] text-[#1b4d3e] focus:outline-none focus:border-[#256d53] focus:ring-1 focus:ring-[#256d53]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#57645d] mb-1">
                    Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subtotalInr}
                    onChange={(e) => setSubtotalInr(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-2 text-sm bg-white rounded-lg border border-[#cfc9bc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#57645d] mb-1">
                    GST / Tax (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmountInr}
                    onChange={(e) => setTaxAmountInr(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-2.5 py-2 text-sm bg-white rounded-lg border border-[#cfc9bc]"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-[#1a382e]">
                  Line Items &amp; Categories ({lineItems.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs font-bold text-[#256d53] hover:text-[#1b4d3e]"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              <div className="border border-[#dedad0] rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f4f1ea] border-b border-[#dedad0] text-[#55635a]">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Item Name</th>
                        <th className="py-2.5 px-2 font-semibold w-24">Qty / Unit</th>
                        <th className="py-2.5 px-2 font-semibold w-24">Amount (₹)</th>
                        <th className="py-2.5 px-2 font-semibold w-36">Category</th>
                        <th className="py-2.5 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ece8df]">
                      {lineItems.map((item, idx) => {
                        const amountInr =
                          item.lineTotalPaise !== null && item.lineTotalPaise !== undefined
                            ? (item.lineTotalPaise / 100).toFixed(2)
                            : '';

                        return (
                          <tr key={idx} className="hover:bg-[#faf9f6]">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.itemName}
                                onChange={(e) =>
                                  handleItemChange(idx, 'itemName', e.target.value)
                                }
                                className="w-full px-2 py-1 border border-[#dedad0] rounded text-xs focus:outline-none focus:border-[#256d53]"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  value={item.quantity ?? ''}
                                  placeholder="1"
                                  onChange={(e) =>
                                    handleItemChange(
                                      idx,
                                      'quantity',
                                      e.target.value ? parseFloat(e.target.value) : null
                                    )
                                  }
                                  className="w-12 px-1 py-1 border border-[#dedad0] rounded text-xs"
                                />
                                <input
                                  type="text"
                                  value={item.unit ?? ''}
                                  placeholder="unit"
                                  onChange={(e) =>
                                    handleItemChange(idx, 'unit', e.target.value)
                                  }
                                  className="w-12 px-1 py-1 border border-[#dedad0] rounded text-xs"
                                />
                              </div>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                value={amountInr}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const paise = val ? Math.round(parseFloat(val) * 100) : 0;
                                  handleItemChange(idx, 'lineTotalPaise', paise);
                                }}
                                className="w-20 px-2 py-1 border border-[#dedad0] rounded text-xs font-semibold text-[#1b4d3e]"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={item.categoryId || ''}
                                onChange={(e) =>
                                  handleItemChange(idx, 'categoryId', e.target.value || null)
                                }
                                className="w-full px-1.5 py-1 border border-[#dedad0] rounded text-xs bg-white text-[#2a3c33]"
                              >
                                <option value="">Uncategorized</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#f8f6f0] border-t border-[#e4dfd3] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Receipt
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#ede8dc] hover:bg-[#e2dccf] text-[#2c3f35] border border-[#d2cbbe] transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#256d53] hover:bg-[#1d5742] rounded-lg shadow-sm shadow-[#256d53]/30 transition-all hover:scale-[1.02]"
            >
              <ShieldCheck className="w-4 h-4" />
              {confirming ? 'Confirming...' : 'Confirm Receipt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
