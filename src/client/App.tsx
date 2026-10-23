import React, { useState, useEffect } from 'react';
import { CategoryDTO, ReceiptDTO } from '../shared/types/receipt.js';
import { api } from './services/api.js';
import { Navbar } from './components/Navbar.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ReceiptsPage } from './pages/ReceiptsPage.js';
import { UploadPage } from './pages/UploadPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { AskAIPage } from './pages/AskAIPage.js';
import { CategoriesPage } from './pages/CategoriesPage.js';
import { ReceiptDetailModal } from './components/ReceiptDetailModal.js';
import { X } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleOpenReceipt = (id: string) => {
    setActiveReceiptId(id);
  };

  const handleCloseReceipt = () => {
    setActiveReceiptId(null);
  };

  const handleReceiptUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUploadSuccess = (receipt: ReceiptDTO) => {
    setIsUploadModalOpen(false);
    setActiveReceiptId(receipt.id);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#1c2e26] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Sticky Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        openUploadModal={() => setIsUploadModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardPage
            key={refreshTrigger}
            onOpenReceipt={handleOpenReceipt}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
            categories={categories}
          />
        )}

        {currentTab === 'receipts' && (
          <ReceiptsPage
            key={refreshTrigger}
            onOpenReceipt={handleOpenReceipt}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            categories={categories}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsPage
            key={refreshTrigger}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {currentTab === 'ask-ai' && (
          <AskAIPage
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {currentTab === 'categories' && (
          <CategoriesPage categories={categories} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f2eb] border-t border-[#e2ddd1] py-6 text-center text-xs text-[#707f76]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-semibold text-[#18392e]">
            Hisaab Kitaab — Kirana Store AI Bookkeeping
          </div>
          <div>
            Built with Google Gen AI SDK • Cloud Run Ready • Deterministic Financial Truth
          </div>
        </div>
      </footer>

      {/* Receipt Detail & Edit Modal */}
      {activeReceiptId && (
        <ReceiptDetailModal
          receiptId={activeReceiptId}
          onClose={handleCloseReceipt}
          onReceiptUpdated={handleReceiptUpdated}
          categories={categories}
        />
      )}

      {/* Upload Receipt Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#fcfbf9] rounded-2xl shadow-2xl border border-[#dedad0] max-w-xl w-full p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#66756c] hover:bg-[#eae5d8]"
            >
              <X className="w-5 h-5" />
            </button>
            <UploadPage
              onUploadSuccess={handleUploadSuccess}
              onCancel={() => setIsUploadModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
