import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, User as UserIcon, Store, LogOut, ChevronDown, ShieldAlert, Sparkles, Sun, Moon, Menu, X } from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activePage }) => {
  const {
    currentUser,
    currentRole,
    selectedBranch,
    branches,
    setSelectedBranch,
    setCurrentUser,
    setCurrentRole,
    users,
    cart,
    showNotification,
    setShowLoginModal
  } = useApp();

  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);

  // Dark/Light Mode state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

  // Removed local login handler - using App.tsx global login portal modal instead

  const handleRoleChange = (role: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN') => {
    setCurrentRole(role);
    // Find matching user role or clear user
    const matchingUser = users.find(u => u.role === role);
    if (matchingUser) {
      setCurrentUser(matchingUser);
    } else {
      setCurrentUser(null);
    }
    setShowRoleSelect(false);
    showNotification(`Switched persona to ${role}`, 'info');
    if (role === 'ADMIN' || role === 'EMPLOYEE') {
      onNavigate('admin-dashboard');
    } else {
      onNavigate('home');
    }
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="glass-panel app-header">
        {/* Brand Logo */}
        <div onClick={() => onNavigate(currentRole === 'CUSTOMER' ? 'home' : 'admin-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
          <ShoppingCart size={28} style={{ color: 'var(--color-accent)' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              FreshCart <Sparkles size={16} />
            </h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Supermarket Chain</span>
          </div>
        </div>

        {/* Navigation Elements (Desktop) */}
        <div className="nav-desktop-only">
          {/* Branch Locator Dropdown (For Customer & Staff) */}
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary" onClick={() => setShowBranchSelect(!showBranchSelect)} style={{ gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <Store size={18} />
              <span>{selectedBranch ? selectedBranch.name : 'Select Store Location'}</span>
              <ChevronDown size={14} />
            </button>
            {showBranchSelect && (
              <div className="glass-panel" style={{ position: 'absolute', top: '110%', left: 0, width: '280px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', zIndex: 150 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', padding: '0.5rem' }}>PICK YOUR CLOSEST STORE</span>
                {branches.filter(b => b.isActive).map(b => (
                  <button 
                    key={b.branchId} 
                    className="btn" 
                    onClick={() => { setSelectedBranch(b); setShowBranchSelect(false); showNotification(`Shopping branch: ${b.name}`); }}
                    style={{ 
                      justifyContent: 'flex-start', 
                      background: selectedBranch?.branchId === b.branchId ? 'var(--color-primary-light)' : 'transparent',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      padding: '0.5rem 0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{b.name}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{b.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>


          {/* Customer Specific Links */}
          {currentRole === 'CUSTOMER' && (
            <>
              <button 
                className="btn" 
                onClick={() => onNavigate('catalog')} 
                style={{ 
                  background: 'transparent', 
                  color: activePage === 'catalog' ? 'var(--color-accent)' : 'var(--text-primary)', 
                  fontWeight: activePage === 'catalog' ? 'bold' : 'normal' 
                }}
              >
                Products
              </button>
              <button 
                className="btn" 
                onClick={() => onNavigate('deals')} 
                style={{ 
                  background: 'transparent', 
                  color: activePage === 'deals' ? 'var(--color-accent)' : 'var(--text-primary)', 
                  fontWeight: activePage === 'deals' ? 'bold' : 'normal' 
                }}
              >
                Deals & Offers
              </button>
            </>
          )}

          {/* Persona Switcher Switch (Highly interactive demo utility) - Only visible if currentUser is ADMIN */}
          {currentUser?.role === 'ADMIN' && (
            <div style={{ position: 'relative' }}>
              <button 
                className="btn" 
                onClick={() => setShowRoleSelect(!showRoleSelect)} 
                style={{ 
                  background: 'rgba(212, 175, 55, 0.1)', 
                  border: '1px solid var(--color-accent)', 
                  color: 'var(--color-accent)',
                  fontSize: '0.8rem',
                  padding: '0.4rem 0.8rem',
                  gap: '0.4rem'
                }}
              >
                <ShieldAlert size={14} />
                <span>Role: {currentRole}</span>
                <ChevronDown size={12} />
              </button>
              {showRoleSelect && (
                <div className="glass-panel" style={{ position: 'absolute', top: '110%', right: 0, width: '160px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', zIndex: 150 }}>
                  <button className="btn" onClick={() => handleRoleChange('CUSTOMER')} style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.5rem', background: currentRole === 'CUSTOMER' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)' }}>Customer View</button>
                  <button className="btn" onClick={() => handleRoleChange('EMPLOYEE')} style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.5rem', background: currentRole === 'EMPLOYEE' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)' }}>Employee View</button>
                  <button className="btn" onClick={() => handleRoleChange('ADMIN')} style={{ justifyContent: 'flex-start', fontSize: '0.8rem', padding: '0.5rem', background: currentRole === 'ADMIN' ? 'var(--color-primary-light)' : 'transparent', color: 'var(--text-primary)' }}>Admin View</button>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button className="btn btn-secondary btn-icon" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Cart Widget (For Customer) */}
          {currentRole === 'CUSTOMER' && (
            <button className="btn btn-primary" onClick={() => onNavigate('cart')} style={{ position: 'relative', gap: '0.5rem' }}>
              <ShoppingCart size={18} />
              <span>Cart</span>
              {cartItemsCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-8px', 
                  right: '-8px', 
                  background: 'var(--error)', 
                  color: 'white', 
                  fontSize: '0.75rem', 
                  borderRadius: '50%', 
                  width: '20px', 
                  height: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}>
                  {cartItemsCount}
                </span>
              )}
            </button>
          )}

          {/* Profile / Auth Widget */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => onNavigate(currentRole === 'CUSTOMER' ? 'profile' : 'admin-dashboard')}
                style={{ gap: '0.5rem', display: 'flex', alignItems: 'center', padding: '0.5rem 0.8rem' }}
              >
                <UserIcon size={16} />
                <span style={{ fontSize: '0.85rem' }}>{currentUser.firstName}</span>
              </button>
              <button 
                className="btn btn-secondary btn-icon" 
                onClick={() => { setCurrentUser(null); setCurrentRole('CUSTOMER'); onNavigate('home'); showNotification('Logged out successfully'); }}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn btn-secondary" onClick={() => setShowLoginModal(true)} style={{ gap: '0.5rem' }}>
              <UserIcon size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          className="nav-mobile-only btn btn-secondary btn-icon" 
          onClick={() => setShowMobileDrawer(true)}
          style={{ display: 'none' }}
        >
          <Menu size={22} />
        </button>
      </header>

      {/* MOBILE DRAWER */}
      {showMobileDrawer && (
        <>
          <div className="mobile-drawer-backdrop" onClick={() => setShowMobileDrawer(false)} />
          <div className="mobile-drawer">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: 'var(--color-accent)' }}>Menu</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowMobileDrawer(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Store Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>STORE LOCATION</span>
              <button className="btn btn-secondary" onClick={() => { setShowBranchSelect(!showBranchSelect); }} style={{ justifyContent: 'space-between', width: '100%', display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Store size={16} />
                  <span style={{ fontSize: '0.85rem' }}>{selectedBranch ? selectedBranch.name : 'Select Location'}</span>
                </div>
                <ChevronDown size={14} />
              </button>
              {showBranchSelect && (
                <div className="glass-panel" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                  {branches.filter(b => b.isActive).map(b => (
                    <button 
                      key={b.branchId} 
                      className="btn" 
                      onClick={() => { setSelectedBranch(b); setShowBranchSelect(false); setShowMobileDrawer(false); showNotification(`Shopping branch: ${b.name}`); }}
                      style={{ 
                        justifyContent: 'flex-start', 
                        background: selectedBranch?.branchId === b.branchId ? 'var(--color-primary-light)' : 'transparent',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        padding: '0.5rem'
                      }}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>NAVIGATION</span>
              {currentRole === 'CUSTOMER' && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { onNavigate('catalog'); setShowMobileDrawer(false); }}
                  style={{ justifyContent: 'flex-start', background: activePage === 'catalog' ? 'var(--color-primary-light)' : 'transparent' }}
                >
                  Products
                </button>
              )}
              {currentRole === 'CUSTOMER' && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { onNavigate('deals'); setShowMobileDrawer(false); }}
                  style={{ justifyContent: 'flex-start', background: activePage === 'deals' ? 'var(--color-primary-light)' : 'transparent' }}
                >
                  Deals & Offers
                </button>
              )}
              {currentRole === 'CUSTOMER' && (
                <button 
                  className="btn btn-primary" 
                  onClick={() => { onNavigate('cart'); setShowMobileDrawer(false); }}
                  style={{ justifyContent: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ShoppingCart size={16} />
                  <span>Cart ({cartItemsCount})</span>
                </button>
              )}
            </div>

            {/* Persona switcher for Admin */}
            {currentUser?.role === 'ADMIN' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>PERSONA</span>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn btn-secondary" onClick={() => { handleRoleChange('CUSTOMER'); setShowMobileDrawer(false); }} style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem', background: currentRole === 'CUSTOMER' ? 'var(--color-primary-light)' : 'transparent' }}>Cust</button>
                  <button className="btn btn-secondary" onClick={() => { handleRoleChange('EMPLOYEE'); setShowMobileDrawer(false); }} style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem', background: currentRole === 'EMPLOYEE' ? 'var(--color-primary-light)' : 'transparent' }}>Emp</button>
                  <button className="btn btn-secondary" onClick={() => { handleRoleChange('ADMIN'); setShowMobileDrawer(false); }} style={{ flex: 1, fontSize: '0.75rem', padding: '0.5rem', background: currentRole === 'ADMIN' ? 'var(--color-primary-light)' : 'transparent' }}>Admin</button>
                </div>
              </div>
            )}

            {/* Theme Toggle & Profile */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={toggleTheme} style={{ flex: 1, gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
                </button>
              </div>

              {currentUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { onNavigate(currentRole === 'CUSTOMER' ? 'profile' : 'admin-dashboard'); setShowMobileDrawer(false); }}
                    style={{ gap: '0.5rem', width: '100%', display: 'flex', alignItems: 'center' }}
                  >
                    <UserIcon size={16} />
                    <span>{currentUser.firstName} {currentUser.lastName}</span>
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => { setCurrentUser(null); setCurrentRole('CUSTOMER'); onNavigate('home'); setShowMobileDrawer(false); showNotification('Logged out successfully'); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button className="btn btn-secondary" onClick={() => { setShowLoginModal(true); setShowMobileDrawer(false); }} style={{ width: '100%', gap: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserIcon size={16} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

    </>
  );
};
