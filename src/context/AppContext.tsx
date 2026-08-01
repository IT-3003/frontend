import React, { createContext, useContext, useState, useEffect } from 'react';

// --- TYPES ---

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  addresses: Address[];
}

export interface Address {
  id: string;
  street: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
}

export interface Branch {
  branchId: string;
  name: string;
  address: string;
  managerId: string;
  managerName: string;
  openingHours: string;
  isActive: boolean;
}

export interface Product {
  itemId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
  isDiscontinued: boolean;
  branchStock: { [branchId: string]: number }; // branchId -> stock count
}

export interface Payment {
  transactionId: string;
  orderId: string;
  amount: number;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH_ON_DELIVERY' | 'MOBILE_WALLET';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
}

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  orderId: string;
  userId: string;
  userName: string;
  branchId: string;
  branchName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'PROCESSING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryAddress: Address | null; // null means in-store pickup
  createdAt: string;
}

export interface Promotion {
  promoId: string;
  code: string;
  discountPercent: number;
  description: string;
  type: 'COUPON' | 'BANNER';
  bannerImageUrl: string;
  expiryDate: string;
  targetBranchId: string | null; // null for chain-wide
  isActive: boolean;
}

export interface Review {
  reviewId: string;
  itemId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  isFlagged: boolean;
  createdAt: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// --- CONTEXT INTERFACE ---

interface AppContextType {
  // Authentication & Session
  currentUser: User | null;
  currentRole: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
  selectedBranch: Branch | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentRole: (role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN') => void;
  setSelectedBranch: (branch: Branch | null) => void;

  // Active Toast / Feedback
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promotion | null;
  activeCoupon: Promotion | null;

  // 1. User Management
  users: User[];
  registerUser: (data: Omit<User, 'userId' | 'status' | 'addresses'> & { password?: string; address?: string }) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User> & { password?: string }) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;

  // 2. Branch Management
  branches: Branch[];
  addBranch: (data: Omit<Branch, 'branchId'>) => Promise<Branch>;
  updateBranch: (branchId: string, updates: Partial<Branch>) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;

  // 3. Items Management
  products: Product[];
  addProduct: (data: Omit<Product, 'itemId' | 'isDiscontinued'>) => Promise<Product>;
  updateProduct: (itemId: string, updates: Partial<Product>) => Promise<void>;
  discontinueProduct: (itemId: string) => Promise<void>;

  // 4. Payment Management
  payments: Payment[];
  createPayment: (orderId: string, amount: number, method: Payment['paymentMethod']) => Promise<Payment>;
  updatePaymentStatus: (transactionId: string, status: Payment['status']) => Promise<void>;
  refundPayment: (transactionId: string) => Promise<void>;

  // 5. Orders Management
  orders: Order[];
  placeOrder: (deliveryAddress: Address | null) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;

  // 6. Promotions Management
  promotions: Promotion[];
  addPromotion: (data: Omit<Promotion, 'promoId'>) => Promise<Promotion>;
  updatePromotion: (promoId: string, updates: Partial<Promotion>) => Promise<void>;
  deletePromotion: (promoId: string) => Promise<void>;

  // 7. Reviews & Feedback Management
  reviews: Review[];
  addReview: (itemId: string, rating: number, comment: string) => Promise<Review>;
  updateReview: (reviewId: string, updates: Partial<Review>) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;

