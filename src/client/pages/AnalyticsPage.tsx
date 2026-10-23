import React, { useState, useEffect } from 'react';
import {
  AnalyticsSummaryDTO,
  CategorySpendingDTO,
  VendorSpendingDTO,
} from '../../shared/types/receipt.js';
import { api } from '../services/api.js';
import { formatINR } from '../utils/formatters.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Download,
  Calendar,
  IndianRupee,
  Receipt as ReceiptIcon,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface Props {
  onOpenReceipt: (id: string) => void;
}

const COLORS = [
  '#256d53',
  '#3ba97f',
  '#62c69d',
  '#dcbc8d',
  '#c48f57',
  '#a37145',
  '#2c8965',
  '#598a72',
  '#845b3c',
  '#385a49',
];

export const AnalyticsPage: React.FC<Props> = ({ onOpenReceipt }) => {
  const [summary, setSummary] = useState<AnalyticsSummaryDTO | null>(null);
  const [datePreset, setDatePreset] = useState<string>('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Evidence drilldown state
  const [selectedCategory, setSelectedCategory] = useState<CategorySpendingDTO | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorSpendingDTO | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [datePreset, startDate, endDate]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getSummary({
        preset: startDate ? undefined : datePreset,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setSummary(data);
      if (data.categoryBreakdown.length > 0) {
        setSelectedCategory(data.categoryBreakdown[0]);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = api.getExportCsvUrl(startDate || undefined, endDate || undefined);
  };

  const pieData = (summary?.categoryBreakdown || []).slice(0, 7).map((c) => ({
    name: c.categoryName,
    value: c.totalPaise / 100,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#14372c]">
            Spending Analytics &amp; Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#66776e] mt-1">
            Authoritative financial aggregations derived strictly from confirmed kirana records
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#256d53] hover:bg-[#1d5742] text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Export Confirmed CSV
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e5e1d6] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-[#6a7a70] mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#256d53]" /> Period:
          </span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'all', label: 'All Records' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                setDatePreset(preset.id);
                setStartDate('');
                setEndDate('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                datePreset === preset.id && !startDate
                  ? 'bg-[#1b4d3e] text-white shadow-sm'
                  : 'bg-[#f4f1ea] hover:bg-[#eae5d8] text-[#3a4e42]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-[#faf9f5] rounded-lg border border-[#dedad0]"
          />
          <span className="text-[#8a9990]">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-[#faf9f5] rounded-lg border border-[#dedad0]"
          />
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#e5e1d6] shadow-sm">
          <span className="text-xs font-bold text-[#627268] uppercase tracking-wider">
            Total Confirmed Expense
          </span>
          <h2 className="text-3xl font-extrabold text-[#14372c] mt-2">
            {formatINR(summary?.totalSpendingPaise)}
          </h2>
          <p className="text-xs text-[#256d53] font-semibold mt-1">
            From {summary?.confirmedReceiptCount || 0} confirmed bills
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e5e1d6] shadow-sm">
          <span className="text-xs font-bold text-[#627268] uppercase tracking-wider">
            Active Categories
          </span>
          <h2 className="text-3xl font-extrabold text-[#14372c] mt-2">
            {summary?.categoryBreakdown?.length || 0}
          </h2>
          <p className="text-xs text-[#66776e] mt-1">
            Across stock, dairy, snacks &amp; supplies
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e5e1d6] shadow-sm">
          <span className="text-xs font-bold text-[#627268] uppercase tracking-wider">
            Active Suppliers
          </span>
          <h2 className="text-3xl font-extrabold text-[#14372c] mt-2">
            {summary?.vendorBreakdown?.length || 0}
          </h2>
          <p className="text-xs text-[#66776e] mt-1">
            Registered wholesale vendors
          </p>
        </div>
      </div>

      {/* Charts & Evidence Linking Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Table & Bar */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#e5e1d6] shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#14372c]">
              Category-Wise Confirmed Spending
            </h3>
            <p className="text-xs text-[#718177]">
              Click any category to inspect the supporting receipt evidence
            </p>
          </div>

          <div className="space-y-2">
            {summary?.categoryBreakdown.map((cat, idx) => {
              const isSelected = selectedCategory?.categoryId === cat.categoryId;
              const percent = summary.totalSpendingPaise > 0
                ? Math.round((cat.totalPaise / summary.totalSpendingPaise) * 100)
                : 0;

              return (
                <div
                  key={cat.categoryId}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-[#256d53] bg-[#f1f9f4] shadow-sm'
                      : 'border-[#ede9df] bg-[#fcfbf9] hover:bg-[#f6f3eb]'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <p className="text-xs font-bold text-[#17372c] truncate">
                        {cat.categoryName}
                      </p>
                      <span className="text-[10px] text-[#718177]">
                        ({percent}%)
                      </span>
                    </div>
                    <div className="text-[11px] text-[#78887e] mt-1 pl-4">
                      {cat.receiptCount} contributing {cat.receiptCount === 1 ? 'receipt' : 'receipts'}
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <span className="text-xs font-extrabold text-[#1b4d3e]">
                      {formatINR(cat.totalPaise)}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-[#8a9990] transition-transform ${isSelected ? 'rotate-90 text-[#256d53]' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence Supporting Receipts Panel */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#e5e1d6] shadow-sm flex flex-col">
          <div className="mb-4 pb-3 border-b border-[#e5e1d6]">
            <h3 className="text-sm font-bold text-[#14372c]">
              Supporting Evidence for:
            </h3>
            <p className="text-base font-extrabold text-[#256d53]">
              {selectedCategory?.categoryName || 'Select a Category'}
            </p>
            <p className="text-xs text-[#718177] mt-0.5">
              Total {formatINR(selectedCategory?.totalPaise)} across {selectedCategory?.receiptCount || 0} verified bills
            </p>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[420px]">
            {selectedCategory && selectedCategory.receiptIds.length > 0 ? (
              selectedCategory.receiptIds.map((recId) => (
                <div
                  key={recId}
                  onClick={() => onOpenReceipt(recId)}
                  className="p-3 rounded-xl bg-[#faf9f5] border border-[#eeebe2] hover:border-[#256d53] hover:bg-[#f3f9f5] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-[#17372c] flex items-center gap-1.5">
                      <ReceiptIcon className="w-3.5 h-3.5 text-[#256d53]" />
                      Receipt #{recId.slice(-6)}
                    </p>
                    <p className="text-[11px] text-[#78887e] mt-0.5">
                      Click to review source document
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#256d53] group-hover:translate-x-0.5 transition-transform">
                    Inspect <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-[#8a9990]">
                Select a category on the left to see supporting receipts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
