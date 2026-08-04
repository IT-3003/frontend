import React, { useState, useEffect } from 'react';
import { X, Settings, ShoppingBag } from 'lucide-react';
import { AppProvider, useApp, Product, apiRequest, User } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CustomerHome } from './pages/CustomerHome';
import { ProductCatalog } from './pages/ProductCatalog';
import { CartCheckout } from './pages/CartCheckout';
import { UserProfile } from './pages/UserProfile';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminBranches } from './pages/AdminBranches';
import { AdminInventory } from './pages/AdminInventory';
import { AdminOrders } from './pages/AdminOrders';
import { AdminPromotions } from './pages/AdminPromotions';
import { AdminReviews } from './pages/AdminReviews';
import { ApiPlayground } from './pages/ApiPlayground';
import { CustomerDeals } from './pages/CustomerDeals';

const AppContent: React.FC = () => {
  const { currentUser, setCurrentUser, currentRole, setCurrentRole, toast, showNotification, registerUser, showLoginModal, setShowLoginModal } = useApp();
  
  // Detect if url contains profile or stripe parameters at initial load
  const getInitialPage = () => {
    if (window.location.pathname === '/playground') return 'playground';
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname === '/profile' || params.has('session_id')) {
      return 'profile';
    }
    return 'home';
  };
  const [activePage, setActivePage] = useState<string>(getInitialPage());
  const [searchParam, setSearchParam] = useState<string>('');
  const [categoryParam, setCategoryParam] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
  const isAdminView = activePage.startsWith('admin-');

  // Sync activePage change to URL
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname === '/playground') {
        setActivePage('playground');
      } else if (window.location.pathname === '/profile') {
        setActivePage('profile');
      } else if (activePage === 'playground' || activePage === 'profile') {
        setActivePage('home');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [activePage]);

  // Redirect unauthenticated guests from admin pages
  useEffect(() => {
    if (isAdminView && !currentUser) {
      navigate('home');
      setShowLoginModal(true);
    }
  }, [activePage, currentUser, isAdminView]);

  // Parse path simulated URL hashes or simple routing triggers
  const navigate = (page: string) => {
    if (page === 'playground') {
      window.history.pushState({}, '', '/playground');
      setActivePage('playground');
      return;
    } else if (page === 'profile') {
      if (!currentUser) {
        setShowLoginModal(true);
        return;
      }
      window.history.pushState({}, '', '/profile');
      setActivePage('profile');
      return;
    } else if (page === 'cart') {
      if (!currentUser) {
        setShowLoginModal(true);
        return;
      }
      setActivePage('cart');
      return;
    } else {
      if (window.location.pathname === '/playground' || window.location.pathname === '/profile') {
        window.history.pushState({}, '', '/');
      }
    }

    // Check for queries inside state transition
    if (page.startsWith('catalog')) {
      const query = page.split('?')[1];
      if (query) {
        const params = new URLSearchParams(query);
        setSearchParam(params.get('search') || '');
        setCategoryParam(params.get('category') || '');
      } else {
        setSearchParam('');
        setCategoryParam('');
      }
      setSelectedProduct(null);
      setActivePage('catalog');
    } else {
      setActivePage(page);
    }
  };

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setActivePage('catalog');
  };

  const renderPage = () => {
    switch (activePage) {
      // API Playground View
      case 'playground':
        return <ApiPlayground />;

      // Customer Views
      case 'home':
        return <CustomerHome onNavigate={navigate} onSelectProduct={handleSelectProduct} />;
      case 'catalog':
        return (
          <ProductCatalog 
            initialSearch={searchParam} 
            initialCategory={categoryParam} 
            selectedProduct={selectedProduct}
            onClearSelectedProduct={() => setSelectedProduct(null)}
          />
        );
      case 'cart':
        return <CartCheckout onNavigate={navigate} />;
      case 'deals':
        return <CustomerDeals onNavigate={navigate} />;
      case 'profile':
        return <UserProfile onNavigate={navigate} />;

      // Operations / Control Panel Views
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-branches':
        return <AdminBranches />;
      case 'admin-inventory':
        return <AdminInventory />;
      case 'admin-orders':
        return <AdminOrders />;
      case 'admin-promotions':
        return <AdminPromotions />;
      case 'admin-reviews':
        return <AdminReviews />;

      default:
        return <ApiPlayground />;
    }
  };

  return (
    <div className="app-container">
      {/* Login Modal Overlay */}
      {showLoginModal && (
        <div className="modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 19, 14, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel scale-in" style={{ width: '420px', padding: '2.5rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
            <button 
              onClick={() => setShowLoginModal(false)}
              className="btn btn-secondary btn-icon"
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', padding: '0.25rem', minWidth: 'auto', minHeight: 'auto', cursor: 'pointer' }}
              title="Close Sign In Dialog"
            >
              <X size={20} />
            </button>
            <div>
              <div style={{ color: 'var(--color-accent)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <ShoppingBag size={48} />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)' }}>FreshCart</h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isRegister ? 'Create your new customer account' : 'Sign in to access the supermarket portal'}
              </p>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const emailInput = target.email.value;
              
              if (isRegister) {
                const fName = target.firstName.value;
                const lName = target.lastName.value;
                const pNo = target.phone.value;
                const addr = target.address.value;
                const pwd = target.password.value;
                
                try {
                  const newUser = await registerUser({
                    email: emailInput,
                    firstName: fName,
                    lastName: lName,
                    phone: pNo,
                    role: 'CUSTOMER',
                    address: addr,
                    password: pwd
                  });
                  
                  if (newUser) {
                    setCurrentUser(newUser);
                    setCurrentRole(newUser.role);
                    showNotification(`Welcome, ${newUser.firstName}!`, 'success');
                    setShowLoginModal(false);
                    navigate('home');
                  }
                } catch (err: any) {
                  showNotification(err.message || 'Registration failed', 'error');
                }
              } else {
                const passwordInput = target.password.value;
                try {
                  const response = await apiRequest('/user/login', {
                    method: 'POST',
                    body: JSON.stringify({ email: emailInput, password: passwordInput })
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

                  if (mappedUser.status === 'INACTIVE') {
                    showNotification('This account is deactivated', 'error');
                    return;
                  }

                  setCurrentUser(mappedUser);
                  setCurrentRole(mappedUser.role);
                  showNotification(`Welcome back, ${mappedUser.firstName}!`, 'success');
                  setShowLoginModal(false);
                  navigate(mappedUser.role === 'ADMIN' || mappedUser.role === 'EMPLOYEE' ? 'admin-dashboard' : 'home');
                } catch (err: any) {
                  showNotification('Invalid credentials. Check email or password.', 'error');
                }
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Email Address</label>
                <input type="email" name="email" required placeholder="name@freshcart.com" className="form-input" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Password</label>
                <input type="password" name="password" required placeholder="••••••••" className="form-input" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', outline: 'none' }} />
              </div>

              {isRegister && (
                <>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>First Name</label>
                      <input type="text" name="firstName" required placeholder="John" className="form-input" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Last Name</label>
                      <input type="text" name="lastName" required placeholder="Doe" className="form-input" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', outline: 'none' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Phone Number</label>
                    <input type="text" name="phone" required placeholder="0771234567" className="form-input" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Delivery Address</label>
                    <input type="text" name="address" required placeholder="No 12, Galle Road, Colombo" className="form-input" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', outline: 'none' }} />
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                {isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div style={{ fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isRegister ? 'Already have an account? ' : 'New to FreshCart? '}
              </span>
              <button 
                className="btn" 
                onClick={() => setIsRegister(!isRegister)} 
                style={{ background: 'transparent', border: 'none', padding: 0, color: 'var(--color-accent)', fontWeight: 'bold', display: 'inline', cursor: 'pointer' }}
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Toast Alert Banner */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar onNavigate={navigate} activePage={activePage} />

      {/* Layout wrapper */}
      <div style={{ display: 'flex', width: '100%', flexGrow: 1, minHeight: 'calc(100vh - 8rem)' }}>
        
        {/* Sidebar (Admin panel contexts only) */}
        {isAdminView && (currentRole === 'ADMIN' || currentRole === 'EMPLOYEE') && (
          <Sidebar onNavigate={navigate} activePage={activePage} />
        )}

        {/* Main Panel Viewport */}
        <main className="main-content" style={{ flexGrow: 1 }}>
          {renderPage()}
        </main>
      </div>

      {/* Floating Toggle Button for Admin Sidebar (Mobile only) */}
      {isAdminView && (currentRole === 'ADMIN' || currentRole === 'EMPLOYEE') && (
        <button 
          className="nav-mobile-only btn btn-primary btn-icon" 
          onClick={() => setShowSidebarDrawer(true)}
          style={{ 
            position: 'fixed', 
            bottom: '2rem', 
            left: '2rem', 
            zIndex: 500, 
            boxShadow: 'var(--shadow-lg)', 
            width: '50px', 
            height: '50px', 
            borderRadius: '50%',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Open Control Panel Navigation"
        >
          <Settings size={24} />
        </button>
      )}

      {/* MOBILE SIDEBAR DRAWER */}
      {showSidebarDrawer && isAdminView && (currentRole === 'ADMIN' || currentRole === 'EMPLOYEE') && (
        <>
          <div className="mobile-drawer-backdrop" onClick={() => setShowSidebarDrawer(false)} style={{ zIndex: 998 }} />
          <div className="mobile-drawer" style={{ left: 0, right: 'auto', borderRight: '1px solid var(--border-color)', borderLeft: 'none', zIndex: 999 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-accent)' }}>Control Panel</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowSidebarDrawer(false)}>
                <X size={20} />
              </button>
            </div>
            {/* Sidebar content */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} onClick={() => setShowSidebarDrawer(false)}>
              <Sidebar onNavigate={navigate} activePage={activePage} />
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
        <div>&copy; 2026 FreshCart Supermarket Chain Inc. All rights reserved.</div>
        <div style={{ marginTop: '0.25rem', opacity: 0.7 }}>Secure Mock Environment • Connected to Local Storage Sandbox</div>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
