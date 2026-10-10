import React, { useState, useEffect } from 'react';
import { Customer, Order } from '../types';
import { formatINR } from '../utils';
import {
  X,
  RefreshCw,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  LogOut,
  Mail,
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onLogout: () => void;
  onProductClick?: (productId: string) => void;
  onCustomerUpdated?: (customer: Customer) => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  customer,
  onLogout,
  onProductClick,
  onCustomerUpdated
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Email verification state
  const [emailInput, setEmailInput] = useState(customer?.email || '');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyStep, setVerifyStep] = useState<'idle' | 'code-sent'>('idle');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('niskart_customer_token');
      const res = await fetch('/api/customer/orders', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch customer orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      fetchOrders();
      setEmailInput(customer.email || '');
      setVerifyStep('idle');
      setVerifyError(null);
      setVerifySuccess(null);
    }
  }, [isOpen, customer]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifySuccess(null);

    const cleanEmail = emailInput.trim();
    if (!cleanEmail) {
      setVerifyError('Please enter your email address.');
      return;
    }

    setVerifyLoading(true);
    try {
      const token = localStorage.getItem('niskart_customer_token');
      const res = await fetch('/api/customer/email/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      setVerifyStep('code-sent');
      setVerifySuccess(data.message || `Verification code sent to ${cleanEmail}`);
    } catch (err: any) {
      setVerifyError(err.message || 'Error sending verification code.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifySuccess(null);

    const cleanCode = verifyCode.trim();
    if (!cleanCode) {
      setVerifyError('Please enter the 6-digit verification code.');
      return;
    }

    setVerifyLoading(true);
    try {
      const token = localStorage.getItem('niskart_customer_token');
      const res = await fetch('/api/customer/email/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: cleanCode })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired verification code.');
      }
      setVerifySuccess('Email verified successfully!');
      setVerifyStep('idle');
      setVerifyCode('');
      if (data.customer && onCustomerUpdated) {
        onCustomerUpdated(data.customer);
      }
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed.');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Confirmed':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Confirmed
          </span>
        );
      case 'Shipped':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <Truck className="w-3 h-3" /> Out for Delivery
          </span>
        );
      case 'Delivered':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" /> Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#0F172A] text-white">
          <div>
            <h3 className="font-bold text-base leading-tight">Customer Account & Orders</h3>
            {customer && (
              <p className="text-xs text-slate-400 mt-0.5">
                {customer.fullName} · {customer.mobile}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Email Verification Banner / Panel */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          {customer?.isEmailVerified ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-xl p-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-900">Verified Email Address</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 font-mono mt-0.5">{customer.email}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">Email Verification</span>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Unverified
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Verify your email to receive automatic order receipts, tracking notifications, and delivery invoices.
              </p>

              {verifyError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                  <span>{verifyError}</span>
                </div>
              )}

              {verifySuccess && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{verifySuccess}</span>
                </div>
              )}

              {verifyStep === 'idle' ? (
                <form onSubmit={handleSendCode} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-emerald-600 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={verifyLoading}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {verifyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Send Code</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      className="w-36 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:border-emerald-600 font-mono tracking-widest text-center font-bold"
                    />
                    <button
                      type="submit"
                      disabled={verifyLoading}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {verifyLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Verify Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerifyStep('idle')}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-5 flex-1 divide-y divide-slate-100">
          {orders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Package className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No orders found</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                You haven&apos;t placed any orders with this phone number yet.
              </p>
            </div>
          ) : (
            orders.map((ord) => (
              <div key={ord.id} className="py-4 first:pt-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {ord.orderNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {getStatusBadge(ord.status)}
                </div>

                {/* Items preview */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700">
                      <span
                        onClick={() => {
                          if (onProductClick && it.productId) {
                            onProductClick(it.productId);
                            onClose();
                          }
                        }}
                        className={`truncate max-w-[280px] ${
                          onProductClick ? 'cursor-pointer hover:text-emerald-700 font-medium' : ''
                        }`}
                        title="Click to view product details"
                      >
                        {it.name} (x{it.quantity})
                      </span>
                      <span className="font-medium text-slate-900 shrink-0 ml-2">
                        {formatINR(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="text-slate-500">
                    <span>Paid via: <strong className="text-slate-700">{ord.paymentMethod}</strong></span>
                    {ord.paymentVerificationStatus === 'PENDING_VERIFICATION' && (
                      <span className="text-amber-600 ml-1.5">(Verification Pending)</span>
                    )}
                    {ord.paymentVerificationStatus === 'VERIFIED' && (
                      <span className="text-emerald-600 ml-1.5 font-medium">(Verified)</span>
                    )}
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {formatINR(ord.finalAmount)}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Delivering to: {ord.houseDetails}, {ord.city}, MP ({ord.pincode})
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Logout */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