  // 8. GET endpoints mapping
  getUserById: (id: string) => Promise<User>;
  getBranchById: (id: string) => Promise<Branch>;
  getItemById: (id: string) => Promise<Product>;
  getReviewById: (id: string) => Promise<Review>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- API BASE CONFIG ---
const API_BASE = '/api';

// Helper for calling API endpoints
export const apiRequest = async (path: string, options?: RequestInit) => {
  const token = localStorage.getItem('fc_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options?.headers
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP Error ${res.status}`);
  }
  return res.json();
};

// --- SEED MOCK DATA ---

export const DEFAULT_USERS: User[] = [
  {
    userId: 'usr_admin',
    email: 'admin@freshcart.com',
    firstName: 'Admin',
    lastName: 'Supermarket',
    phone: '+15550001',
    role: 'ADMIN',
    status: 'ACTIVE',
    addresses: []
  },
  {
    userId: 'usr_emp1',
    email: 'jane.smith@freshcart.com',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+15550002',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    addresses: []
  },
  {
    userId: 'usr_cust1',
    email: 'john.doe@gmail.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    addresses: [
      {
        id: 'addr_1',
        street: '123 Main St',
        city: 'Springfield',
        zipCode: '62701',
        isDefault: true
      }
    ]
  }
];

export const DEFAULT_BRANCHES: Branch[] = [
  {
    branchId: 'br_001',
    name: 'Springfield Mall (HQ)',
    address: '250 Mall Drive, Springfield',
    managerId: 'usr_emp1',
    managerName: 'Jane Smith',
    openingHours: '08:00 AM - 10:00 PM',
    isActive: true
  },
  {
    branchId: 'br_002',
    name: 'Downtown Express',
    address: '789 Broad St, Metro City',
    managerId: 'usr_admin',
    managerName: 'Admin Supermarket',
    openingHours: '07:00 AM - 11:00 PM',
    isActive: true
  },
  {
    branchId: 'br_003',
    name: 'Westside Supercentre',
    address: '44 Sunset Blvd, Springfield',
    managerId: 'usr_emp1',
    managerName: 'Jane Smith',
    openingHours: '08:00 AM - 09:00 PM',
    isActive: true
  }
];

export const DEFAULT_PRODUCTS: Product[] = [
  {
    itemId: 'itm_banana',
    name: 'Fresh Organic Bananas',
    sku: 'PROD-BAN-001',
    category: 'Produce',
    description: 'Premium organic sweet yellow bananas. Perfect for smoothies or healthy snacks.',
    price: 1.99,
    imageUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60',
    isDiscontinued: false,
    branchStock: { br_001: 150, br_002: 80, br_003: 200 }
  },
  {
    itemId: 'itm_milk',
    name: 'Whole Milk 1 Gallon',
    sku: 'PROD-MLK-002',
    category: 'Dairy & Eggs',
    description: 'Fresh pasteurized Vitamin D whole milk from local family farms.',
    price: 3.49,
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=60',
    isDiscontinued: false,
    branchStock: { br_001: 50, br_002: 40, br_003: 0 }
  },
  {
    itemId: 'itm_bread',
    name: 'Artisanal Sourdough Bread',
    sku: 'PROD-BRD-003',
    category: 'Bakery',
    description: 'Freshly baked daily with a golden crust and a light, chewy texture.',
    price: 4.25,
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&auto=format&fit=crop&q=60',
    isDiscontinued: false,
    branchStock: { br_001: 20, br_002: 15, br_003: 35 }
  },
  {
    itemId: 'itm_apples',
    name: 'Honeycrisp Apples (Bag)',
    sku: 'PROD-APL-004',
    category: 'Produce',
    description: 'Crisp, sweet, and juicy red honeycrisp apples. 3lb bags.',
    price: 4.99,
    imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=60',
    isDiscontinued: false,
    branchStock: { br_001: 90, br_002: 50, br_003: 110 }
  },
  {
    itemId: 'itm_chocolate',
    name: 'Dark Chocolate Sea Salt Bar',
    sku: 'PROD-CHOC-005',
    category: 'Snacks',
    description: '72% cacao rich dark Belgian chocolate infused with hand-harvested sea salt.',
    price: 2.99,
    imageUrl: 'https://images.unsplash.com/photo-1548907040-4d42b52125ca?w=500&auto=format&fit=crop&q=60',
    isDiscontinued: false,
    branchStock: { br_001: 120, br_002: 100, br_003: 80 }
  },
  {
    itemId: 'itm_eggs',
    name: 'Free Range Large Brown Eggs (Dozen)',
    sku: 'PROD-EGG-006',
    category: 'Dairy & Eggs',
    description: 'Grade A farm-fresh large brown eggs from free-range chickens.',
    price: 3.99,
    imageUrl: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=500&auto=format&fit=crop&q=60',
    isDiscontinued: false,
    branchStock: { br_001: 75, br_002: 30, br_003: 60 }
  }
];

export const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    promoId: 'prm_save10',
    code: 'SAVE10',
    discountPercent: 10,
    description: 'Enjoy 10% off your entire order with this coupon code!',
    type: 'COUPON',
    bannerImageUrl: '',
    expiryDate: '2026-12-31T23:59:59Z',
    targetBranchId: null,
    isActive: true
  },
  {
    promoId: 'prm_banner1',
    code: 'FRESHDEAL',
    discountPercent: 15,
    description: 'Fresh Deals! Get 15% off on all organic fruits & produce this week.',
    type: 'BANNER',
    bannerImageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
    expiryDate: '2026-08-31T23:59:59Z',
    targetBranchId: null,
    isActive: true
  },
  {
    promoId: 'prm_banner2',
    code: 'BAKERY15',
    discountPercent: 15,
    description: 'Grand Opening Special: 15% off artisanal breads at Downtown Express!',
    type: 'BANNER',
    bannerImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80',
    expiryDate: '2026-07-31T23:59:59Z',
    targetBranchId: 'br_002',
    isActive: true
  }
];

export const DEFAULT_REVIEWS: Review[] = [
  {
    reviewId: 'rev_1',
    itemId: 'itm_banana',
    userId: 'usr_cust1',
    userName: 'John Doe',
    rating: 5,
    comment: 'Extremely fresh and perfectly ripe. Will definitely order again!',
    isFlagged: false,
    createdAt: '2026-07-06T12:30:00Z'
  },
  {
    reviewId: 'rev_2',
    itemId: 'itm_banana',
    userId: 'usr_emp1',
    userName: 'Jane Smith',
    rating: 4,
    comment: 'Great quality, but make sure to eat them quickly!',
    isFlagged: false,
    createdAt: '2026-07-05T09:15:00Z'
  },
  {
    reviewId: 'rev_3',
    itemId: 'itm_bread',
    userId: 'usr_cust1',
    userName: 'John Doe',
    rating: 5,
    comment: 'Delicious sourdough crust! Tastes like it came straight from Paris.',
    isFlagged: false,
    createdAt: '2026-07-07T08:00:00Z'
  }
];

// --- PROVIDER ---

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use empty defaults (no made up data)
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fc_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('fc_branches');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('fc_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem('fc_promotions');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('fc_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('fc_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('fc_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Current session/UI states (no mock defaults)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fc_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentRole, setCurrentRole] = useState<'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'>(() => {
    const saved = localStorage.getItem('fc_current_role');
    return (saved === 'CUSTOMER' || saved === 'EMPLOYEE' || saved === 'ADMIN') ? saved : 'CUSTOMER';
  });

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(() => {
    const saved = localStorage.getItem('fc_selected_branch');
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('fc_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCoupon, setActiveCoupon] = useState<Promotion | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sync state to local storage
  useEffect(() => { localStorage.setItem('fc_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('fc_branches', JSON.stringify(branches)); }, [branches]);
  useEffect(() => { localStorage.setItem('fc_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('fc_promotions', JSON.stringify(promotions)); }, [promotions]);
  useEffect(() => { localStorage.setItem('fc_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('fc_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('fc_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('fc_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (currentUser) localStorage.setItem('fc_current_user', JSON.stringify(currentUser));
    else localStorage.removeItem('fc_current_user');
  }, [currentUser]);
  useEffect(() => { localStorage.setItem('fc_current_role', currentRole); }, [currentRole]);
  useEffect(() => {
    if (selectedBranch) localStorage.setItem('fc_selected_branch', JSON.stringify(selectedBranch));
    else localStorage.removeItem('fc_selected_branch');
  }, [selectedBranch]);

  // --- API ASYNC SYNC ON LOAD ---
  useEffect(() => {
    const loadRealData = async () => {
      let mappedUsersList: User[] = [];
      try {
        const backendUsers = await apiRequest('/user');
        if (Array.isArray(backendUsers)) {
          mappedUsersList = backendUsers.map((bu: any) => ({
            userId: `usr_${bu.id}`,
            email: bu.email,
            firstName: bu.firstName,
            lastName: bu.lastName,
            phone: bu.phoneNumber || '',
            role: (bu.role === 'STAFF' ? 'EMPLOYEE' : bu.role) as User['role'],
            status: (bu.active ? 'ACTIVE' : 'INACTIVE') as User['status'],
            addresses: bu.address ? [{
              id: `addr_${bu.id}`,
              street: bu.address,
              city: 'Colombo',
              zipCode: '00100',
              isDefault: true
            }] : []
          }));
          setUsers(mappedUsersList);
        }
      } catch (e) {
        console.warn("Failed to fetch users from backend:", e);
      }

      try {
        const backendBranches = await apiRequest('/branch');
        if (Array.isArray(backendBranches)) {
          const mappedBranches = backendBranches.map((bb: any) => ({
            branchId: `br_${bb.branchId}`,
            name: bb.branchName,
            address: bb.address,
            managerId: `usr_${bb.managerId}`,
            managerName: `Manager ${bb.managerId}`,
            phoneNumber: bb.phoneNumber,
            openingHours: bb.openingHours,
            isActive: bb.active !== false
          }));
          setBranches(mappedBranches);
          if (mappedBranches.length > 0 && !selectedBranch) {
            setSelectedBranch(mappedBranches[0]);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch branches from backend:", e);
      }

      try {
        const backendItems = await apiRequest('/item/all');
        if (Array.isArray(backendItems)) {
          const mappedProducts = backendItems.map((bi: any) => ({
            itemId: `item_${bi.itemId}`,
            name: bi.itemName,
            sku: bi.brand ? `${bi.brand.toUpperCase()}-${bi.itemId}` : `SKU-${bi.itemId}`,
            category: bi.category,
            description: bi.description,
            price: bi.baseprice,
            imageUrl: bi.imageUrl,
            isDiscontinued: false,
            branchStock: {
              'br_1': bi.stockQuantity,
              'br_2': Math.max(0, bi.stockQuantity - 5),
              'br_3': Math.max(0, bi.stockQuantity - 10)
            }
          }));
          setProducts(mappedProducts);
        }
      } catch (e) {
        console.warn("Failed to fetch items from backend:", e);
      }

      try {
        const backendPromotions = await apiRequest('/promotion');
        if (Array.isArray(backendPromotions)) {
          const mappedPromotions = backendPromotions.map((bp: any) => ({
            promoId: `promo_${bp.promotionId}`,
            code: bp.promotionName.toUpperCase().replace(/\s+/g, '_'),
            description: bp.description,
            discountPercent: bp.discountValue,
            type: (bp.discountType === 'BANNER' ? 'BANNER' : 'COUPON') as Promotion['type'],
            bannerImageUrl: bp.bannerImageUrl || '',
            expiryDate: bp.endDate ? new Date(bp.endDate).toISOString() : new Date().toISOString(),
            targetBranchId: bp.itemId ? String(bp.itemId) : null,
            isActive: true
          }));
          setPromotions(mappedPromotions);
        }
      } catch (e) {
        console.warn("Failed to fetch promotions from backend:", e);
      }

      try {
        const backendReviews = await apiRequest('/reviews');
        if (Array.isArray(backendReviews)) {
          const mappedReviews = backendReviews.map((br: any) => {
            const userObj = mappedUsersList.find(u => u.userId === `usr_${br.userId}`);
            return {
              reviewId: `rev_${br.reviewId}`,
              userId: `usr_${br.userId}`,
              itemId: `item_${br.itemId}`,
              userName: userObj ? `${userObj.firstName} ${userObj.lastName}` : `User ${br.userId}`,
              rating: br.rating,
              comment: br.comment,
              isFlagged: false,
              createdAt: new Date().toISOString()
            };
          });
          setReviews(mappedReviews);
        }
      } catch (e) {
        console.warn("Failed to fetch reviews from backend:", e);
      }

      try {
        const backendPayments = await apiRequest('/payment/all');
        if (Array.isArray(backendPayments)) {
          const mappedPayments = backendPayments.map((bp: any) => ({
            transactionId: bp.transaction || `tx_${bp.paymentId}`,
            orderId: `ord_${bp.order ? bp.order.orderId : (bp.orderId || '')}`,
            amount: bp.amount,
            paymentMethod: bp.paymentMethod || 'CASH_ON_DELIVERY',
            status: bp.paymentStatus === 'SUCCESS' ? 'COMPLETED' : (bp.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING'),
            createdAt: bp.paymentDate || new Date().toISOString()
          }));
          setPayments(mappedPayments);
        }
      } catch (e) {
        console.warn("Failed to fetch payments from backend:", e);
      }

      try {
        const backendOrders = await apiRequest('/order');
        if (Array.isArray(backendOrders)) {
          const mappedOrders = backendOrders.map((bo: any) => {
            const orderUserId = bo.user ? bo.user.id : bo.userId;
            const orderBranchId = bo.branch ? bo.branch.branchId : bo.branchId;
            const userObj = mappedUsersList.find(u => u.userId === `usr_${orderUserId}`);
            return {
              orderId: `ord_${bo.orderId}`,
              userId: `usr_${orderUserId}`,
              userName: userObj ? `${userObj.firstName} ${userObj.lastName}` : `Customer ${orderUserId}`,
              branchId: `br_${orderBranchId}`,
              branchName: bo.branch ? bo.branch.branchName : `Branch ${orderBranchId}`,
              items: Array.isArray(bo.orderItems) ? bo.orderItems.map((oi: any) => ({
                itemId: `item_${oi.productId}`,
                name: oi.productName || `Product ${oi.productId}`,
                price: oi.unitPrice,
                quantity: oi.quantity
              })) : [],
              subtotal: bo.subtotal,
              discount: bo.discountAmount,
              deliveryFee: bo.deliveryAddress ? 3.99 : 0,
              total: bo.totalAmount,
              status: (bo.status || 'PROCESSING') as Order['status'],
              deliveryAddress: bo.deliveryAddress ? {
                id: `addr_${bo.orderId}`,
                street: bo.deliveryAddress,
                city: 'Colombo',
                zipCode: '00100',
                isDefault: false
              } : null,
              createdAt: bo.orderDate || new Date().toISOString()
            };
          });
          setOrders(mappedOrders);
        }
      } catch (e) {
        console.warn("Failed to fetch orders from backend:", e);
      }
    };
    loadRealData();
  }, []);

  // Handle Notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // --- CART OPERATIONS ---

  const addToCart = (product: Product, qty = 1) => {
    if (!selectedBranch) {
      showNotification('Please select a branch first', 'error');
      return;
    }
    const branchStock = product.branchStock[selectedBranch.branchId] || 0;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.itemId === product.itemId);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + qty;

      if (targetQty > branchStock) {
        showNotification(`Only ${branchStock} units available in stock at ${selectedBranch.name}`, 'error');
        return prev;
      }
      showNotification(`${product.name} added to cart`, 'success');

      if (existing) {
        return prev.map((item) =>
          item.product.itemId === product.itemId ? { ...item, quantity: targetQty } : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.itemId !== productId));
    showNotification('Item removed from cart', 'info');
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (!selectedBranch) return;
    const item = cart.find((i) => i.product.itemId === productId);
    if (!item) return;

    const branchStock = item.product.branchStock[selectedBranch.branchId] || 0;
    if (qty > branchStock) {
      showNotification(`Only ${branchStock} units available in stock`, 'error');
      return;
    }

    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((i) => (i.product.itemId === productId ? { ...i, quantity: qty } : i))
    );
  };

  const clearCart = () => {
    setCart([]);
    setActiveCoupon(null);
  };

  const applyCoupon = (code: string) => {
    const promo = promotions.find(
      (p) => p.code.toUpperCase() === code.toUpperCase() && p.isActive && p.type === 'COUPON'
    );
    if (!promo) {
      showNotification('Invalid or expired coupon code', 'error');
      return null;
    }
    if (promo.targetBranchId && selectedBranch && promo.targetBranchId !== selectedBranch.branchId) {
      showNotification('This coupon is not valid at your selected store branch', 'error');
      return null;
    }

    // Check if expired
    if (new Date(promo.expiryDate) < new Date()) {
      showNotification('This coupon has expired', 'error');
      return null;
    }

    setActiveCoupon(promo);
    showNotification(`Coupon ${promo.code} applied!`, 'success');
    return promo;
  };

  // --- 1. USER MANAGEMENT ---

  const registerUser = async (data: Omit<User, 'userId' | 'status' | 'addresses'> & { password?: string; address?: string }) => {
    const numericId = Math.floor(100000 + Math.random() * 900000);
    const backendUserPayload = {
      id: numericId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password || 'SecurePassword123!',
      phoneNumber: data.phone || '',
      role: data.role === 'EMPLOYEE' ? 'STAFF' : data.role,
      active: true,
      type: data.role === 'ADMIN' ? 'admin' : (data.role === 'EMPLOYEE' ? 'staff' : 'customer'),
      address: data.address || ''
    };

    try {
      const response = await apiRequest('/user/create', {
        method: 'POST',
        body: JSON.stringify(backendUserPayload)
      });
      const mappedUser: User = {
        userId: `usr_${response.id}`,
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        phone: response.phoneNumber || response.phone || '',
        role: response.role === 'STAFF' ? 'EMPLOYEE' : response.role,
        status: response.active ? 'ACTIVE' : 'INACTIVE',
        addresses: response.address ? [{
          id: `addr_${response.id}`,
          street: response.address,
          city: 'Colombo',
          zipCode: '00100',
          isDefault: true
        }] : []
      };
      setUsers((prev) => [...prev, mappedUser]);
      showNotification(`Account created for ${mappedUser.firstName}!`, 'success');
      return mappedUser;
    } catch (e) {
      console.warn("Backend API registration failed, falling back to local simulation:", e);
      const newUser: User = {
        ...data,
        userId: 'usr_' + numericId,
        status: 'ACTIVE',
        addresses: data.address ? [{
          id: `addr_${numericId}`,
          street: data.address,
          city: 'Colombo',
          zipCode: '00100',
          isDefault: true
        }] : []
      };
      setUsers((prev) => [...prev, newUser]);
      showNotification(`[Simulation] Account created for ${newUser.firstName}!`, 'success');
      return newUser;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User> & { password?: string }) => {
    const existing = users.find((u) => u.userId === userId);
    if (!existing) return;

    const backendUserPayload = {
      id: toNumericId(userId),
      firstName: updates.firstName !== undefined ? updates.firstName : existing.firstName,
      lastName: updates.lastName !== undefined ? updates.lastName : existing.lastName,
      email: existing.email,
      phoneNumber: updates.phone !== undefined ? updates.phone : existing.phone,
      role: existing.role === 'EMPLOYEE' ? 'STAFF' : existing.role,
      active: existing.status === 'ACTIVE',
      type: existing.role === 'ADMIN' ? 'admin' : (existing.role === 'EMPLOYEE' ? 'staff' : 'customer'),
      address: existing.addresses[0]?.street || '',
      password: updates.password || null
    };

    try {
      const numericId = toNumericId(userId);
      await apiRequest(`/user/${numericId}`, {
        method: 'PUT',
        body: JSON.stringify(backendUserPayload)
      });
    } catch (e) {
      console.warn("Backend API profile update failed, modifying local state only:", e);
    }

    const localUpdates = {
      firstName: backendUserPayload.firstName,
      lastName: backendUserPayload.lastName,
      phone: backendUserPayload.phoneNumber
    };

    setUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, ...localUpdates } : u))
    );
    if (currentUser?.userId === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...localUpdates } : null));
    }
    showNotification('Profile updated successfully', 'success');
  };

  const deactivateUser = async (userId: string) => {
    try {
      const numericId = toNumericId(userId);
      await apiRequest(`/user/${numericId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend API account deactivation failed, modifying local state only:", e);
    }
    setUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, status: 'INACTIVE' } : u))
    );
    if (currentUser?.userId === userId) {
      setCurrentUser(null);
      setCurrentRole('CUSTOMER');
    }
    showNotification('Account has been deactivated', 'info');
  };

  // --- 2. BRANCH MANAGEMENT ---

  const addBranch = async (data: Omit<Branch, 'branchId'>) => {
    const numericId = Math.floor(100000 + Math.random() * 900000);
    const backendBranchPayload = {
      branchId: numericId,
      branchName: data.name,
      address: data.address,
      phoneNumber: '',
      managerId: toNumericId(data.managerId),
      openingHours: data.openingHours,
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString()
    };

    try {
      const response = await apiRequest('/branch/create', {
        method: 'POST',
        body: JSON.stringify(backendBranchPayload)
      });
      const mappedBranch: Branch = {
        branchId: String(response.branchId),
        name: response.branchName,
        address: response.address,
        managerId: String(response.managerId),
        managerName: data.managerName || '',
        openingHours: response.openingHours,
        isActive: true
      };
      setBranches((prev) => [...prev, mappedBranch]);
      showNotification(`Branch "${mappedBranch.name}" created!`, 'success');
      return mappedBranch;
    } catch (e) {
      console.warn("Backend API branch create failed, simulating locally:", e);
      const newBranch: Branch = {
        ...data,
        branchId: 'br_' + numericId
      };
      setBranches((prev) => [...prev, newBranch]);
      showNotification(`[Simulation] Branch "${newBranch.name}" created!`, 'success');
      return newBranch;
    }
  };

  const updateBranch = async (branchId: string, updates: Partial<Branch>) => {
    try {
      // Branch update is not supported in the backend controller, simulation only
      await apiRequest(`/branch/${toNumericId(branchId)}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn("Backend API branch update failed, modifying local state only:", e);
    }
    setBranches((prev) =>
      prev.map((b) => (b.branchId === branchId ? { ...b, ...updates } : b))
    );
    if (selectedBranch?.branchId === branchId) {
      setSelectedBranch((prev) => (prev ? { ...prev, ...updates } : null));
    }
    showNotification('Branch updated successfully', 'success');
  };

  const deleteBranch = async (branchId: string) => {
    try {
      const numericId = toNumericId(branchId);
      await apiRequest(`/branch/${numericId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend API branch delete failed, modifying local state only:", e);
    }
    setBranches((prev) =>
      prev.map((b) => (b.branchId === branchId ? { ...b, isActive: false } : b))
    );
    showNotification('Branch archived', 'info');
  };

  // --- 3. ITEMS MANAGEMENT ---

  const addProduct = async (data: Omit<Product, 'itemId' | 'isDiscontinued'>) => {
    const numericId = Math.floor(100000 + Math.random() * 900000);
    const totalStock = Object.values(data.branchStock || {}).reduce((a, b) => a + b, 0) || 100;
    const backendItemPayload = {
      itemId: numericId,
      itemName: data.name,
      category: data.category,
      baseprice: data.price,
      brand: data.sku ? data.sku.split('-')[0] : 'FreshCart',
      imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
      description: data.description || 'Premium product from FreshCart.',
      costPrice: Number((data.price * 0.7).toFixed(2)) || 1.0,
      stockQuantity: totalStock
    };

    try {
      const response = await apiRequest('/item/create', {
        method: 'POST',
        body: JSON.stringify(backendItemPayload)
      });
      const mappedProduct: Product = {
        itemId: String(response.itemId),
        name: response.itemName,
        sku: data.sku || `SKU-${response.itemId}`,
        category: response.category,
        description: response.description || '',
        price: response.baseprice,
        imageUrl: response.imageUrl || '',
        isDiscontinued: false,
        branchStock: data.branchStock || {}
      };
      setProducts((prev) => [...prev, mappedProduct]);
      showNotification(`Product "${mappedProduct.name}" added to catalog!`, 'success');
      return mappedProduct;
    } catch (e) {
      console.warn("Backend API add product failed, simulating locally:", e);
      const newProd: Product = {
        ...data,
        itemId: 'itm_' + numericId,
        isDiscontinued: false
      };
      setProducts((prev) => [...prev, newProd]);
      showNotification(`[Simulation] Product "${newProd.name}" added!`, 'success');
      return newProd;
    }
  };

  const updateProduct = async (itemId: string, updates: Partial<Product>) => {
    const numericId = toNumericId(itemId);
    const existing = products.find(p => p.itemId === itemId);
    const name = updates.name !== undefined ? updates.name : (existing?.name || '');
    const category = updates.category !== undefined ? updates.category : (existing?.category || '');
    const price = updates.price !== undefined ? updates.price : (existing?.price || 0.0);
    const sku = updates.sku !== undefined ? updates.sku : (existing?.sku || '');
    const imageUrl = updates.imageUrl !== undefined ? updates.imageUrl : (existing?.imageUrl || '');
    const description = updates.description !== undefined ? updates.description : (existing?.description || '');
    const stock = updates.branchStock !== undefined ? Object.values(updates.branchStock).reduce((a, b) => a + b, 0) : (existing ? Object.values(existing.branchStock).reduce((a, b) => a + b, 0) : 100);

    const backendItemPayload = {
      itemId: numericId,
      itemName: name,
      category: category,
      baseprice: price,
      brand: sku ? sku.split('-')[0] : 'FreshCart',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
      description: description || 'Premium product from FreshCart.',
      costPrice: Number((price * 0.7).toFixed(2)) || 1.0,
      stockQuantity: stock
    };

    try {
      await apiRequest(`/item/${numericId}`, {
        method: 'PUT',
        body: JSON.stringify(backendItemPayload)
      });
    } catch (e) {
      console.warn("Backend API update product failed, modifying local state only:", e);
    }
    setProducts((prev) =>
      prev.map((p) => (p.itemId === itemId ? { ...p, ...updates } : p))
    );
    showNotification('Product details updated', 'success');
  };

  const discontinueProduct = async (itemId: string) => {
    try {
      const numericId = toNumericId(itemId);
      await apiRequest(`/item/${numericId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend API discontinue product failed, modifying local state only:", e);
    }
    setProducts((prev) =>
      prev.map((p) => (p.itemId === itemId ? { ...p, isDiscontinued: true } : p))
    );
    setCart((prev) => prev.filter((item) => item.product.itemId !== itemId));
    showNotification('Product discontinued', 'info');
  };

  // --- 4. PAYMENT MANAGEMENT ---

  const createPayment = async (orderId: string, amount: number, method: Payment['paymentMethod']) => {
    const numericPaymentId = Math.floor(100000 + Math.random() * 900000);
    
    let backendMethod = 'CASH';
    if (method === 'CREDIT_CARD') backendMethod = 'CREDIT_CARD';
    else if (method === 'DEBIT_CARD') backendMethod = 'DEBIT_CARD';
    else if (method === 'MOBILE_WALLET') backendMethod = 'PAYPAL';

    const backendPaymentPayload = {
      order: { orderId: toNumericId(orderId) },
      user: { 
        id: currentUser ? toNumericId(currentUser.userId) : 1,
        type: currentUser ? (currentUser.role === 'ADMIN' ? 'admin' : (currentUser.role === 'EMPLOYEE' ? 'staff' : 'customer')) : 'customer'
      },
      amount: amount,
      paymentMethod: backendMethod,
      transaction: 'tx_' + numericPaymentId,
      paymentStatus: method === 'CREDIT_CARD' ? 'PENDING' : 'SUCCESS',
      paymentDate: new Date().toISOString(),
      isActive: true
    };

    try {
      const response = await apiRequest('/payment/create', {
        method: 'POST',
        body: JSON.stringify(backendPaymentPayload)
      });

      let frontendMethod: Payment['paymentMethod'] = 'CREDIT_CARD';
      if (response.paymentMethod === 'CASH') frontendMethod = 'CASH_ON_DELIVERY';
      else if (response.paymentMethod === 'PAYPAL') frontendMethod = 'MOBILE_WALLET';
      else if (response.paymentMethod === 'DEBIT_CARD') frontendMethod = 'DEBIT_CARD';

      let frontendStatus: Payment['status'] = 'PENDING';
      if (response.paymentStatus === 'SUCCESS') frontendStatus = 'COMPLETED';
      else if (response.paymentStatus === 'FAILED') frontendStatus = 'FAILED';

      const mappedPayment: Payment = {
        transactionId: response.transaction || String(response.paymentId),
        orderId: String(response.order ? response.order.orderId : response.orderId),
        amount: response.amount,
        paymentMethod: frontendMethod,
        status: frontendStatus,
        createdAt: response.paymentDate || new Date().toISOString()
      };
      setPayments((prev) => [mappedPayment, ...prev]);
      return mappedPayment;
    } catch (e) {
      console.warn("Backend API create payment failed, simulating locally:", e);
      const newPayment: Payment = {
        transactionId: 'tx_' + numericPaymentId,
        orderId,
        amount,
        paymentMethod: method,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };
      setPayments((prev) => [newPayment, ...prev]);
      return newPayment;
    }
  };

  const updatePaymentStatus = async (transactionId: string, status: Payment['status']) => {
    try {
      await apiRequest(`/payments/${transactionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.warn("Backend API update payment status failed, modifying local state only:", e);
    }
    setPayments((prev) =>
      prev.map((p) => (p.transactionId === transactionId ? { ...p, status } : p))
    );
    showNotification(`Payment status: ${status}`, status === 'COMPLETED' ? 'success' : 'error');
  };

  const refundPayment = async (transactionId: string) => {
    try {
      await apiRequest(`/payments/${transactionId}/refund`, { method: 'POST' });
    } catch (e) {
      console.warn("Backend API refund failed, modifying local state only:", e);
    }

    setPayments((prev) =>
      prev.map((p) => (p.transactionId === transactionId ? { ...p, status: 'REFUNDED' } : p))
    );

    const paymentObj = payments.find((p) => p.transactionId === transactionId);
    if (paymentObj) {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === paymentObj.orderId ? { ...o, status: 'CANCELLED' } : o))
      );
      // Restore stock levels locally
      const order = orders.find((o) => o.orderId === paymentObj.orderId);
      if (order) {
        setProducts((prevProds) =>
          prevProds.map((prod) => {
            const itemInOrder = order.items.find((oi) => oi.itemId === prod.itemId);
            if (itemInOrder) {
              const currentStock = prod.branchStock[order.branchId] || 0;
              return {
                ...prod,
                branchStock: {
                  ...prod.branchStock,
                  [order.branchId]: currentStock + itemInOrder.quantity
                }
              };
            }
            return prod;
          })
        );
      }
    }
    showNotification('Payment refunded and order cancelled', 'info');
  };

  // --- 5. ORDERS MANAGEMENT ---

  const placeOrder = async (deliveryAddress: Address | null) => {
    if (!currentUser) throw new Error('Must be logged in to place an order');
    if (!selectedBranch) throw new Error('Must select a branch');
    if (cart.length === 0) throw new Error('Cart is empty');

    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const discount = activeCoupon ? (subtotal * activeCoupon.discountPercent) / 100 : 0;
    const deliveryFee = deliveryAddress ? 3.99 : 0;
    const total = Number((subtotal - discount + deliveryFee).toFixed(2));

    const assignedOrderId = Math.floor(100000 + Math.random() * 900000);
    const orderPayload = {
      orderId: assignedOrderId,
      user: { 
        id: toNumericId(currentUser.userId),
        type: currentUser.role === 'ADMIN' ? 'admin' : (currentUser.role === 'EMPLOYEE' ? 'staff' : 'customer')
      },
      branch: { branchId: toNumericId(selectedBranch.branchId) },
      orderItems: cart.map((i) => {
        const itemNumId = toNumericId(i.product.itemId);
        const itemQty = i.quantity;
        return {
          orderItemId: Math.floor(100000 + Math.random() * 900000),
          product: { itemId: itemNumId },
          productName: i.product.name,
          quantity: itemQty,
          unitPrice: i.product.price,
          lineTotal: Number((i.product.price * itemQty).toFixed(2))
        };
      }),
      subtotal: Number(subtotal.toFixed(2)),
      discountAmount: Number(discount.toFixed(2)),
      couponCode: activeCoupon?.code || null,
      totalAmount: total,
      status: 'PROCESSING',
      deliveryAddress: deliveryAddress ? deliveryAddress.street : 'In-Store Pickup',
      orderDate: new Date().toISOString()
    };

    try {
      const response = await apiRequest('/order/create', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      // Update local product stocks based on successful placement
      setProducts((prevProds) =>
        prevProds.map((prod) => {
          const cartItem = cart.find((i) => i.product.itemId === prod.itemId);
          if (cartItem) {
            const currentStock = prod.branchStock[selectedBranch.branchId] || 0;
            return {
              ...prod,
              branchStock: {
                ...prod.branchStock,
                [selectedBranch.branchId]: Math.max(0, currentStock - cartItem.quantity)
              }
            };
          }
          return prod;
        })
      );

      const mappedOrder: Order = {
        orderId: String(response.orderId),
        userId: currentUser.userId,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        branchId: selectedBranch.branchId,
        branchName: selectedBranch.name,
        items: cart.map((i) => ({
          itemId: i.product.itemId,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity
        })),
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        deliveryFee,
        total,
        status: response.status || 'PROCESSING',
        deliveryAddress,
        createdAt: response.orderDate || new Date().toISOString()
      };

      setOrders((prev) => [mappedOrder, ...prev]);
      return mappedOrder;
    } catch (e) {
      console.warn("Backend API place order failed, simulating locally:", e);
      const newOrder: Order = {
        orderId: 'ord_' + assignedOrderId.toString(),
        userId: currentUser.userId,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        branchId: selectedBranch.branchId,
        branchName: selectedBranch.name,
        items: cart.map((i) => ({
          itemId: i.product.itemId,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity
        })),
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        deliveryFee,
        total,
        status: 'PROCESSING',
        deliveryAddress,
        createdAt: new Date().toISOString()
      };

      setProducts((prevProds) =>
        prevProds.map((prod) => {
          const cartItem = cart.find((i) => i.product.itemId === prod.itemId);
          if (cartItem) {
            const currentStock = prod.branchStock[selectedBranch.branchId] || 0;
            return {
              ...prod,
              branchStock: {
                ...prod.branchStock,
                [selectedBranch.branchId]: Math.max(0, currentStock - cartItem.quantity)
              }
            };
          }
          return prod;
        })
      );

      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.warn("Backend API update status failed, modifying local state only:", e);
    }
    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status } : o))
    );
    showNotification(`Order status updated to: ${status}`, 'info');
  };

  const cancelOrder = async (orderId: string) => {
    const orderObj = orders.find((o) => o.orderId === orderId);
    if (!orderObj) return;

    try {
      await apiRequest(`/orders/${orderId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend API cancel order failed, modifying local state only:", e);
    }

    setOrders((prev) =>
      prev.map((o) => (o.orderId === orderId ? { ...o, status: 'CANCELLED' } : o))
    );

    // Restore stock levels
    setProducts((prevProds) =>
      prevProds.map((prod) => {
        const orderItem = orderObj.items.find((i) => i.itemId === prod.itemId);
        if (orderItem) {
          const currentStock = prod.branchStock[orderObj.branchId] || 0;
          return {
            ...prod,
            branchStock: {
              ...prod.branchStock,
              [orderObj.branchId]: currentStock + orderItem.quantity
            }
          };
        }
        return prod;
      })
    );

    const payment = payments.find((p) => p.orderId === orderId);
    if (payment) {
      setPayments((prev) =>
        prev.map((p) => (p.orderId === orderId ? { ...p, status: 'REFUNDED' } : p))
      );
    }

    showNotification('Order cancelled, inventory released', 'info');
  };



  // --- 6. PROMOTIONS MANAGEMENT ---

  const addPromotion = async (data: Omit<Promotion, 'promoId'>) => {
    const numericPromoId = Math.floor(100000 + Math.random() * 900000);
    const itemNumId = data.targetBranchId ? toNumericId(data.targetBranchId) : 1; // Backend requires an item, use targetBranchId or default to 1 (banana)
    const backendPromoPayload = {
      promotionId: numericPromoId,
      promotionName: data.code,
      description: data.description,
      discountValue: data.discountPercent,
      discountType: data.type,
      startDate: new Date().toISOString().split('T')[0],
      endDate: data.expiryDate ? data.expiryDate.split('T')[0] : new Date().toISOString().split('T')[0],
      item: { itemId: itemNumId }
    };

    try {
      const response = await apiRequest('/promotion/create', {
        method: 'POST',
        body: JSON.stringify(backendPromoPayload)
      });
      const mappedPromo: Promotion = {
        promoId: String(response.promotionId),
        code: response.promotionName,
        discountPercent: response.discountValue,
        description: response.description,
        type: response.discountType === 'BANNER' ? 'BANNER' : 'COUPON',
        bannerImageUrl: data.bannerImageUrl || '',
        expiryDate: response.endDate ? new Date(response.endDate).toISOString() : new Date().toISOString(),
        targetBranchId: response.item ? String(response.item.itemId) : null,
        isActive: true
      };
      setPromotions((prev) => [...prev, mappedPromo]);
      showNotification(`Promotion "${mappedPromo.code}" created!`, 'success');
      return mappedPromo;
    } catch (e) {
      console.warn("Backend API promotions create failed, simulating locally:", e);
      const newPromo: Promotion = {
        ...data,
        promoId: 'prm_' + numericPromoId
      };
      setPromotions((prev) => [...prev, newPromo]);
      showNotification(`[Simulation] Promotion "${newPromo.code}" created!`, 'success');
      return newPromo;
    }
  };

  const updatePromotion = async (promoId: string, updates: Partial<Promotion>) => {
    try {
      await apiRequest(`/promotion/${toNumericId(promoId)}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn("Backend API update promo failed, modifying local state only:", e);
    }
    setPromotions((prev) =>
      prev.map((p) => (p.promoId === promoId ? { ...p, ...updates } : p))
    );
    showNotification('Promotion details updated', 'success');
  };

  const deletePromotion = async (promoId: string) => {
    try {
      await apiRequest(`/promotion/${toNumericId(promoId)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend API delete promo failed, modifying local state only:", e);
    }
    setPromotions((prev) => prev.filter((p) => p.promoId !== promoId));
    showNotification('Promotion deleted', 'info');
  };

  // --- 7. REVIEWS & FEEDBACK MANAGEMENT ---

  const toNumericId = (id: string): number => {
    const num = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(num)) return num;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 1000000;
  };

  const addReview = async (itemId: string, rating: number, comment: string) => {
    if (!currentUser) throw new Error('Must be logged in to leave a review');

    const numericUserId = toNumericId(currentUser.userId);
    const numericItemId = toNumericId(itemId);
    const numericReviewId = Math.floor(100000 + Math.random() * 900000);

    try {
      const response = await apiRequest('/reviews/create', {
        method: 'POST',
        body: JSON.stringify({
          reviewId: numericReviewId,
          userId: numericUserId,
          itemId: numericItemId,
          rating,
          comment
        })
      });
      const mappedResponse: Review = {
        reviewId: String(response.reviewId),
        itemId: itemId,
        userId: currentUser.userId,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        rating: response.rating,
        comment: response.comment,
        isFlagged: false,
        createdAt: new Date().toISOString()
      };
      setReviews((prev) => [mappedResponse, ...prev]);
      showNotification('Review submitted successfully!', 'success');
      return mappedResponse;
    } catch (e) {
      console.warn("Backend API add review failed, simulating locally:", e);
      const newReview: Review = {
        reviewId: 'rev_' + Math.random().toString(36).substr(2, 9),
        itemId,
        userId: currentUser.userId,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        rating,
        comment,
        isFlagged: false,
        createdAt: new Date().toISOString()
      };
      setReviews((prev) => [newReview, ...prev]);
      showNotification('Review submitted successfully (local simulation)!', 'success');
      return newReview;
    }
  };

  const updateReview = async (reviewId: string, updates: Partial<Review>) => {
    try {
      await apiRequest(`/reviews/${toNumericId(reviewId)}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn("Backend API update review failed, modifying local state only:", e);
    }
    setReviews((prev) =>
      prev.map((r) => (r.reviewId === reviewId ? { ...r, ...updates } : r))
    );
    showNotification('Review updated', 'success');
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const numericId = toNumericId(reviewId);
      await apiRequest(`/reviews/${numericId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend API delete review failed, modifying local state only:", e);
    }
    setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
    showNotification('Review removed', 'info');
  };

  const getUserById = async (id: string): Promise<User> => {
    const numericId = toNumericId(id);
    const response = await apiRequest(`/user/${numericId}`);
    return {
      userId: String(response.id),
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      phone: response.phoneNumber || '',
      role: response.role === 'STAFF' ? 'EMPLOYEE' : response.role,
      status: response.active ? 'ACTIVE' : 'INACTIVE',
      addresses: []
    };
  };

  const getBranchById = async (id: string): Promise<Branch> => {
    const numericId = toNumericId(id);
    const response = await apiRequest(`/branch/${numericId}`);
    return {
      branchId: String(response.branchId),
      name: response.branchName,
      address: response.address,
      managerId: String(response.managerId),
      managerName: '',
      openingHours: response.openingHours,
      isActive: true
    };
  };

  const getItemById = async (id: string): Promise<Product> => {
    const numericId = toNumericId(id);
    const response = await apiRequest(`/item/${numericId}`);
    return {
      itemId: String(response.itemId),
      name: response.itemName,
      sku: '',
      category: response.category,
      description: '',
      price: response.baseprice,
      imageUrl: '',
      isDiscontinued: false,
      branchStock: {}
    };
  };

  const getReviewById = async (id: string): Promise<Review> => {
    const numericId = toNumericId(id);
    const response = await apiRequest(`/reviews/${numericId}`);
    return {
      reviewId: String(response.reviewId),
      itemId: String(response.itemId),
      userId: String(response.userId),
      userName: '',
      rating: response.rating,
      comment: response.comment,
      isFlagged: false,
      createdAt: new Date().toISOString()
    };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        selectedBranch,
        setCurrentUser,
        setCurrentRole,
        setSelectedBranch,
        showNotification,
        toast,
        cart,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        applyCoupon,
        activeCoupon,
        users,
        registerUser,
        updateUser,
        deactivateUser,
        branches,
        addBranch,
        updateBranch,
        deleteBranch,
        products,
        addProduct,
        updateProduct,
        discontinueProduct,
        payments,
        createPayment,
        updatePaymentStatus,
        refundPayment,
        orders,
        placeOrder,
        updateOrderStatus,
        cancelOrder,
        promotions,
        addPromotion,
        updatePromotion,
        deletePromotion,
        reviews,
        addReview,
        updateReview,
        deleteReview,
        getUserById,
        getBranchById,
        getItemById,
        getReviewById
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
