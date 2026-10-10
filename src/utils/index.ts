export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

export function generateUpiLink(upiId: string, payeeName: string, amount: number, orderRef: string): string {
  const cleanId = encodeURIComponent(upiId);
  const cleanName = encodeURIComponent(payeeName);
  const cleanRef = encodeURIComponent(orderRef);
  return `upi://pay?pa=${cleanId}&pn=${cleanName}&am=${amount.toFixed(2)}&cu=INR&tn=${cleanRef}`;
}

export function generateQrUrl(upiLink: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(upiLink)}`;
}

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';
