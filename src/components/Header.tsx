import React from 'react';
import {
  MapPin,
  Phone,
  Shield,
  Search,
  X,
  User,
  Heart,
  ShoppingBag,
  ChevronDown
} from 'lucide-react';
import { DeliveryCity, Customer } from '../types';

interface HeaderProps {
  selectedCity: DeliveryCity;
  onOpenCityModal: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
  onOpenCustomerOrders: () => void;
  customer: Customer | null;
  onCustomerLogout: () => void;
  wishlistCount: number;
  cartCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCity,
  onOpenCityModal,
  onOpenAdmin,
  onOpenAuth,
  onOpenWishlist,
  onOpenCart,
  onOpenCustomerOrders,
  customer,
  onCustomerLogout,
  wishlistCount,
  cartCount,
  searchQuery,
  onSearchChange
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-xs">
      {/* 1. Top Delivery & Support Bar */}
      <div className="bg-[#0F172A] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* City Selector */}
          <button
            onClick={onOpenCityModal}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group"
            title="Change Delivery City"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Deliver to:</span>
            <span className="font-semibold text-white group-hover:underline">
              {selectedCity}, MP
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white" />
          </button>

          {/* Right items: Support & Admin */}
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="tel:7772809503"
              className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors"
              title="Call Customer Support"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline text-slate-400">Support:</span>
              <span className="font-medium text-white">7772809503</span>
            </a>

            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer bg-slate-800/80 px-2.5 py-1 rounded-sm border border-slate-700/60"
              title="Administrator Dashboard"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium">Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4 md:gap-8">
        {/* Brand Logo */}
        <a href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-md bg-[#059669] flex items-center justify-center text-white font-bold text-xl shadow-xs group-hover:bg-[#047857] transition-colors">
            N
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-bold text-xl tracking-tight text-[#0F172A]">
                NisKart
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                MP
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Madhya Pradesh</p>
          </div>
        </a>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by name, ID (e.g. NISU-101) or description..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all shadow-2xs placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Actions: Account, Wishlist, Cart */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Customer Profile / Login */}
          {customer ? (
            <div className="relative group">
              <button
                onClick={onOpenCustomerOrders}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                title="My Account & Orders"
              >
                <User className="w-4 h-4 text-emerald-600" />
                <span className="max-w-[90px] truncate">{customer.fullName}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-lg transition-colors cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="relative p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-lg transition-colors cursor-pointer"
            title="Saved Wishlist"
            aria-label="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Cart */}
          <button
            onClick={onOpenCart}
            className="relative flex items-center gap-2 bg-[#059669] hover:bg-[#047857] text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            title="Shopping Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-white text-emerald-700 text-xs font-extrabold px-1.5 py-0.2 rounded-full min-w-5 text-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Mobile Dedicated Search Bar */}
      <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products or NISU-101..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
