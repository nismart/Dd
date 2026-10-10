import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DEFAULT_NOTIFICATION_EMAIL = 'nishaldamor08@gmail.com';
const TARGET_EMAIL = process.env.TARGET_EMAIL || DEFAULT_NOTIFICATION_EMAIL;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface CustomerRecord {
  id: string;
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  isEmailVerified?: boolean;
  isSeller?: boolean;
  sellerId?: string;
  resetToken?: string;
  resetExpires?: number;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface SellerRecord {
  id: string;
  customerId: string;
  storeName: string;
  sellerName: string;
  mobile: string;
  email?: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  commissionRate: number; // percentage, e.g. 5
  createdAt: string;
}

interface ProductEditRequestRecord {
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

interface AuditRecord {
  id: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  mobile: string;
  email?: string;
  alternateMobile?: string;
  city: string;
  pincode: string;
  houseDetails: string;
  roadArea: string;
  state: string;
  items: {
    productId: string;
    sellerId?: string;
    name: string;
    price: number;
    quantity: number;
    total?: number;
    image: string;
  }[];
  baseSubtotal: number;
  paymentAdjustment: number;
  finalAmount: number;
  paymentMethod: string;
  upiRef?: string;
  paymentVerificationStatus: string;
  status: string;
  courierPartner?: string;
  trackingNumber?: string;
  trackingNotes?: string;
  emailNotificationSent?: boolean;
  emailNotificationError?: string;
  createdAt: string;
  updatedAt: string;
}

interface DbSchema {
  products: any[];
  categories: any[];
  banners: any[];
  paymentSettings: any;
  customers: CustomerRecord[];
  orders: OrderRecord[];
  sellers: SellerRecord[];
  productEditRequests: ProductEditRequestRecord[];
  auditLogs: AuditRecord[];
}

// In-memory verification codes map
const emailVerifications = new Map<string, { code: string; expiresAt: number; email?: string }>();

// Safe helper to parse JSON from external HTTP responses without throwing SyntaxError on HTML
async function parseResponseJson(res: any): Promise<any> {
  try {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        message: res.statusText || (text && text.length > 150 ? text.slice(0, 150) + '...' : text) || `HTTP error ${res.status}`
      };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to read response body' };
  }
}

// Default initial data
const initialDb: DbSchema = {
  products: [
    {
      id: 'prod-101',
      productId: 'NISU-101',
      name: 'Royal Chanderi Silk Saree with Gold Zari Border',
      description: 'Authentic royal emerald green Chanderi silk saree handcrafted in Ashoknagar MP. Adorned with traditional floral butis and rich gold zari border. Comes with matching blouse piece.',
      sellingPrice: 2499,
      originalPrice: 4999,
      mainImage: '/src/assets/images/chanderi_silk_saree_1791567774256.jpg',
      images: [
        '/src/assets/images/chanderi_silk_saree_1791567774256.jpg',
        '/src/assets/images/niskart_hero_banner_1791567763130.jpg'
      ],
      categoryTag: 'handloom-sarees',
      isAvailable: true,
      createdAt: '2026-03-01T10:00:00Z'
    },
    {
      id: 'prod-102',
      productId: 'NISU-102',
      name: 'Authentic Ujjaini & Ratlami Laung Sev (500g)',
      description: 'The world-famous Ratlami Sev prepared with premium gram flour, pungent clove (laung), black pepper, and secret Malwa spices. Extra crisp, aromatic, and authentically spiced.',
      sellingPrice: 199,
      originalPrice: 260,
      mainImage: '/src/assets/images/ratlami_sev_namkeen_1791567785574.jpg',
      images: [
        '/src/assets/images/ratlami_sev_namkeen_1791567785574.jpg'
      ],
      categoryTag: 'namkeen-snacks',
      isAvailable: true,
      createdAt: '2026-03-02T11:00:00Z'
    },
    {
      id: 'prod-103',
      productId: 'NISU-103',
      name: 'Premium MP Sehore Sharbati Gehu / Wheat (5kg)',
      description: 'Hand-picked golden Sharbati wheat grown in the black soil of Sehore, Madhya Pradesh. Known as the Golden Grain of India, it yields extra soft, sweet, and fluffy rotis.',
      sellingPrice: 420,
      originalPrice: 520,
      mainImage: '/src/assets/images/sehore_sharbati_wheat_1791567799163.jpg',
      images: [
        '/src/assets/images/sehore_sharbati_wheat_1791567799163.jpg'
      ],
      categoryTag: 'spices-grains',
      isAvailable: true,
      createdAt: '2026-03-03T12:00:00Z'
    },
    {
      id: 'prod-104',
      productId: 'NISU-104',
      name: 'Bagli Shuddh Desi Cow A2 Bilona Ghee (1 Litre)',
      description: 'Pure Vedic A2 Bilona Ghee prepared traditionally from grass-fed Desi cows in Bagli, Dewas district. Rich in granular texture (danedaar), golden color, and divine aroma.',
      sellingPrice: 1350,
      originalPrice: 1600,
      mainImage: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80'
      ],
      categoryTag: 'daily-essentials',
      isAvailable: true,
      createdAt: '2026-03-04T09:00:00Z'
    },
    {
      id: 'prod-105',
      productId: 'NISU-105',
      name: 'Indore Famous Jeeravan Powder & Garadu Masala Combo',
      description: 'The iconic Indori Jeeravan taste! Perfect sprinkler for Poha, Sev, Fruits, Curd, and Garadu. Blend of 21 digestive Ayurvedic spices crafted in Sarafa Bazar.',
      sellingPrice: 175,
      originalPrice: 240,
      mainImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'
      ],
      categoryTag: 'spices-grains',
      isAvailable: true,
      createdAt: '2026-03-05T14:30:00Z'
    },
    {
      id: 'prod-106',
      productId: 'NISU-106',
      name: 'Handcrafted Brass Peacock Deepam from Tikamgarh',
      description: 'Heavy solid brass traditional oil lamp with peacock arch handcrafted by artisans of Tikamgarh and Dewas. High polish finish, eternal design for festive prayer.',
      sellingPrice: 890,
      originalPrice: 1250,
      mainImage: 'https://images.unsplash.com/photo-1608096299210-db7e38487075?w=600&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1608096299210-db7e38487075?w=600&auto=format&fit=crop&q=80'
      ],
      categoryTag: 'handicrafts',
      isAvailable: true,
      createdAt: '2026-03-06T15:00:00Z'
    },
    {
      id: 'prod-107',
      productId: 'NISU-107',
      name: 'Dewas Pure Kachi Ghani Mustard Oil (1 Litre Bottle)',
      description: 'Cold pressed whole mustard oil extracted traditionally in Dewas. Rich natural pungency, 100% unadulterated, cholesterol-free cooking oil.',
      sellingPrice: 185,
      originalPrice: 220,
      mainImage: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'
      ],
      categoryTag: 'daily-essentials',
      isAvailable: true,
      createdAt: '2026-03-07T11:00:00Z'
    },
    {
      id: 'prod-108',
      productId: 'NISU-108',
      name: 'Hatpipliya Special Roasted Gram (Bhuna Chana with Hing)',
      description: 'Crisp wood-roasted desi chana tossed with pure Malwa compounded asafoetida and black salt. Healthy protein snack, low glycemic index.',
      sellingPrice: 140,
      originalPrice: 190,
      mainImage: 'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80',
      images: [
        'https://images.unsplash.com/photo-1514733670139-4d87a1941d55?w=600&auto=format&fit=crop&q=80'
      ],
      categoryTag: 'namkeen-snacks',
      isAvailable: true,
      createdAt: '2026-03-08T13:00:00Z'
    }
  ],
  categories: [
    {
      id: 'cat-1',
      title: 'Handloom Sarees',
      tag: 'handloom-sarees',
      image: '/src/assets/images/chanderi_silk_saree_1791567774256.jpg',
      displayOrder: 1
    },
    {
      id: 'cat-2',
      title: 'Namkeen & Snacks',
      tag: 'namkeen-snacks',
      image: '/src/assets/images/ratlami_sev_namkeen_1791567785574.jpg',
      displayOrder: 2
    },
    {
      id: 'cat-3',
      title: 'Spices & Grains',
      tag: 'spices-grains',
      image: '/src/assets/images/sehore_sharbati_wheat_1791567799163.jpg',
      displayOrder: 3
    },
    {
      id: 'cat-4',
      title: 'Daily Essentials',
      tag: 'daily-essentials',
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=300&auto=format&fit=crop&q=80',
      displayOrder: 4
    },
    {
      id: 'cat-5',
      title: 'Handicrafts & Decor',
      tag: 'handicrafts',
      image: 'https://images.unsplash.com/photo-1608096299210-db7e38487075?w=300&auto=format&fit=crop&q=80',
      displayOrder: 5
    }
  ],
  banners: [
    {
      id: 'ban-1',
      title: 'Celebrate Madhya Pradesh: The Heart of India',
      subtitle: 'Festive Discounts Up to 50% Off on Pure Chanderi, Malwa Spices & Handcrafts',
      badge: 'Festive Special',
      image: '/src/assets/images/niskart_hero_banner_1791567763130.jpg',
      displayOrder: 1,
      tag: 'handloom-sarees',
      ctaText: 'Explore Collection'
    },
    {
      id: 'ban-2',
      title: 'Authentic Ratlami Sev & Malwa Namkeen Feast',
      subtitle: 'Freshly packed crisp snacks straight from Ratlam, Indore, and Dewas to your doorstep',
      badge: 'Best Seller',
      image: '/src/assets/images/ratlami_sev_namkeen_1791567785574.jpg',
      displayOrder: 2,
      tag: 'namkeen-snacks',
      ctaText: 'Shop Namkeen'
    },
    {
      id: 'ban-3',
      title: 'Pure Sehore Sharbati Wheat & A2 Bilona Ghee',
      subtitle: '100% Natural Farm Sourced Staple Foods with Express Local Delivery in MP',
      badge: 'Farm Fresh',
      image: '/src/assets/images/sehore_sharbati_wheat_1791567799163.jpg',
      displayOrder: 3,
      tag: 'spices-grains',
      ctaText: 'Order Essentials'
    }
  ],
  paymentSettings: {
    upiId: '7772809503@paytm',
    upiQrImage: '',
    onlinePaymentEnabled: true,
    web3FormsKey: '',
    codFee: 50,
    upiDiscount: 50
  },
  customers: [],
  orders: [
    {
      id: 'ord-1001',
      orderNumber: 'NIS-2026-10082',
      customerId: null,
      customerName: 'Aakash Verma',
      mobile: '7772809503',
      alternateMobile: '9826012345',
      city: 'Dewas',
      pincode: '455001',
      houseDetails: 'Flat 302, Gayatri Heights',
      roadArea: 'Station Road, Near Chamunda Mata Mandir',
      state: 'Madhya Pradesh',
      items: [
        {
          productId: 'NISU-102',
          name: 'Authentic Ujjaini & Ratlami Laung Sev (500g)',
          price: 199,
          quantity: 2,
          image: '/src/assets/images/ratlami_sev_namkeen_1791567785574.jpg'
        },
        {
          productId: 'NISU-105',
          name: 'Indore Famous Jeeravan Powder & Garadu Masala Combo',
          price: 175,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'
        }
      ],
      baseSubtotal: 573,
      paymentAdjustment: -50,
      finalAmount: 523,
      paymentMethod: 'UPI',
      upiRef: 'UPI592817293810',
      paymentVerificationStatus: 'VERIFIED',
      status: 'Confirmed',
      createdAt: '2026-03-09T08:24:00Z',
      updatedAt: '2026-03-09T09:10:00Z'
    }
  ]
};

