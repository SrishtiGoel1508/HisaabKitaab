import React from 'react';
import { ReceiptStatus, DuplicateStatus } from '../../shared/types/receipt.js';
import { CheckCircle2, AlertTriangle, Clock, Copy } from 'lucide-react';

interface Props {
  status: ReceiptStatus;
  duplicateStatus?: DuplicateStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, duplicateStatus, size = 'md' }) => {
  const isSm = size === 'sm';
  const px = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (duplicateStatus === 'suspected') {
    return (
      <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${px}`}>
        <Copy className="w-3.5 h-3.5" />
        Duplicate Match
      </span>
    );
  }

  switch (status) {
    case 'confirmed':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${px}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Confirmed
        </span>
      );
    case 'needs_review':
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-300 ${px}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Needs Review
        </span>
      );
    case 'draft':
    default:
      return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full bg-stone-100 text-stone-700 border border-stone-300 ${px}`}>
          <Clock className="w-3.5 h-3.5 text-stone-500" />
          Draft
        </span>
      );
  }
};
