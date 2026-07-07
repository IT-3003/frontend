import React, { useState } from 'react';
import { AppProvider, useApp, Product } from './context/AppContext';
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

const AppContent: React.FC = () => {
  const { currentRole, toast } = useApp();
  const [activePage, setActivePage] = useState<string>('home');
  const [searchParam, setSearchParam] = useState<string>('');
  const [categoryParam, setCategoryParam] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Parse path simulated URL hashes or simple routing triggers
  const navigate = (page: string) => {
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
        return <CustomerHome onNavigate={navigate} onSelectProduct={handleSelectProduct} />;
    }
  };

  const isAdminView = activePage.startsWith('admin-');

  return (
    <div className="app-container">
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