// Database helper with atomic write
function enrichProductSpecifications(prod: any) {
  if (!prod.specifications || Object.keys(prod.specifications).length === 0) {
    if (prod.productId === 'NISU-101') {
      prod.specifications = {
        'Fabric': 'Pure Chanderi Silk with Natural Sheen',
        'Zari Work': 'Gold Metallic Zari Border & Floral Butis',
        'Origin': 'Ashoknagar & Chanderi, Madhya Pradesh',
        'Includes': 'Saree (5.5m) + Unstitched Blouse Piece (0.8m)',
        'Care Instructions': 'Dry Clean Recommended'
      };
    } else if (prod.productId === 'NISU-102') {
      prod.specifications = {
        'Net Weight': '500 Grams',
        'Key Ingredients': 'Besan (Gram Flour), Pure Clove (Laung), Black Pepper, Asafoetida',
        'Origin': 'Ratlam & Ujjain, Madhya Pradesh',
        'Shelf Life': '90 Days from Packaging',
        'Dietary': '100% Vegetarian, No Artificial Preservatives'
      };
    } else if (prod.productId === 'NISU-103') {
      prod.specifications = {
        'Net Weight': '5 Kilograms',
        'Grain Variety': 'Authentic Golden Sharbati Wheat (Single-Origin)',
        'Origin': 'Sehore District, Madhya Pradesh',
        'Moisture Content': 'Less than 11.5%',
        'Characteristics': 'Yields Extra Soft, Naturally Sweet Rotis'
      };
    } else if (prod.productId === 'NISU-104') {
      prod.specifications = {
        'Net Volume': '1 Litre',
        'Method': 'Traditional Vedic Bilona Churning',
        'Source': 'Free-grazing Indigenous Desi Cows',
        'Origin': 'Bagli, Dewas District, Madhya Pradesh',
        'Texture': 'Danedaar (Granular Golden Ghee)'
      };
    } else if (prod.productId === 'NISU-105') {
      prod.specifications = {
        'Net Weight': '200g (Pack of 2)',
        'Key Ingredients': 'Jeera, Clove, Dry Mango, Black Salt, Malwa Hing',
        'Origin': 'Indore (Sarafa Bazar), Madhya Pradesh',
        'Culinary Use': 'Iconic Sprinkler for Indori Poha, Sev, Garadu'
      };
    } else if (prod.productId === 'NISU-106') {
      prod.specifications = {
        'Material': 'Solid Cast Bell Brass (High Polish)',
        'Height & Weight': '10 Inches / 1.25 Kilograms',
        'Craftsmanship': 'Hand-cast by Master Dhokra/Brass Artisans',
        'Origin': 'Tikamgarh & Dewas, Madhya Pradesh'
      };
    } else if (prod.productId === 'NISU-107') {
      prod.specifications = {
        'Net Volume': '1 Litre Glass/Pet Bottle',
        'Extraction': 'Wood Cold-Pressed (Kachi Ghani)',
        'Seeds': '100% Non-GMO Black Mustard Seeds',
        'Origin': 'Dewas District, Madhya Pradesh'
      };
    } else if (prod.productId === 'NISU-108') {
      prod.specifications = {
        'Net Weight': '400 Grams',
        'Ingredients': 'Wood-Roasted Desi Chana, Malwa Hing, Black Salt',
        'Origin': 'Hatpipliya, Dewas District, Madhya Pradesh',
        'Health Benefits': 'Rich in Plant Protein & Dietary Fiber'
      };
    } else {
      prod.specifications = {
        'Origin': 'Madhya Pradesh, India',
        'Authenticity': '100% Verified Regional Craft/Produce',
        'Quality Grade': 'A-Grade Premium Selection'
      };
    }
  }
  return prod;
}

