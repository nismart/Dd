import React, { useState, useEffect } from 'react';
import {
  Product,
  CategoryThumbnail,
  Banner,
  Order,
  PaymentSettings,
  OrderStatus,
  PaymentVerificationStatus
} from '../../types';
import { formatINR, FALLBACK_PRODUCT_IMAGE } from '../../utils';
import {
  Shield,
  X,
  Package,
  Layers,
  Image as ImageIcon,
  CreditCard,
  Mail,
  Search,
  Plus,
  Trash2,
  Edit,
  Check,
  CheckCircle,
  AlertCircle,
  Clock,
  Truck,
  XCircle,
  Upload,
  RefreshCw,
  LogOut,
  Send,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onDataModified: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onDataModified
}) => {
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem('niskart_admin_token')
  );
  const [passcode, setPasscode] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active admin tab
  const [activeTab, setActiveTab] = useState<
    'orders' | 'products' | 'thumbnails' | 'banners' | 'payments' | 'email'
  >('orders');

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
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

  // Email Settings state
  const [targetEmail, setTargetEmail] = useState('nishaldamor08@gmail.com');
  const [web3FormsKey, setWeb3FormsKey] = useState('');
  const [showWeb3Key, setShowWeb3Key] = useState(false);
  const [emailSaveLoading, setEmailSaveLoading] = useState(false);
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<any>({
    configured: false,
    targetEmail: 'nishaldamor08@gmail.com',
    lastStatus: '',
    lastTestSuccess: true
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search in orders / products
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Modals for add/edit product
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Modals for add/edit category thumbnail
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryThumbnail> | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Modals for add/edit banner
  const [editingBanner, setEditingBanner] = useState<Partial<Banner> | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  // Check auth and load data
  useEffect(() => {
    if (adminToken && isOpen) {
      loadAllAdminData();
    }
  }, [adminToken, isOpen]);

  const loadAllAdminData = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      const [resOrders, resProducts, resCats, resBans, resPayments, resEmailSettings] = await Promise.all([
        fetch('/api/admin/orders', { headers }),
        fetch('/api/admin/products', { headers }),
        fetch('/api/admin/categories', { headers }),
        fetch('/api/admin/banners', { headers }),
        fetch('/api/admin/payment-settings', { headers }),
        fetch('/api/admin/email/settings', { headers })
      ]);

      if (resOrders.status === 401) {
        handleLogout();
        return;
      }

      if (resOrders.ok) setOrders(await resOrders.json());
      if (resProducts.ok) setProducts(await resProducts.json());
      if (resCats.ok) setCategories(await resCats.json());
      if (resBans.ok) setBanners(await resBans.json());
      if (resPayments.ok) setPaymentSettings(await resPayments.json());
      if (resEmailSettings.ok) {
        const data = await resEmailSettings.json();
        setTargetEmail(data.targetEmail || 'nishaldamor08@gmail.com');
        setWeb3FormsKey(data.web3FormsKey || '');
        setEmailStatus(data);
      }
    } catch (err) {
      console.error('Error loading admin data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error('Invalid credentials.');
      }
      setAdminToken(data.token);
      localStorage.setItem('niskart_admin_token', data.token);
      setPasscode('');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    setAdminToken(null);
    localStorage.removeItem('niskart_admin_token');
  };

  // Status updates for orders
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
        setMessage({ type: 'success', text: `Order status updated to "${status}"` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update order status' });
    }
  };

  const handleUpdatePaymentStatus = async (
    orderId: string,
    paymentVerificationStatus: PaymentVerificationStatus
  ) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ paymentVerificationStatus })
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentVerificationStatus } : o))
        );
        setMessage({
          type: 'success',
          text: `Payment verification updated to "${paymentVerificationStatus}"`
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update payment status' });
    }
  };

  // Retry order email notification
  const handleRetryOrderEmail = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/retry-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Email dispatched: ${data.message}` });
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, emailNotificationSent: true, emailNotificationError: undefined } : o))
        );
      } else {
        setMessage({ type: 'error', text: `Email failed: ${data.message}` });
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, emailNotificationSent: false, emailNotificationError: data.message } : o))
        );
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to retry order email' });
    }
  };

  // Save Email Settings
  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaveLoading(true);
    try {
      const res = await fetch('/api/admin/email/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ targetEmail, web3FormsKey })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Email settings saved successfully.' });
        setEmailStatus(data.settings);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save email settings.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save email settings' });
    } finally {
      setEmailSaveLoading(false);
    }
  };

  // Test Email
  const handleTestEmail = async () => {
    setEmailTestLoading(true);
    try {
      const res = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message || 'Email test failed' });
      }
      if (data.status) {
        setEmailStatus(data.status);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Email test request failed' });
    } finally {
      setEmailTestLoading(false);
    }
  };

  // Image Upload Helper
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, onUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64Data })
        });
        const data = await res.json();
        if (res.ok && data.url) {
          onUrl(data.url);
        } else {
          alert(data.error || 'Upload failed');
        }
      } catch (err) {
        alert('Upload failed due to network error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const isEdit = Boolean(editingProduct.id);
      const url = isEdit ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(editingProduct)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadAllAdminData();
      onDataModified();
      setMessage({ type: 'success', text: isEdit ? 'Product updated successfully' : 'Product created successfully' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteProduct = async (prodId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete product "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/products/${prodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== prodId));
        onDataModified();
        setMessage({ type: 'success', text: `Product "${name}" deleted` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete product' });
    }
  };

  // Save Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const isEdit = Boolean(editingCategory.id);
      const url = isEdit ? `/api/admin/categories/${editingCategory.id}` : '/api/admin/categories';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(editingCategory)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save thumbnail');

      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      loadAllAdminData();
      onDataModified();
      setMessage({ type: 'success', text: isEdit ? 'Category updated' : 'Category added' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteCategory = async (id: string, title: string) => {
    if (!confirm(`Delete category thumbnail "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        onDataModified();
        setMessage({ type: 'success', text: `Category "${title}" removed` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete category' });
    }
  };

  // Save Banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    try {
      const isEdit = Boolean(editingBanner.id);
      const url = isEdit ? `/api/admin/banners/${editingBanner.id}` : '/api/admin/banners';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(editingBanner)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save banner');

      setIsBannerModalOpen(false);
      setEditingBanner(null);
      loadAllAdminData();
      onDataModified();
      setMessage({ type: 'success', text: isEdit ? 'Banner updated' : 'Banner added' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteBanner = async (id: string, title: string) => {
    if (!confirm(`Delete banner "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        setBanners((prev) => prev.filter((b) => b.id !== id));
        onDataModified();
        setMessage({ type: 'success', text: `Banner deleted` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete banner' });
    }
  };

  // Save Payment Settings
  const handleSavePayments = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/payment-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(paymentSettings)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Payment settings updated successfully' });
        onDataModified();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update payment settings' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">NisKart Admin Panel</h2>
              <p className="text-xs text-slate-400">Madhya Pradesh E-Commerce Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {adminToken && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100'
                : 'bg-rose-50 text-rose-800 border-b border-rose-100'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Unauthenticated View: Strictly Password-Only Login */}
        {!adminToken ? (
          <div className="p-8 sm:p-14 flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-4">
            <form onSubmit={handleAdminLogin} className="w-full space-y-3">
              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              <input
                type="password"
                required
                autoFocus
                placeholder="Password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 text-center tracking-widest font-mono"
              />

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Login</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard View */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Tabs Bar */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-bold rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Orders ({orders.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-bold rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Products ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('thumbnails')}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'thumbnails'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-bold rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Thumbnails ({categories.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('banners')}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'banners'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-bold rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Banners ({banners.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'payments'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-bold rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Settings</span>
              </button>

              <button
                onClick={() => setActiveTab('email')}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'email'
                    ? 'border-emerald-600 text-emerald-800 bg-white font-bold rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email Notifications</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by order #, phone, name..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <button
                      onClick={loadAllAdminData}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 bg-white">
                    {orders
                      .filter((o) => {
                        if (!orderSearch) return true;
                        const q = orderSearch.toLowerCase();
                        return (
                          o.orderNumber.toLowerCase().includes(q) ||
                          o.customerName.toLowerCase().includes(q) ||
                          o.mobile.includes(q) ||
                          o.city.toLowerCase().includes(q)
                        );
                      })
                      .map((ord) => (
                        <div key={ord.id} className="p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded-sm">
                                  {ord.orderNumber}
                                </span>
                                <span className="font-bold text-xs text-slate-900">
                                  {ord.customerName} ({ord.mobile})
                                </span>
                                {ord.email && (
                                  <span className="text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                                    {ord.email}
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-500">
                                  · {ord.city}, MP
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Address: {ord.houseDetails}, {ord.roadArea} ({ord.pincode})
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Order Status Select */}
                              <select
                                value={ord.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                                }
                                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 cursor-pointer"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-wrap gap-2 text-xs">
                            {ord.items.map((it, i) => (
                              <span key={i} className="bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-700">
                                {it.name} × <strong>{it.quantity}</strong> ({formatINR(it.price * it.quantity)})
                              </span>
                            ))}
                          </div>

                          {/* Payment & Amount bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs border-t border-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>
                                Mode: <strong>{ord.paymentMethod}</strong>
                              </span>
                              {ord.upiRef && (
                                <span className="font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-sm border border-emerald-100">
                                  UTR: {ord.upiRef}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-sm font-semibold ${
                                  ord.paymentVerificationStatus === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : ord.paymentVerificationStatus === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ord.paymentVerificationStatus}
                              </span>

                              {/* Verify / Reject buttons for UPI */}
                              {ord.paymentMethod === 'UPI' && (
                                <div className="flex items-center gap-1 ml-2">
                                  <button
                                    onClick={() => handleUpdatePaymentStatus(ord.id, 'VERIFIED')}
                                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleUpdatePaymentStatus(ord.id, 'REJECTED')}
                                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}

                              {/* Email alert status and retry */}
                              <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-2">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold ${
                                    ord.emailNotificationSent
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {ord.emailNotificationSent ? 'Alert Dispatched' : 'Alert Pending'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRetryOrderEmail(ord.id)}
                                  className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-sm font-medium cursor-pointer flex items-center gap-1"
                                  title="Resend order email notification"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>Resend</span>
                                </button>
                              </div>
                            </div>

                            <div className="font-bold text-sm text-slate-900">
                              Total: <span className="text-emerald-700">{formatINR(ord.finalAmount)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* TAB 2: PRODUCTS */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search product name or ID..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setEditingProduct({
                          productId: `NISU-${Math.floor(100 + Math.random() * 900)}`,
                          name: '',
                          description: '',
                          sellingPrice: 499,
                          originalPrice: 799,
                          categoryTag: 'handloom-sarees',
                          isAvailable: true,
                          mainImage: '/src/assets/images/niskart_hero_banner_1791567763130.jpg',
                          images: ['/src/assets/images/niskart_hero_banner_1791567763130.jpg']
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  {/* Products Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                          <tr>
                            <th className="p-3">Image</th>
                            <th className="p-3">Code</th>
                            <th className="p-3">Product Name</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Selling Price</th>
                            <th className="p-3">Original</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {products
                            .filter((p) => {
                              if (!productSearch) return true;
                              const q = productSearch.toLowerCase();
                              return p.name.toLowerCase().includes(q) || p.productId.toLowerCase().includes(q);
                            })
                            .map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/70">
                                <td className="p-3">
                                  <img
                                    src={p.mainImage || FALLBACK_PRODUCT_IMAGE}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5"
                                  />
                                </td>
                                <td className="p-3 font-mono font-bold text-slate-700">{p.productId}</td>
                                <td className="p-3 font-semibold text-slate-900 max-w-[200px] truncate">
                                  {p.name}
                                </td>
                                <td className="p-3 text-slate-500">{p.categoryTag}</td>
                                <td className="p-3 font-bold text-emerald-800">{formatINR(p.sellingPrice)}</td>
                                <td className="p-3 text-slate-400 line-through">{formatINR(p.originalPrice)}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      p.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {p.isAvailable ? 'Available' : 'Out of Stock'}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1">
                                  <button
                                    onClick={() => {
                                      setEditingProduct({ ...p });
                                      setIsProductModalOpen(true);
                                    }}
                                    className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                    title="Edit Product"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: THUMBNAILS */}
              {activeTab === 'thumbnails' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Manage circular category thumbnails shown on the NisKart homepage.
                    </p>
                    <button
                      onClick={() => {
                        setEditingCategory({
                          title: '',
                          tag: '',
                          image: '/src/assets/images/niskart_hero_banner_1791567763130.jpg',
                          displayOrder: categories.length + 1
                        });
                        setIsCategoryModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Thumbnail</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {categories.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2 text-center">
                        <div className="w-16 h-16 rounded-full overflow-hidden mx-auto bg-slate-50 border border-slate-200">
                          <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{c.title}</h4>
                          <p className="text-[11px] font-mono text-slate-400">Tag: {c.tag}</p>
                          <p className="text-[10px] text-slate-500">Order: {c.displayOrder}</p>
                        </div>
                        <div className="flex justify-center gap-1 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => {
                              setEditingCategory({ ...c });
                              setIsCategoryModalOpen(true);
                            }}
                            className="p-1 text-slate-600 hover:text-emerald-700 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(c.id, c.title)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: BANNERS */}
              {activeTab === 'banners' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Manage promotional carousel banners displayed to shoppers.
                    </p>
                    <button
                      onClick={() => {
                        setEditingBanner({
                          title: '',
                          subtitle: '',
                          badge: 'Special Offer',
                          image: '/src/assets/images/niskart_hero_banner_1791567763130.jpg',
                          displayOrder: banners.length + 1,
                          ctaText: 'Shop Now'
                        });
                        setIsBannerModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Banner</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {banners.map((b) => (
                      <div key={b.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                        <div className="h-28 overflow-hidden bg-slate-900 relative">
                          <img src={b.image} alt={b.title} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end text-white">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase">{b.badge}</span>
                            <h4 className="font-bold text-xs truncate">{b.title}</h4>
                          </div>
                        </div>
                        <div className="p-3 flex items-center justify-between text-xs">
                          <div>
                            <p className="text-slate-500 text-[11px] truncate max-w-xs">{b.subtitle}</p>
                            <span className="text-[10px] text-slate-400">Order: {b.displayOrder} · Tag: {b.tag || 'None'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingBanner({ ...b });
                                setIsBannerModalOpen(true);
                              }}
                              className="p-1 text-slate-600 hover:text-emerald-700 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBanner(b.id, b.title)}
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: PAYMENT SETTINGS */}
              {activeTab === 'payments' && (
                <form onSubmit={handleSavePayments} className="max-w-xl space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">UPI Payment Configuration</h4>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Merchant UPI ID (Default: 7772809503@paytm)
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentSettings.upiId}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, upiId: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Custom UPI QR Code Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Leave empty to use automatic high-res QR generation"
                        value={paymentSettings.upiQrImage}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, upiQrImage: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 text-sm">Fees & Discounts</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          COD Handling Fee (₹)
                        </label>
                        <input
                          type="number"
                          value={paymentSettings.codFee}
                          onChange={(e) =>
                            setPaymentSettings({
                              ...paymentSettings,
                              codFee: Number(e.target.value)
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          UPI Discount (₹)
                        </label>
                        <input
                          type="number"
                          value={paymentSettings.upiDiscount}
                          onChange={(e) =>
                            setPaymentSettings({
                              ...paymentSettings,
                              upiDiscount: Number(e.target.value)
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="enableOnline"
                        checked={paymentSettings.onlinePaymentEnabled}
                        onChange={(e) =>
                          setPaymentSettings({
                            ...paymentSettings,
                            onlinePaymentEnabled: e.target.checked
                          })
                        }
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <label htmlFor="enableOnline" className="font-semibold text-slate-800 cursor-pointer">
                        Enable Online Payments (UPI and Card gateways)
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Save Payment Settings
                  </button>
                </form>
              )}

              {/* TAB 6: EMAIL SETTINGS */}
              {activeTab === 'email' && (
                <div className="max-w-xl space-y-5 text-xs">
                  <form onSubmit={handleSaveEmailSettings} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="border-b border-slate-200 pb-3">
                      <h4 className="font-bold text-slate-900 text-sm">Order Notification & Web3Forms Settings</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Configure Web3Forms Access Key and recipient email for automatic order notifications.
                      </p>
                    </div>

                    {/* Notification Email */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Notification Recipient Email (Default: nishaldamor08@gmail.com)
                      </label>
                      <input
                        type="email"
                        required
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-600 font-medium"
                      />
                    </div>

                    {/* Web3Forms Access Key */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">
                          Web3Forms Access Key
                        </label>
                        <a
                          href="https://docs.web3forms.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-700 hover:underline"
                        >
                          docs.web3forms.com
                        </a>
                      </div>
                      <div className="relative">
                        <input
                          type={showWeb3Key ? 'text' : 'password'}
                          placeholder="e.g. 1a2b3c4d-5e6f-7g8h-9i0j-..."
                          value={web3FormsKey}
                          onChange={(e) => setWeb3FormsKey(e.target.value)}
                          className="w-full pl-3 pr-10 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-emerald-600 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowWeb3Key(!showWeb3Key)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                          title={showWeb3Key ? 'Hide Access Key' : 'Show Access Key'}
                        >
                          {showWeb3Key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Status & Test result */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Email Integration Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            web3FormsKey
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {web3FormsKey ? 'Configured & Active' : 'Missing Web3Forms Key'}
                        </span>
                      </div>
                      {emailStatus?.lastStatus && (
                        <div className="text-slate-600 border-t border-slate-100 pt-1.5">
                          <span className="text-slate-400">Status Info: </span>
                          <span className="font-medium">{emailStatus.lastStatus}</span>
                        </div>
                      )}
                      {emailStatus?.lastTestedAt && (
                        <div className="text-slate-400 text-[10px]">
                          Last Tested: {new Date(emailStatus.lastTestedAt).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={emailSaveLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {emailSaveLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Email Settings</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={emailTestLoading}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {emailTestLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Test Email Configuration</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingProduct.id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setIsProductModalOpen(false)} className="cursor-pointer text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Product ID (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.productId || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, productId: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category Tag *</label>
                  <select
                    value={editingProduct.categoryTag || 'handloom-sarees'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, categoryTag: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.tag}>
                        {c.title} ({c.tag})
                      </option>
                    ))}
                    <option value="handloom-sarees">Handloom Sarees</option>
                    <option value="namkeen-snacks">Namkeen & Snacks</option>
                    <option value="spices-grains">Spices & Grains</option>
                    <option value="daily-essentials">Daily Essentials</option>
                    <option value="handicrafts">Handicrafts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.sellingPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Main Image URL or Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingProduct.mainImage || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, mainImage: e.target.value })}
                    className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                    placeholder="URL or use upload button"
                  />
                  <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadFile(e, (url) => setEditingProduct({ ...editingProduct, mainImage: url }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={editingProduct.isAvailable !== false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isAvailable: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="inStockCheck" className="font-semibold text-slate-800">
                  Mark Product as Available in Stock
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2">
              {editingCategory.id ? 'Edit Category Thumbnail' : 'Add Category Thumbnail'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.title || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category Tag (e.g. namkeen-snacks) *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.tag || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, tag: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Display Order</label>
                <input
                  type="number"
                  value={editingCategory.displayOrder || 1}
                  onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Image URL or Upload</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingCategory.image || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })}
                    className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                  />
                  <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadFile(e, (url) => setEditingCategory({ ...editingCategory, image: url }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Thumbnail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b pb-2">
              {editingBanner.id ? 'Edit Banner' : 'Add Banner'}
            </h3>
            <form onSubmit={handleSaveBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={editingBanner.title || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Subtitle</label>
                <input
                  type="text"
                  value={editingBanner.subtitle || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Badge Text (e.g. Festive Special)</label>
                <input
                  type="text"
                  value={editingBanner.badge || ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Image URL or Upload *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={editingBanner.image || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                    className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                  />
                  <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-lg cursor-pointer flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleUploadFile(e, (url) => setEditingBanner({ ...editingBanner, image: url }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editingBanner.displayOrder || 1}
                    onChange={(e) => setEditingBanner({ ...editingBanner, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category Tag Link</label>
                  <input
                    type="text"
                    value={editingBanner.tag || ''}
                    onChange={(e) => setEditingBanner({ ...editingBanner, tag: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    placeholder="e.g. namkeen-snacks"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 border rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
