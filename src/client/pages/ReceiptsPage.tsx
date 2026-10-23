import React, { useState, useEffect } from 'react';
import { ReceiptDTO, CategoryDTO } from '../../shared/types/receipt.js';
import { api } from '../services/api.js';
import { formatINR, formatDate } from '../utils/formatters.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  Search,
  Filter,
  Receipt as ReceiptIcon,
  Plus,
  RefreshCw,
  Copy,
  Calendar,
} from 'lucide-react';

interface Props {
  onOpenReceipt: (id: string) => void;
  onOpenUpload: () => void;
  categories: CategoryDTO[];
}

export const ReceiptsPage: React.FC<Props> = ({ onOpenReceipt, onOpenUpload }) => {
  const [receipts, setReceipts] = useState<ReceiptDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [searchVendor, setSearchVendor] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [duplicateFilter, setDuplicateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadReceipts();
  }, [statusFilter, duplicateFilter, startDate, endDate]);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const data = await api.getReceipts({
        status: statusFilter,
        duplicateStatus: duplicateFilter,
        vendor: searchVendor,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });
      setReceipts(data.items);
      setTotalCount(data.total);
    } catch (err) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReceipts();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#14372c]">
            Receipt Ledger &amp; Invoices
          </h1>
          <p className="text-xs sm:text-sm text-[#66776e] mt-1">
            Search, review, correct, and confirm kirana purchase bills ({totalCount} total)
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#256d53] hover:bg-[#1d5742] text-white text-xs sm:text-sm font-bold shadow-sm transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Upload New Receipt
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e1d6] shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Vendor Search */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#8a9990] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search vendor (e.g. Amul, Parle, Ganesh)..."
              value={searchVendor}
              onChange={(e) => setSearchVendor(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#faf9f5] rounded-xl border border-[#dedad0] focus:outline-none focus:border-[#256d53] focus:bg-white"
            />
          </form>

          {/* Date range inputs */}
          <div className="md:col-span-4 flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Start Date"
              className="w-1/2 px-2.5 py-2 text-xs bg-[#faf9f5] rounded-xl border border-[#dedad0]"
            />
            <span className="text-xs text-[#8a9990]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="End Date"
              className="w-1/2 px-2.5 py-2 text-xs bg-[#faf9f5] rounded-xl border border-[#dedad0]"
            />
          </div>

          {/* Duplicate filter dropdown */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={duplicateFilter}
              onChange={(e) => setDuplicateFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[#faf9f5] rounded-xl border border-[#dedad0] text-[#33463b] font-medium"
            >
              <option value="all">All Duplicate States</option>
              <option value="suspected">Suspected Duplicates Only</option>
              <option value="none">No Duplicate Match</option>
              <option value="dismissed">Dismissed Candidates</option>
            </select>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#f0ece1]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-[#6a7a70] mr-1">Status:</span>
            {[
              { id: 'all', label: 'All Receipts' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'needs_review', label: 'Needs Review' },
              { id: 'draft', label: 'Drafts' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === st.id
                    ? 'bg-[#1b4d3e] text-white shadow-sm'
                    : 'bg-[#f4f1ea] hover:bg-[#eae5d8] text-[#3a4e42]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadReceipts}
            className="flex items-center gap-1 text-xs font-semibold text-[#516358] hover:text-[#1b4d3e]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-[#e5e1d6] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#8a9990]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#256d53]" />
            Loading receipt ledger...
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center text-[#718177]">
            <ReceiptIcon className="w-12 h-12 text-[#d2cec3] mx-auto mb-3" />
            <p className="font-bold text-sm text-[#18392e]">No receipts matched your criteria</p>
            <p className="text-xs text-[#8a9990] mt-1">
              Try adjusting your search terms, date range, or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7f5ed] border-b border-[#e5e1d6] text-[#55655b]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Vendor / Supplier</th>
                  <th className="py-3 px-4 font-semibold">Bill Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Line Items</th>
                  <th className="py-3 px-4 font-semibold">Flags / Duplicate</th>
                  <th className="py-3 px-4 font-semibold text-right">Grand Total (₹)</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeae1]">
                {receipts.map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => onOpenReceipt(rec.id)}
                    className="hover:bg-[#fbf9f4] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#18392e]">
                        {rec.vendorName || (
                          <span className="text-amber-700 italic">[Vendor Missing]</span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#78887e]">
                        File: {rec.originalFilename}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#44554c]">
                      {formatDate(rec.receiptDate)}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge
                        status={rec.status}
                        duplicateStatus={rec.duplicateStatus}
                        size="sm"
                      />
                    </td>

                    <td className="py-3 px-4 text-[#66776e]">
                      {rec.lineItems?.length || 0} line {rec.lineItems?.length === 1 ? 'item' : 'items'}
                    </td>

                    <td className="py-3 px-4">
                      {rec.duplicateCandidates && rec.duplicateCandidates.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          <Copy className="w-3 h-3" /> Duplicate ({rec.duplicateCandidates.length})
                        </span>
                      ) : rec.reviewFlags && rec.reviewFlags.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {rec.reviewFlags.length} flag(s)
                        </span>
                      ) : (
                        <span className="text-[#9aa79f] text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-extrabold text-[#1b4d3e] text-right">
                      {formatINR(rec.totalAmountPaise)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReceipt(rec.id);
                        }}
                        className="px-3 py-1 text-xs font-bold rounded-lg bg-[#ede8dc] hover:bg-[#ded7c8] text-[#243b2f] transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
