import React, { useState } from 'react';
import { Product, DeliveryCity } from '../types';
import { formatINR, FALLBACK_PRODUCT_IMAGE } from '../utils';
import {
  X,
  Heart,
  ShoppingBag,
  Zap,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowLeft,
  Share2,
  Check,
  PackageX
} from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product | null;
  unavailableId?: string | null;
  onClose: () => void;
  selectedCity: DeliveryCity;
  allProducts: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onSelectRelated: (product: Product) => void;
  onSelectCategory?: (categoryTag: string) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  unavailableId,
  onClose,
  selectedCity,
  allProducts,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  onSelectRelated,
  onSelectCategory
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  // If neither product nor unavailableId is present, don't show modal
  if (!product && !unavailableId) return null;

  // Handle unavailable product state
  if (!product && unavailableId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-6 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
            <PackageX className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Product Currently Unavailable</h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
              We could not find an active item for <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">"{unavailableId}"</span>. It might be currently out of stock, unlisted, or the link may have expired.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Browse Available Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe non-null assertion since checked above
  const currentProduct = product!;

  const handleShare = () => {
    const url = `${window.location.origin}/?product=${encodeURIComponent(currentProduct.productId)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  const gallery = currentProduct.images && currentProduct.images.length > 0
    ? currentProduct.images
    : [currentProduct.mainImage || FALLBACK_PRODUCT_IMAGE];

  const currentImage = gallery[selectedImageIndex] || currentProduct.mainImage || FALLBACK_PRODUCT_IMAGE;

  const hasDiscount = currentProduct.originalPrice > currentProduct.sellingPrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentProduct.originalPrice - currentProduct.sellingPrice) / currentProduct.originalPrice) * 100)
    : 0;

  const relatedProducts = allProducts
    .filter((p) => p.categoryTag === currentProduct.categoryTag && p.id !== currentProduct.id)
    .slice(0, 4);

  const specs = currentProduct.specifications || {
    'Origin': 'Madhya Pradesh, India',
    'Authenticity': '100% Certified Regional Artisan Produce',
    'Category': currentProduct.categoryTag.replace(/-/g, ' ').toUpperCase()
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 my-auto max-h-[94vh] flex flex-col relative">
        {/* Top bar with Breadcrumbs, Share & Close */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-slate-500 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catalog</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-slate-500 font-semibold">{currentProduct.productId}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 bg-white hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Copy product link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold text-[11px]">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[11px]">Share</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Close product details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Details Body */}
        <div className="overflow-y-auto p-4 sm:p-7 flex-1 space-y-6 pb-24 md:pb-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Left: Image Gallery */}
            <div className="space-y-3 sm:space-y-4">
              <div className="aspect-square bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-3 sm:p-4 relative group">
                <img
                  src={currentImage}
                  alt={currentProduct.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                  }}
                  className="w-full h-full object-contain max-h-[380px] transition-transform duration-300 group-hover:scale-105"
                />

                {hasDiscount && (
                  <span className="absolute top-3 left-3 bg-emerald-700 text-white text-xs font-bold px-2.5 py-0.5 rounded-md shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 rounded-xl border p-1 bg-slate-50 overflow-hidden shrink-0 cursor-pointer transition-all ${
                        selectedImageIndex === idx
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img
                        src={img}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Purchase & Product Details */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                {/* Category & Wishlist */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (onSelectCategory) {
                        onSelectCategory(currentProduct.categoryTag);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="capitalize">{currentProduct.categoryTag.replace(/-/g, ' ')}</span>
                  </button>

                  <button
                    onClick={() => onToggleWishlist(currentProduct)}
                    className={`p-2 rounded-full border transition-all cursor-pointer ${
                      isWishlisted
                        ? 'bg-rose-50 border-rose-200 text-rose-500'
                        : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50'
                    }`}
                    title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Title & SKU */}
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 mt-2 leading-snug">
                  {currentProduct.name}
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Product SKU: {currentProduct.productId}</p>

                {/* Price block */}
                <div className="mt-3.5 flex items-baseline gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {formatINR(currentProduct.sellingPrice)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xs sm:text-sm text-slate-400 line-through">
                        {formatINR(currentProduct.originalPrice)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        Save {discountPercent}%
                      </span>
                    </>
                  )}
                </div>

                {/* Stock Status */}
                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  {currentProduct.isAvailable ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>In Stock · Ready for Immediate Dispatch</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold text-rose-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Currently Out of Stock · Restocking Soon</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="mt-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    About this Product
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {currentProduct.description}
                  </p>
                </div>

                {/* Specifications Grid */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Product Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(specs).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">{key}</span>
                        <span className="text-slate-800 font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Delivering to {selectedCity}, Madhya Pradesh</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Express 24-48 hours delivery directly from local warehouse</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>7 Days replacement guarantee for damaged or defective items</span>
                  </div>
                </div>
              </div>

              {/* Quantity Selector & CTAs (Desktop / Tablet) */}
              <div className="pt-4 border-t border-slate-100 space-y-3 hidden md:block">
                {currentProduct.isAvailable ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          disabled={quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-slate-900 min-w-8 text-center bg-white">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity((q) => q + 1)}
                          className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => onAddToCart(currentProduct, quantity)}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        onClick={() => {
                          onBuyNow(currentProduct, quantity);
                          onClose();
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-colors cursor-pointer"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-600">
                    This product is currently out of stock. Please check back soon or browse related items below.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3">
                Related Products from Madhya Pradesh
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      onSelectRelated(rel);
                      setSelectedImageIndex(0);
                      setQuantity(1);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-white cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden p-1 flex items-center justify-center">
                      <img
                        src={rel.mainImage || FALLBACK_PRODUCT_IMAGE}
                        alt={rel.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-xs font-semibold text-slate-800 truncate mt-1.5">
                      {rel.name}
                    </p>
                    <p className="text-xs font-bold text-emerald-700">
                      {formatINR(rel.sellingPrice)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="md:hidden absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3 shadow-lg flex items-center justify-between gap-2 z-20">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-2 py-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2.5 py-1.5 text-xs font-bold text-slate-900 min-w-7 text-center bg-white">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-2 py-1.5 text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => onAddToCart(currentProduct, quantity)}
              disabled={!currentProduct.isAvailable}
              className="flex-1 py-2.5 px-2 bg-slate-100 hover:bg-emerald-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Cart</span>
            </button>

            <button
              onClick={() => {
                onBuyNow(currentProduct, quantity);
                onClose();
              }}
              disabled={!currentProduct.isAvailable}
              className="flex-1 py-2.5 px-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