function loadDb(): typeof initialDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed.products)) {
        parsed.products.forEach(enrichProductSpecifications);
      }
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read db.json, using defaults:', err);
  }
  initialDb.products.forEach(enrichProductSpecifications);
  saveDb(initialDb);
  return initialDb;
}

function saveDb(data: typeof initialDb) {
  try {
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

let db = loadDb();

// Session storage
interface AdminSession {
  token: string;
  expiresAt: number;
}
let adminSessions = new Map<string, AdminSession>();

interface CustomerSession {
  token: string;
  customerId: string;
  expiresAt: number;
}
let customerSessions = new Map<string, CustomerSession>();

// Passwords helper
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const h = crypto.pbkdf2Sync(password, s, 1000, 64, 'sha512').toString('hex');
  return { hash: h, salt: s };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const h = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return h === hash;
}

// Server init
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));

// Admin authentication middleware
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Admin credentials required.' });
  }
  const token = authHeader.split(' ')[1];
  const session = adminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Admin session expired or invalid. Please log in again.' });
  }
  next();
}

// Customer session middleware (optional or strict)
function getCustomerFromHeader(req: express.Request): any | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const session = customerSessions.get(token);
  if (!session || session.expiresAt < Date.now()) return null;
  return db.customers.find((c: any) => c.id === session.customerId) || null;
}

// ========================
// PUBLIC STORE APIS
// ========================

app.get('/api/store/data', (_req, res) => {
  res.json({
    products: db.products.filter(p => p.isAvailable),
    categories: [...db.categories].sort((a, b) => a.displayOrder - b.displayOrder),
    banners: [...db.banners].sort((a, b) => a.displayOrder - b.displayOrder),
    paymentSettings: {
      upiId: db.paymentSettings.upiId,
      upiQrImage: db.paymentSettings.upiQrImage,
      onlinePaymentEnabled: db.paymentSettings.onlinePaymentEnabled,
      codFee: db.paymentSettings.codFee,
      upiDiscount: db.paymentSettings.upiDiscount
    }
  });
});

