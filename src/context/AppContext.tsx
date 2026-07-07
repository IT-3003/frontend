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
  registerUser: (data: Omit<User, 'userId' | 'status' | 'addresses'> & { password?: string }) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- API BASE CONFIG ---
const API_BASE = 'http://localhost:8080/api';

// Helper for calling API endpoints
const apiRequest = async (path: string, options?: RequestInit) => {
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

const DEFAULT_USERS: User[] = [
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

const DEFAULT_BRANCHES: Branch[] = [
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

const DEFAULT_PRODUCTS: Product[] = [
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

const DEFAULT_PROMOTIONS: Promotion[] = [
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

const DEFAULT_REVIEWS: Review[] = [
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
  // Load state from localStorage or use defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fc_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [branches, setBranches] = useState<Branch[]>(() => {
    const saved = localStorage.getItem('fc_branches');
    return saved ? JSON.parse(saved) : DEFAULT_BRANCHES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('fc_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [promotions, setPromotions] = useState<Promotion[]>(() => {
    const saved = localStorage.getItem('fc_promotions');
    return saved ? JSON.parse(saved) : DEFAULT_PROMOTIONS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('fc_reviews');
    return saved ? JSON.parse(saved) : DEFAULT_REVIEWS;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('fc_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('fc_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // Current session/UI states
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fc_current_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[2]; // Default to customer John Doe
  });

  const [currentRole, setCurrentRole] = useState<'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'>(() => {
    const saved = localStorage.getItem('fc_current_role');
    return (saved === 'CUSTOMER' || saved === 'EMPLOYEE' || saved === 'ADMIN') ? saved : 'CUSTOMER';
  });

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(() => {
    const saved = localStorage.getItem('fc_selected_branch');
    return saved ? JSON.parse(saved) : DEFAULT_BRANCHES[0];
  });

  const [cart, setCart] = useState<CartItem[]>([]);
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
    const loadData = async () => {
      // Sync Branches
      try {
        const remoteBranches = await apiRequest('/branches');
        if (remoteBranches && remoteBranches.length > 0) setBranches(remoteBranches);
      } catch (e) {
        console.warn("Backend API `/branches` down, using local branches configuration.", e);
      }

      // Sync Products Catalog
      try {
        const remoteProducts = await apiRequest('/items');
        if (remoteProducts && remoteProducts.length > 0) setProducts(remoteProducts);
      } catch (e) {
        console.warn("Backend API `/items` down, using local product catalog.", e);
      }

      // Sync Active Promotions
      try {
        const remotePromos = await apiRequest('/promotions/active');
        if (remotePromos && remotePromos.length > 0) setPromotions(remotePromos);
      } catch (e) {
        console.warn("Backend API `/promotions/active` down, using local promotion campaigns.", e);
      }

      // Sync Orders
      try {
        const remoteOrders = await apiRequest('/orders');
        if (remoteOrders) setOrders(remoteOrders);
      } catch (e) {
        console.warn("Backend API `/orders` down, using local orders logs.", e);
      }

      // Sync Payments
      try {
        const remotePayments = await apiRequest('/payments/logs');
        if (remotePayments) setPayments(remotePayments);
      } catch (e) {
        console.warn("Backend API `/payments/logs` down, using local transaction logs.", e);
      }
    };

    loadData();
  }, []);

  // Fetch reviews for loaded items
  useEffect(() => {
    const loadReviews = async () => {
      if (products.length === 0) return;
      try {
        // Fetch reviews for the first product to verify API
        const firstProdId = products[0].itemId;
        const data = await apiRequest(`/reviews/item/${firstProdId}`);
        if (data && data.reviews) {
          // Merge remote reviews
          setReviews(prev => {
            const others = prev.filter(r => r.itemId !== firstProdId);
            return [...others, ...data.reviews];
          });
        }
      } catch (e) {
        console.warn("Backend API `/reviews/item` down, using local feedback database.", e);
      }
    };
    loadReviews();
  }, [products]);

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

  const registerUser = async (data: Omit<User, 'userId' | 'status' | 'addresses'> & { password?: string }) => {
    try {
      const response = await apiRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setUsers((prev) => [...prev, response]);
      showNotification(`Account created for ${response.firstName}!`, 'success');
      return response;
    } catch (e) {
      console.warn("Backend API registration failed, falling back to local simulation:", e);
      const newUser: User = {
        ...data,
        userId: 'usr_' + Math.random().toString(36).substr(2, 9),
        status: 'ACTIVE',
        addresses: []
      };
      setUsers((prev) => [...prev, newUser]);
      showNotification(`[Simulation] Account created for ${newUser.firstName}!`, 'success');
      return newUser;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await apiRequest('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.warn("Backend API profile update failed, modifying local state only:", e);
    }
    setUsers((prev) =>
      prev.map((u) => (u.userId === userId ? { ...u, ...updates } : u))
    );
    if (currentUser?.userId === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
    showNotification('Profile updated successfully', 'success');
  };

  const deactivateUser = async (userId: string) => {
    try {
      await apiRequest('/users/deactivate', { method: 'DELETE' });
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
    try {
      const response = await apiRequest('/branches', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setBranches((prev) => [...prev, response]);
      showNotification(`Branch "${response.name}" created!`, 'success');
      return response;
    } catch (e) {
      console.warn("Backend API branch create failed, simulating locally:", e);
      const newBranch: Branch = {
        ...data,
        branchId: 'br_' + Math.random().toString(36).substr(2, 9)
      };
      setBranches((prev) => [...prev, newBranch]);
      showNotification(`[Simulation] Branch "${newBranch.name}" created!`, 'success');
      return newBranch;
    }
  };

  const updateBranch = async (branchId: string, updates: Partial<Branch>) => {
    try {
      await apiRequest(`/branches/${branchId}`, {
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
      await apiRequest(`/branches/${branchId}`, { method: 'DELETE' });
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
    try {
      const response = await apiRequest('/items', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setProducts((prev) => [...prev, response]);
      showNotification(`Product "${response.name}" added to catalog!`, 'success');
      return response;
    } catch (e) {
      console.warn("Backend API add product failed, simulating locally:", e);
      const newProd: Product = {
        ...data,
        itemId: 'itm_' + Math.random().toString(36).substr(2, 9),
        isDiscontinued: false
      };
      setProducts((prev) => [...prev, newProd]);
      showNotification(`[Simulation] Product "${newProd.name}" added!`, 'success');
      return newProd;
    }
  };

  const updateProduct = async (itemId: string, updates: Partial<Product>) => {
    try {
      await apiRequest(`/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
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
      await apiRequest(`/items/${itemId}`, { method: 'DELETE' });
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
    try {
      const response = await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({ orderId, amount, paymentMethod: method })
      });
      setPayments((prev) => [response, ...prev]);
      return response;
    } catch (e) {
      console.warn("Backend API create payment failed, simulating locally:", e);
      const newPayment: Payment = {
        transactionId: 'tx_' + Math.random().toString(36).substr(2, 9),
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

    const orderPayload = {
      branchId: selectedBranch.branchId,
      items: cart.map((i) => ({ itemId: i.product.itemId, quantity: i.quantity })),
      couponCode: activeCoupon?.code || null,
      deliveryAddressId: deliveryAddress?.id || null
    };

    try {
      const response = await apiRequest('/orders', {
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
      
      setOrders((prev) => [response, ...prev]);
      return response;
    } catch (e) {
      console.warn("Backend API place order failed, simulating locally:", e);
      const newOrder: Order = {
        orderId: 'ord_' + Math.floor(100000 + Math.random() * 900000).toString(),
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
    try {
      const response = await apiRequest('/promotions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      setPromotions((prev) => [...prev, response]);
      showNotification(`Promotion "${response.code}" created!`, 'success');
      return response;
    } catch (e) {
      console.warn("Backend API promotions create failed, simulating locally:", e);
      const newPromo: Promotion = {
        ...data,
        promoId: 'prm_' + Math.random().toString(36).substr(2, 9)
      };
      setPromotions((prev) => [...prev, newPromo]);
      showNotification(`[Simulation] Promotion "${newPromo.code}" created!`, 'success');
      return newPromo;
    }
  };

  const updatePromotion = async (promoId: string, updates: Partial<Promotion>) => {
    try {
      await apiRequest(`/promotions/${promoId}`, {
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
      await apiRequest(`/promotions/${promoId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend API delete promo failed, modifying local state only:", e);
    }
    setPromotions((prev) => prev.filter((p) => p.promoId !== promoId));
    showNotification('Promotion deleted', 'info');
  };

  // --- 7. REVIEWS & FEEDBACK MANAGEMENT ---

  const addReview = async (itemId: string, rating: number, comment: string) => {
    if (!currentUser) throw new Error('Must be logged in to leave a review');
    
    try {
      const response = await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({ itemId, rating, comment })
      });
      setReviews((prev) => [response, ...prev]);
      showNotification('Review submitted successfully!', 'success');
      return response;
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
      await apiRequest(`/reviews/${reviewId}`, {
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
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn("Backend API delete review failed, modifying local state only:", e);
    }
    setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
    showNotification('Review removed', 'info');
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
        deleteReview
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
