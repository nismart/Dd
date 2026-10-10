import React, { useState, useEffect } from 'react';
import {
  Product,
  CategoryThumbnail,
  Banner,
  Customer,
  DeliveryCity,
  CartItem,
  Order,
  PaymentSettings
} from './types';
import { Header } from './components/Header';
import { CityModal } from './components/CityModal';
import { CategoryThumbnails } from './components/CategoryThumbnails';
import { BannerCarousel } from './components/BannerCarousel';
import { ProductCatalog, PriceFilter, SortOption } from './components/ProductCatalog';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistModal } from './components/WishlistModal';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle,
  MapPin,
  Heart,
  Phone
} from 'lucide-react';

export default function App() {
  // Store Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryThumbnail[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    upiId: '7772809503@paytm',
    upiQrImage: '',
    onlinePaymentEnabled: true,
    codFee: 50,
    upiDiscount: 50
  });

  // User & Location Preferences
  const [selectedCity, setSelectedCity] = useState<DeliveryCity>(() => {
    return (localStorage.getItem('niskart_delivery_city') as DeliveryCity) || 'Dewas';
  });

  const [customer, setCustomer] = useState<Customer | null>(null);

  // Cart & Wishlist State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('niskart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistIds, setWishlistIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('niskart_wishlist');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<string | null>(null);
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Modals & Panels
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [unavailableProductId, setUnavailableProductId] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Helper to extract product identifier from location
  const getRequestedProductId = (): string | null => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryId = searchParams.get('product') || searchParams.get('p') || searchParams.get('id');
      if (queryId) return queryId;

      const pathMatch = window.location.pathname.match(/^\/product\/([^/]+)/);
      if (pathMatch) return decodeURIComponent(pathMatch[1]);

      const hash = window.location.hash;
      if (hash.includes('product=')) {
        const hashParams = new URLSearchParams(hash.replace(/^#\/?/, ''));
        return hashParams.get('product');
      } else if (hash.startsWith('#/product/')) {
        return decodeURIComponent(hash.replace('#/product/', ''));
      }
    } catch {}
    return null;
  };

  const handleOpenProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setUnavailableProductId(null);
    try {
      const newUrl = `/?product=${encodeURIComponent(prod.productId)}`;
      window.history.pushState({ productId: prod.productId }, '', newUrl);
    } catch {}
    document.title = `${prod.name} | NisKart – Madhya Pradesh`;
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    setUnavailableProductId(null);
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('product');
      currentUrl.searchParams.delete('p');
      currentUrl.searchParams.delete('id');
      const cleanPath = currentUrl.pathname.startsWith('/product/') ? '/' : currentUrl.pathname;
      const target = `${cleanPath}${currentUrl.search}`;
      window.history.pushState({}, '', target);
    } catch {}
    document.title = 'NisKart – Madhya Pradesh';
  };

  // Mobile Bottom Navigation Tab
  const [mobileTab, setMobileTab] = useState<'home' | 'products' | 'wishlist' | 'cart' | 'account'>('home');

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // Sync city to local storage
  const handleSelectCity = (city: DeliveryCity) => {
    setSelectedCity(city);
    localStorage.setItem('niskart_delivery_city', city);
    showToast(`Delivery city updated to ${city}, MP`);
  };

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('niskart_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist to local storage
  useEffect(() => {
    localStorage.setItem('niskart_wishlist', JSON.stringify(Array.from(wishlistIds)));
  }, [wishlistIds]);

  // Fetch Store Data
  const fetchStoreData = async () => {
    try {
      const res = await fetch('/api/store/data');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setCategories(data.categories || []);
        setBanners(data.banners || []);
        if (data.paymentSettings) {
          setPaymentSettings(data.paymentSettings);
        }
      }
    } catch (err) {
      console.error('Failed to load store data', err);
    }
  };

  // Fetch Authenticated Customer
  const checkCustomerAuth = async () => {
    const token = localStorage.getItem('niskart_customer_token');
    if (!token) return;
    try {
      const res = await fetch('/api/customer/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
      } else {
        localStorage.removeItem('niskart_customer_token');
        setCustomer(null);
      }
    } catch (err) {
      console.error('Auth check error', err);
    }
  };

  useEffect(() => {
    fetchStoreData();
    checkCustomerAuth();
  }, []);

  // Sync on initial load once products are fetched from backend
  useEffect(() => {
    if (products.length > 0) {
      const targetId = getRequestedProductId();
      if (targetId) {
        const clean = targetId.trim().toLowerCase();
        const found = products.find(
          (p) =>
            p.productId.toLowerCase() === clean ||
            p.id.toLowerCase() === clean ||
            p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean
        );
        if (found) {
          setSelectedProduct(found);
          setUnavailableProductId(null);
          document.title = `${found.name} | NisKart – Madhya Pradesh`;
        } else {
          setSelectedProduct(null);
          setUnavailableProductId(targetId);
        }
      }
    }
  }, [products]);

  // Sync with browser back and forward navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      if (products.length === 0) return;
      const targetId = getRequestedProductId();
      if (!targetId) {
        setSelectedProduct(null);
        setUnavailableProductId(null);
        document.title = 'NisKart – Madhya Pradesh';
        return;
      }
      const clean = targetId.trim().toLowerCase();
      const found = products.find(
        (p) =>
          p.productId.toLowerCase() === clean ||
          p.id.toLowerCase() === clean ||
          p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === clean
      );
      if (found) {
        setSelectedProduct(found);
        setUnavailableProductId(null);
        document.title = `${found.name} | NisKart – Madhya Pradesh`;
      } else {
        setSelectedProduct(null);
        setUnavailableProductId(targetId);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added "${product.name}" to cart`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleBuyNow = (product: Product, quantity = 1) => {
    handleAddToCart(product, quantity);
    setIsCheckoutOpen(true);
  };

  // Wishlist toggle
  const handleToggleWishlist = (product: Product) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
        showToast(`Removed from Wishlist`);
      } else {
        next.add(product.id);
        showToast(`Saved to Wishlist`);
      }
      return next;
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  // Customer Login / Logout
  const handleLoginSuccess = (cust: Customer, token: string) => {
    setCustomer(cust);
    localStorage.setItem('niskart_customer_token', token);
    showToast(`Welcome back, ${cust.fullName}!`);
  };

  const handleCustomerLogout = () => {
    const token = localStorage.getItem('niskart_customer_token');
    if (token) {
      fetch('/api/customer/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => {});
    }
    setCustomer(null);
    localStorage.removeItem('niskart_customer_token');
    showToast('Signed out successfully');
  };

  // Handle Order Created
  const handleOrderCreated = (order: Order) => {
    setCart([]);
    localStorage.removeItem('niskart_cart');
    setConfirmedOrder(order);
  };

  // Mobile Bottom Navigation Router
  const handleMobileTabSelect = (tab: 'home' | 'products' | 'wishlist' | 'cart' | 'account') => {
    setMobileTab(tab);
    if (tab === 'home') {
      setSelectedCategoryTag(null);
      setSearchQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tab === 'products') {
      const el = document.getElementById('catalog-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'wishlist') {
      setIsWishlistOpen(true);
    } else if (tab === 'cart') {
      setIsCartOpen(true);
    } else if (tab === 'account') {
      if (customer) {
        setIsOrdersOpen(true);
      } else {
        setIsAuthOpen(true);
      }
    }
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistProducts = products.filter((p) => wishlistIds.has(p.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans antialiased pb-16 md:pb-0">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-60 bg-[#0F172A] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Header Navigation */}
      <Header
        selectedCity={selectedCity}
        onOpenCityModal={() => setIsCityModalOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCustomerOrders={() => setIsOrdersOpen(true)}
        customer={customer}
        onCustomerLogout={handleCustomerLogout}
        wishlistCount={wishlistIds.size}
        cartCount={totalCartCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Custom Category Thumbnails */}
      <CategoryThumbnails
        categories={categories}
        selectedCategoryTag={selectedCategoryTag}
        onSelectCategoryTag={(tag) => {
          setSelectedCategoryTag(tag);
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 3. Promotional Banner Carousel (shown when not searching) */}
      {!searchQuery && (
        <BannerCarousel
          banners={banners}
          onBannerAction={(tag) => {
            if (tag) setSelectedCategoryTag(tag);
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 4. Value Propositions Bar */}
      <section className="max-w-7xl mx-auto px-4 py-4 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2.5 p-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 leading-tight">Express MP Delivery</p>
              <p className="text-[11px] text-slate-500">Dewas, Indore, Bagli, Hatpipliya</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 leading-tight">100% Authentic</p>
              <p className="text-[11px] text-slate-500">Verified Malwa & MP artisans</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 leading-tight">7-Day Easy Return</p>
              <p className="text-[11px] text-slate-500">Hassle-free replacement</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 leading-tight">Dedicated Helpline</p>
              <p className="text-[11px] text-slate-500">Call 7772809503</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Product Catalog & Browsing */}
      <main className="flex-1">
        <ProductCatalog
          products={products}
          selectedCategoryTag={selectedCategoryTag}
          priceFilter={priceFilter}
          onPriceFilterChange={setPriceFilter}
          sortOption={sortOption}
          onSortChange={setSortOption}
          searchQuery={searchQuery}
          onProductClick={(p) => handleOpenProduct(p)}
          onAddToCart={(p) => handleAddToCart(p, 1)}
          onBuyNow={(p) => handleBuyNow(p, 1)}
          onToggleWishlist={handleToggleWishlist}
          wishlistProductIds={wishlistIds}
          onClearFilters={() => {
            setSelectedCategoryTag(null);
            setPriceFilter('all');
            setSearchQuery('');
            setSortOption('default');
          }}
        />
      </main>

      {/* 6. Footer */}
      <footer className="bg-[#0F172A] text-slate-400 text-xs mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#059669] flex items-center justify-center text-white font-bold text-lg">
                N
              </div>
              <span className="font-bold text-lg text-white">NisKart</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Madhya Pradesh&apos;s premier indigenous e-commerce marketplace connecting local craftspersons, handloom weavers, and regional farmers with families across Malwa and beyond.
            </p>
            <div className="flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Registered Hub: Dewas &amp; Indore, MP</span>
            </div>
          </div>

          {/* Supported Locations */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">
              Serving MP Cities
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => handleSelectCity('Dewas')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Dewas, MP (Head Hub)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSelectCity('Indore')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Indore, MP (Metro Hub)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSelectCity('Hatpipliya')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Hatpipliya, MP (Local Hub)
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSelectCity('Bagli')}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Bagli, MP (Farm Hub)
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">
              Customer Support
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a href="tel:7772809503" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call: 7772809503</span>
                </a>
              </li>
              <li>
                <button
                  onClick={() => setIsOrdersOpen(true)}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Track My Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsWishlistOpen(true)}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  My Saved Wishlist
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsAdminOpen(true)}
                  className="hover:text-emerald-400 transition-colors cursor-pointer text-slate-500 hover:text-slate-300"
                >
                  Store Administration
                </button>
              </li>
            </ul>
          </div>

          {/* Payment Guarantee */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">
              Payments &amp; Trust
            </h4>
            <p className="text-slate-400 leading-relaxed">
              We accept UPI (Google Pay, PhonePe, Paytm with instant ₹50 discount) and Cash on Delivery (+₹50) across all covered MP pin codes.
            </p>
            <div className="pt-1">
              <span className="font-mono text-[11px] bg-slate-800 text-emerald-300 px-2.5 py-1 rounded-md border border-slate-700">
                Official UPI: {paymentSettings.upiId}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-footer */}
        <div className="border-t border-slate-800/80 py-4 px-4 text-center text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} NisKart – Madhya Pradesh. All rights reserved. Handcrafted with pride in MP.</p>
        </div>
      </footer>

      {/* 7. Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={mobileTab}
        onSelectTab={handleMobileTabSelect}
        wishlistCount={wishlistIds.size}
        cartCount={totalCartCount}
      />

      {/* 8. Modals & Drawers */}
      <CityModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        onProductClick={(p) => handleOpenProduct(p)}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistProducts={wishlistProducts}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
        onProductClick={(p) => handleOpenProduct(p)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        customer={customer}
        defaultCity={selectedCity}
        paymentSettings={paymentSettings}
        onOrderCreated={handleOrderCreated}
      />

      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewOrders={() => {
          setConfirmedOrder(null);
          setIsOrdersOpen(true);
        }}
      />

      <CustomerOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        customer={customer}
        onLogout={handleCustomerLogout}
        onCustomerUpdated={(c) => setCustomer(c)}
        onProductClick={(productId) => {
          const prod = products.find(
            (p) => p.productId.toLowerCase() === productId.toLowerCase() || p.id.toLowerCase() === productId.toLowerCase()
          );
          if (prod) handleOpenProduct(prod);
        }}
      />

      <ProductDetailsModal
        product={selectedProduct}
        unavailableId={unavailableProductId}
        onClose={handleCloseProduct}
        selectedCity={selectedCity}
        allProducts={products}
        onAddToCart={(p, q) => handleAddToCart(p, q)}
        onBuyNow={(p, q) => handleBuyNow(p, q)}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={selectedProduct ? wishlistIds.has(selectedProduct.id) : false}
        onSelectRelated={(p) => handleOpenProduct(p)}
        onSelectCategory={(tag) => {
          setSelectedCategoryTag(tag);
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataModified={fetchStoreData}
      />
    </div>
  );
}