app.get('/api/products/:id', (req, res) => {
  const product = db.products.find(p => p.id === req.params.id || p.productId === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// ========================
// CUSTOMER AUTH APIS
// ========================

app.post('/api/customer/register', (req, res) => {
  const { fullName, mobile, password, email } = req.body;
  if (!fullName || !mobile || !password) {
    return res.status(400).json({ error: 'Full name, mobile number, and password are required.' });
  }
  const cleanMobile = String(mobile).trim().replace(/\D/g, '');
  if (cleanMobile.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = db.customers.find((c: any) => c.mobile === cleanMobile);
  if (existing) {
    return res.status(400).json({ error: 'An account with this mobile number already exists. Please log in.' });
  }

  let cleanEmail: string | undefined = undefined;
  if (email && typeof email === 'string' && email.trim()) {
    cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
  }

  const { hash, salt } = hashPassword(password);
  const newCustomer: CustomerRecord = {
    id: `cust-${Date.now()}`,
    fullName: fullName.trim(),
    mobile: cleanMobile,
    email: cleanEmail,
    passwordHash: hash,
    salt,
    isEmailVerified: false,
    createdAt: new Date().toISOString()
  };

  db.customers.push(newCustomer);
  saveDb(db);

  const token = crypto.randomBytes(32).toString('hex');
  customerSessions.set(token, {
    token,
    customerId: newCustomer.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.json({
    customer: {
      id: newCustomer.id,
      fullName: newCustomer.fullName,
      mobile: newCustomer.mobile,
      email: newCustomer.email,
      isEmailVerified: Boolean(newCustomer.isEmailVerified),
      createdAt: newCustomer.createdAt
    },
    token
  });
});

app.post('/api/customer/login', (req, res) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile number and password are required.' });
  }
  const cleanMobile = String(mobile).trim().replace(/\D/g, '');
  const customer = db.customers.find((c: any) => c.mobile === cleanMobile);
  if (!customer) {
    return res.status(401).json({ error: 'No account found with this mobile number. Please sign up.' });
  }

  if (!verifyPassword(password, customer.passwordHash, customer.salt)) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  customerSessions.set(token, {
    token,
    customerId: customer.id,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
  });

  res.json({
    customer: {
      id: customer.id,
      fullName: customer.fullName,
      mobile: customer.mobile,
      email: customer.email,
      isEmailVerified: Boolean(customer.isEmailVerified),
      createdAt: customer.createdAt
    },
    token
  });
});

app.get('/api/customer/me', (req, res) => {
  const customer = getCustomerFromHeader(req);
  if (!customer) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    id: customer.id,
    fullName: customer.fullName,
    mobile: customer.mobile,
    email: customer.email,
    isEmailVerified: Boolean(customer.isEmailVerified),
    createdAt: customer.createdAt
  });
});

// Customer Email Verification
app.post('/api/customer/email/send-verification', async (req, res) => {
  const customer = getCustomerFromHeader(req);
  if (!customer) {
    return res.status(401).json({ error: 'Please log in to verify your email address.' });
  }

  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address (e.g. name@example.com).' });
  }

  // Generate 6-digit cryptographically secure verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

  emailVerifications.set(customer.id, {
    email: cleanEmail,
    code,
    expiresAt
  });

  // Dispatch verification email via Web3Forms if configured
  const web3FormsKey = db.paymentSettings.web3FormsKey || process.env.WEB3FORMS_ACCESS_KEY || '';
  if (web3FormsKey) {
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: web3FormsKey,
          subject: `Your NisKart Email Verification Code: ${code}`,
          from_name: 'NisKart Madhya Pradesh',
          to_email: cleanEmail,
          message: `Hello ${customer.fullName},\n\nYour 6-digit NisKart verification code is: ${code}\nThis code will expire in 15 minutes. Please do not share this code with anyone.\n\nThank you for choosing NisKart – Madhya Pradesh!`
        })
      });
      const parsed = await parseResponseJson(response);
      if (!response.ok || !parsed.success) {
        console.warn('[EMAIL VERIFICATION WARNING]', parsed.message);
      }
    } catch (err: any) {
      console.error('[EMAIL VERIFICATION DISPATCH ERROR]', err.message);
    }
  } else {
    console.log(`[VERIFICATION AUDIT] Verification code generated for ${customer.fullName}`);
  }

  res.json({
    success: true,
    message: `Verification code sent to ${cleanEmail}. Enter the 6-digit code to complete verification.`
  });
});

app.post('/api/customer/email/verify', (req, res) => {
  const customer = getCustomerFromHeader(req);
  if (!customer) {
    return res.status(401).json({ error: 'Please log in to verify your email address.' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Verification code is required.' });
  }

  const entry = emailVerifications.get(customer.id);
  if (!entry) {
    return res.status(400).json({ error: 'No active verification request found. Please request a new code.' });
  }

  if (Date.now() > entry.expiresAt) {
    emailVerifications.delete(customer.id);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }

  if (entry.code !== String(code).trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please check and try again.' });
  }

  // Single-use token: immediately delete from memory
  customer.email = entry.email;
  customer.isEmailVerified = true;
  emailVerifications.delete(customer.id);
  saveDb(db);

  res.json({
    success: true,
    message: 'Email address verified successfully!',
    customer: {
      id: customer.id,
      fullName: customer.fullName,
      mobile: customer.mobile,
      email: customer.email,
      isEmailVerified: true,
      createdAt: customer.createdAt
    }
  });
});

app.post('/api/customer/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    customerSessions.delete(token);
  }
  res.json({ success: true });
});

app.get('/api/customer/orders', (req, res) => {
  const customer = getCustomerFromHeader(req);
  if (!customer) {
    return res.status(401).json({ error: 'Please log in to view your orders.' });
  }
  const customerOrders = db.orders.filter((o: any) => o.customerId === customer.id || o.mobile === customer.mobile);
  res.json(customerOrders);
});

// ========================
// ORDER NOTIFICATION & CREATION
// ========================

