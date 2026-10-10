import React from 'react';
import { Product } from '../types';
import { formatINR, FALLBACK_PRODUCT_IMAGE } from '../utils';
import { Heart, ShoppingBag, Zap, Eye, Filter, ArrowUpDown, PackageOpen } from 'lucide-react';

export type PriceFilter = 'all' | 'under-500' | '500-1000' | 'above-1000';
export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'popular';

interface ProductCatalogProps {
  products: Product[];
  selectedCategoryTag: string | null;
  priceFilter: PriceFilter;
  onPriceFilterChange: (f: PriceFilter) => void;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  searchQuery: string;
  onProductClick: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistProductIds: Set<string>;
  onClearFilters: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategoryTag,
  priceFilter,
  onPriceFilterChange,
  sortOption,
  onSortChange,
  searchQuery,
  onProductClick,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  wishlistProductIds,
  onClearFilters
}) => {
  // Filter by category
  let filtered = products.filter((p) => {
    if (selectedCategoryTag && p.categoryTag !== selectedCategoryTag) {
      return false;
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const specValues = p.specifications ? Object.values(p.specifications).join(' ').toLowerCase() : '';
      const specKeys = p.specifications ? Object.keys(p.specifications).join(' ').toLowerCase() : '';
      const matchName = p.name.toLowerCase().includes(q);
      const matchId = p.productId.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCategory = p.categoryTag.toLowerCase().includes(q);
      const matchSpecs = specValues.includes(q) || specKeys.includes(q);
      
      // Also match each space-separated search token if multiple words are provided
      const tokens = q.split(/\s+/).filter(Boolean);
      const fullSearchCorpus = `${p.name} ${p.productId} ${p.categoryTag} ${p.description} ${specValues}`.toLowerCase();
      const matchAllTokens = tokens.length > 1 && tokens.every((tok) => fullSearchCorpus.includes(tok));

      if (!matchName && !matchId && !matchDesc && !matchCategory && !matchSpecs && !matchAllTokens) {
        return false;
      }
    }
    // Price filter
    if (priceFilter === 'under-500' && p.sellingPrice >= 500) return false;
    if (priceFilter === '500-1000' && (p.sellingPrice < 500 || p.sellingPrice > 1000)) return false;
    if (priceFilter === 'above-1000' && p.sellingPrice <= 1000) return false;

    return true;
  });

  // Sorting
  if (sortOption === 'price-asc') {
    filtered = [...filtered].sort((a, b) => a.sellingPrice - b.sellingPrice);
  } else if (sortOption === 'price-desc') {
    filtered = [...filtered].sort((a, b) => b.sellingPrice - a.sellingPrice);
  } else if (sortOption === 'popular') {
    // Sort by largest discount savings or ID
    filtered = [...filtered].sort((a, b) => {
      const discA = a.originalPrice - a.sellingPrice;
      const discB = b.originalPrice - b.sellingPrice;
      return discB - discA;
    });
  }

  return (
    <section id="catalog-section" className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* Controls Bar: Price Filter & Sorting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            <span>Explore Products</span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authentic goods sourced directly from artisan hubs & trusted suppliers in Madhya Pradesh
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Price Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
            <span className="text-slate-500 px-2 flex items-center gap-1 hidden sm:flex">
              <Filter className="w-3.5 h-3.5" /> Price:
            </span>
            <button
              onClick={() => onPriceFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                priceFilter === 'all'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => onPriceFilterChange('under-500')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                priceFilter === 'under-500'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              &lt; ₹500
            </button>
            <button
              onClick={() => onPriceFilterChange('500-1000')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                priceFilter === '500-1000'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ₹500–₹1,000
            </button>
            <button
              onClick={() => onPriceFilterChange('above-1000')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                priceFilter === 'above-1000'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              &gt; ₹1,000
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent font-medium text-slate-900 focus:outline-hidden cursor-pointer"
            >
              <option value="default">Featured / Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="popular">Best Value (Discount)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 mt-6 p-8">
          <PackageOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No products match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, price filter, or category selection.
          </p>
          <button
            onClick={onClearFilters}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
          {filtered.map((prod) => {
            const hasDiscount = prod.originalPrice > prod.sellingPrice;
            const discountPercent = hasDiscount
              ? Math.round(((prod.originalPrice - prod.sellingPrice) / prod.originalPrice) * 100)
              : 0;
            const isWishlisted = wishlistProductIds.has(prod.id);

            return (
              <div
                key={prod.id}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col overflow-hidden relative"
              >
                {/* Image Container */}
                <div
                  onClick={() => onProductClick(prod)}
                  className="relative aspect-4/3 sm:aspect-square bg-slate-50 overflow-hidden cursor-pointer flex items-center justify-center p-3"
                >
                  <img
                    src={prod.mainImage || FALLBACK_PRODUCT_IMAGE}
                    alt={prod.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                    }}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Discount Badge */}
                  {hasDiscount && (
                    <span className="absolute top-2.5 left-2.5 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      {discountPercent}% OFF
                    </span>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(prod);
                    }}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer ${
                      isWishlisted
                        ? 'bg-rose-50 text-rose-500 shadow-xs'
                        : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white shadow-2xs'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  {/* Quick View Overlay on hover for desktop */}
                  <div className="absolute inset-x-0 bottom-2 px-3 hidden sm:flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Eye className="w-3.5 h-3.5" /> Quick View
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Product ID & Stock */}
                    <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 mb-1">
                      <span className="font-mono font-medium text-slate-500">{prod.productId}</span>
                      <span className="text-emerald-700 font-medium">In Stock</span>
                    </div>

                    {/* Product Name */}
                    <h3
                      onClick={() => onProductClick(prod)}
                      className="font-semibold text-xs sm:text-sm text-slate-900 line-clamp-2 hover:text-emerald-700 transition-colors cursor-pointer leading-snug"
                      title={prod.name}
                    >
                      {prod.name}
                    </h3>
                  </div>

                  {/* Price & Action Buttons */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {formatINR(prod.sellingPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatINR(prod.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart & Buy Now Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onAddToCart(prod)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                        title="Add to Shopping Cart"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add</span>
                      </button>

                      <button
                        onClick={() => onBuyNow(prod)}
                        className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                        title="Buy Now and Checkout"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Buy</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
