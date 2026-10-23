import React, { useState, useEffect } from 'react';
import {
  AnalyticsSummaryDTO,
  ReceiptDTO,
  CategoryDTO,
} from '../../shared/types/receipt.js';
import { api } from '../services/api.js';
import { formatINR, formatDate } from '../utils/formatters.js';
import { StatusBadge } from '../components/StatusBadge.js';
import {
  IndianRupee,
  Receipt as ReceiptIcon,
  AlertCircle,
  Copy,
  ArrowUpRight,
  Upload,
  Calendar,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
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

interface Props {
  onOpenReceipt: (id: string) => void;
  onOpenUpload: () => void;
  onNavigateToTab: (tab: string) => void;
  categories: CategoryDTO[];
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

export const DashboardPage: React.FC<Props> = ({
  onOpenReceipt,
  onOpenUpload,
  onNavigateToTab,
}) => {
  const [summary, setSummary] = useState<AnalyticsSummaryDTO | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptDTO[]>([]);
  const [datePreset, setDatePreset] = useState<string>('this_month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [datePreset]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sumData, recData] = await Promise.all([
        api.getSummary({ preset: datePreset }),
        api.getReceipts({ limit: 6 }),
      ]);
      setSummary(sumData);
      setRecentReceipts(recData.items);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const categoryChartData = (summary?.categoryBreakdown || []).slice(0, 6).map((cat) => ({
    name: cat.categoryName,
    amount: (cat.totalPaise / 100),
    formatted: formatINR(cat.totalPaise),
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-[#1b4d3e] to-[#256d53] rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-[#1b4d3e]/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#a3f3cb]" />
            Kirana AI Bookkeeping Engine Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gupta Kirana &amp; General Store
          </h1>
          <p className="text-sm text-[#c8e6d8] mt-1.5 max-w-xl">
            Digitise purchase receipts instantly with Gemini AI. Keep authoritative, verified books in Indian Rupees without spreadsheet hassles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateToTab('ask-ai')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 backdrop-blur-sm transition-all"
          >
            Ask Hisaab Kitaab
            <ArrowUpRight className="w-4 h-4 text-[#a3f3cb]" />
          </button>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e1f7ec] hover:bg-white text-[#14372c] text-xs sm:text-sm font-extrabold shadow-md transition-all hover:scale-105"
          >
            <Upload className="w-4 h-4 text-[#256d53]" />
            Upload New Bill
          </button>
        </div>
      </div>

      {/* Date Range Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f6f3eb] p-2.5 rounded-xl border border-[#e4dfd3]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#516358] px-2">
          <Calendar className="w-4 h-4 text-[#256d53]" />
          Accounting Period:
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month (October)' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'all', label: 'All Records' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setDatePreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                datePreset === preset.id
                  ? 'bg-[#1b4d3e] text-white shadow-sm'
                  : 'bg-white hover:bg-[#eae5d8] text-[#33463b] border border-[#d8d3c5]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Confirmed Spending */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5e1d6] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#627268] uppercase tracking-wider">
              Confirmed Spending
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#e3f4eb] flex items-center justify-center text-[#256d53]">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#14372c]">
              {formatINR(summary?.totalSpendingPaise)}
            </h3>
            <p className="text-xs text-[#718177] mt-1">
              Verified from {summary?.confirmedReceiptCount || 0} confirmed {summary?.confirmedReceiptCount === 1 ? 'receipt' : 'receipts'}
            </p>
          </div>
        </div>

        {/* Confirmed Receipts Count */}
        <div className="bg-white rounded-2xl p-5 border border-[#e5e1d6] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#627268] uppercase tracking-wider">
              Confirmed Bills
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#e1f7ec] flex items-center justify-center text-[#2c8965]">
              <ReceiptIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-[#14372c]">
              {summary?.confirmedReceiptCount || 0}
            </h3>
            <p className="text-xs text-[#2c8965] font-semibold mt-1">
              100% Traceable bookkeeping truth
            </p>
          </div>
        </div>

        {/* Needs Review Count */}
        <div
          onClick={() => onNavigateToTab('receipts')}
          className="bg-white rounded-2xl p-5 border border-[#e5e1d6] shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-amber-400 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#627268] uppercase tracking-wider">
              Needs Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-amber-800">
              {summary?.needsReviewCount || 0}
            </h3>
            <p className="text-xs text-amber-700 mt-1 flex items-center gap-1 font-medium">
              Missing date, blurry or discrepancy <ArrowUpRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>

        {/* Possible Duplicate Alerts */}
        <div
          onClick={() => onNavigateToTab('receipts')}
          className="bg-white rounded-2xl p-5 border border-[#e5e1d6] shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-orange-400 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#627268] uppercase tracking-wider">
              Duplicate Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 group-hover:scale-110 transition-transform">
              <Copy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-orange-800">
              {summary?.duplicateCount || 0}
            </h3>
            <p className="text-xs text-orange-700 mt-1 flex items-center gap-1 font-medium">
              Exact hash or matching bills <ArrowUpRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spending by Category Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#e5e1d6] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#14372c]">
                Confirmed Spending by Category
              </h3>
              <p className="text-xs text-[#718177]">
                Calculated strictly from verified line items in confirmed receipts
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('analytics')}
              className="text-xs font-bold text-[#256d53] hover:underline flex items-center gap-1"
            >
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#627268' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#627268' }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Amount']}
                    contentStyle={{ backgroundColor: '#fcfcf9', borderRadius: 8, borderColor: '#dedad0', fontSize: 12 }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-[#718177]">
              <ReceiptIcon className="w-12 h-12 text-[#cfcbbe] mb-2" />
              <p className="font-semibold text-sm">No confirmed spending records for this period</p>
              <p className="text-xs text-[#9aa7a0] mt-1">Confirm draft receipts to populate official category metrics</p>
            </div>
          )}
        </div>

        {/* Top Vendors Quick Summary */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#e5e1d6] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#14372c]">
                Top Suppliers &amp; Wholesalers
              </h3>
              <p className="text-xs text-[#718177]">
                By confirmed purchase volume
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {(summary?.vendorBreakdown || []).slice(0, 5).map((vendor, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#faf9f5] border border-[#eeebe2] flex items-center justify-between hover:bg-[#f3f0e6] transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-[#17372c] truncate">
                    {vendor.vendorName}
                  </p>
                  <p className="text-[11px] text-[#78887e]">
                    {vendor.receiptCount} {vendor.receiptCount === 1 ? 'bill' : 'bills'}
                  </p>
                </div>
                <span className="text-xs font-extrabold text-[#1b4d3e]">
                  {formatINR(vendor.totalPaise)}
                </span>
              </div>
            ))}

            {(!summary?.vendorBreakdown || summary.vendorBreakdown.length === 0) && (
              <div className="flex-1 flex items-center justify-center text-xs text-[#8a9990]">
                No vendor records found for this period.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Receipt Activity Table */}
      <div className="bg-white rounded-2xl p-6 border border-[#e5e1d6] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#14372c]">
              Recent Receipt Activity
            </h3>
            <p className="text-xs text-[#718177]">
              Click on any receipt to review, edit line items, or confirm
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('receipts')}
            className="text-xs font-bold text-[#256d53] hover:underline flex items-center gap-1"
          >
            View All ({recentReceipts.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7f5ed] border-y border-[#e5e1d6] text-[#55655b]">
              <tr>
                <th className="py-3 px-4 font-semibold">Vendor / Supplier</th>
                <th className="py-3 px-4 font-semibold">Receipt Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Items</th>
                <th className="py-3 px-4 font-semibold text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eeeae1]">
              {recentReceipts.map((rec) => (
                <tr
                  key={rec.id}
                  onClick={() => onOpenReceipt(rec.id)}
                  className="hover:bg-[#fbf9f4] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-[#1b3d30]">
                    {rec.vendorName || (
                      <span className="text-amber-700 italic">[Vendor Missing]</span>
                    )}
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
                  <td className="py-3 px-4 font-extrabold text-[#1b4d3e] text-right">
                    {formatINR(rec.totalAmountPaise)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReceipt(rec.id);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-[#ede8dc] hover:bg-[#ded7c8] text-[#293d32]"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