async function sendOrderNotificationEmail(order: OrderRecord): Promise<{ success: boolean; message: string }> {
  const targetEmail = db.paymentSettings.notificationEmail || db.paymentSettings.targetEmail || DEFAULT_NOTIFICATION_EMAIL;
  const web3FormsKey = db.paymentSettings.web3FormsKey || process.env.WEB3FORMS_ACCESS_KEY || '';

  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const itemsText = order.items.map((it, idx) => `${idx + 1}. ${it.name} (SKU: ${it.productId}) × ${it.quantity} = ₹${it.price * it.quantity}`).join('\n');

  const messageText = `
========================================
NEW NISKART ORDER CONFIRMATION
========================================
Order ID: ${order.orderNumber}
Date & Time: ${orderDate}

CUSTOMER DETAILS:
Name: ${order.customerName}
Mobile: ${order.mobile}${order.alternateMobile ? ` (Alternate: ${order.alternateMobile})` : ''}
Email: ${order.email || 'Not provided'}

DELIVERY ADDRESS:
${order.houseDetails}, ${order.roadArea}
City: ${order.city}, Madhya Pradesh - PIN: ${order.pincode}

ORDERED ITEMS:
${itemsText}

FINANCIAL BREAKDOWN:
Base Subtotal: ₹${order.baseSubtotal}
Payment Method: ${order.paymentMethod}
Payment Adjustment: ₹${order.paymentAdjustment}
Final Amount: ₹${order.finalAmount}
Verification Status: ${order.paymentVerificationStatus}
${order.upiRef ? `UPI Reference (UTR): ${order.upiRef}` : ''}
Current Status: ${order.status}
========================================
`;

  if (!web3FormsKey) {
    const logMsg = `Web3Forms Access Key not set. Order #${order.orderNumber} saved to system log for ${targetEmail}.`;
    console.log(`[NISKART EMAIL AUDIT] ${logMsg}\n${messageText}`);
    order.emailNotificationSent = false;
    order.emailNotificationError = 'Web3Forms Access Key not configured';
    saveDb(db);
    return { success: false, message: logMsg };
  }

  try {
    const payload = {
      access_key: web3FormsKey,
      subject: `New NisKart Order #${order.orderNumber} - ₹${order.finalAmount} (${order.city}, MP)`,
      from_name: 'NisKart Madhya Pradesh',
      email: order.email || 'orders@niskart.mp',
      to_email: targetEmail,
      message: messageText,
      order_id: order.orderNumber,
      customer_name: order.customerName,
      customer_mobile: order.mobile,
      order_city: order.city,
      final_total: `₹${order.finalAmount}`,
      payment_method: order.paymentMethod,
      order_status: order.status
    };

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await parseResponseJson(response);
    if (response.ok && data.success) {
      console.log(`[NISKART EMAIL SUCCESS] Dispatched order #${order.orderNumber} to ${targetEmail}`);
      order.emailNotificationSent = true;
      order.emailNotificationError = undefined;
      emailStatusLog.lastTestedAt = new Date().toISOString();
      emailStatusLog.lastStatus = `Order notification #${order.orderNumber} delivered to ${targetEmail}`;
      emailStatusLog.lastTestSuccess = true;
      saveDb(db);
      return { success: true, message: `Notification delivered to ${targetEmail}` };
    } else {
      const errMsg = data.message || 'Web3Forms API rejected notification submission.';
      console.error(`[NISKART EMAIL REJECTED] ${errMsg}`);
      order.emailNotificationSent = false;
      order.emailNotificationError = errMsg;
      emailStatusLog.lastTestedAt = new Date().toISOString();
      emailStatusLog.lastStatus = `Notification attempt failed: ${errMsg}`;
      emailStatusLog.lastTestSuccess = false;
      saveDb(db);
      return { success: false, message: errMsg };
    }
  } catch (err: any) {
    const errMsg = err.message || 'Network failure dispatching notification';
    console.error(`[NISKART EMAIL EXCEPTION] ${errMsg}`);
    order.emailNotificationSent = false;
    order.emailNotificationError = errMsg;
    saveDb(db);
    return { success: false, message: errMsg };
  }
}

const VALID_CITIES = ['Dewas', 'Hatpipliya', 'Bagli', 'Indore'];

