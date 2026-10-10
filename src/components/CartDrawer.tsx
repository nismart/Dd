import React from 'react';
import { CartItem, Product } from '../types';
import { formatINR, FALLBACK_PRODUCT_IMAGE } from '../utils';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  onProductClick?: (product: Product) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onProductClick
}) => {
  if (!isOpen) return null;

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const baseSubtotal = items.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#0F172A] text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Your Cart</h3>
            <span className="text-xs bg-emerald-700/80 text-white font-semibold px-2 py-0.5 rounded-full">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close cart drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-base">Your shopping cart is empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Discover authentic handlooms, freshly ground spices, and snacks from Madhya Pradesh.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Browse Products
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div key={product.id} className="py-4 flex gap-3.5 first:pt-0">
                {/* Product Thumbnail */}
                <div
                  onClick={() => {
                    if (onProductClick) {
                      onProductClick(product);
                      onClose();
                    }
                  }}
                  className="w-18 h-18 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 p-1 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors"
                >
                  <img
                    src={product.mainImage || FALLBACK_PRODUCT_IMAGE}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4
                        onClick={() => {
                          if (onProductClick) {
                            onProductClick(product);
                            onClose();
                          }
                        }}
                        className="text-xs font-bold text-slate-900 line-clamp-1 leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
                      >
                        {product.name}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">{product.productId}</p>
                    </div>
                    <button
                      onClick={() => onRemoveItem(product.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {/* Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        disabled={quantity <= 1}
                        title="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-bold text-slate-800 min-w-6 text-center bg-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">
                        {formatINR(product.sellingPrice * quantity)}
                      </span>
                      {quantity > 1 && (
                        <p className="text-[10px] text-slate-400">
                          {formatINR(product.sellingPrice)} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/70 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-semibold text-slate-900">{formatINR(baseSubtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                <span>Payment Discounts Available:</span>
                <span className="font-bold">₹50 OFF on UPI</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                <span>Cash On Delivery: +₹50 · Standard Delivery in MP</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Verified Local Madhya Pradesh Sellers</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
