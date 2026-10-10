import React from 'react';
import { CategoryThumbnail } from '../types';
import { Sparkles, Layers, X } from 'lucide-react';
import { FALLBACK_PRODUCT_IMAGE } from '../utils';

interface CategoryThumbnailsProps {
  categories: CategoryThumbnail[];
  selectedCategoryTag: string | null;
  onSelectCategoryTag: (tag: string | null) => void;
}

export const CategoryThumbnails: React.FC<CategoryThumbnailsProps> = ({
  categories,
  selectedCategoryTag,
  onSelectCategoryTag
}) => {
  return (
    <div className="w-full bg-white border-b border-slate-100 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Shop By Category</span>
          </div>
          {selectedCategoryTag && (
            <button
              onClick={() => onSelectCategoryTag(null)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear Filter</span>
            </button>
          )}
        </div>

        {/* Horizontally scrollable container */}
        <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-none pt-1">
          {/* "All" button */}
          <button
            onClick={() => onSelectCategoryTag(null)}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-hidden"
          >
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all ${
                selectedCategoryTag === null
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500 ring-offset-2'
                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium text-center whitespace-nowrap ${
                selectedCategoryTag === null
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-600 group-hover:text-slate-900'
              }`}
            >
              All Items
            </span>
          </button>

          {/* Categories */}
          {categories.map((cat) => {
            const isSelected = selectedCategoryTag === cat.tag;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategoryTag(isSelected ? null : cat.tag)}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-hidden"
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-100 transition-all ${
                    isSelected
                      ? 'ring-2 ring-emerald-600 ring-offset-2 shadow-md'
                      : 'border border-slate-200 group-hover:border-emerald-400 group-hover:shadow-xs'
                  }`}
                >
                  <img
                    src={cat.image || FALLBACK_PRODUCT_IMAGE}
                    alt={cat.title}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span
                  className={`text-xs font-medium text-center whitespace-nowrap ${
                    isSelected
                      ? 'text-emerald-700 font-bold'
                      : 'text-slate-700 group-hover:text-emerald-700'
                  }`}
                >
                  {cat.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
