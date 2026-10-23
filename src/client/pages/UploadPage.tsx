import React, { useState, useRef } from 'react';
import { api } from '../services/api.js';
import { ReceiptDTO } from '../../shared/types/receipt.js';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Camera,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

interface Props {
  onUploadSuccess: (receipt: ReceiptDTO) => void;
  onCancel?: () => void;
}

export const UploadPage: React.FC<Props> = ({ onUploadSuccess, onCancel }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    setWarningMsg(null);

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'image/jpg',
    ];
    if (!allowedMimes.includes(file.type.toLowerCase()) && !file.name.endsWith('.svg')) {
      setErrorMsg(
        `Unsupported file format: ${file.name}. Please upload a photograph (JPEG, PNG, WebP) or PDF receipt.`
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg(`File size exceeds 10MB limit: ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setErrorMsg(null);
    setWarningMsg(null);

    try {
      setUploadStep('1/3: Securing file & computing SHA-256 hash...');
      await new Promise((r) => setTimeout(r, 400));

      setUploadStep('2/3: Digitizing with Gemini AI (extracting items, vendor, prices)...');
      const response = await api.uploadReceipt(selectedFile);

      setUploadStep('3/3: Running bookkeeping validation & duplicate detection...');
      await new Promise((r) => setTimeout(r, 400));

      if (response.warning) {
        setWarningMsg(response.warning);
      }

      onUploadSuccess(response.receipt);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload and process receipt');
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#14372c]">
          Upload Kirana Purchase Bill
        </h1>
        <p className="text-xs sm:text-sm text-[#66776e] mt-1">
          Upload a paper receipt, supplier invoice, or PDF. Gemini will extract all line items, tax, and totals automatically.
        </p>
      </div>

      {/* Main Drag-and-Drop Card */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
          dragActive
            ? 'border-[#256d53] bg-[#e6f7ef]'
            : 'border-[#dedad0] bg-white hover:border-[#256d53]/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#e6f7ef] flex items-center justify-center text-[#256d53] shadow-inner">
            <Upload className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#14372c]">
              Drag &amp; drop your bill here
            </h3>
            <p className="text-xs text-[#718177] mt-1">
              Supports JPEG, PNG, WebP photographs, and PDF invoices up to 10MB
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl bg-[#256d53] hover:bg-[#1d5742] text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
            >
              Browse Files
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl bg-[#f4f1ea] hover:bg-[#eae5d8] text-[#33463b] text-xs sm:text-sm font-bold border border-[#d8d3c5] transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4 text-[#256d53]" />
              Camera / Photo
            </button>
          </div>
        </div>
      </div>

      {/* Selected File Card */}
      {selectedFile && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e5e1d6] shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#e2efe8] text-[#1b4d3e] flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-[#14372c] truncate">
                {selectedFile.name}
              </h4>
              <p className="text-xs text-[#718177]">
                {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'image'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUploadAndProcess}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#256d53] hover:bg-[#1d5742] text-white text-xs sm:text-sm font-extrabold shadow-md transition-all disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Digitize Receipt
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Box */}
      {uploading && (
        <div className="bg-[#f0f9f4] rounded-2xl p-5 border border-[#bfe7d3] space-y-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs font-bold text-[#1b4d3e]">
            <Sparkles className="w-4 h-4 text-[#3ba97f] animate-pulse" />
            AI Receipt Processing Workflow
          </div>
          <div className="w-full bg-[#dbeee4] h-2 rounded-full overflow-hidden">
            <div className="bg-[#256d53] h-full w-2/3 animate-pulse rounded-full" />
          </div>
          <p className="text-xs text-[#2c6e54] font-medium">{uploadStep}</p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="bg-red-50 rounded-2xl p-4 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Upload Failed</p>
            <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Warning note */}
      {warningMsg && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-amber-800 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Manual Review Required</p>
            <p className="text-xs text-amber-700 mt-0.5">{warningMsg}</p>
          </div>
        </div>
      )}

      {/* Bookkeeping Assurance Card */}
      <div className="p-4 rounded-xl bg-[#f7f5ed] border border-[#e4ded0] text-xs text-[#55635a] flex items-center gap-3">
        <CheckCircle2 className="w-4 h-4 text-[#256d53] flex-shrink-0" />
        <span>
          <strong>Backend owns financial truth:</strong> Gemini extracts values as suggestions. Nothing is added to official accounting totals until you explicitly review and confirm.
        </span>
      </div>
    </div>
  );
};
