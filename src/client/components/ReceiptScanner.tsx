// src/components/ReceiptScanner.tsx
import React, { useState, useRef } from "react";
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import { ExtractedReceipt, ReceiptItem, uploadReceiptImage } from "../services/receiptService";

interface ReceiptScannerProps {
  onSaveEntry?: (data: ExtractedReceipt) => void;
  onClose?: () => void;
}

type ScanStep = "idle" | "preview" | "uploading" | "review";

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onSaveEntry, onClose }) => {
  const [step, setStep] = useState<ScanStep>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Extracted data state (editable by the store owner)
  const [receiptData, setReceiptData] = useState<ExtractedReceipt | null>(null);

  // Hidden file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handle image capture/selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage(null);
    setStep("preview");
  };

  // Reset to retake
  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setStep("idle");

    // Clear input values to allow re-selecting same file if needed
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  // Upload to backend
  const handleUsePhoto = async () => {
    if (!selectedFile) return;

    setStep("uploading");
    setErrorMessage(null);

    try {
      const data = await uploadReceiptImage(selectedFile);
      setReceiptData(data);
      setStep("review");
    } catch (err: any) {
      console.error("Receipt upload error:", err);
      setErrorMessage(err.message || "रसीद पढ़ने में समस्या हुई। कृपया दोबारा प्रयास करें।");
      setStep("preview");
    }
  };

  // Helper to edit review items
  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    if (!receiptData) return;
    const updatedItems = [...receiptData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setReceiptData({ ...receiptData, items: updatedItems });
  };

  const handleAddItem = () => {
    if (!receiptData) return;
    setReceiptData({
      ...receiptData,
      items: [...receiptData.items, { name: "", quantity: 1, price: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!receiptData) return;
    const updatedItems = receiptData.items.filter((_, i) => i !== index);
    setReceiptData({ ...receiptData, items: updatedItems });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-sm sm:p-4">
      <div className="relative flex flex-col h-full w-full max-w-lg mx-auto bg-white sm:rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-200" />
            <h2 className="font-semibold text-lg tracking-wide">
              {step === "review" ? "पर्ची विवरण (Review Entry)" : "रसीद स्कैन करें (Scan Receipt)"}
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-emerald-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Hidden File Inputs */}
        {/* 1. Camera Input (environment triggers rear camera on mobile) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        {/* 2. Gallery Input */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Error Notification */}
        {errorMessage && (
          <div className="m-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* STEP 1: IDLE / SELECTION */}
          {step === "idle" && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-2 space-y-6">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                <Camera className="w-12 h-12" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-800">पर्ची या बिल का फोटो लें</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                  Take a clear photo of the bill or handwritten slip to record in HisaabKitaab.
                </p>
              </div>

              <div className="w-full space-y-3 pt-4">
                {/* Primary Button: Open Camera */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-md flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-base"
                >
                  <Camera className="w-5 h-5" />
                  कैमरा खोलें (Take Photo)
                </button>

                {/* Secondary Button: Gallery Fallback */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  गैलरी से चुनें (Choose from Gallery)
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW PHOTO */}
          {step === "preview" && previewUrl && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 relative bg-black/5 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center min-h-[300px]">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <p className="text-xs text-center text-slate-500">
                सुनिश्चित करें कि सभी आइटम और कुल राशि स्पष्ट दिखाई दे रहे हैं।
              </p>

              {/* Action Buttons: Retake vs Use Photo */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="py-3 px-4 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  दोबारा लें (Retake)
                </button>

                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  आगे बढ़ें (Use Photo)
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: LOADING STATE */}
          {step === "uploading" && (
            <div className="flex flex-col items-center justify-center h-full py-16 space-y-4 text-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-800">रसीद पढ़ी जा रही है...</h4>
                <p className="text-sm text-slate-500 mt-1">Reading receipt details, please wait...</p>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW EXTRACTED INFORMATION */}
          {step === "review" && receiptData && (
            <div className="space-y-4 text-slate-800 pb-2">
              
              {/* Warnings for unclear fields or arithmetic inconsistency */}
              {receiptData.unclear_fields && receiptData.unclear_fields.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    कृपया ध्यान दें (Check Highlighted Info):
                  </div>
                  {receiptData.unclear_fields.includes("arithmetic_inconsistency") && (
                    <p>• पर्ची के जोड़ (Total) और आइटम के दामों में अंतर है। कृपया कुल राशि जांच लें।</p>
                  )}
                  {receiptData.unclear_fields.filter(f => f !== "arithmetic_inconsistency").map((f) => (
                    <p key={f}>• <strong>{f}</strong> स्पष्ट नहीं पढ़ा जा सका, कृपया मैन्युअल भरें।</p>
                  ))}
                </div>
              )}

              {/* Vendor & Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">दुकान / पार्टी (Vendor)</label>
                  <input
                    type="text"
                    value={receiptData.vendor || ""}
                    placeholder="दुकान का नाम"
                    onChange={(e) => setReceiptData({ ...receiptData, vendor: e.target.value })}
                    className="w-full text-sm font-medium p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">तारीख (Date)</label>
                  <input
                    type="text"
                    value={receiptData.date || ""}
                    placeholder="DD/MM/YYYY"
                    onChange={(e) => setReceiptData({ ...receiptData, date: e.target.value })}
                    className="w-full text-sm font-medium p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-600">सामान सूची (Items)</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> आइटम जोड़ें
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  <div className="grid grid-cols-12 text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-2 border-b border-slate-200">
                    <span className="col-span-6">आइटम (Name)</span>
                    <span className="col-span-2 text-center">मात्रा</span>
                    <span className="col-span-3 text-right">दर (₹)</span>
                    <span className="col-span-1"></span>
                  </div>

                  <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                    {receiptData.items?.length > 0 ? (
                      receiptData.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-1 items-center px-3 py-2 text-sm bg-white">
                          <input
                            type="text"
                            value={item.name}
                            placeholder="Item name"
                            onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                            className="col-span-6 p-1 border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded text-xs font-medium focus:outline-none"
                          />
                          <input
                            type="number"
                            value={item.quantity || 1}
                            min="1"
                            onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                            className="col-span-2 text-center p-1 border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded text-xs font-medium focus:outline-none"
                          />
                          <input
                            type="number"
                            value={item.price || 0}
                            onChange={(e) => handleItemChange(idx, "price", parseFloat(e.target.value) || 0)}
                            className="col-span-3 text-right p-1 border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded text-xs font-medium focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="col-span-1 flex justify-center text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400">कोई सामान सूची नहीं मिली</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total & Category Box */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="block text-[11px] font-medium text-emerald-800">श्रेणी (Category)</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
                    {receiptData.category || "Food"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="block text-xs font-semibold text-emerald-900">कुल राशि (Total Amount)</span>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-base font-bold text-slate-800">₹</span>
                    <input
                      type="number"
                      step="any"
                      value={receiptData.total !== null ? receiptData.total : ""}
                      onChange={(e) =>
                        setReceiptData({
                          ...receiptData,
                          total: e.target.value === "" ? null : parseFloat(e.target.value)
                        })
                      }
                      className="w-28 text-right font-bold text-lg text-emerald-900 bg-white border border-emerald-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="py-3 px-4 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm"
                >
                  रद्द करें (Discard)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onSaveEntry && receiptData) {
                      onSaveEntry(receiptData);
                    }
                    if (onClose) onClose();
                  }}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  खाता में जोड़ें (Save)
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};