import React from 'react';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'home' | 'products' | 'wishlist' | 'cart' | 'account';
  onSelectTab: (tab: 'home' | 'products' | 'wishlist' | 'cart' | 'account') => void;
  wishlistCount: number;
  cartCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  wishlistCount,
  cartCount
}) => {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="grid grid-cols-5 h-14">
        {/* Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'home' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Products */}
        <button
          onClick={() => onSelectTab('products')}
          className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'products' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span className="text-[10px]">Products</span>
        </button>

        {/* Wishlist */}
        <button
          onClick={() => onSelectTab('wishlist')}
          className={`relative flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'wishlist' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <Heart className="w-4 h-4" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Wishlist</span>
        </button>

        {/* Cart */}
        <button
          onClick={() => onSelectTab('cart')}
          className={`relative flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'cart' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Cart</span>
        </button>

        {/* Account / Orders */}
        <button
          onClick={() => onSelectTab('account')}
          className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'account' ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span className="text-[10px]">Account</span>
        </button>
      </div>
    </div>
  );
};
