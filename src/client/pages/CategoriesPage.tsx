import React from 'react';
import { CategoryDTO } from '../../shared/types/receipt.js';
import { Tags, ShieldCheck, Sparkles } from 'lucide-react';

interface Props {
  categories: CategoryDTO[];
}

export const CategoriesPage: React.FC<Props> = ({ categories }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e2f4eb] text-xs font-bold text-[#1b4d3e] mb-2">
          <Tags className="w-3.5 h-3.5 text-[#256d53]" />
          Standard Kirana Tax &amp; Expense Taxonomy
        </div>
        <h1 className="text-2xl font-extrabold text-[#14372c]">
          Bookkeeping Categories
        </h1>
        <p className="text-xs sm:text-sm text-[#66776e] mt-1">
          Pre-seeded categories tailored to Indian grocery stores, FMCG distributors, and neighborhood retailers. Gemini suggests assignments and you can adjust them anytime.
        </p>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-2xl p-5 border border-[#e5e1d6] shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-8 h-8 rounded-lg bg-[#eef7f2] text-[#256d53] flex items-center justify-center font-bold text-xs">
                  <Tags className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono text-[#8a9990]">
                  ID: {cat.id.slice(-6)}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#14372c]">
                {cat.name}
              </h3>
              <p className="text-xs text-[#6e7f75] mt-1 leading-relaxed">
                {cat.description || 'Kirana store expense category'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#f0ece1] flex items-center justify-between text-[11px] text-[#718177]">
              <span>Active in Bookkeeping</span>
              <span className="text-[#256d53] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Validated
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