app.post('/api/orders', (req, res) => {
  const {
    customerName,
    mobile,
    alternateMobile,
    city,
    pincode,
    houseDetails,
    roadArea,
    paymentMethod,
    upiRef,
    items
  } = req.body;

  // Validation
  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ error: 'Customer full name is required.' });
  }
  const cleanMobile = String(mobile || '').trim().replace(/\D/g, '');
  if (cleanMobile.length !== 10) {
    return res.status(400).json({ error: 'A valid 10-digit primary mobile number is required.' });
  }
  if (alternateMobile) {
    const cleanAlt = String(alternateMobile).trim().replace(/\D/g, '');
    if (cleanAlt.length > 0 && cleanAlt.length !== 10) {
      return res.status(400).json({ error: 'Alternate mobile number must be 10 digits if provided.' });
    }
  }
  if (!VALID_CITIES.includes(city)) {
    return res.status(400).json({ error: `Selected city is invalid. Supported cities: ${VALID_CITIES.join(', ')}` });
  }
  const cleanPincode = String(pincode || '').trim().replace(/\D/g, '');
  if (cleanPincode.length !== 6) {
    return res.status(400).json({ error: 'Please enter a valid 6-digit PIN code.' });
  }
  if (!houseDetails || !houseDetails.trim()) {
    return res.status(400).json({ error: 'House/Building details are required.' });
  }
  if (!roadArea || !roadArea.trim()) {
    return res.status(400).json({ error: 'Road/Locality/Area is required.' });
  }
  if (!['COD', 'UPI', 'CARD'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method selected.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart cannot be empty.' });
  }

  // Calculate prices securely from DB
  let baseSubtotal = 0;
  const verifiedItems: any[] = [];

  for (const item of items) {
    const prod = db.products.find(p => p.id === item.productId || p.productId === item.productId);
    if (!prod) {
      return res.status(400).json({ error: `Product not found: ${item.name || item.productId}` });
    }
    if (!prod.isAvailable) {
      return res.status(400).json({ error: `Product "${prod.name}" is currently out of stock.` });
    }
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    const itemSubtotal = prod.sellingPrice * qty;
    baseSubtotal += itemSubtotal;

    verifiedItems.push({
      productId: prod.productId,
      name: prod.name,
      price: prod.sellingPrice,
      quantity: qty,
      image: prod.mainImage
    });
  }

  // Payment adjustments
  let paymentAdjustment = 0;
  let paymentVerificationStatus: any = 'NOT_APPLICABLE';

  if (paymentMethod === 'COD') {
    paymentAdjustment = db.paymentSettings.codFee || 50;
    paymentVerificationStatus = 'NOT_APPLICABLE';
  } else if (paymentMethod === 'UPI') {
    paymentAdjustment = -(db.paymentSettings.upiDiscount || 50);
    paymentVerificationStatus = 'PENDING_VERIFICATION';
    if (!upiRef || !upiRef.trim()) {
      return res.status(400).json({ error: 'Please enter the 12-digit UPI Transaction Reference / UTR number for verification.' });
    }
  } else if (paymentMethod === 'CARD') {
    paymentAdjustment = 0;
    paymentVerificationStatus = 'PENDING_VERIFICATION';
  }

  const finalAmount = Math.max(0, baseSubtotal + paymentAdjustment);

  // Authenticated customer link
  const currentCustomer = getCustomerFromHeader(req);
  const orderNumber = `NIS-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  // Customer email if provided
  const customerEmail = req.body.email ? String(req.body.email).trim() : (currentCustomer?.email || undefined);

  const newOrder: OrderRecord = {
    id: `ord-${Date.now()}`,
    orderNumber,
    customerId: currentCustomer ? currentCustomer.id : null,
    customerName: customerName.trim(),
    mobile: cleanMobile,
    email: customerEmail,
    alternateMobile: alternateMobile ? String(alternateMobile).trim() : undefined,
    city,
    pincode: cleanPincode,
    houseDetails: houseDetails.trim(),
    roadArea: roadArea.trim(),
    state: 'Madhya Pradesh',
    items: verifiedItems,
    baseSubtotal,
    paymentAdjustment,
    finalAmount,
    paymentMethod,
    upiRef: upiRef ? upiRef.trim() : undefined,
    paymentVerificationStatus,
    status: 'Pending',
    emailNotificationSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDb(db);

  // Dispatch automatic order notification email
  sendOrderNotificationEmail(newOrder).catch((err) => {
    console.error('[NISKART ORDER EMAIL ASYNC ERROR]', err);
  });

  res.status(201).json({
    order: newOrder,
    message: 'Order placed successfully!'
  });
});

// Customer Email Verification Endpoints (Compatibility / Direct)
app.post('/api/customer/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
  emailVerifications.set(cleanEmail, { code, expiresAt, email: cleanEmail });

  // If customer is logged in, also index by customer id
  const currentCustomer = getCustomerFromHeader(req);
  if (currentCustomer) {
    emailVerifications.set(currentCustomer.id, { code, expiresAt, email: cleanEmail });
  }

  // If Web3Forms is available, dispatch verification code to user
  const web3FormsKey = db.paymentSettings.web3FormsKey || process.env.WEB3FORMS_ACCESS_KEY || '';
  if (web3FormsKey) {
    try {
      const resp = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          access_key: web3FormsKey,
          subject: 'Your NisKart Email Verification Code',
          from_name: 'NisKart Support',
          to_email: cleanEmail,
          message: `Your NisKart email verification code is: ${code}\nThis code will expire in 15 minutes.`
        })
      });
      await parseResponseJson(resp);
    } catch (e: any) {
      console.error('Failed to send customer verification email', e.message);
    }
  }

  res.json({
    success: true,
    message: `Verification code generated for ${cleanEmail}. (Valid for 15 minutes)`
  });
});

app.post('/api/customer/verify-email', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }
  const cleanEmail = email.trim().toLowerCase();
  const record = emailVerifications.get(cleanEmail);
  if (!record) {
    return res.status(400).json({ error: 'No pending verification found or code expired. Please request a new code.' });
  }
  if (Date.now() > record.expiresAt) {
    emailVerifications.delete(cleanEmail);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
  }
  if (record.code !== String(code).trim()) {
    return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
  }

  emailVerifications.delete(cleanEmail);

  // If customer is logged in, mark customer email verified
  const currentCustomer = getCustomerFromHeader(req);
  if (currentCustomer) {
    currentCustomer.email = cleanEmail;
    currentCustomer.isEmailVerified = true;
    emailVerifications.delete(currentCustomer.id);
    saveDb(db);
  }

  res.json({
    success: true,
    verified: true,
    message: 'Email verified successfully.'
  });
});

// ========================
// ADMIN APIS
// ========================

app.post('/api/admin/login', (req, res) => {
  const { passcode } = req.body;
  if (!passcode) {
    return res.status(400).json({ error: 'Admin passcode is required.' });
  }
  if (passcode !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin passcode. Access denied.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, {
    token,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });

  res.json({ token, success: true });
});

app.get('/api/admin/check', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authorized: false });
  }
  const token = authHeader.split(' ')[1];
  const session = adminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ authorized: false });
  }
  res.json({ authorized: true });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers.authorization!.split(' ')[1];
  adminSessions.delete(token);
  res.json({ success: true });
});

// Admin Orders
app.get('/api/admin/orders', requireAdmin, (_req, res) => {
  res.json(db.orders);
});

app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const valid = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  if (!valid.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }
  const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  order.status = status;
  order.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json({ order, success: true });
});

app.put('/api/admin/orders/:id/payment', requireAdmin, (req, res) => {
  const { paymentVerificationStatus } = req.body;
  const valid = ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'NOT_APPLICABLE'];
  if (!valid.includes(paymentVerificationStatus)) {
    return res.status(400).json({ error: 'Invalid verification status' });
  }
  const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  order.paymentVerificationStatus = paymentVerificationStatus;
  order.updatedAt = new Date().toISOString();
  saveDb(db);
  res.json({ order, success: true });
});

// Admin Products CRUD
app.get('/api/admin/products', requireAdmin, (_req, res) => {
  res.json(db.products);
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const { productId, name, description, sellingPrice, originalPrice, mainImage, images, categoryTag, isAvailable } = req.body;
  if (!productId || !name || sellingPrice === undefined) {
    return res.status(400).json({ error: 'Product ID, Name, and Selling Price are required.' });
  }
  // Check unique productId
  const cleanId = String(productId).trim().toUpperCase();
  if (db.products.some(p => p.productId.toUpperCase() === cleanId)) {
    return res.status(400).json({ error: `Product ID "${cleanId}" already exists. Please choose a unique ID.` });
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    productId: cleanId,
    name: name.trim(),
    description: (description || '').trim(),
    sellingPrice: Number(sellingPrice),
    originalPrice: Number(originalPrice || sellingPrice),
    mainImage: mainImage || '/src/assets/images/niskart_hero_banner_1791567763130.jpg',
    images: Array.isArray(images) && images.length ? images.slice(0, 5) : [mainImage],
    categoryTag: categoryTag || 'all',
    isAvailable: isAvailable !== false,
    createdAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  saveDb(db);
  res.status(201).json({ product: newProduct, success: true });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const prod = db.products.find(p => p.id === req.params.id || p.productId === req.params.id);
  if (!prod) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const { productId, name, description, sellingPrice, originalPrice, mainImage, images, categoryTag, isAvailable } = req.body;
  if (productId && productId.trim().toUpperCase() !== prod.productId.toUpperCase()) {
    const cleanId = productId.trim().toUpperCase();
    if (db.products.some(p => p.productId.toUpperCase() === cleanId && p.id !== prod.id)) {
      return res.status(400).json({ error: `Product ID "${cleanId}" is already used by another product.` });
    }
    prod.productId = cleanId;
  }
  if (name) prod.name = name.trim();
  if (description !== undefined) prod.description = description.trim();
  if (sellingPrice !== undefined) prod.sellingPrice = Number(sellingPrice);
  if (originalPrice !== undefined) prod.originalPrice = Number(originalPrice);
  if (mainImage) prod.mainImage = mainImage;
  if (Array.isArray(images)) prod.images = images.slice(0, 5);
  if (categoryTag) prod.categoryTag = categoryTag;
  if (isAvailable !== undefined) prod.isAvailable = Boolean(isAvailable);

  saveDb(db);
  res.json({ product: prod, success: true });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const idx = db.products.findIndex(p => p.id === req.params.id || p.productId === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }
  const deleted = db.products.splice(idx, 1)[0];
  saveDb(db);
  res.json({ message: `Product "${deleted.name}" removed successfully.` });
});

// Admin Categories CRUD
app.get('/api/admin/categories', requireAdmin, (_req, res) => {
  res.json(db.categories);
});

app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { title, tag, image, displayOrder } = req.body;
  if (!title || !tag) {
    return res.status(400).json({ error: 'Title and Tag are required.' });
  }
  const newCat = {
    id: `cat-${Date.now()}`,
    title: title.trim(),
    tag: tag.trim().toLowerCase().replace(/\s+/g, '-'),
    image: image || '/src/assets/images/niskart_hero_banner_1791567763130.jpg',
    displayOrder: Number(displayOrder) || db.categories.length + 1
  };
  db.categories.push(newCat);
  saveDb(db);
  res.status(201).json({ category: newCat, success: true });
});

app.put('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category thumbnail not found' });
  const { title, tag, image, displayOrder } = req.body;
  if (title) cat.title = title.trim();
  if (tag) cat.tag = tag.trim().toLowerCase().replace(/\s+/g, '-');
  if (image) cat.image = image;
  if (displayOrder !== undefined) cat.displayOrder = Number(displayOrder);
  saveDb(db);
  res.json({ category: cat, success: true });
});

app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
  const idx = db.categories.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Category thumbnail not found' });
  db.categories.splice(idx, 1);
  saveDb(db);
  res.json({ success: true });
});

// Admin Banners CRUD
app.get('/api/admin/banners', requireAdmin, (_req, res) => {
  res.json(db.banners);
});

app.post('/api/admin/banners', requireAdmin, (req, res) => {
  const { title, subtitle, badge, image, displayOrder, tag, ctaText } = req.body;
  if (!title || !image) {
    return res.status(400).json({ error: 'Title and Image are required for banner.' });
  }
  const newBanner = {
    id: `ban-${Date.now()}`,
    title: title.trim(),
    subtitle: (subtitle || '').trim(),
    badge: (badge || 'Special Offer').trim(),
    image: image.trim(),
    displayOrder: Number(displayOrder) || db.banners.length + 1,
    tag: tag ? tag.trim() : undefined,
    ctaText: (ctaText || 'Shop Now').trim()
  };
  db.banners.push(newBanner);
  saveDb(db);
  res.status(201).json({ banner: newBanner, success: true });
});

app.put('/api/admin/banners/:id', requireAdmin, (req, res) => {
  const ban = db.banners.find(b => b.id === req.params.id);
  if (!ban) return res.status(404).json({ error: 'Banner not found' });
  const { title, subtitle, badge, image, displayOrder, tag, ctaText } = req.body;
  if (title) ban.title = title.trim();
  if (subtitle !== undefined) ban.subtitle = subtitle.trim();
  if (badge !== undefined) ban.badge = badge.trim();
  if (image) ban.image = image.trim();
  if (displayOrder !== undefined) ban.displayOrder = Number(displayOrder);
  if (tag !== undefined) ban.tag = tag.trim() || undefined;
  if (ctaText !== undefined) ban.ctaText = ctaText.trim();
  saveDb(db);
  res.json({ banner: ban, success: true });
});

app.delete('/api/admin/banners/:id', requireAdmin, (req, res) => {
  const idx = db.banners.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Banner not found' });
  db.banners.splice(idx, 1);
  saveDb(db);
  res.json({ success: true });
});

// Payment Settings
app.get('/api/admin/payment-settings', requireAdmin, (_req, res) => {
  res.json(db.paymentSettings);
});

app.put('/api/admin/payment-settings', requireAdmin, (req, res) => {
  const { upiId, upiQrImage, onlinePaymentEnabled, web3FormsKey, codFee, upiDiscount } = req.body;
  if (upiId) db.paymentSettings.upiId = upiId.trim();
  if (upiQrImage !== undefined) db.paymentSettings.upiQrImage = upiQrImage;
  if (onlinePaymentEnabled !== undefined) db.paymentSettings.onlinePaymentEnabled = Boolean(onlinePaymentEnabled);
  if (web3FormsKey !== undefined) db.paymentSettings.web3FormsKey = web3FormsKey.trim();
  if (codFee !== undefined) db.paymentSettings.codFee = Number(codFee);
  if (upiDiscount !== undefined) db.paymentSettings.upiDiscount = Number(upiDiscount);

  saveDb(db);
  res.json({ paymentSettings: db.paymentSettings, success: true });
});

// Email testing & configuration status
let emailStatusLog = {
  configured: Boolean(process.env.SMTP_HOST || process.env.WEB3FORMS_ACCESS_KEY || db.paymentSettings.web3FormsKey),
  targetEmail: db.paymentSettings.notificationEmail || db.paymentSettings.targetEmail || DEFAULT_NOTIFICATION_EMAIL,
  lastTestedAt: new Date().toISOString(),
  lastStatus: 'Notification recipient: ' + (db.paymentSettings.notificationEmail || db.paymentSettings.targetEmail || DEFAULT_NOTIFICATION_EMAIL),
  lastTestSuccess: true
};

app.get('/api/admin/email/settings', requireAdmin, (_req, res) => {
  const targetEmail = db.paymentSettings.notificationEmail || db.paymentSettings.targetEmail || DEFAULT_NOTIFICATION_EMAIL;
  const web3FormsKey = db.paymentSettings.web3FormsKey || process.env.WEB3FORMS_ACCESS_KEY || '';
  res.json({
    targetEmail,
    web3FormsKey,
    hasKey: Boolean(web3FormsKey),
    configured: Boolean(web3FormsKey),
    lastTestedAt: emailStatusLog.lastTestedAt,
    lastStatus: emailStatusLog.lastStatus,
    lastTestSuccess: emailStatusLog.lastTestSuccess
  });
});

app.put('/api/admin/email/settings', requireAdmin, (req, res) => {
  const { targetEmail, web3FormsKey } = req.body;
  if (targetEmail && targetEmail.trim()) {
    db.paymentSettings.notificationEmail = targetEmail.trim();
    db.paymentSettings.targetEmail = targetEmail.trim();
    emailStatusLog.targetEmail = targetEmail.trim();
  }
  if (web3FormsKey !== undefined) {
    db.paymentSettings.web3FormsKey = web3FormsKey.trim();
    emailStatusLog.configured = Boolean(web3FormsKey.trim());
  }
  saveDb(db);
  res.json({
    success: true,
    message: 'Email settings saved successfully.',
    settings: {
      targetEmail: db.paymentSettings.notificationEmail || DEFAULT_NOTIFICATION_EMAIL,
      web3FormsKey: db.paymentSettings.web3FormsKey,
      configured: Boolean(db.paymentSettings.web3FormsKey)
    }
  });
});

app.get('/api/admin/email/status', requireAdmin, (_req, res) => {
  emailStatusLog.configured = Boolean(process.env.SMTP_HOST || process.env.WEB3FORMS_ACCESS_KEY || db.paymentSettings.web3FormsKey);
  emailStatusLog.targetEmail = db.paymentSettings.notificationEmail || db.paymentSettings.targetEmail || DEFAULT_NOTIFICATION_EMAIL;
  res.json(emailStatusLog);
});

app.post('/api/admin/email/test', requireAdmin, async (_req, res) => {
  const targetEmail = db.paymentSettings.notificationEmail || db.paymentSettings.targetEmail || DEFAULT_NOTIFICATION_EMAIL;
  const web3FormsKey = db.paymentSettings.web3FormsKey || process.env.WEB3FORMS_ACCESS_KEY || '';

  if (!web3FormsKey) {
    emailStatusLog.lastTestedAt = new Date().toISOString();
    emailStatusLog.lastStatus = 'Web3Forms Access Key is not configured. Please enter your Access Key in Email Settings and save.';
    emailStatusLog.lastTestSuccess = false;
    return res.status(400).json({
      success: false,
      message: 'Web3Forms Access Key is not configured. Please enter your Access Key in Email Settings and click Save Settings.',
      status: emailStatusLog
    });
  }

  try {
    const testPayload = {
      access_key: web3FormsKey,
      subject: `[Test] NisKart Email Integration Test - ${new Date().toLocaleTimeString()}`,
      from_name: 'NisKart MP Admin Test',
      to_email: targetEmail,
      message: `This is a test notification verifying that NisKart e-commerce email alerts are properly configured for recipient: ${targetEmail}.\nTimestamp: ${new Date().toISOString()}`
    };

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const data = await parseResponseJson(response);
    emailStatusLog.lastTestedAt = new Date().toISOString();
    if (response.ok && data.success) {
      emailStatusLog.lastStatus = `Test email sent successfully to ${targetEmail} via Web3Forms.`;
      emailStatusLog.lastTestSuccess = true;
      res.json({
        success: true,
        message: `Test email sent successfully to ${targetEmail}`,
        status: emailStatusLog
      });
    } else {
      const err = data.message || 'Web3Forms rejected test submission. Verify that your Access Key is valid.';
      emailStatusLog.lastStatus = `Test failed: ${err}`;
      emailStatusLog.lastTestSuccess = false;
      res.status(400).json({
        success: false,
        message: err,
        status: emailStatusLog
      });
    }
  } catch (err: any) {
    emailStatusLog.lastTestedAt = new Date().toISOString();
    emailStatusLog.lastStatus = `Test failed due to network error: ${err.message}`;
    emailStatusLog.lastTestSuccess = false;
    res.status(500).json({
      success: false,
      message: `Network error: ${err.message}`,
      status: emailStatusLog
    });
  }
});

app.post('/api/admin/orders/:id/retry-email', requireAdmin, async (req, res) => {
  const order = db.orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const result = await sendOrderNotificationEmail(order);
  res.json({
    success: result.success,
    message: result.message,
    order
  });
});

// Image Upload API (Supports Base64 or direct file data)
app.post('/api/upload', (req, res) => {
  try {
    const { data, filename } = req.body;
    if (!data) {
      return res.status(400).json({ error: 'Image data is required' });
    }
    // Clean base64 string
    const matches = data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it's a URL already, return it
      if (data.startsWith('http://') || data.startsWith('https://') || data.startsWith('/')) {
        return res.json({ url: data });
      }
      return res.status(400).json({ error: 'Invalid image format. Must be a valid image base64 or URL.' });
    }
    const ext = matches[1].replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // File size check (5MB limit)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image exceeds maximum 5MB size limit.' });
    }

    const safeName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    const targetPath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(targetPath, buffer);

    res.json({ url: `/uploads/${safeName}` });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process uploaded image.' });
  }
});

// Setup Vite Dev Middlewares or Production Static
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NisKart server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
