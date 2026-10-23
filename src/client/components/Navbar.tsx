import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Upload,
  BarChart3,
  BotMessageSquare,
  Tags,
  Download,
  Store,
  Menu,
  X,
} from 'lucide-react';
import { api } from '../services/api.js';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  openUploadModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, openUploadModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'receipts', label: 'Receipts', icon: Receipt },
    { id: 'analytics', label: 'Spending Analytics', icon: BarChart3 },
    { id: 'ask-ai', label: 'Ask Hisaab Kitaab', icon: BotMessageSquare, badge: 'AI' },
    { id: 'categories', label: 'Categories', icon: Tags },
  ];

  const handleExportCsv = () => {
    window.location.href = api.getExportCsvUrl();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#fdfcf9] border-b border-[#e6e2d8] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1b4d3e] to-[#256d53] flex items-center justify-center text-white shadow-md shadow-[#1b4d3e]/20 group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#14372c] block">
                  Hisaab <span className="text-[#3ba97f]">Kitaab</span>
                </span>
                <span className="text-xs text-[#6e7771] block font-medium -mt-1">
                  Gupta Kirana &amp; General Store
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1b4d3e] text-white shadow-sm shadow-[#1b4d3e]/20'
                      : 'text-[#3e4f46] hover:bg-[#f1eee5] hover:text-[#18392e]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                        isActive
                          ? 'bg-[#3ba97f] text-white'
                          : 'bg-[#e2f4eb] text-[#1b4d3e]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              title="Export all confirmed bookkeeping records to CSV"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#2f483c] bg-[#f2eee3] hover:bg-[#e8e2d4] border border-[#dcd4c3] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={openUploadModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#256d53] hover:bg-[#1d5742] shadow-sm shadow-[#256d53]/25 transition-all hover:scale-[1.02]"
            >
              <Upload className="w-4 h-4" />
              Upload Receipt
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={openUploadModal}
              className="p-2 rounded-lg bg-[#256d53] text-white"
              title="Upload Receipt"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#2f483c] hover:bg-[#f2eee3]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-[#e6e2d8] bg-[#fbf9f4] space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive
                    ? 'bg-[#1b4d3e] text-white'
                    : 'text-[#2f483c] hover:bg-[#f0ece1]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#e2f4eb] text-[#1b4d3e]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2">
            <button
              onClick={handleExportCsv}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#2f483c] bg-[#ede7d8] border border-[#d6cdb9]"
            >
              <Download className="w-3.5 h-3.5" />
              Export Confirmed Book to CSV
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
