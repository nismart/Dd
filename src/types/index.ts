export type DeliveryCity = 'Dewas' | 'Hatpipliya' | 'Bagli' | 'Indore';

export type ProductApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface Product {
  id: string;
  productId: string; // e.g. NISU-101
  sellerId?: string;
  sellerName?: string;
  name: string;
  description: string;
  wholesalePrice?: number;
  sellingPrice: number;
  originalPrice: number;
  mainImage: string;
  images: string[];
  categoryTag: string;
  isAvailable: boolean;
  approvalStatus?: ProductApprovalStatus;
  rejectionReason?: string;
  stockQuantity?: number;
  specifications?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryThumbnail {
  id: string;
  title: string;
  tag: string;
  image: string;
  displayOrder: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  displayOrder: number;
  tag?: string;
  ctaText?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  isEmailVerified?: boolean;
  isSeller?: boolean;
  sellerId?: string;
  createdAt: string;
}

export interface Seller {
  id: string;
  customerId: string;
  storeName: string;
  sellerName: string;
  mobile: string;
  email?: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  commissionRate: number; // e.g. 5 for 5%
  createdAt: string;
}

export interface ProductEditRequest {
  id: string;
  productId: string;
  sellerId: string;
  sellerName: string;
  proposedData: {
    name?: string;
    description?: string;
    wholesalePrice?: number;
    requestedSellingPrice?: number;
    mainImage?: string;
    categoryTag?: string;
    stockQuantity?: number;
    isAvailable?: boolean;
    specifications?: Record<string, string>;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface SellerStats {
  totalProductsSold: number;
  grossSales: number;
  commissionRate: number;
  commissionAmount: number;
  netEarnings: number;
  pendingSettlement: number;
}

export interface OrderItem {
  productId: string;
  sellerId?: string;
  name: string;
  price: number;
  quantity: number;
  total?: number;
  image: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned'
  | 'Pending';

export type PaymentMethod = 'COD' | 'UPI' | 'CARD';
export type PaymentVerificationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED' | 'NOT_APPLICABLE';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  mobile: string;
  email?: string;
  alternateMobile?: string;
  city: DeliveryCity;
  pincode: string;
  houseDetails: string;
  roadArea: string;
  state: string;
  items: OrderItem[];
  baseSubtotal: number;
  paymentAdjustment: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  upiRef?: string;
  paymentVerificationStatus: PaymentVerificationStatus;
  status: OrderStatus;
  courierPartner?: string;
  trackingNumber?: string;
  trackingNotes?: string;
  emailNotificationSent?: boolean;
  emailNotificationError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSettings {
  upiId: string;
  upiQrImage: string;
  onlinePaymentEnabled: boolean;
  web3FormsKey?: string;
  codFee: number;
  upiDiscount: number;
}

export interface EmailSettings {
  configured: boolean;
  targetEmail: string;
  web3FormsKey?: string;
  lastTestedAt?: string;
  lastStatus?: string;
  lastTestSuccess?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}
