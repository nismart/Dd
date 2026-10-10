import React from 'react';
import { Product } from '../types';
import { formatINR, FALLBACK_PRODUCT_IMAGE } from '../utils';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistProducts: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistProducts,
  onRemoveFromWishlist,
  onAddToCart,
  onProductClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#0F172A] text-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-400 fill-current" />
            <h3 className="font-bold text-base">Your Wishlist</h3>
            <span className="text-xs bg-rose-500/80 text-white font-semibold px-2 py-0.5 rounded-full">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 flex-1 divide-y divide-slate-100">
          {wishlistProducts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-400 mx-auto flex items-center justify-center">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No items in your wishlist yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Tap the heart icon on any product to save your favorite MP handlooms, snacks, and essentials.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            wishlistProducts.map((prod) => (
              <div key={prod.id} className="py-3.5 flex items-center gap-3.5 first:pt-0">
                <div
                  onClick={() => {
                    onProductClick(prod);
                    onClose();
                  }}
                  className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 p-1 flex items-center justify-center cursor-pointer"
                >
                  <img
                    src={prod.mainImage || FALLBACK_PRODUCT_IMAGE}
                    alt={prod.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    onClick={() => {
                      onProductClick(prod);
                      onClose();
                    }}
                    className="text-xs font-bold text-slate-900 truncate hover:text-emerald-700 cursor-pointer"
                  >
                    {prod.name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400">{prod.productId}</p>
                  <p className="text-xs font-bold text-emerald-800 mt-0.5">
                    {formatINR(prod.sellingPrice)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onAddToCart(prod);
                      onRemoveFromWishlist(prod.id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="Move to Cart"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>To Cart</span>
                  </button>

                  <button
                    onClick={() => onRemoveFromWishlist(prod.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
