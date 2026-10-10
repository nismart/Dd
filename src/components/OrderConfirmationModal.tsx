import React from 'react';
import { Order } from '../types';
import { formatINR } from '../utils';
import { CheckCircle2, PackageCheck, MapPin, Phone, ArrowRight, ShoppingBag } from 'lucide-react';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrders: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewOrders
}) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Banner */}
        <div className="bg-emerald-700 text-white p-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold">Order Placed Successfully!</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Thank you for shopping on NisKart – Madhya Pradesh
          </p>
          <div className="mt-3 inline-block bg-white/10 px-3 py-1 rounded-full text-xs font-mono font-semibold tracking-wider">
            Order #{order.orderNumber}
          </div>
        </div>

        {/* Details Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
          {/* Customer & Address */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Customer: {order.customerName}</span>
              <span className="flex items-center gap-1 text-slate-500 font-normal">
                <Phone className="w-3 h-3" /> {order.mobile}
              </span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {order.houseDetails}, {order.roadArea}, {order.city}, Madhya Pradesh - {order.pincode}
              </span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
            <div className="bg-slate-50 px-3.5 py-2 font-bold text-slate-700 flex justify-between">
              <span>Ordered Items</span>
              <span>Subtotal</span>
            </div>
            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100">
              {order.items.map((it, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between">
                  <div className="truncate max-w-[240px]">
                    <p className="font-semibold text-slate-800 truncate">{it.name}</p>
                    <p className="text-[11px] text-slate-400">
                      Qty: {it.quantity} × {formatINR(it.price)}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatINR(it.price * it.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Base Subtotal:</span>
              <span>{formatINR(order.baseSubtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Payment Mode ({order.paymentMethod}):</span>
              <span>
                {order.paymentAdjustment > 0
                  ? `+${formatINR(order.paymentAdjustment)} (COD Fee)`
                  : order.paymentAdjustment < 0
                  ? `${formatINR(order.paymentAdjustment)} (UPI Discount)`
                  : '₹0'}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>Final Total Amount:</span>
              <span className="text-emerald-700">{formatINR(order.finalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Verification Status:</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded-sm ${
                  order.paymentVerificationStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.paymentVerificationStatus === 'PENDING_VERIFICATION'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {order.paymentVerificationStatus === 'PENDING_VERIFICATION'
                  ? 'Pending Admin Verification'
                  : order.paymentVerificationStatus === 'VERIFIED'
                  ? 'Payment Verified'
                  : 'Cash on Delivery'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onViewOrders();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#059669] hover:bg-[#047857] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <span>View My Orders</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
