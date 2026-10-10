import React, { useState } from 'react';
import { CartItem, Customer, DeliveryCity, Order, PaymentMethod, PaymentSettings } from '../types';
import { formatINR, generateQrUrl, generateUpiLink, FALLBACK_PRODUCT_IMAGE } from '../utils';
import {
  X,
  CreditCard,
  QrCode,
  Truck,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
  MapPin,
  Phone,
  User as UserIcon
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  customer: Customer | null;
  defaultCity: DeliveryCity;
  paymentSettings: PaymentSettings;
  onOrderCreated: (order: Order) => void;
}

const SUPPORTED_CITIES: DeliveryCity[] = ['Dewas', 'Hatpipliya', 'Bagli', 'Indore'];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  customer,
  defaultCity,
  paymentSettings,
  onOrderCreated
}) => {
  const [customerName, setCustomerName] = useState(customer ? customer.fullName : '');
  const [mobile, setMobile] = useState(customer ? customer.mobile : '');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState(customer?.email || '');
  const [city, setCity] = useState<DeliveryCity>(defaultCity || 'Dewas');
  const [pincode, setPincode] = useState('455001');
  const [houseDetails, setHouseDetails] = useState('');
  const [roadArea, setRoadArea] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiRef, setUpiRef] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Pricing calculations
  const baseSubtotal = items.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  let paymentAdjustment = 0;
  if (paymentMethod === 'COD') {
    paymentAdjustment = paymentSettings.codFee || 50;
  } else if (paymentMethod === 'UPI') {
    paymentAdjustment = -(paymentSettings.upiDiscount || 50);
  }

  const finalAmount = Math.max(0, baseSubtotal + paymentAdjustment);

  // Dynamic UPI Link & QR
  const upiId = paymentSettings.upiId || '7772809503@paytm';
  const upiLink = generateUpiLink(upiId, 'NisKart', finalAmount, `NIS-${Date.now().toString().slice(-5)}`);
  const qrCodeUrl = paymentSettings.upiQrImage || generateQrUrl(upiLink);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (!customerName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Primary mobile number must be exactly 10 digits.');
      return;
    }
    if (alternateMobile.trim()) {
      const cleanAlt = alternateMobile.trim().replace(/\D/g, '');
      if (cleanAlt.length !== 10) {
        setError('Alternate mobile number must be exactly 10 digits if provided.');
        return;
      }
    }
    if (email.trim()) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address (e.g. name@example.com) or leave it empty.');
        return;
      }
    }
    const cleanPincode = pincode.trim().replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (!houseDetails.trim()) {
      setError('Please provide house/flat/building details.');
      return;
    }
    if (!roadArea.trim()) {
      setError('Please provide road, street, or locality details.');
      return;
    }
    if (paymentMethod === 'UPI' && !upiRef.trim()) {
      setError('Please provide the 12-digit UPI Transaction Reference (UTR) for payment verification.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('niskart_customer_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customerName: customerName.trim(),
          mobile: cleanMobile,
          alternateMobile: alternateMobile.trim() || undefined,
          email: email.trim() || undefined,
          city,
          pincode: cleanPincode,
          houseDetails: houseDetails.trim(),
          roadArea: roadArea.trim(),
          paymentMethod,
          upiRef: paymentMethod === 'UPI' ? upiRef.trim() : undefined,
          items: items.map((i) => ({
            productId: i.product.productId,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.sellingPrice,
            image: i.product.mainImage
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      onOrderCreated(data.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while placing order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
              N
            </div>
            <div>
              <h3 className="font-bold text-base">Secure Checkout · Madhya Pradesh</h3>
              <p className="text-xs text-slate-400">Direct Delivery across Dewas, Indore, Hatpipliya & Bagli</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitOrder} className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Delivery Address Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>1. Delivery Address (Madhya Pradesh)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 7772809503"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternate Mobile (Optional)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Secondary contact number"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="name@example.com (for order updates)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery City (MP) *
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as DeliveryCity)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600 cursor-pointer font-medium"
                >
                  {SUPPORTED_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}, Madhya Pradesh
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PIN Code (6 digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 455001"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  disabled
                  value="Madhya Pradesh"
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 cursor-not-allowed font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  House / Flat / Building Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Flat No, House No, Building or Apartment Name"
                  value={houseDetails}
                  onChange={(e) => setHouseDetails(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Road, Street, Locality or Landmark *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street name, colony, landmark (e.g. Near Chamunda Mata Mandir)"
                  value={roadArea}
                  onChange={(e) => setRoadArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* 2. Payment Method Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>2. Choose Payment Method</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* UPI Option */}
              <div
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span className="font-bold text-xs text-slate-900">UPI Payment</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm">
                    -₹50 OFF
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Instant QR scan via GPay, PhonePe, Paytm</p>
              </div>

              {/* COD Option */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-xs text-slate-900">Cash on Delivery</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                    +₹50 Fee
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Pay cash upon home delivery in MP</p>
              </div>

              {/* Card Option */}
              <div
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-slate-700" />
                    <span className="font-bold text-xs text-slate-900">Card Payment</span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                    ₹0 Fee
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Debit / Credit card gateway test mode</p>
              </div>
            </div>

            {/* UPI Details Box if UPI selected */}
            {paymentMethod === 'UPI' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Image */}
                  <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="NisKart UPI QR Code"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="text-xs">
                      <span className="text-slate-500">Payee UPI ID:</span>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                        <code className="font-bold text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200 text-xs">
                          {upiId}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                        >
                          {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUpi ? 'Copied' : 'Copy ID'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600">
                      Scan with any UPI app (PhonePe, GPay, Paytm) for payable amount of{' '}
                      <strong className="text-emerald-800">{formatINR(finalAmount)}</strong>.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Enter 12-Digit UPI Reference Number (UTR / Ref ID) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 592817293810"
                        value={upiRef}
                        onChange={(e) => setUpiRef(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:border-emerald-600 font-mono"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Note: UPI orders are placed with payment pending administrator verification.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-semibold">Test Mode Payment Gateway Notice:</p>
                <p className="text-[11px]">
                  Card payments are offered in test mode. No card numbers are stored on our servers. You can proceed with order placement.
                </p>
              </div>
            )}
          </div>

          {/* 3. Order Summary */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              3. Order Summary ({items.length} items)
            </h4>

            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 pr-1">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate max-w-[280px]">
                    <img
                      src={product.mainImage || FALLBACK_PRODUCT_IMAGE}
                      alt=""
                      className="w-8 h-8 rounded-md object-contain bg-slate-50 border border-slate-200 p-0.5"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {quantity} × {formatINR(product.sellingPrice)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatINR(product.sellingPrice * quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Base Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatINR(baseSubtotal)}</span>
              </div>

              {paymentMethod === 'COD' && (
                <div className="flex justify-between text-slate-700">
                  <span>Cash on Delivery Handling Charge:</span>
                  <span className="font-semibold">+₹{paymentSettings.codFee || 50}</span>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>UPI Online Payment Discount:</span>
                  <span>-₹{paymentSettings.upiDiscount || 50}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Final Payable Amount:</span>
                <span className="text-emerald-700">{formatINR(finalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {loading
                  ? 'Confirming Order...'
                  : `Place Order · ${formatINR(finalAmount)} (${paymentMethod})`}
              </span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified server-side calculation · Safe delivery in Madhya Pradesh</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
