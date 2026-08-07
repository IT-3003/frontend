import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Trash2, Edit3, ShieldAlert, Store, ShoppingBag, CreditCard, Tag, MessageSquare, List, Database } from 'lucide-react';

interface ApiLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  requestBody?: any;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  responseBody?: any;
}

export const ApiPlayground: React.FC = () => {
  const {
    registerUser,
    deactivateUser,
    addBranch,
    deleteBranch,
    addProduct,
    updateProduct,
    discontinueProduct,
    createPayment,
    addPromotion,
    addReview,
    deleteReview,
    getUserById,
    getBranchById,
    getItemById,
    getReviewById,
    users,
    branches,
    products,
    promotions,
    reviews,
    payments,
    orders
  } = useApp();

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [activeTab, setActiveTab] = useState<'user' | 'branch' | 'item' | 'payment' | 'promotion' | 'review' | 'db'>('user');

  // DB Viewer state
  const [dbTables, setDbTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<{ columns: { column_name: string; data_type: string }[]; rows: any[] } | null>(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingTableData, setLoadingTableData] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Fetch tables list
  const fetchTables = async () => {
    setLoadingTables(true);
    setDbError(null);
    setIsSimulated(false);
    try {
      const res = await fetch('/api/db/tables');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setDbTables(data || []);
      if (data && data.length > 0 && !selectedTable) {
        setSelectedTable(data[0]);
      }
    } catch (err: any) {
      console.warn("Database API tables fetch failed, falling back to simulated sandbox tables:", err);
      setIsSimulated(true);
      const simulatedTables = ['users', 'branches', 'products', 'promotions', 'reviews', 'payments', 'orders'];
      setDbTables(simulatedTables);
      if (!selectedTable) {
        setSelectedTable(simulatedTables[0]);
      }
    } finally {
      setLoadingTables(false);
    }
  };

  // Fetch specific table content
  const fetchTableData = async (tableName: string) => {
    setLoadingTableData(true);
    setDbError(null);
    
    if (isSimulated) {
      // Return simulated metadata and rows
      try {
        let cols: { column_name: string; data_type: string }[] = [];
        let rowsData: any[] = [];
        
        switch (tableName) {
          case 'users':
            cols = [
              { column_name: 'userId', data_type: 'VARCHAR' },
              { column_name: 'email', data_type: 'VARCHAR' },
              { column_name: 'firstName', data_type: 'VARCHAR' },
              { column_name: 'lastName', data_type: 'VARCHAR' },
              { column_name: 'phone', data_type: 'VARCHAR' },
              { column_name: 'role', data_type: 'VARCHAR' },
              { column_name: 'status', data_type: 'VARCHAR' }
            ];
            rowsData = users;
            break;
          case 'branches':
            cols = [
              { column_name: 'branchId', data_type: 'VARCHAR' },
              { column_name: 'name', data_type: 'VARCHAR' },
              { column_name: 'address', data_type: 'VARCHAR' },
              { column_name: 'managerId', data_type: 'VARCHAR' },
              { column_name: 'managerName', data_type: 'VARCHAR' },
              { column_name: 'openingHours', data_type: 'VARCHAR' },
              { column_name: 'isActive', data_type: 'BOOLEAN' }
            ];
            rowsData = branches;
            break;
          case 'products':
            cols = [
              { column_name: 'itemId', data_type: 'VARCHAR' },
              { column_name: 'name', data_type: 'VARCHAR' },
              { column_name: 'sku', data_type: 'VARCHAR' },
              { column_name: 'category', data_type: 'VARCHAR' },
              { column_name: 'description', data_type: 'VARCHAR' },
              { column_name: 'price', data_type: 'NUMERIC' },
              { column_name: 'imageUrl', data_type: 'VARCHAR' },
              { column_name: 'isDiscontinued', data_type: 'BOOLEAN' }
            ];
            rowsData = products;
            break;
          case 'promotions':
            cols = [
              { column_name: 'promoId', data_type: 'VARCHAR' },
              { column_name: 'code', data_type: 'VARCHAR' },
              { column_name: 'discountPercent', data_type: 'INTEGER' },
              { column_name: 'description', data_type: 'VARCHAR' },
              { column_name: 'type', data_type: 'VARCHAR' },
              { column_name: 'bannerImageUrl', data_type: 'VARCHAR' },
              { column_name: 'expiryDate', data_type: 'TIMESTAMP' },
              { column_name: 'targetBranchId', data_type: 'VARCHAR' },
              { column_name: 'isActive', data_type: 'BOOLEAN' }
            ];
            rowsData = promotions;
            break;
          case 'reviews':
            cols = [
              { column_name: 'reviewId', data_type: 'VARCHAR' },
              { column_name: 'itemId', data_type: 'VARCHAR' },
              { column_name: 'userId', data_type: 'VARCHAR' },
              { column_name: 'userName', data_type: 'VARCHAR' },
              { column_name: 'rating', data_type: 'INTEGER' },
              { column_name: 'comment', data_type: 'VARCHAR' },
              { column_name: 'isFlagged', data_type: 'BOOLEAN' },
              { column_name: 'createdAt', data_type: 'TIMESTAMP' }
            ];
            rowsData = reviews;
            break;
          case 'payments':
            cols = [
              { column_name: 'transactionId', data_type: 'VARCHAR' },
              { column_name: 'orderId', data_type: 'VARCHAR' },
              { column_name: 'amount', data_type: 'NUMERIC' },
              { column_name: 'paymentMethod', data_type: 'VARCHAR' },
              { column_name: 'status', data_type: 'VARCHAR' },
              { column_name: 'createdAt', data_type: 'TIMESTAMP' }
            ];
            rowsData = payments;
            break;
          case 'orders':
            cols = [
              { column_name: 'orderId', data_type: 'VARCHAR' },
              { column_name: 'userId', data_type: 'VARCHAR' },
              { column_name: 'userName', data_type: 'VARCHAR' },
              { column_name: 'branchId', data_type: 'VARCHAR' },
              { column_name: 'branchName', data_type: 'VARCHAR' },
              { column_name: 'subtotal', data_type: 'NUMERIC' },
              { column_name: 'discount', data_type: 'NUMERIC' },
              { column_name: 'deliveryFee', data_type: 'NUMERIC' },
              { column_name: 'total', data_type: 'NUMERIC' },
              { column_name: 'status', data_type: 'VARCHAR' },
              { column_name: 'createdAt', data_type: 'TIMESTAMP' }
            ];
            rowsData = orders;
            break;
          default:
            break;
        }

        setTableData({ columns: cols, rows: rowsData });
      } catch (err: any) {
        setDbError(err.message || String(err));
      } finally {
        setLoadingTableData(false);
      }
      return;
    }

    try {
      const res = await fetch(`/api/db/tables/${tableName}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setTableData(data);
    } catch (err: any) {
      setDbError(err.message || String(err));
    } finally {
      setLoadingTableData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'db') {
      fetchTables();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'db' && selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable, activeTab]);

  const addLog = (method: string, url: string, requestBody?: any): string => {
    const id = Math.random().toString(36).substr(2, 9);
    const newLog: ApiLog = {
      id,
      timestamp: new Date().toLocaleTimeString(),
      method,
      url,
      requestBody,
      status: 'PENDING'
    };
    setLogs((prev) => [newLog, ...prev]);
    return id;
  };

  const updateLogSuccess = (id: string, responseBody: any) => {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, status: 'SUCCESS', responseBody } : log))
    );
  };

  const updateLogError = (id: string, errorMsg: string) => {
    setLogs((prev) =>
      prev.map((log) => (log.id === id ? { ...log, status: 'ERROR', responseBody: { error: errorMsg } } : log))
    );
  };

  // 1. User Management Forms
  const [userEmail, setUserEmail] = useState('testuser@gmail.com');
  const [userFirstName, setUserFirstName] = useState('Alice');
  const [userLastName, setUserLastName] = useState('Smith');
  const [userPhone, setUserPhone] = useState('+14155552671');
  const [userRole, setUserRole] = useState<'CUSTOMER' | 'EMPLOYEE' | 'ADMIN'>('CUSTOMER');
  const [deactivateUserId, setDeactivateUserId] = useState('');

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const logId = addLog('POST', '/api/user/create', { email: userEmail, firstName: userFirstName, lastName: userLastName, phone: userPhone, role: userRole });
    try {
      const res = await registerUser({
        email: userEmail,
        firstName: userFirstName,
        lastName: userLastName,
        phone: userPhone,
        role: userRole
      });
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  const handleDeactivateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivateUserId) return;
    const logId = addLog('DELETE', `/api/user/${deactivateUserId}`);
    try {
      await deactivateUser(deactivateUserId);
      updateLogSuccess(logId, { message: 'User deactivated successfully' });
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  // 2. Branch Management Forms
  const [branchName, setBranchName] = useState('Metro Hub');
  const [branchAddress, setBranchAddress] = useState('500 Broadway St, New York');
  const [branchPhoneNumber, setBranchPhoneNumber] = useState('0771234567');
  const [branchManagerId, setBranchManagerId] = useState('1');
  const [branchHours, setBranchHours] = useState('09:00 AM - 09:00 PM');
  const [deleteBranchId, setDeleteBranchId] = useState('');

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const logId = addLog('POST', '/api/branch/create', { name: branchName, address: branchAddress, phoneNumber: branchPhoneNumber, managerId: branchManagerId, openingHours: branchHours, managerName: '' });
    try {
      const res = await addBranch({
        name: branchName,
        address: branchAddress,
        phoneNumber: branchPhoneNumber,
        managerId: branchManagerId,
        managerName: '',
        openingHours: branchHours,
        isActive: true
      });
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  const handleDeleteBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteBranchId) return;
    const logId = addLog('DELETE', `/api/branch/${deleteBranchId}`);
    try {
      await deleteBranch(deleteBranchId);
      updateLogSuccess(logId, { message: 'Branch deleted/archived successfully' });
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  // 3. Items Management Forms
  const [itemName, setItemName] = useState('Fresh Avocados');
  const [itemCategory, setItemCategory] = useState('Produce');
  const [itemPrice, setItemPrice] = useState(2.99);
  const [itemSku, setItemSku] = useState('PROD-AVO-001');
  const [updateItemId, setUpdateItemId] = useState('');
  const [updateItemPrice, setUpdateItemPrice] = useState(3.49);
  const [discontinueItemId, setDiscontinueItemId] = useState('');

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const logId = addLog('POST', '/api/item/create', { name: itemName, category: itemCategory, price: itemPrice, sku: itemSku });
    try {
      const res = await addProduct({
        name: itemName,
        sku: itemSku,
        category: itemCategory,
        description: 'Testing Item Description',
        price: itemPrice,
        imageUrl: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300',
        branchStock: {}
      });
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateItemId) return;
    const logId = addLog('PUT', `/api/item/${updateItemId}`, { price: updateItemPrice });
    try {
      await updateProduct(updateItemId, { price: updateItemPrice });
      updateLogSuccess(logId, { message: 'Product updated successfully' });
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  const handleDiscontinueProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discontinueItemId) return;
    const logId = addLog('DELETE', `/api/item/${discontinueItemId}`);
    try {
      await discontinueProduct(discontinueItemId);
      updateLogSuccess(logId, { message: 'Product discontinued successfully' });
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  // 4. Payment Management Forms
  const [payOrderId, setPayOrderId] = useState('101');
  const [payAmount, setPayAmount] = useState(45.99);
  const [payMethod, setPayMethod] = useState<'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH_ON_DELIVERY' | 'MOBILE_WALLET'>('CREDIT_CARD');

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const logId = addLog('POST', '/api/janindu/create', { orderId: payOrderId, amount: payAmount, paymentMethod: payMethod });
    try {
      const res = await createPayment(payOrderId, payAmount, payMethod);
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  // 5. Promotions Management Forms
  const [promoCode, setPromoCode] = useState('OFF20');
  const [promoDiscount, setPromoDiscount] = useState(20);
  const [promoDesc, setPromoDesc] = useState('20% off for testing');
  const [promoType, setPromoType] = useState<'COUPON' | 'BANNER'>('COUPON');

  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    const logId = addLog('POST', '/api/promotion/create', { code: promoCode, discountPercent: promoDiscount, description: promoDesc, type: promoType });
    try {
      const res = await addPromotion({
        code: promoCode,
        discountPercent: promoDiscount,
        description: promoDesc,
        type: promoType,
        bannerImageUrl: '',
        expiryDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        targetBranchId: null,
        isActive: true
      });
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  // 6. Reviews & Feedback Forms
  const [revItemId, setRevItemId] = useState('10');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('Amazing product!');
  const [deleteReviewId, setDeleteReviewId] = useState('');

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const logId = addLog('POST', '/api/reviews/create', { itemId: revItemId, rating: revRating, comment: revComment });
    try {
      const res = await addReview(revItemId, revRating, revComment);
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  const handleDeleteReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteReviewId) return;
    const logId = addLog('DELETE', `/api/reviews/${deleteReviewId}`);
    try {
      await deleteReview(deleteReviewId);
      updateLogSuccess(logId, { message: 'Review deleted successfully' });
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  // GET endpoints test states & handlers
  const [queryUserId, setQueryUserId] = useState('');
  const [queryBranchId, setQueryBranchId] = useState('');
  const [queryItemId, setQueryItemId] = useState('');
  const [queryReviewId, setQueryReviewId] = useState('');

  const handleGetUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryUserId) return;
    const logId = addLog('GET', `/api/user/${queryUserId}`);
    try {
      const res = await getUserById(queryUserId);
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  const handleGetBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryBranchId) return;
    const logId = addLog('GET', `/api/branch/${queryBranchId}`);
    try {
      const res = await getBranchById(queryBranchId);
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  const handleGetItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryItemId) return;
    const logId = addLog('GET', `/api/item/${queryItemId}`);
    try {
      const res = await getItemById(queryItemId);
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  const handleGetReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryReviewId) return;
    const logId = addLog('GET', `/api/reviews/${queryReviewId}`);
    try {
      const res = await getReviewById(queryReviewId);
      updateLogSuccess(logId, res);
    } catch (err: any) {
      updateLogError(logId, err.message || String(err));
    }
  };

  return (
    <div className="main-content" style={{ padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)' }}>
          <Database size={24} /> Backend API Playground
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Directly execute and test the Spring Boot REST endpoints from the React frontend in real-time.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* Navigation Sidebar */}
        <div className="glass-panel" style={{ padding: '1rem', height: 'fit-content' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem', letterSpacing: '0.05em' }}>SELECT API MODULE</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button className="btn" onClick={() => setActiveTab('user')} style={{ justifyContent: 'flex-start', background: activeTab === 'user' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)', width: '100%' }}>
              <ShieldAlert size={18} /> User Management
            </button>
            <button className="btn" onClick={() => setActiveTab('branch')} style={{ justifyContent: 'flex-start', background: activeTab === 'branch' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)', width: '100%' }}>
              <Store size={18} /> Branch Management
            </button>
            <button className="btn" onClick={() => setActiveTab('item')} style={{ justifyContent: 'flex-start', background: activeTab === 'item' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)', width: '100%' }}>
              <ShoppingBag size={18} /> Items & Inventory
            </button>
            <button className="btn" onClick={() => setActiveTab('payment')} style={{ justifyContent: 'flex-start', background: activeTab === 'payment' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)', width: '100%' }}>
              <CreditCard size={18} /> Payment Management
            </button>
            <button className="btn" onClick={() => setActiveTab('promotion')} style={{ justifyContent: 'flex-start', background: activeTab === 'promotion' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)', width: '100%' }}>
              <Tag size={18} /> Promotions
            </button>
            <button className="btn" onClick={() => setActiveTab('review')} style={{ justifyContent: 'flex-start', background: activeTab === 'review' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)', width: '100%' }}>
              <MessageSquare size={18} /> Reviews & Feedback
            </button>
            <button className="btn" onClick={() => setActiveTab('db')} style={{ justifyContent: 'flex-start', background: activeTab === 'db' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)', width: '100%' }}>
              <Database size={18} /> Database Viewer
            </button>
          </div>
        </div>

        {/* Playground Forms Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            {activeTab === 'user' && (
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert className="text-accent" /> User Management Endpoints
                </h3>

                <form onSubmit={handleRegisterUser} style={{ marginBottom: '2.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Register User (POST /api/user/create)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input type="text" className="form-input" value={userFirstName} onChange={(e) => setUserFirstName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input type="text" className="form-input" value={userLastName} onChange={(e) => setUserLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input type="text" className="form-input" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role</label>
                      <select className="form-input" value={userRole} onChange={(e) => setUserRole(e.target.value as any)}>
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Register User
                  </button>
                </form>

                <form onSubmit={handleDeactivateUser} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Deactivate User (DELETE /api/user/&#123;id&#125;)</h4>
                  <div className="form-group">
                    <label className="form-label">User ID (Numeric)</label>
                    <input type="text" className="form-input" placeholder="e.g. 104857" value={deactivateUserId} onChange={(e) => setDeactivateUserId(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-danger" style={{ gap: '0.5rem' }}>
                    <Trash2 size={16} /> Deactivate User
                  </button>
                </form>

                <form onSubmit={handleGetUser} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Get User by ID (GET /api/user/&#123;id&#125;)</h4>
                  <div className="form-group">
                    <label className="form-label">User ID (Numeric)</label>
                    <input type="text" className="form-input" placeholder="e.g. 104857" value={queryUserId} onChange={(e) => setQueryUserId(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Fetch User Data
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'branch' && (
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Store className="text-accent" /> Branch Management Endpoints
                </h3>

                <form onSubmit={handleAddBranch} style={{ marginBottom: '2.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Create Store Branch (POST /api/branch/create)</h4>
                  <div className="form-group">
                    <label className="form-label">Branch Name</label>
                    <input type="text" className="form-input" value={branchName} onChange={(e) => setBranchName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input type="text" className="form-input" value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Manager ID (Numeric)</label>
                      <input type="text" className="form-input" value={branchManagerId} onChange={(e) => setBranchManagerId(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input type="text" className="form-input" value={branchPhoneNumber} onChange={(e) => setBranchPhoneNumber(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Opening Hours</label>
                    <input type="text" className="form-input" value={branchHours} onChange={(e) => setBranchHours(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Create Store Branch
                  </button>
                </form>

                <form onSubmit={handleDeleteBranch} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Delete Branch (DELETE /api/branch/&#123;id&#125;)</h4>
                  <div className="form-group">
                    <label className="form-label">Branch ID (Numeric)</label>
                    <input type="text" className="form-input" placeholder="e.g. 500123" value={deleteBranchId} onChange={(e) => setDeleteBranchId(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-danger" style={{ gap: '0.5rem' }}>
                    <Trash2 size={16} /> Delete Branch
                  </button>
                </form>

                <form onSubmit={handleGetBranch} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Get Branch by ID (GET /api/branch/&#123;id&#125;)</h4>
                  <div className="form-group">
                    <label className="form-label">Branch ID (Numeric)</label>
                    <input type="text" className="form-input" placeholder="e.g. 500123" value={queryBranchId} onChange={(e) => setQueryBranchId(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Fetch Branch Data
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'item' && (
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShoppingBag className="text-accent" /> Items & Inventory Endpoints
                </h3>

                <form onSubmit={handleAddProduct} style={{ marginBottom: '2.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Add Product (POST /api/item/create)</h4>
                  <div className="form-group">
                    <label className="form-label">Product Name</label>
                    <input type="text" className="form-input" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <input type="text" className="form-input" value={itemCategory} onChange={(e) => setItemCategory(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">SKU</label>
                      <input type="text" className="form-input" value={itemSku} onChange={(e) => setItemSku(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Base Price ($)</label>
                    <input type="number" step="0.01" className="form-input" value={itemPrice} onChange={(e) => setItemPrice(parseFloat(e.target.value))} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Add Product
                  </button>
                </form>

                <form onSubmit={handleUpdateProduct} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginBottom: '2.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Update Product (PUT /api/item/&#123;id&#125;)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Item ID (Numeric)</label>
                      <input type="text" className="form-input" placeholder="e.g. 20015" value={updateItemId} onChange={(e) => setUpdateItemId(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Price ($)</label>
                      <input type="number" step="0.01" className="form-input" value={updateItemPrice} onChange={(e) => setUpdateItemPrice(parseFloat(e.target.value))} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                    <Edit3 size={16} /> Update Product Price
                  </button>
                </form>

                <form onSubmit={handleDiscontinueProduct} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Discontinue Product (DELETE /api/item/&#123;id&#125;)</h4>
                  <div className="form-group">
                    <label className="form-label">Item ID (Numeric)</label>
                    <input type="text" className="form-input" placeholder="e.g. 20015" value={discontinueItemId} onChange={(e) => setDiscontinueItemId(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-danger" style={{ gap: '0.5rem' }}>
                    <Trash2 size={16} /> Discontinue Product
                  </button>
                </form>

                <form onSubmit={handleGetItem} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Get Item by ID (GET /api/item/&#123;id&#125;)</h4>
                  <div className="form-group">
                    <label className="form-label">Item ID (Numeric)</label>
                    <input type="text" className="form-input" placeholder="e.g. 20015" value={queryItemId} onChange={(e) => setQueryItemId(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Fetch Item Data
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'payment' && (
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard className="text-accent" /> Payment Management Endpoints
                </h3>

                <form onSubmit={handleCreatePayment}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Create Payment Record (POST /api/janindu/create)</h4>
                  <div className="form-group">
                    <label className="form-label">Order ID (Numeric)</label>
                    <input type="text" className="form-input" value={payOrderId} onChange={(e) => setPayOrderId(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount ($)</label>
                    <input type="number" step="0.01" className="form-input" value={payAmount} onChange={(e) => setPayAmount(parseFloat(e.target.value))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-input" value={payMethod} onChange={(e) => setPayMethod(e.target.value as any)}>
                      <option value="CREDIT_CARD">CREDIT_CARD</option>
                      <option value="DEBIT_CARD">DEBIT_CARD</option>
                      <option value="CASH_ON_DELIVERY">CASH_ON_DELIVERY</option>
                      <option value="MOBILE_WALLET">MOBILE_WALLET</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Process Payment
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'promotion' && (
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Tag className="text-accent" /> Promotions Management Endpoints
                </h3>

                <form onSubmit={handleAddPromotion}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Create Promotion Coupon (POST /api/promotion/create)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Promo Code</label>
                      <input type="text" className="form-input" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Discount Value (%)</label>
                      <input type="number" className="form-input" value={promoDiscount} onChange={(e) => setPromoDiscount(parseInt(e.target.value, 10))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input type="text" className="form-input" value={promoDesc} onChange={(e) => setPromoDesc(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={promoType} onChange={(e) => setPromoType(e.target.value as any)}>
                      <option value="COUPON">COUPON</option>
                      <option value="BANNER">BANNER</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Create Promotion
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'review' && (
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MessageSquare className="text-accent" /> Reviews & Feedback Endpoints
                </h3>

                <form onSubmit={handleAddReview} style={{ marginBottom: '2.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Write a Review (POST /api/reviews/create)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Item ID (Numeric)</label>
                      <input type="text" className="form-input" value={revItemId} onChange={(e) => setRevItemId(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rating (1-5)</label>
                      <input type="number" min="1" max="5" className="form-input" value={revRating} onChange={(e) => setRevRating(parseInt(e.target.value, 10))} required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Comment</label>
                    <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={revComment} onChange={(e) => setRevComment(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Submit Review
                  </button>
                </form>

                <form onSubmit={handleDeleteReview} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Delete Review (DELETE /api/reviews/&#123;id&#125;)</h4>
                  <div className="form-group">
                    <label className="form-label">Review ID (Numeric)</label>
                    <input type="text" className="form-input" placeholder="e.g. 98124" value={deleteReviewId} onChange={(e) => setDeleteReviewId(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-danger" style={{ gap: '0.5rem' }}>
                    <Trash2 size={16} /> Delete Review
                  </button>
                </form>

                <form onSubmit={handleGetReview} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', marginTop: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Get Review by ID (GET /api/reviews/&#123;id&#125;)</h4>
                  <div className="form-group">
                    <label className="form-label">Review ID (Numeric)</label>
                    <input type="text" className="form-input" placeholder="e.g. 98124" value={queryReviewId} onChange={(e) => setQueryReviewId(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ gap: '0.5rem' }}>
                    <Send size={16} /> Fetch Review Data
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'db' && (
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database className="text-accent" /> Database Table Inspector
                  </span>
                  <button className="btn btn-secondary" onClick={fetchTables} disabled={loadingTables} style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                    {loadingTables ? 'Refreshing...' : 'Refresh Tables'}
                  </button>
                </h3>

                {dbError && (
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: 'var(--border-radius-sm)', color: 'var(--error)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Error fetching database information: {dbError}
                  </div>
                )}

                {loadingTables ? (
                  <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
                    Loading database tables metadata...
                  </div>
                ) : dbTables.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', padding: '2rem 0', textAlign: 'center' }}>
                    No public tables found in the database.
                  </div>
                ) : (
                  <div>
                    {/* Table Selection Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                      {dbTables.map((tableName) => (
                        <button
                          key={tableName}
                          onClick={() => setSelectedTable(tableName)}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid ' + (selectedTable === tableName ? 'var(--color-primary)' : 'var(--border-color)'),
                            backgroundColor: selectedTable === tableName ? 'var(--color-primary-light)' : 'rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: selectedTable === tableName ? 'bold' : 'normal',
                            transition: 'all 0.2s'
                          }}
                        >
                          {tableName}
                        </button>
                      ))}
                    </div>

                    {selectedTable && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                            Table: <code style={{ color: 'var(--color-accent)' }}>{selectedTable}</code>
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Showing top 100 rows
                          </span>
                        </div>

                        {loadingTableData ? (
                          <div style={{ color: 'var(--text-muted)', padding: '3rem 0', textAlign: 'center' }}>
                            Loading table rows and columns...
                          </div>
                        ) : tableData ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Column Schema Details */}
                            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>SCHEMA STRUCTURE</span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.5rem' }}>
                                {tableData.columns.map((col: any) => (
                                  <div key={col.column_name} style={{ fontSize: '0.8rem' }}>
                                    <code style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{col.column_name}</code>
                                    <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem', fontSize: '0.75rem' }}>({col.data_type})</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Data Rows Grid */}
                            <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--bg-primary)' }}>
                              {tableData.rows.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', padding: '3rem 0', textAlign: 'center', fontSize: '0.9rem' }}>
                                  No rows found in <code style={{ color: 'var(--color-accent)' }}>{selectedTable}</code>.
                                </div>
                              ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                                      {tableData.columns.map((col: any) => (
                                        <th key={col.column_name} style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                                          {col.column_name}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tableData.rows.map((row: any, rowIndex: number) => (
                                      <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        {tableData.columns.map((col: any) => {
                                          const val = row[col.column_name];
                                          let displayVal = '';
                                          if (val === null || val === undefined) {
                                            displayVal = 'NULL';
                                          } else if (typeof val === 'object') {
                                            displayVal = JSON.stringify(val);
                                          } else {
                                            displayVal = String(val);
                                          }

                                          return (
                                            <td 
                                              key={col.column_name} 
                                              style={{ 
                                                padding: '0.75rem 1rem', 
                                                color: val === null ? 'var(--text-muted)' : 'var(--text-primary)',
                                                fontFamily: val === null || typeof val === 'object' ? 'monospace' : 'inherit',
                                                fontSize: val === null || typeof val === 'object' ? '0.75rem' : '0.85rem',
                                                maxWidth: '300px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                              }}
                                              title={displayVal}
                                            >
                                              {displayVal}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Console / Network Logs */}
          <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                <List size={18} /> Network Logs & Responses
              </h3>
              <button className="btn btn-secondary" onClick={() => setLogs([])} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Clear Logs</button>
            </div>
            
            <div style={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '120px' }}>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>
                  No API calls executed yet. Submit any of the forms above to see live HTTP logs here.
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    style={{ 
                      padding: '1rem', 
                      borderRadius: 'var(--border-radius-sm)', 
                      backgroundColor: 'var(--bg-primary)', 
                      borderLeft: '4px solid ' + (log.status === 'SUCCESS' ? 'var(--success)' : (log.status === 'ERROR' ? 'var(--error)' : 'var(--warning)'))
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', color: log.method === 'GET' ? 'var(--info)' : (log.method === 'POST' ? 'var(--success)' : 'var(--warning)'), marginRight: '0.5rem' }}>
                          {log.method}
                        </span>
                        <code style={{ color: 'var(--text-primary)' }}>{log.url}</code>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {log.timestamp} • <span style={{ fontWeight: 'bold', color: log.status === 'SUCCESS' ? 'var(--success)' : (log.status === 'ERROR' ? 'var(--error)' : 'var(--warning)') }}>{log.status}</span>
                      </div>
                    </div>
                    
                    {log.requestBody && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Request Payload:</span>
                        <pre style={{ margin: 0, fontSize: '0.75rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.3)', overflowX: 'auto', color: 'var(--text-primary)' }}>
                          {JSON.stringify(log.requestBody, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {log.responseBody && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Response Data:</span>
                        <pre style={{ margin: 0, fontSize: '0.75rem', padding: '0.5rem', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.3)', overflowX: 'auto', color: log.status === 'ERROR' ? 'var(--error)' : 'var(--text-primary)' }}>
                          {JSON.stringify(log.responseBody, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
